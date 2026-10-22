# x402 付费天气 API 服务（Base Sepolia 测试网）

基于 **x402 付费协议（v2 系列）** 构建的 AI Agent 自主付费天气查询 API 服务。

---

## 🌟 核心特性与架构

- **网络环境**：Base Sepolia 测试网 (`eip155:84532`)
- **结算代币**：Circle 官方测试 USDC (`0x036CbD53842c5426634e7929541eC2318f3dCF7e`，6 位小数)
- **API 定价**：`$0.001` / 次
- **无 Gas 代付**：基于 EIP-3009 授权签名，由公共 Facilitator (`https://x402.org/facilitator`) 代付链上 Gas，付款方仅需持有测试 USDC
- **双天气源抽象**：
  - `openmeteo`（默认，免 Key 免注册实况天气）
  - `amap`（高德 Web 服务天气 API，需配置 `AMAP_KEY`）
- **安全核验机制**：Agent 付款前严格执行「金额、网络、收款地址、域名」四项检查，并在人工确认前强制停顿

---

## 📁 目录结构

```text
Level 1/
├── api/
│   └── index.js             # Express 核心服务（含 x402 中间件，支持 Vercel Serverless）
├── server.js                # 本地运行服务入口（端口 3000）
├── vercel.json              # Vercel 路由重写规则
├── src/
│   ├── config/
│   │   └── wallet.js        # 钱包私密配置读取与 0x 规范化
│   └── providers/
│       ├── openmeteo.js     # Open-Meteo 天气提供器
│       ├── amap.js          # 高德天气提供器（内置常用城市 adcode）
│       └── index.js         # 天气数据源统一切换层
├── scripts/
│   ├── client.js            # Agent 端自动付款客户端
│   └── reconcile.js         # 链上交易对账脚本（支持非标准 topic 形状匹配）
├── secrets/                 # 本地密钥文件夹（已在 .gitignore 中严格忽略）
└── package.json
```

---

## 🚀 本地运行与验证指南

### 1. 启动本地服务
```powershell
node server.js
```
- 服务状态端点：`http://localhost:3000/health`
- 天气查询端点：`http://localhost:3000/api/weather?city=北京`

### 2. 验收标准 1：curl 未付款探测 402
```powershell
curl.exe -i "http://127.0.0.1:3000/api/weather?city=%E5%8C%97%E4%BA%AC"
```
服务端返回 `HTTP/1.1 402 Payment Required` 与 Base64 编码的 `PAYMENT-REQUIRED` 账单头。

### 3. 验收标准 2：运行 Agent 客户端（阶段 1：账单核验与人工停顿）
```powershell
node scripts/client.js "北京"
```
客户端将展示结构化账单要素（金额 $0.001、网络 Base Sepolia、官方 USDC 合约、收款方），通过 4 项安全检查后停下来等待人工核准。

### 4. 验收标准 3：执行 EIP-3009 授权付款并获取天气
```powershell
$env:CONFIRM = "yes"; node scripts/client.js "北京"
```
Agent 客户端使用私钥签名并通过 Facilitator 结算，成功返回 `HTTP 200`、实况天气 JSON 以及链上结算 `Tx Hash`。

### 5. 验收标准 4：运行链上对账脚本
```powershell
node scripts/reconcile.js <TxHash>
```
对账脚本直连 Base Sepolia RPC，核查：
- 交易执行状态（Success）
- 事件形状匹配（付款方、收款方、1000 atomic units）
- 双方钱包当前 USDC 余额变动

---

## ☁️ Vercel 生产环境实测数据

- **线上服务公网根地址**：`https://x402-weather-service.vercel.app`
- **免费健康探测端点**：`https://x402-weather-service.vercel.app/health`
- **付费天气 API 端点**：`https://x402-weather-service.vercel.app/api/weather?city=北京`

### 线上已完成的真实链上结算实录：
1. **本地测试阶段结算 Tx**：
   [`0x1899a7b38ebf4af00d0e6a53e89d953c53d0fb5bdea9204c27a439a3ba4f657e`](https://sepolia.basescan.org/tx/0x1899a7b38ebf4af00d0e6a53e89d953c53d0fb5bdea9204c27a439a3ba4f657e)
2. **Vercel 公网实测结算 Tx (北京)**：
   [`0x587fd1284cbc8d49ec9ce9c31f4998001c270bd6a0492d97c1a869473cc9b352`](https://sepolia.basescan.org/tx/0x587fd1284cbc8d49ec9ce9c31f4998001c270bd6a0492d97c1a869473cc9b352)
3. **现场公网实测结算 Tx (深圳)**：
   [`0x5c258d23a6e8ca252ba228f347e44cd4913327462a31d02faab8e9cc6729bacd`](https://sepolia.basescan.org/tx/0x5c258d23a6e8ca252ba228f347e44cd4913327462a31d02faab8e9cc6729bacd)

### 随时在公网复测：
```powershell
# 1. 探测公网 402 账单（严格安全停顿）
$env:TARGET_URL = "https://x402-weather-service.vercel.app"; node scripts/client.js "深圳"

# 2. 授权自动支付 $0.001 USDC 获取天气
$env:TARGET_URL = "https://x402-weather-service.vercel.app"; $env:CONFIRM = "yes"; node scripts/client.js "深圳"

# 3. 链上对账
node scripts/reconcile.js 0x5c258d23a6e8ca252ba228f347e44cd4913327462a31d02faab8e9cc6729bacd
```

---

## 🤖 AI Agent 接入与本地支付环境自主配置指南

> **写给使用本仓库的开发者或接手本项目的 AI Agent**：
> 本节为你提供完整的接入说明。按照以下步骤，即可全自动配置好本地钱包凭据、测试代币及环境变量。

### 1. 了解底层结算网络与代币规范
本服务使用 **Base Sepolia 测试网** 结算，由公共 Facilitator 代付链上 Gas，无需准备测试网 ETH！
- **网络名称**：Base Sepolia (CAIP-2: `eip155:84532`，Chain ID: `84532`)
- **代币类型**：Circle 官方测试网 USDC (6 位小数)
- **代币合约**：`0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **单次调用费用**：`$0.001 USDC` (即 `1000 atomic units`)
- **公共 Facilitator 网关**：`https://x402.org/facilitator`

### 2. 准备钱包资产（极简领水）
你需要准备两个钱包地址（支持任意 EVM 钱包如 MetaMask、Rabby 生成的新地址）：
1. **收款钱包 (PayTo)**：服务端的收益接收钱包，**仅需公开地址**，不需要私钥；
2. **付款钱包 (Payer)**：AI Agent 扣费钱包，需要**私钥**以完成 EIP-3009 链下授权签名。
   - 打开 [Circle 官方水龙头](https://faucet.circle.com/)；
   - 网络选择 **Base Sepolia**；
   - 输入你的 Agent 付款钱包地址，即可免费领取 `20.0 USDC` 测试代币（足够进行 20,000 次调用）。

### 3. 配置本地钱包凭据（二选一）

#### 选项 A：使用配置文件（推荐，适合本地与自动化）
复制根目录模板 `wallet.example.json` 为 `wallet.json`（该文件已被 `.gitignore` 严格忽略，绝不会被推送到 Git）：
```json
{
  "description": "Base Sepolia 测试网专用钱包配置",
  "payerAddress": "0x你的Agent付款钱包公开地址",
  "payerPrivateKey": "0x你的Agent付款钱包私钥",
  "payToAddress": "0x你的服务端收款钱包公开地址"
}
```
> 💡 程序支持自动向上在项目根目录、`secrets/wallet.json` 或 `../wallet/wallet.json` 自动寻找并读取该配置。

#### 选项 B：使用环境变量（适合 CI/CD 与无状态 Agent）
复制 `.env.example` 为 `.env`，或在当前终端会话中直接导出：
```powershell
# PowerShell
$env:PAY_TO = "0x你的服务端收款钱包公开地址"
$env:PAYER_ADDRESS = "0x你的Agent付款钱包公开地址"
$env:PAYER_PRIVATE_KEY = "0x你的Agent付款钱包私钥"
```
```bash
# Bash
export PAY_TO="0x你的服务端收款钱包公开地址"
export PAYER_ADDRESS="0x你的Agent付款钱包公开地址"
export PAYER_PRIVATE_KEY="0x你的Agent付款钱包私钥"
```

### 4. 运行全链路调用测试

#### 场景 1：Agent 调用云端公网天气 API
```powershell
# 1. 探测 402 账单（核验金额、网络、合约、收款人，确保安全）
$env:TARGET_URL = "https://x402-weather-service.vercel.app"
node scripts/client.js "上海"

# 2. 确认付款并取得天气数据（自动生成 EIP-3009 签名，免 Gas 结算）
$env:CONFIRM = "yes"
node scripts/client.js "上海"
```

#### 场景 2：本地运行自己的天气服务端并自付自测
```powershell
# 1. 启动本地服务端（端口 3000）
node server.js
# 或在 Windows 下直接双击运行 启动本地天气服务.bat

# 2. 在另一个终端发起本地测试
$env:TARGET_URL = "http://localhost:3000"
$env:CONFIRM = "yes"
node scripts/client.js "广州"
```

### 5. 链上对账核验
每次调用成功后，控制台均会输出一个交易哈希（Tx Hash）。使用内置对账脚本可直连 Base Sepolia 节点进行数据不可篡改性审计：
```powershell
node scripts/reconcile.js <TxHash>
```
脚本将输出区块高度、事件日志匹配结果以及调用前后双方钱包的实时 USDC 余额变动。

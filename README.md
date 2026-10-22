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
2. **Vercel 公网实测阶段结算 Tx**：
   [`0x587fd1284cbc8d49ec9ce9c31f4998001c270bd6a0492d97c1a869473cc9b352`](https://sepolia.basescan.org/tx/0x587fd1284cbc8d49ec9ce9c31f4998001c270bd6a0492d97c1a869473cc9b352)

### 随时在公网复测：
```powershell
# 1. 探测公网 402 账单（严格安全停顿）
$env:TARGET_URL = "https://x402-weather-service.vercel.app"; node scripts/client.js "北京"

# 2. 授权自动支付 $0.001 USDC 获取天气
$env:TARGET_URL = "https://x402-weather-service.vercel.app"; $env:CONFIRM = "yes"; node scripts/client.js "北京"

# 3. 链上对账
node scripts/reconcile.js <TxHash>
```

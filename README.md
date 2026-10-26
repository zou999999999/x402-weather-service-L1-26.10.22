# x402 付费天气 API 服务（Base Sepolia 测试网）

基于 **x402 付费协议（v2 系列）** 构建的 AI Agent 自主付费天气查询 API 服务。本项目遵循标准规范的**「服务端 (Server)」与「用户端 (Client)」端到端物理解耦架构**。

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
- **端到端解耦设计**：
  - **服务端 (Server)**：仅感知收款地址 (`PAY_TO`)，绝不包含任何客户端私钥读取逻辑；
  - **用户端 (Client)**：拥有 Agent 付款私钥，独立签名与核验，不依赖服务端内部逻辑。

---

## 📁 规范化目录结构

```text
Level 1/
├── server/                     # 【服务端 / 资源提供方】
│   ├── api/
│   │   └── index.js            # Express 核心服务（含 x402 中间件）
│   ├── src/
│   │   ├── config/wallet.js    # 仅读取服务端收款钱包 (getPayToAddress)
│   │   └── providers/          # 天气数据源抽象 (Open-Meteo & 高德天气)
│   ├── server.js               # 本地服务监听入口（端口 3000）
│   ├── vercel.json             # 服务端独立 Vercel 部署配置
│   ├── package.json            # 服务端专属依赖 (@x402/express, express 等)
│   └── .env.example            # 服务端公开环境变量模板
│
├── client/                     # 【用户端 / Agent 消费端】
│   ├── src/
│   │   ├── config/wallet.js    # 仅管理付款钱包 (getPayerPrivateKey, getPayerAddress)
│   │   ├── client.js           # Agent 402 探测、安全拦截与 EIP-3009 授权签名
│   │   └── reconcile.js        # 链上对账审计脚本（基于事件形状匹配）
│   ├── package.json            # 客户端专属依赖 (@x402/fetch, @x402/evm, viem 等)
│   └── .env.example            # 客户端本地私钥与环境配置模板
│
├── archive/                    # 【过程文件与历史资料归档】
│   ├── antigravity-x402-prompt.md # 原始任务需求 Prompt
│   ├── x402付费天气API服务_Level1任务全流程总结报告.docx # 本地结项总结报告
│   ├── generate_docx.py        # 本地 Word 报告生成脚本
│   └── README.md               # 归档说明
│
├── vercel.json                 # 根目录 Vercel 构建配置（指向 server/api/index.js）
├── 启动本地天气服务.bat        # Windows 一键启动脚本（运行 node server/server.js）
├── package.json                # Monorepo 统一工作区编排
└── README.md
```

---

## 🚀 运行与验证指南

### 1. 服务端操作（Server Side）

#### 启动本地服务
```powershell
# 方式 A：根目录统一启动（或双击 启动本地天气服务.bat）
node server.js

# 方式 B：进入 server 子目录独立启动
cd server
npm start
```
- 服务状态端点：`http://localhost:3000/health`
- 天气查询端点：`http://localhost:3000/api/weather?city=北京`

#### 未付款探测 402（curl 验证）
```powershell
curl.exe -i "http://127.0.0.1:3000/api/weather?city=%E5%8C%97%E4%BA%AC"
```
服务端返回 `HTTP/1.1 402 Payment Required` 与 Base64 编码的 `PAYMENT-REQUIRED` 账单头。

---

### 2. 用户端 / Agent 消费端操作（Client Side）

#### 阶段 1：运行 Agent 客户端（账单核验与人工停顿）
```powershell
# 针对本地服务测试
node client/src/client.js "北京"

# 针对 Vercel 公网线上测试
$env:TARGET_URL = "https://x402-weather-service.vercel.app"
node client/src/client.js "北京"
```
客户端将展示结构化账单要素（金额 $0.001、网络 Base Sepolia、官方 USDC 合约、收款方），通过 4 项安全检查后停下来等待人工核准。

#### 阶段 2：执行 EIP-3009 授权付款并获取天气
```powershell
$env:CONFIRM = "yes"
node client/src/client.js "北京"
```
Agent 客户端使用私钥签名并通过 Facilitator 结算，成功返回 `HTTP 200`、实况天气 JSON 以及链上结算 `Tx Hash`。

#### 阶段 3：运行链上对账脚本
```powershell
node client/src/reconcile.js <TxHash>
```
对账脚本直连 Base Sepolia RPC，核查：
- 交易执行状态（Success）
- 事件形状匹配（付款方、收款方、1000 atomic units）
- 双方钱包当前 USDC 余额变动

---

## 🔒 架构与安全铁律

1. **绝对零私钥泄露**：服务端代码不包含、不感知任何消费者付款私钥；私钥仅由本地客户端在签名时临时加载。
2. **纯粹原则**：所有二进制汇报文档（`*.docx`）和非业务脚本均已加入 `.gitignore`，严禁提交到 GitHub 仓库。

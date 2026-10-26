# 发给 Antigravity 的 Prompt：搭建 x402 付费天气 API 服务（测试网）

> 使用方法：把下面分隔线内的全部内容复制粘贴给 Antigravity。
> ⚠️ 私钥不要写进 prompt——让它用环境变量读取，你在本地终端 export。

---

## 任务

帮我从零搭建一个 **x402 付费 API 服务**，部署到 Vercel，并写一个 agent 端付款客户端，
跑通一次完整的「查天气 → 收到 402 → 自动用测试 USDC 付款 → 拿到数据 → 对账」全链路。
全程只用 **Base Sepolia 测试网**，不碰主网，不花真钱。

## 背景

- 这是一个实习项目：验证「AI agent 自主为 API 服务付费」的模式。
- 模式是：先搭好 API 服务平台，之后用户给 agent 下指令，
  agent 用预设钱包 + x402 协议自动完成付款调用。

## 架构

```
用户对 agent 说"查一下北京的天气"
  → agent 运行 x402 客户端脚本
  → ① GET /api/weather?city=北京（不带付款）
  → Vercel 云服务（x402 中间件）返回 ② 402 + 结构化付款要求
  → 客户端自动用 EIP-3009 签名付款授权 ③ 带付款头重发
  → facilitator 验证并在链上结算 USDC
  → 服务端 ④ 用自有 key 调天气 API 提供商，返回天气 JSON
  → 客户端拿到 ⑤ 200 + 天气数据 + 结算 tx hash
  → 双方记账，事后对账
```

## 具体要求

### 1. 被包装的 API（第一层转发）

- 主选：**高德天气查询 API**：`https://restapi.amap.com/v3/weather/weatherInfo?key=<KEY>&city=<adcode>&extensions=base`
  - 需要 Web 服务类型的 key（环境变量 `AMAP_KEY` 读取，不要硬编码）
  - 用户传中文城市名，服务端内置常用城市名 → adcode 映射（如北京 `110000`）
- 备选（key 还没下来时先用这个跑通）：**Open-Meteo**，免 key、免注册
  - 先用 `https://geocoding-api.open-meteo.com/v1/search` 把城市名转经纬度，
    再调 `https://api.open-meteo.com/v1/forecast` 取实况天气
- 数据源做成可切换的抽象层：环境变量 `PROVIDER=openmeteo|amap` 切换，路由和收费层不动

### 2. 服务端

- 部署平台：**Vercel**（serverless）。Node + Express，`api/index.js` 直接导出 Express app；
  加 `vercel.json` 把所有请求 rewrite 到 `/api/index.js`；`.gitignore` 必须包含 `node_modules/` 和 `.env`
- 用官方 x402 中间件给 `GET /api/weather` 收费；另留一个免费端点 `GET /health`
  返回服务状态（provider/网络/定价），供部署后验证
- 定价：**$0.001/次**
- 收款地址从环境变量 `PAY_TO` 读取

### 3. 客户端（agent 端）

- 一个 Node 脚本：先发未付款请求拿到 402，把账单解码打印出来
  （金额 / 网络 / 收款地址 / 资产合约），**停下来等人工核对**
- 只有环境变量 `CONFIRM=yes` 时才签名付款并重试，打印结果和结算 tx hash
- 私钥只从环境变量 `PAYER_PRIVATE_KEY` 读取，**绝不写进任何文件**

### 4. 双钱包与对账

- **付款钱包**：agent 用的测试网专用小额钱包，里面放少量测试 USDC（水龙头领）
- **收款钱包**：服务端的 `PAY_TO` 地址，只需要地址
- 对账：写一个只读链的对账脚本，输入结算 tx hash 后核对：
  交易成功、付款方/收款方/金额与账单一致；并核对两个钱包的余额变化

## 技术约束（都是已实测的事实，照做，别自己猜）

- x402 SDK 用 **@x402/\* v2 系列**（带 scope）：`@x402/express`、`@x402/core`、`@x402/evm`、`@x402/fetch`。
  旧的无 scope 包名（`x402-express`、`x402-fetch`）已废弃，不要装
- 服务端中间件：`paymentMiddleware`（来自 `@x402/express`）+ `x402ResourceServer`
  + `HTTPFacilitatorClient`（来自 `@x402/core/server`）+ `ExactEvmScheme`（来自 `@x402/evm/exact/server`）
- 客户端：`wrapFetchWithPaymentFromConfig`（来自 `@x402/fetch`）
  + `new ExactEvmScheme(account)`（来自 `@x402/evm`，account 由 viem 的 `privateKeyToAccount` 生成）；
  结算回执从响应的 `PAYMENT-RESPONSE` 头用 `decodePaymentResponseHeader` 解出 tx hash
- Facilitator：用公共测试网通道 `https://x402.org/facilitator`，免 key；**它只支持测试网，不能用于主网**
- 网络：Base Sepolia，CAIP-2 写法 `eip155:84532`
- 结算币：Circle 官方测试 USDC，合约 `0x036CbD53842c5426634e7929541eC2318f3dCF7e`，**6 位小数**。
  注意：测试网上有假冒的 USDC 代币，402 声明、钱包持有、服务端配置三处必须都是这个合约地址
- 价格必须用十进制字符串（如 `"$0.001"`）传给中间件；**不要传原子单位数字**，
  v2 会把数字 `10000` 理解成 $10,000
- 付款走 EIP-3009：facilitator 代付 gas，付款钱包有 USDC 就行，不需要 ETH
- 对账注意：这个测试 USDC 的转账事件 topic **不是**标准 ERC-20 Transfer 的
  `0xddf252ad…288b6ed`（实测为 `0xddf252ad…523b3ef`），对账脚本按事件形状
  （topics[1]=付款方、topics[2]=收款方、data=金额）匹配，不要硬编码标准 topic

## 安全习惯（必须遵守）

- 付款前先核对：**金额、网络、收款地址、域名**，四项都对上才签名
- 私钥、API key 只走环境变量，不进代码、不进 git
- 只用测试网；任何一步涉及主网或真实资金，先停下来问我

## 验收标准

1. `curl` 不带付款调 `/api/weather` → 返回 **402** + 结构化付款要求
2. 客户端一次调用 → **200** + 真实天气数据
3. 链上可查到结算交易：付款钱包 → 收款钱包，USDC 金额 = 定价
4. 对账脚本输出全部通过
5. 部署到 Vercel 后，用公网地址把 1–4 再完整跑一遍

## 执行顺序

先本地跑通（402 → 付款 → 200 → 对账），再部署 Vercel。
每完成一步告诉我结果；遇到与上面「技术约束」冲突的情况，以约束为准并说明。

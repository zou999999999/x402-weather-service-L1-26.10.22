---
name: x402-project-ops
description: >-
  Use this skill whenever working on, extending, or delivering tasks for x402 API projects (Level 1, Level 2, and all future projects).
  Enforces mandatory rules for client-server physical architecture separation, updating the project handover context document,
  maintaining zero-leakage security, and strictly ensuring GitHub repository purity.
---

# x402 项目工程运维与提交规范准则 (Project Ops Skill)

本 Skill 沉淀了本项目全生命周期的核心工程铁律。任何后续接手的 AI Agent 必须在后续**所有项目（Level 1、Level 2 及所有未来项目）**中无条件遵循以下流程：

---

## 🏛️ 准则一：全项目架构规范与端到端物理解耦铁律 (Mandatory Architecture Separation)

**核心要求**：
所有项目在搭建和演进时，**必须从第一天起严格将「服务端 (Server / Provider)」与「用户端 (Client / Agent Consumer)」在物理目录、依赖配置及安全边界上彻底解耦**，严禁混杂在同一文件或单体目录中！

### 1. 物理目录拆分标准
```text
project-root/
├── server/                     # 【服务端 / API 提供方 / 资源中心】
│   ├── api/index.js            # Express 核心路由与 x402 paymentMiddleware
│   ├── src/config/wallet.js    # 仅读取收款公钥 (getPayToAddress)，绝无私钥逻辑
│   ├── src/providers/          # 后台数据源抽象
│   ├── server.js               # 本地服务监听入口
│   ├── package.json            # 仅包含服务端依赖 (@x402/express, express 等)
│   └── .env.example            # 仅包含服务端公开变量 (PORT, PAY_TO, 数据源KEY等)
│
├── client/                     # 【用户端 / Agent 消费端 / 审计端】
│   ├── src/config/wallet.js    # 管理付款方私钥与地址 (getPayerPrivateKey, getPayerAddress)
│   ├── src/client.js           # Agent 未付款探测、402 账单四项安全核查、EIP-3009 签名扣费
│   ├── src/reconcile.js        # 链上对账与余额核验
│   ├── package.json            # 仅包含客户端依赖 (@x402/fetch, @x402/evm, viem 等)
│   └── .env.example            # 仅包含客户端敏感与私有变量 (PAYER_PRIVATE_KEY, TARGET_URL)
│
├── package.json                # Monorepo 工作区编排 (workspaces: ["server", "client"])
└── README.md                   # 全局架构与双端操作指引
```

### 2. 密钥与配置单向物理隔离（绝对零交叉污染）
- **服务端绝对只读收款地址**：服务端代码与配置仅允许感知收款地址（`PAY_TO`），**严禁在服务端代码中出现任何读取付款私钥（`PAYER_PRIVATE_KEY`）的逻辑**。
- **客户端私钥本地化隔离**：客户端独立保管 Agent 付款私钥，私钥仅供客户端发起 EIP-3009 授权签名使用，绝不上传云端，绝不与服务端共用同一个全局配置文件。

### 3. 依赖按端精简划分
- 服务端不得引入客户端专用包（如 `@x402/fetch`、`viem` 客户端账户签名等）；
- 客户端不得引入服务端专用包（如 `@x402/express`、`express` 服务端中间件等）。

---

## 📌 准则二：任务结束必须更新交接文档 (Mandatory Context Update)

**核心要求**：
每当完成用户的任何开发、配置、测试、对账或维护任务后，**必须在回复用户前同步更新工程根目录下的交接文档**：
👉 [`项目交接与全流程上下文总结.md`](file:///./项目交接与全流程上下文总结.md)

**更新内容包括但不限于**：
1. **状态与架构变更**：新增的功能、修复的缺陷、调整的目录架构与配置；
2. **链上凭据**：凡发起链上交易，必须补充新的交易哈希（Tx Hash）、区块高度及双方最新钱包余额；
3. **技术经验**：遇到的新坑点与经过实测验证的底层解决方案。

---

## 🛡️ 准则三：GitHub 上传严格准则（核心代码纯粹原则）

向 GitHub 远程仓库推送代码时，必须严格执行**“纯净代码准则”**：

### 1. 允许且必须上传的内容（Core & Essential Docs）
- **解耦后的核心源码**：
  - `server/` 完整服务端源码与 `server/package.json`
  - `client/` 完整客户端/对账源码与 `client/package.json`
  - 根目录统一代理入口（`api/index.js`、`server.js`、`scripts/` 适配器）
- **必要且关键的项目说明与环境模板**：
  - `README.md`（项目使用、架构说明与 Agent 快速接入指南）
  - `package.json` & `package-lock.json`（工作区与依赖清单）
  - `vercel.json`（云端 Serverless 路由无损还原规则）
  - `server/.env.example` 与 `client/.env.example`（各端公开配置模板）
  - `启动本地天气服务.bat`（Windows 编码规范化的启动脚本）
  - `项目交接与全流程上下文总结.md`（项目全局上下文总结）

### 2. 绝对严禁上传的内容（Zero Clutter Policy）
- 🚫 **严禁上传二进制汇报文档**：`*.docx`、`*.pdf` 等 Word/PDF 文档一律通过 `.gitignore` 排除，仅在本地电脑保留；
- 🚫 **严禁上传冗杂的非业务辅助代码**：如本地用于排版 Word 报告的 `scripts/generate_docx.py` 等与服务运行无关的 Python 脚本，严禁推送到线上，确保 GitHub 仓库纯正无冗余；
- 🚫 **严禁上传真实私钥与配置**：`wallet.json`、`secrets/wallet.json`、`.env` 严禁提交；
- 🚫 **严禁暴露个人本地磁盘绝对路径**：所有代码、错误提示与文档中的路径必须为 `./` 通用相对路径，严禁出现个人磁盘盘符（如 `D:\`）与个人姓名拼音。

---

## 🔑 准则四：Git 提交身份规范

所有向该仓库提交的代码，必须统一使用已绑定的专属 GitHub 身份：
```bash
git config user.name "zou999999999"
git config user.email "zoujiancheng2007@gmail.com"
```
确保 GitHub 网页上的提交记录完整显示专属头像并正确统计贡献度。

---

## ⚙️ 准则五：测试网络与资金安全守则

1. **结算网络**：Base Sepolia 测试网 (`eip155:84532`)；
2. **结算代币**：Circle 官方测试网 USDC (`0x036CbD53842c5426634e7929541eC2318f3dCF7e`)；
3. **免 Gas 机制**：由公共 Facilitator (`https://x402.org/facilitator`) 代付 Gas，付款钱包无需持有测试 ETH；
4. **人工确认防误付**：运行客户端时，若未显式指定 `CONFIRM=yes`，程序必须停留在第 2 步等待人工审核账单。

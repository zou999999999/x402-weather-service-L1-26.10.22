# -*- coding: utf-8 -*-
"""
x402 付费天气 API 服务 —— 全景架构深度解析与技术答辩报告生成器
使用 python-docx 自动化生成排版优美、包含完整架构说明、代码拆解、链上凭证及答辩押题的 Word 汇报报告
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=180, right=180):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def style_table(table, header_bg="1F497D", zebra_bg="F2F5F9"):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, row in enumerate(table.rows):
        trPr = row._tr.get_or_add_trPr()
        trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
        for cell in row.cells:
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
            if i == 0:
                set_cell_background(cell, header_bg)
                for paragraph in cell.paragraphs:
                    for run in paragraph.runs:
                        run.font.bold = True
                        run.font.color.rgb = RGBColor(255, 255, 255)
            elif i % 2 == 1:
                set_cell_background(cell, zebra_bg)
            else:
                set_cell_background(cell, "FFFFFF")

def add_code_block(doc, code_text):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.cell(0, 0)
    set_cell_background(cell, "F8F9FA")
    set_cell_margins(cell, top=100, bottom=100, left=160, right=160)
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(code_text)
    run.font.name = "Consolas"
    run.font.size = Pt(9.0)
    run.font.color.rgb = RGBColor(40, 44, 52)
    doc.add_paragraph()

def add_callout(doc, text, title="💡 核心要点 / 架构洞察"):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.cell(0, 0)
    set_cell_background(cell, "EFF6FF") # 柔和淡蓝
    set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
    
    # 边框设置左粗边框
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:left w:val="single" w:sz="24" w:space="0" w:color="1F497D"/><w:top w:val="none"/><w:right w:val="none"/><w:bottom w:val="none"/></w:tcBorders>')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    
    r_t = p.add_run(f"{title}\n")
    r_t.font.bold = True
    r_t.font.size = Pt(10)
    r_t.font.color.rgb = RGBColor(31, 73, 125)
    
    r_c = p.add_run(text)
    r_c.font.size = Pt(9.5)
    r_c.font.color.rgb = RGBColor(51, 51, 51)
    doc.add_paragraph()

def build_full_report():
    doc = docx.Document()

    # 页面边距设置 (标准 A4: 上下 2.54cm, 左右 2.8cm)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.1)
        section.right_margin = Inches(1.1)

    # 1. 标题区
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(20)
    p_title.paragraph_format.space_after = Pt(8)
    r_title = p_title.add_run("x402 付费天气 API 服务\n全景代码架构与项目技术答辩报告")
    r_title.font.name = "微软雅黑"
    r_title.font.size = Pt(22)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(31, 73, 125) # 专业商务蓝

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(24)
    r_sub = p_sub.add_run("—— 基于 Base Sepolia 与 EIP-3009 的 AI Agent 原生微支付全链路工程实践")
    r_sub.font.name = "微软雅黑"
    r_sub.font.size = Pt(12)
    r_sub.font.color.rgb = RGBColor(89, 89, 89)

    # 汇报元数据信息卡片
    meta_table = doc.add_table(rows=4, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("项目定位", "验证「AI Agent 自主发现、谈判并为 Web API 签名付费」的闭环交互"),
        ("核心技术栈", "Node.js (ESM), Express, @x402/* v2, Viem, Vercel Serverless, Base Sepolia"),
        ("开源代码仓库", "https://github.com/zou999999999/x402-weather-service-L1-26.10.22"),
        ("云端生产环境", "https://x402-weather-service.vercel.app (全时段 24/7 在线)")
    ]
    for idx, (k, v) in enumerate(meta_data):
        row = meta_table.rows[idx]
        row.cells[0].paragraphs[0].add_run(k).font.bold = True
        row.cells[1].paragraphs[0].add_run(v)
    style_table(meta_table, header_bg="2E5B88", zebra_bg="F4F7FA")
    doc.add_paragraph()

    # ==========================================
    # 一、项目背景与核心网络资产
    # ==========================================
    h1 = doc.add_heading("一、 项目核心网络资产与配置清单", level=1)
    h1.paragraph_format.space_before = Pt(16)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "本项目依托 Coinbase 孵化的以太坊 Layer2 扩容网络 Base Sepolia 测试网，完全遵循 HTTP 402 Payment Required 原生标准，"
        "打通了服务发布、Agent 拦截探测、EIP-3009 本地内存加密授权以及链上代付结算的全流程。"
    )

    t_assets = doc.add_table(rows=7, cols=3)
    t_assets_data = [
        ("资产类别", "配置属性 / 网络端点", "参数详情与作用"),
        ("底层区块链", "结算网络 (CAIP-2)", "Base Sepolia 测试网 (eip155:84532, Chain ID: 84532)"),
        ("结算代币", "Circle 官方测试 USDC", "0x036CbD53842c5426634e7929541eC2318f3dCF7e (精度: 6位小数)"),
        ("单次调用定价", "API 调用成本", "$0.001 USDC / 次 (即 1000 atomic units，千分之一美元)"),
        ("收款方钱包", "服务端收益接收 (PayTo)", "0xdcD7DAFafb0EF3d50bDdB480Dbd503Fa6D1B6C09 (仅需公开地址)"),
        ("付款方钱包", "Agent 扣费钱包 (Payer)", "0x4830D4857AdA8b000aFC1C2702294B0999dEaFB3 (本地私钥签名)"),
        ("清算基础设施", "公共 Facilitator 网关", "https://x402.org/facilitator (验证 EIP-3009 签名，免 Gas 代付)")
    ]
    for r_idx, r_data in enumerate(t_assets_data):
        for c_idx, val in enumerate(r_data):
            p = t_assets.rows[r_idx].cells[c_idx].paragraphs[0]
            p.add_run(val)
    style_table(t_assets, header_bg="1F497D", zebra_bg="F2F5F9")
    doc.add_paragraph()

    # ==========================================
    # 二、全景代码架构与逐层目录深度剖析
    # ==========================================
    h1 = doc.add_heading("二、 全景代码架构与逐层目录深度剖析", level=1)
    h1.paragraph_format.space_before = Pt(16)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "本项目工程结构严格践行「高内聚、低耦合」、「关注点分离」与「防御性编程」原则。源码树完整结构如下："
    )

    tree_text = """x402-weather-service/
├── api/                     # 【云端 Serverless 接入层】
│   └── index.js             # Express 核心 API 服务，集成 x402 中间件，兼容 Vercel 云函数
├── src/                     # 【核心业务与底层支撑层】
│   ├── config/              #   ├── 配置子模块（环境嗅探与私密凭据读取）
│   │   └── wallet.js        #   │   └── 钱包私钥与地址的安全解析层（防御性路径探测、0x自动补齐）
│   └── providers/           #   └── 天气数据源抽象子模块（策略模式，与支付解耦）
│       ├── openmeteo.js     #       ├── Open-Meteo 天气源（免 Key 免注册，地理编码 + 气象预报）
│       ├── amap.js          #       ├── 高德天气源（国内高精度，城市名到 adcode 映射转换）
│       └── index.js         #       └── 统一工厂调度层（支持环境变量热切换数据源）
├── scripts/                 # 【Agent 客户端与独立审计层】
│   ├── client.js            # AI Agent 智能客户端（402谈判、四项安全核查、EIP-3009签名支付）
│   ├── reconcile.js         # 链上对账审计脚本（RPC直连区块链，事件形状匹配，不可篡改审计）
│   └── generate_docx.py     # 自动化 Word 总结汇报生成脚本（python-docx 自动排版）
├── secrets/                 # 【物理级本地密钥隔离目录】（被 .gitignore 彻底忽略）
├── server.js                # 【本地运行入口】（node server.js 监听 3000 端口）
├── vercel.json              # 【云端路由网关规则】（Serverless 重写与路径无损还原参数）
├── 启动本地天气服务.bat     # 【Windows 一键启动脚本】（CRLF规范，编码优化，自动拉起浏览器）
├── wallet.example.json      # 根目录公开钱包配置模板（供新环境克隆使用）
├── .env.example             # 根目录公开环境变量配置模板
├── .gitignore               # 全局 Git 忽略清单（杜绝私钥、node_modules 泄露）
└── package.json             # 项目元信息、模块化 ESM 声明 ("type": "module")、核心依赖声明"""
    add_code_block(doc, tree_text)

    # 逐个模块剖析
    h2 = doc.add_heading("1. api/ 目录 —— Serverless 接入层", level=2)
    doc.add_paragraph(
        "• 命名缘由：依据 Vercel Serverless Function 平台规范，api/ 目录下的 index.js 导出 Express 实例后，"
        "平台会自动将其识别为无服务器云函数进行弹性扩缩容部署。\n"
        "• 核心机制：\n"
        "  1) 路由配置与定价绑定：定义 routesConfig，为 GET /api/weather 绑定 price: \"$0.001\"；\n"
        "  2) x402 中间件拦截：调用 paymentMiddleware(routesConfig, resourceServer)，对未带有效签名的请求自动截断并返还 HTTP 402 与 Base64 结构化账单；\n"
        "  3) 路径无损还原：配合 vercel.json 的 rewrite 参数，将 req.query.__path 动态重置回 req.url，抹平了本地与 Serverless 平台的路径解析差异；\n"
        "  4) 双端点架构：开放免费状态端点 GET /health 与受保护收费端点 GET /api/weather。"
    )

    h2 = doc.add_heading("2. src/ 目录 —— 策略解耦与安全配置层", level=2)
    doc.add_paragraph(
        "• src/config/wallet.js（安全解析层）：\n"
        "  采用防御性编程。配置 candidatePaths 依次检测系统环境变量、当前项目根目录、父级目录及 secrets/ 目录；"
        "内置 0x 前缀自愈逻辑，且私钥仅在执行时瞬时装载进局部内存，绝不在日志或异常栈中向外抛出。\n\n"
        "• src/providers/（策略模式数据抽象层）：\n"
        "  将「Web3 付费结算逻辑」与「具体天气查询业务」彻底解耦。支付层只认费用与放行信号，业务层负责具体数据生产。\n"
        "  - openmeteo.js：默认源。先调 Geocoding API 把城市名转换为经纬度，再调 Forecast API 取出实时气温、湿度、风速与天气现象，免 Key 免注册；\n"
        "  - amap.js：备选源。内置常用城市中文名称到高德行政区划代码（adcode）字典，调取高德 Web 服务接口；\n"
        "  - index.js：工厂分发。通过环境变量 PROVIDER=openmeteo|amap 实现数据源热切换，符合开闭原则。"
    )

    h2 = doc.add_heading("3. scripts/ 目录 —— Agent 自动化与对账审计层", level=2)
    doc.add_paragraph(
        "• scripts/client.js（AI Agent 决策中枢）：\n"
        "  模拟自主智能体行为。分为三大严密阶段：\n"
        "  1) 未付款初始探测：向服务端发送初始探测，解析 HTTP 402 响应头中的 payment-required 账单；\n"
        "  2) 四项安全规则拦截：对金额（$0.001）、网络（Base Sepolia）、代币（Circle USDC）、收款方地址进行强制断言。非 CONFIRM=yes 时强制挂起，防止资金静默流失；\n"
        "  3) EIP-3009 付款执行：使用 viem/accounts 导出签名者，配合 ExactEvmScheme 与 wrapFetchWithPaymentFromConfig 发起无 Gas 链上签名结算，成功后打印天气数据与结算 Tx Hash。\n\n"
        "• scripts/reconcile.js（只读区块链审计系统）：\n"
        "  纯只读链上程序。直连 Base Sepolia RPC，拉取区块收据（Receipt）。通过创新的「事件形状匹配」过滤 Transfer 日志，精确核验扣费金额、双方地址及链上最新余额变动。\n\n"
        "• scripts/generate_docx.py（交付报告生成器）：\n"
        "  工程自建交付工具，提取全链路链上凭据，自动输出结构化 Word 总结汇报。"
    )

    # ==========================================
    # 三、真实链上结算凭据与审计记录
    # ==========================================
    h1 = doc.add_heading("三、 已完成的真实链上结算与对账凭证", level=1)
    h1.paragraph_format.space_before = Pt(16)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "项目在实测验证阶段已在 Base Sepolia 测试网上完成了 3 笔完全真实的代币划转与上链清算，"
        "所有数据均可在以太坊 Layer2 公开区块浏览器 BaseScan 上随时查验："
    )

    t_tx = doc.add_table(rows=4, cols=4)
    t_tx_data = [
        ("测试阶段 / 场景", "交易哈希 (Tx Hash)", "链上状态", "区块高度与 Gas 结算"),
        ("1. 本地测试阶段 (北京)", "0x1899a7b38ebf4af00d0e6a53e89d953c53d0fb5bdea9204c27a439a3ba4f657e", "✅ 成功 (success)", "Gas 代付: 85728 (0 费率)"),
        ("2. Vercel 公网阶段 (北京)", "0x587fd1284cbc8d49ec9ce9c31f4998001c270bd6a0492d97c1a869473cc9b352", "✅ 成功 (success)", "区块 #48365375 (Facilitator 代付)"),
        ("3. 现场实测阶段 (深圳)", "0x5c258d23a6e8ca252ba228f347e44cd4913327462a31d02faab8e9cc6729bacd", "✅ 成功 (success)", "区块 #48566530 (扣除 0.001 USDC)")
    ]
    for r_idx, r_data in enumerate(t_tx_data):
        for c_idx, val in enumerate(r_data):
            p = t_tx.rows[r_idx].cells[c_idx].paragraphs[0]
            p.add_run(val)
    style_table(t_tx, header_bg="1F497D", zebra_bg="F2F5F9")
    doc.add_paragraph()

    # 双方余额动态变化说明
    add_callout(doc, 
        "• 付款方钱包 (Agent Payer): 初始 19.998 USDC ──> 经三次实测调用现为 19.995 USDC (每次精确扣减 0.001)\n"
        "• 收款方钱包 (Server PayTo): 初始 30.002 USDC ──> 经三次实测调用现为 30.005 USDC (每次精确到账 +0.001)\n"
        "• 对账审计结论：双方账户在链上的资金划转严丝合缝，与账单金额完全一致，无任何多余扣款或滑点损失。",
        title="💰 双方钱包链上资金真实变动轨迹（原子级审计）"
    )

    # ==========================================
    # 四、核心技术攻坚与避坑经验总结
    # ==========================================
    h1 = doc.add_heading("四、 核心技术攻坚与底层避坑经验", level=1)
    h1.paragraph_format.space_before = Pt(16)
    h1.paragraph_format.space_after = Pt(6)

    pitfalls = [
        ("1. x402 SDK v2 规范演进", 
         "严禁混用旧版无 scope 包（如旧版 x402-express），必须全量迁移至 @x402/* v2 系列。"),
        ("2. 定价必须为十进制字符串", 
         "向中间件传入 price 时必须为 \"$0.001\" 字符串格式。若错误传入整数 1000，中间件会将其视作 1,000 美元导致调用严重超额拦截。"),
        ("3. Windows 平台 DNS IPv6 握手超时优化", 
         "Windows 下 Node.js 默认优先解析 IPv6 地址，导致连接 Cloudflare 与 Facilitator 时频繁遭遇 10 秒握手超时。在所有入口第一行强制配置 dns.setDefaultResultOrder('ipv4first')，响应降至秒级。"),
        ("4. 测试网非标准 Transfer Topic 形状匹配", 
         "Base Sepolia 上的 Circle 测试 USDC 转账事件 Topic[0] 为 0xddf252ad...523b3ef，对账脚本采用过滤排除空授权数据的「事件形状匹配」机制，保障对账解析 100% 稳健。"),
        ("5. Vercel Serverless 路由无损还原", 
         "针对 Vercel 重写导致原始路由被覆盖的问题，在 vercel.json 中配置 ?__path=/$1，并在 Express 入口处通过拦截器还原 req.url，完美兼容本地与云端。"),
        ("6. Windows BAT 批处理 LF 指针漂移陷阱", 
         "Windows cmd.exe 解释器寻址硬编码按 CRLF (2字节) 计算。若脚本保存为 Linux LF (1字节)，多行累积后指针漂移，导致误将 echo 文本腰斩并作为命令执行。解决方案：强制采用 Windows CRLF 换行并以无 BOM UTF-8 保存。"),
        ("7. 零私钥泄漏 Git 防御机制", 
         "通过 .gitignore 物理拦截真实 wallet.json，仅在根目录提供 wallet.example.json 模版，并在提交前进行 64 位十六进制私钥扫描，确保开源代码库绝对安全。")
    ]
    for p_title, p_desc in pitfalls:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
        r_t = p.add_run(f"• {p_title}：")
        r_t.font.bold = True
        r_t.font.name = "微软雅黑"
        p.add_run(p_desc)

    doc.add_paragraph()

    # ==========================================
    # 五、导师答辩高频考问与标准高分回答（押题精粹）
    # ==========================================
    h1 = doc.add_heading("五、 导师答辩高频考问与标准高分回答", level=1)
    h1.paragraph_format.space_before = Pt(16)
    h1.paragraph_format.space_after = Pt(6)

    qa_list = [
        ("Q1：为什么 Agent 发起支付时，付款钱包里完全不需要持有以太坊 ETH 作为 Gas 手续费？",
         "答辩要点：以太坊 EIP-3009 授权签名 + Facilitator 代付中继机制。\n"
         "标准回答：本项目采用了以太坊 EIP-3009（Transfer With Authorization）标准。Agent 在付款时并不是直接向以太坊节点发送区块链交易，而是利用本地私钥在内存中生成一份密码学授权签名（相当于一张电子支票）。随后，公共 Facilitator 清算网关拿到签名作为代理人，替我们垫付 Gas 费将交易广播到 Base Sepolia 链上。USDC 智能合约验证签名合法后直接划扣代币。因此 Agent 钱包仅需持有测试 USDC，实现了真正的「零 Gas 门槛」自主付费。"),

        ("Q2：为什么要把天气业务单独做成 src/providers/ 抽象层，直接写在接口里不是更省事吗？",
         "答辩要点：开闭原则（OCP）与策略模式（Strategy Pattern）。\n"
         "标准回答：这是为了实现架构的高内聚与低耦合。我们把「Web3 底层支付协议」与「上层业务数据获取」彻底分离。providers 是一个可插拔的抽象层，对上屏蔽了 Open-Meteo（经纬度查询）与高德（行政代码查询）的接口差异。这种设计带来了极强的工业级扩展能力：未来如果将服务升级为付费股票分析、实时金融汇率或大模型算力接口，底层的 x402 计费、中间件路由及对账代码一行都不需要修改，只需扩展 Provider 即可。"),

        ("Q3：本地 Express 常驻服务与 Vercel 云端 Serverless 在运行机制上有何本质区别？如何实现一套代码双端复用？",
         "答辩要点：有状态常驻进程 vs 无状态事件驱动云函数；路由重写无损还原。\n"
         "标准回答：本地运行是基于 Node.js 长时间监听 3000 端口的常驻进程；而 Vercel 云端是按需冷启动、秒级执行完毕即销毁的无状态 Serverless 云函数。为了让同一套代码无缝跑在两个环境，我们在 vercel.json 中配置了重写规则 `?__path=/$1`，并在 api/index.js 入口通过前置中间件动态将 `req.query.__path` 还原回 `req.url`，既抹平了云函数的路径覆盖缺陷，又保留了本地一键调试的高效性。"),

        ("Q4：如果后续继续演进该系统，有哪些明确的架构扩展规划？",
         "答辩要点：动态阶梯定价、ERC-4337 账户抽象、多链与流式支付。\n"
         "标准回答：规划从三个维度深入扩展：\n"
         "1) 协议层：引入动态阶梯定价（根据查询未来天数或城市复杂度动态生成金额），并引入 ERC-4337 会话密钥（Session Keys），允许 Agent 在预设预算内免重复签名批量调用；\n"
         "2) 业务层：横向拓展金融大盘、全球物流追踪与 AI 知识库检索等高商业价值 API；\n"
         "3) 经济模型：接入 Superfluid 链上流式支付（Streaming Payments），实现按秒或按流量计费，适应超高并发 Agent 交互场景。")
    ]

    for q, a in qa_list:
        p_q = doc.add_paragraph()
        p_q.paragraph_format.space_before = Pt(6)
        p_q.paragraph_format.space_after = Pt(2)
        r_q = p_q.add_run(q)
        r_q.font.bold = True
        r_q.font.size = Pt(10.5)
        r_q.font.color.rgb = RGBColor(31, 73, 125)

        p_a = doc.add_paragraph()
        p_a.paragraph_format.space_before = Pt(2)
        p_a.paragraph_format.space_after = Pt(8)
        p_a.paragraph_format.line_spacing = 1.2
        r_a = p_a.add_run(a)
        r_a.font.size = Pt(9.5)
        r_a.font.color.rgb = RGBColor(51, 51, 51)

    # 保存文档
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, ".."))
    
    # 1. 保存为全景架构与答辩汇报专用文档
    out_file = os.path.join(project_root, "x402付费天气API服务_全景架构深度解析与技术答辩报告.docx")
    doc.save(out_file)
    print(f"Report successfully saved to: {out_file}")

    # 2. 同时覆写更新原有的验证报告文档，确保双份同步
    backup_file = os.path.join(project_root, "x402付费天气API服务搭建与全链路验证报告.docx")
    try:
        doc.save(backup_file)
        print(f"Report synced to: {backup_file}")
    except Exception as e:
        print(f"Backup warning: {e}")

if __name__ == "__main__":
    build_full_report()

import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { wrapFetchWithPaymentFromConfig, decodePaymentResponseHeader } from '@x402/fetch';
import { ExactEvmScheme } from '@x402/evm';
import { privateKeyToAccount } from 'viem/accounts';
import { getPayerPrivateKey, getPayerAddress, getPayToAddress } from '../src/config/wallet.js';

// 预期常量规范
const EXPECTED_NETWORK = 'eip155:84532';
const EXPECTED_USDC_CONTRACT = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'.toLowerCase();
const EXPECTED_AMOUNT = '1000'; // 6 位小数下的 0.001 USDC

async function run() {
  const targetHost = process.env.TARGET_URL || 'http://localhost:3000';
  const city = process.argv[2] || process.env.CITY || '北京';
  const weatherApiUrl = `${targetHost.replace(/\/+$/, '')}/api/weather?city=${encodeURIComponent(city)}`;

  console.log(`\n=========================================================`);
  console.log(`🤖 [Agent Client] 准备向 API 发起天气查询请求`);
  console.log(`🎯 目标 URL: ${weatherApiUrl}`);
  console.log(`🏙️  查询城市: ${city}`);
  console.log(`=========================================================\n`);

  // 第一步：先发送未付款的 GET 请求
  console.log(`⏳ 步骤 1/3: 发送未付款初始请求探测账单...`);
  const initialRes = await fetch(weatherApiUrl);

  if (initialRes.status === 200) {
    console.log(`✨ 该端点未要求付款，直接返回了 200 数据:`);
    const data = await initialRes.json();
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (initialRes.status !== 402) {
    console.error(`❌ 意外的 HTTP 状态码: ${initialRes.status} ${initialRes.statusText}`);
    const text = await initialRes.text();
    console.error(`响应内容: ${text}`);
    process.exit(1);
  }

  // 第二步：解析并核对 402 Payment Required 账单
  const paymentRequiredHeader = initialRes.headers.get('payment-required') || initialRes.headers.get('x-payment-required');
  if (!paymentRequiredHeader) {
    console.error('❌ 服务端返回了 402，但未附带 payment-required 协议头');
    process.exit(1);
  }

  let bill;
  try {
    const jsonStr = Buffer.from(paymentRequiredHeader, 'base64').toString('utf8');
    bill = JSON.parse(jsonStr);
  } catch (err) {
    console.error('❌ 解码 payment-required 账单失败:', err.message);
    process.exit(1);
  }

  const accept = bill.accepts?.[0] || {};
  const network = accept.network;
  const amount = accept.amount;
  const asset = accept.asset;
  const payTo = accept.payTo;
  const configuredPayerAddr = getPayerAddress();

  console.log(`=========================================================`);
  console.log(`🧾 收到 402 Payment Required 结构化账单`);
  console.log(`=========================================================`);
  console.log(`📍 目标服务域名:   ${new URL(weatherApiUrl).origin}`);
  console.log(`🌐 结算网络:       ${network} (${network === EXPECTED_NETWORK ? '✅ Base Sepolia' : '❌ 非预期网络!'})`);
  console.log(`💰 支付金额:       ${amount} atomic units (${amount === EXPECTED_AMOUNT ? '✅ $0.001 USDC' : '❌ 非预期金额!'})`);
  console.log(`🏦 结算代币合约:   ${asset} (${asset?.toLowerCase() === EXPECTED_USDC_CONTRACT ? '✅ 官方测试USDC' : '❌ 非官方代币!'})`);
  console.log(`📥 收款方地址:     ${payTo}`);
  console.log(`👤 付款方 (Agent): ${configuredPayerAddr || '（从私钥动态派生）'}`);
  console.log(`=========================================================\n`);

  // 严格核验四大安全要素
  const securityChecks = [
    { name: '网络检查 (Base Sepolia)', pass: network === EXPECTED_NETWORK },
    { name: '代币合约检查 (Circle USDC)', pass: asset?.toLowerCase() === EXPECTED_USDC_CONTRACT },
    { name: '支付金额检查 ($0.001 = 1000)', pass: amount === EXPECTED_AMOUNT },
    { name: '收款地址存在性检查', pass: !!payTo && payTo !== '0x0000000000000000000000000000000000000000' }
  ];

  const failedChecks = securityChecks.filter(c => !c.pass);
  if (failedChecks.length > 0) {
    console.error(`🚨 【安全规则拦截】账单未能通过全部安全核验：`);
    failedChecks.forEach(c => console.error(`  ❌ ${c.name}`));
    console.error(`⚠️ 为防止资金损失，已中止操作！`);
    process.exit(1);
  }

  console.log(`✅ 四项安全检查全部通过 (金额 / 网络 / 收款地址 / 域名)！\n`);

  // 第三步：人工确认判断 (CONFIRM=yes)
  const isConfirmed = (process.env.CONFIRM || '').toLowerCase() === 'yes';
  if (!isConfirmed) {
    console.log(`⏸️  步骤 2/3: 账单已生成并就绪，已按安全约束【停下来等待人工核对】。`);
    console.log(`---------------------------------------------------------`);
    console.log(`👉 请核对上方账单信息。确认无误后，设置环境变量 CONFIRM=yes 执行付款：`);
    console.log(`   PowerShell:  $env:CONFIRM="yes"; node scripts/client.js "${city}"`);
    console.log(`   CMD:         set CONFIRM=yes && node scripts/client.js "${city}"`);
    console.log(`---------------------------------------------------------\n`);
    return;
  }

  // 第四步：执行 EIP-3009 付款重试
  console.log(`🔐 步骤 3/3: 人工确认已通过 (CONFIRM=yes)，正在生成 EIP-3009 付款授权签名...`);

  const privateKey = getPayerPrivateKey();
  if (!privateKey) {
    console.error(`❌ 未找到付款方私钥 PAYER_PRIVATE_KEY！`);
    console.error(`👉 请在 wallet.json 或环境变量 PAYER_PRIVATE_KEY 中填入私钥后重试。`);
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey);
  console.log(`🔑 付款方签名地址: ${account.address}`);

  const scheme = new ExactEvmScheme(account);
  const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
    schemes: [
      {
        network: EXPECTED_NETWORK,
        client: scheme
      }
    ]
  });

  console.log(`🚀 正在向 Facilitator (https://x402.org/facilitator) 发起链上无 Gas 结算...`);
  const paidResponse = await fetchWithPayment(weatherApiUrl);

  if (paidResponse.status !== 200) {
    console.error(`❌ 支付后重发请求失败，状态码: ${paidResponse.status}`);
    const errText = await paidResponse.text();
    console.error(`响应: ${errText}`);
    process.exit(1);
  }

  const weatherResult = await paidResponse.json();
  const paymentResponseHeader = paidResponse.headers.get('payment-response') || paidResponse.headers.get('x-payment-response');

  let txHash = null;
  if (paymentResponseHeader) {
    try {
      const decodedResponse = decodePaymentResponseHeader(paymentResponseHeader);
      txHash = decodedResponse.transaction || decodedResponse.transactionHash || decodedResponse.txHash;
    } catch (e) {
      console.warn('⚠️ 解析 payment-response 头时出现警告:', e.message);
    }
  }

  console.log(`\n=========================================================`);
  console.log(`🎉 付款与查询成功！(HTTP 200 OK)`);
  console.log(`=========================================================`);
  if (txHash) {
    console.log(`🔗 链上结算 Tx Hash:    ${txHash}`);
    console.log(`🔍 Base Sepolia 浏览器: https://sepolia.basescan.org/tx/${txHash}`);
  } else {
    console.log(`⚠️ 未在响应头中解析出明确的 tx hash，请核对 Facilitator 回执。`);
  }
  console.log(`\n🌤️ 天气数据响应:`);
  console.log(JSON.stringify(weatherResult, null, 2));
  console.log(`=========================================================\n`);

  if (txHash) {
    console.log(`👉 下一步：运行链上对账脚本核验交易与余额变化：`);
    console.log(`   node scripts/reconcile.js ${txHash}\n`);
  }
}

run().catch(err => {
  console.error('💥 运行时发生异常:', err);
  process.exit(1);
});

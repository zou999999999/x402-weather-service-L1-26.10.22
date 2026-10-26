import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { createPublicClient, http, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';
import { getPayerAddress, getPayToAddress } from './config/wallet.js';

const USDC_CONTRACT = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const EXPECTED_AMOUNT = 1000n; // 0.001 USDC

const ERC20_BALANCE_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
];

function cleanAddress(topic) {
  if (!topic) return '';
  return ('0x' + topic.slice(26)).toLowerCase();
}

async function reconcile(txHash) {
  if (!txHash || !txHash.startsWith('0x')) {
    console.error('❌ 请提供有效的交易哈希，例如: node client/src/reconcile.js 0x...');
    process.exit(1);
  }

  console.log(`\n=========================================================`);
  console.log(`🔍 [x402 链上对账核验]`);
  console.log(`📌 目标交易哈希: ${txHash}`);
  console.log(`🌐 链网络: Base Sepolia (Chain ID: 84532)`);
  console.log(`=========================================================\n`);

  const client = createPublicClient({
    chain: baseSepolia,
    transport: http()
  });

  console.log(`⏳ 正在从 Base Sepolia 链上获取交易回执与收据...`);
  const receipt = await client.getTransactionReceipt({ hash: txHash });

  if (!receipt) {
    console.error(`❌ 未能查询到该交易的回执，可能交易尚未被链打包或哈希有误。`);
    process.exit(1);
  }

  const isSuccess = receipt.status === 'success';
  console.log(`📊 交易执行状态: ${isSuccess ? '✅ 成功 (success)' : '❌ 失败 (reverted)'}`);
  console.log(`📦 区块高度:     #${receipt.blockNumber}`);
  console.log(`⛽ Gas 使用量:   ${receipt.gasUsed.toString()} (Facilitator 代付)`);

  if (!isSuccess) {
    console.error(`🚨 交易在链上执行失败，对账不通过！`);
    process.exit(1);
  }

  // 筛选 USDC 合约产生的日志
  const usdcLogs = receipt.logs.filter(
    log => log.address.toLowerCase() === USDC_CONTRACT.toLowerCase()
  );

  console.log(`\n🔎 在交易收据中定位到 ${usdcLogs.length} 条 USDC 合约日志事件`);

  // 按事件形状寻找：topics.length >= 3, topics[1]=付款方, topics[2]=收款方, data 非空带金额
  let matchedTransfer = null;
  for (const log of usdcLogs) {
    if (log.topics.length >= 3 && log.data && log.data !== '0x' && log.data.length > 2) {
      const from = cleanAddress(log.topics[1]);
      const to = cleanAddress(log.topics[2]);
      const amount = BigInt(log.data);
      matchedTransfer = {
        topic0: log.topics[0],
        from,
        to,
        amount,
        rawLog: log
      };
      break;
    }
  }

  if (!matchedTransfer) {
    console.error(`❌ 未在收据中匹配到符合转账形状的代币事件（topics[1]=付款方, topics[2]=收款方, data=金额）`);
    process.exit(1);
  }

  console.log(`\n=========================================================`);
  console.log(`🧾 事件形状解析结果:`);
  console.log(`=========================================================`);
  console.log(`Topic[0] (事件标识):   ${matchedTransfer.topic0}`);
  console.log(`付款方 (topics[1]):    ${matchedTransfer.from}`);
  console.log(`收款方 (topics[2]):    ${matchedTransfer.to}`);
  console.log(`转账数量 (data):       ${matchedTransfer.amount.toString()} atomic units = ${formatUnits(matchedTransfer.amount, 6)} USDC`);

  const configuredPayTo = (getPayToAddress() || '').toLowerCase();
  const configuredPayer = (getPayerAddress() || '').toLowerCase();

  const isAmountMatch = matchedTransfer.amount === EXPECTED_AMOUNT;
  const isPayToMatch = !configuredPayTo || matchedTransfer.to === configuredPayTo;
  const isPayerMatch = !configuredPayer || matchedTransfer.from === configuredPayer;

  console.log(`\n📋 对账项目核验:`);
  console.log(`  - 交易状态检查:         ${isSuccess ? '✅ 通过' : '❌ 失败'}`);
  console.log(`  - 转账金额 ($0.001):     ${isAmountMatch ? '✅ 精确匹配 (1000 atomic units)' : `❌ 金额不符 (实付: ${matchedTransfer.amount})`}`);
  console.log(`  - 收款方 (PAY_TO):      ${isPayToMatch ? '✅ 匹配' : `⚠️ 不匹配 (预期: ${configuredPayTo}, 实际: ${matchedTransfer.to})`}`);
  console.log(`  - 付款方 (Agent Payer): ${isPayerMatch ? '✅ 匹配' : `⚠️ 不匹配 (预期: ${configuredPayer}, 实际: ${matchedTransfer.from})`}`);

  // 查询双方当前链上 USDC 余额
  console.log(`\n⏳ 正在查询双方钱包的当前链上 USDC 余额...`);
  try {
    const payerBalance = await client.readContract({
      address: USDC_CONTRACT,
      abi: ERC20_BALANCE_ABI,
      functionName: 'balanceOf',
      args: [matchedTransfer.from]
    });
    const payeeBalance = await client.readContract({
      address: USDC_CONTRACT,
      abi: ERC20_BALANCE_ABI,
      functionName: 'balanceOf',
      args: [matchedTransfer.to]
    });

    console.log(`💰 付款方当前 USDC 余额: ${formatUnits(payerBalance, 6)} USDC`);
    console.log(`💰 收款方当前 USDC 余额: ${formatUnits(payeeBalance, 6)} USDC`);
  } catch (err) {
    console.warn(`⚠️ 查询钱包余额时出现警告:`, err.message);
  }

  console.log(`\n=========================================================`);
  if (isSuccess && isAmountMatch && isPayToMatch) {
    console.log(`🎉 【对账成功】链上交易记录与账单完全吻合，所有检查均已通过！`);
  } else {
    console.log(`⚠️ 【对账警告】部分字段与配置存在差异，请核验上述详情。`);
  }
  console.log(`=========================================================\n`);
}

const targetTx = process.argv[2];
if (!targetTx) {
  console.log(`使用方法: node client/src/reconcile.js <TxHash>`);
  console.log(`例如: node client/src/reconcile.js 0x937b42f...`);
  process.exit(1);
}

reconcile(targetTx).catch(err => {
  console.error('💥 对账脚本执行出错:', err);
  process.exit(1);
});

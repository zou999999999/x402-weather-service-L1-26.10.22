import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import express from 'express';
import { x402ResourceServer, HTTPFacilitatorClient } from '@x402/core/server';
import { paymentMiddleware } from '@x402/express';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { getWeather, getCurrentProviderName } from '../src/providers/index.js';
import { getPayToAddress } from '../src/config/wallet.js';

const app = express();
app.use(express.json());

// 兼容 Vercel rewrite：如果 Vercel 将请求路径重写到了 /api/index.js，从 x-matched-path 还原原始路由
app.use((req, res, next) => {
  const matchedPath = req.headers['x-matched-path'];
  if (matchedPath && req.url.startsWith('/api/index.js')) {
    const queryIdx = req.url.indexOf('?');
    const query = queryIdx !== -1 ? req.url.slice(queryIdx) : '';
    req.url = matchedPath + query;
  }
  next();
});

// 基础网络与合约配置（Base Sepolia 测试网）
export const NETWORK = 'eip155:84532';
export const USDC_ASSET = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
export const PRICE_USD = '$0.001';
export const FACILITATOR_URL = 'https://x402.org/facilitator';

// 读取收款地址 (优先环境变量 PAY_TO，其次 secrets/wallet.json，兜底为配置好的收款钱包)
const payTo = getPayToAddress() || '0xdcD7DAFafb0EF3d50bDdB480Dbd503Fa6D1B6C09';

// 配置 x402 资源服务器与 Base Sepolia EVM 方案
const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
const resourceServer = new x402ResourceServer(facilitatorClient)
  .register(NETWORK, new ExactEvmScheme());

// 定义付费路由规格：/api/weather 收费 $0.001
const routesConfig = {
  '/api/weather': {
    accepts: {
      scheme: 'exact',
      payTo: payTo,
      price: PRICE_USD,
      network: NETWORK
    },
    description: 'Real-time weather query API ($0.001 USDC on Base Sepolia)'
  }
};

// 挂载 x402 中间件（自动处理 402 生成与链上结算核验）
app.use(paymentMiddleware(routesConfig, resourceServer));

// 1. 免费状态检查端点：GET /health
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'x402-weather-service',
    provider: getCurrentProviderName(),
    network: NETWORK,
    asset: USDC_ASSET,
    pricing: PRICE_USD,
    payTo: getPayToAddress() || '未配置(待填入)',
    facilitator: FACILITATOR_URL,
    timestamp: new Date().toISOString()
  });
});

// 2. 付费天气查询端点：GET /api/weather
app.get('/api/weather', async (req, res) => {
  try {
    const city = req.query.city || '北京';
    const weatherData = await getWeather(city);
    res.json({
      success: true,
      query: { city },
      data: weatherData
    });
  } catch (error) {
    console.error('Weather query error:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取天气数据失败'
    });
  }
});

// 根路由简单提示
app.get('/', (req, res) => {
  res.send('x402 Weather Service is running! Visit /health for status or /api/weather for paid weather API.');
});

export default app;

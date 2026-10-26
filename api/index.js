/**
 * Vercel Serverless Function 入口适配层
 * 统一代理至完全解耦的 server/api/index.js
 */
import app, { NETWORK, USDC_ASSET, PRICE_USD, FACILITATOR_URL } from '../server/api/index.js';

export { NETWORK, USDC_ASSET, PRICE_USD, FACILITATOR_URL };
export default app;

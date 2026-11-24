// backend/src/services/swapService.ts
/**
 * 0x Swap API v2 integration for BNB Smart Chain.
 * Docs: https://0x.org/docs/api#tag/Swap
 */
import axios from 'axios';
import logger from '../utils/logger';

const ZX_API_BASE = 'https://api.0x.org';
const ZX_CHAIN_ID = 56; // BSC Mainnet

// Token addresses on BSC Mainnet
const TOKEN_ADDRESSES: Record<string, string> = {
  BNB:  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  USDT: '0x55d398326f99059fF775485246999027B3197955',
  USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
};

const TOKEN_DECIMALS: Record<string, number> = {
  BNB: 18, USDT: 18, USDC: 18,
};

function getZxHeaders() {
  const apiKey = process.env.ZX_API_KEY;
  if (!apiKey) throw new Error('ZX_API_KEY is not set');
  return { '0x-api-key': apiKey, '0x-chain-id': String(ZX_CHAIN_ID) };
}

/**
 * Calculate fee basis points targeting ~$0.01 USD.
 * Since 0x uses percentage-based fees, we calculate dynamically.
 * Minimum 1 bps (0.01%) to avoid rounding to zero.
 */
function calculateFeeBps(sellAmountUSD: number): number {
  const targetFeeUSD = 0.01;
  if (sellAmountUSD <= 0) return 1;
  const bps = Math.ceil((targetFeeUSD / sellAmountUSD) * 10000);
  return Math.max(1, Math.min(bps, 100)); // 1–100 bps cap
}

export interface SwapQuoteResult {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  buyAmountFormatted: string;
  exchangeRate: string;
  estimatedGas: string;
  lwFeeBps: number;
  lwFeeUSD: string;
  priceImpact: string;
  rawQuote: any;
}

export async function getSwapQuote(
  sellTokenSymbol: string,
  buyTokenSymbol: string,
  sellAmountHuman: string,
  takerAddress: string,
): Promise<SwapQuoteResult> {
  const sellAddr = TOKEN_ADDRESSES[sellTokenSymbol.toUpperCase()];
  const buyAddr  = TOKEN_ADDRESSES[buyTokenSymbol.toUpperCase()];
  if (!sellAddr || !buyAddr) throw new Error('Unsupported token');

  const decimals = TOKEN_DECIMALS[sellTokenSymbol.toUpperCase()] ?? 18;
  const sellAmountWei = BigInt(Math.floor(parseFloat(sellAmountHuman) * 10 ** decimals)).toString();

  const feeRecipient = process.env.FEE_WALLET_ADDRESS;
  if (!feeRecipient) throw new Error('FEE_WALLET_ADDRESS is not set');

  // Rough USD estimate for fee calculation (assume $1 for BNB, 1:1 for stables)
  const roughUSD = sellTokenSymbol.toUpperCase() === 'BNB'
    ? parseFloat(sellAmountHuman) * 300   // rough BNB price; in prod fetch live price
    : parseFloat(sellAmountHuman);
  const feeBps = calculateFeeBps(roughUSD);

  const params = {
    chainId: ZX_CHAIN_ID,
    sellToken: sellAddr,
    buyToken: buyAddr,
    sellAmount: sellAmountWei,
    takerAddress,
    swapFeeRecipient: feeRecipient,
    swapFeeBps: feeBps,
    swapFeeToken: sellAddr,
  };

  logger.info(`0x quote request: ${sellTokenSymbol} → ${buyTokenSymbol} ${sellAmountHuman}`);

  const response = await axios.get(`${ZX_API_BASE}/swap/permit2/quote`, {
    params,
    headers: getZxHeaders(),
  });

  const q = response.data;
  const buyDecimals = TOKEN_DECIMALS[buyTokenSymbol.toUpperCase()] ?? 18;
  const buyAmountFormatted = (parseFloat(q.buyAmount) / 10 ** buyDecimals).toFixed(6);
  const feeBpsNum = feeBps;
  const feeUSD = (roughUSD * feeBpsNum / 10000).toFixed(4);

  return {
    sellToken: sellTokenSymbol,
    buyToken: buyTokenSymbol,
    sellAmount: sellAmountHuman,
    buyAmountFormatted,
    exchangeRate: `1 ${sellTokenSymbol} ≈ ${(parseFloat(buyAmountFormatted) / parseFloat(sellAmountHuman)).toFixed(4)} ${buyTokenSymbol}`,
    estimatedGas: q.estimatedGas ?? '—',
    lwFeeBps: feeBpsNum,
    lwFeeUSD: `$${feeUSD}`,
    priceImpact: q.estimatedPriceImpact ? `${q.estimatedPriceImpact}%` : '—',
    rawQuote: q,
  };
}

export async function buildSwapTransaction(
  sellTokenSymbol: string,
  buyTokenSymbol: string,
  sellAmountHuman: string,
  takerAddress: string,
): Promise<any> {
  const quoteResult = await getSwapQuote(sellTokenSymbol, buyTokenSymbol, sellAmountHuman, takerAddress);
  // The raw quote contains the transaction object the user needs to sign
  return quoteResult.rawQuote;
}

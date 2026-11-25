// backend/src/services/swapService.ts
/**
 * Multi-DEX Swap Service:
 * - BSC Mainnet (Chain ID 56): 0x Swap API v2 integration
 * - BSC Testnet (Chain ID 97): PancakeSwap V2 Router integration
 */
import axios from 'axios';
import { ethers } from 'ethers';
import logger from '../utils/logger';

// ─── Mainnet (0x) Configuration ──────────────────────────────────────────────
const ZX_API_BASE = 'https://api.0x.org';
const ZX_CHAIN_ID = 56;

const MAINNET_TOKEN_ADDRESSES: Record<string, string> = {
  BNB:  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  USDT: '0x55d398326f99059fF775485246999027B3197955',
  USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
};

const MAINNET_TOKEN_DECIMALS: Record<string, number> = {
  BNB: 18, USDT: 18, USDC: 18,
};

// ─── Testnet (PancakeSwap V2) Configuration ──────────────────────────────────
export const PANCAKESWAP_ROUTER_TESTNET = '0xD99D1c33F9fC3444f8101754aBC46c52416550D1';
const TESTNET_RPC_URL = 'https://data-seed-prebsc-1-s1.binance.org:8545';

export const TESTNET_TOKEN_ADDRESSES: Record<string, string> = {
  BNB:  '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd', // WBNB on BSC Testnet
  WBNB: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
  USDT: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
  USDC: '0x64544969ed7EBf5f083679233325356EbE738930',
};

const TESTNET_TOKEN_DECIMALS: Record<string, number> = {
  BNB: 18, USDT: 18, USDC: 18,
};

const PANCAKE_ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
];

function getZxHeaders() {
  const apiKey = process.env.ZX_API_KEY;
  if (!apiKey) throw new Error('ZX_API_KEY is not set');
  return {
    '0x-api-key': apiKey,
    '0x-version': 'v2',
  };
}

/**
 * Calculate fee basis points targeting ~$0.01 USD on Mainnet.
 */
function calculateFeeBps(sellAmountUSD: number): number {
  const targetFeeUSD = 0.01;
  if (sellAmountUSD <= 0) return 1;
  const bps = Math.ceil((targetFeeUSD / sellAmountUSD) * 10000);
  return Math.max(1, Math.min(bps, 100)); // 1–100 bps cap
}

export interface SwapQuoteResult {
  provider: 'PancakeSwap' | '0x';
  chainId: number;
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  buyAmountFormatted: string;
  buyAmountRaw: string;
  exchangeRate: string;
  estimatedGas: string;
  lwFeeBps: number;
  lwFeeUSD: string;
  priceImpact: string;
  path?: string[];
  routerAddress?: string;
  rawQuote: any;
}

// ─── 0x Mainnet Quote ────────────────────────────────────────────────────────
async function get0xSwapQuote(
  sellTokenSymbol: string,
  buyTokenSymbol: string,
  sellAmountHuman: string,
  takerAddress: string,
): Promise<SwapQuoteResult> {
  const sellUpper = sellTokenSymbol.toUpperCase();
  const buyUpper  = buyTokenSymbol.toUpperCase();
  const sellAddr = MAINNET_TOKEN_ADDRESSES[sellUpper];
  const buyAddr  = MAINNET_TOKEN_ADDRESSES[buyUpper];
  if (!sellAddr || !buyAddr) throw new Error('Unsupported token for 0x swap');

  const decimals = MAINNET_TOKEN_DECIMALS[sellUpper] ?? 18;
  const sellAmountWei = BigInt(Math.floor(parseFloat(sellAmountHuman) * 10 ** decimals)).toString();

  const feeRecipient = process.env.FEE_WALLET_ADDRESS;
  if (!feeRecipient) throw new Error('FEE_WALLET_ADDRESS is not set');

  const roughUSD = sellUpper === 'BNB'
    ? parseFloat(sellAmountHuman) * 600
    : parseFloat(sellAmountHuman);
  const feeBps = calculateFeeBps(roughUSD);

  const params: Record<string, any> = {
    chainId: ZX_CHAIN_ID,
    sellToken: sellAddr,
    buyToken: buyAddr,
    sellAmount: sellAmountWei,
    taker: takerAddress,
    swapFeeRecipient: feeRecipient,
    swapFeeBps: feeBps,
    swapFeeToken: sellAddr,
  };

  logger.info(`0x quote request: ${sellUpper} -> ${buyUpper} ${sellAmountHuman}`);

  const response = await axios.get(`${ZX_API_BASE}/swap/permit2/quote`, {
    params,
    headers: getZxHeaders(),
  });

  const q = response.data;
  const buyDecimals = MAINNET_TOKEN_DECIMALS[buyUpper] ?? 18;
  const buyAmountFormatted = (parseFloat(q.buyAmount) / 10 ** buyDecimals).toFixed(6);
  const feeUSD = (roughUSD * feeBps / 10000).toFixed(4);

  return {
    provider: '0x',
    chainId: 56,
    sellToken: sellUpper,
    buyToken: buyUpper,
    sellAmount: sellAmountHuman,
    buyAmountFormatted,
    buyAmountRaw: q.buyAmount,
    exchangeRate: `1 ${sellUpper} ≈ ${(parseFloat(buyAmountFormatted) / parseFloat(sellAmountHuman)).toFixed(4)} ${buyUpper}`,
    estimatedGas: q.totalNetworkFee ? ethers.formatEther(q.totalNetworkFee) : '—',
    lwFeeBps: feeBps,
    lwFeeUSD: `$${feeUSD}`,
    priceImpact: q.estimatedPriceImpact ? `${q.estimatedPriceImpact}%` : '—',
    rawQuote: q,
  };
}

// ─── PancakeSwap Testnet Quote ───────────────────────────────────────────────
async function getPancakeSwapQuote(
  sellTokenSymbol: string,
  buyTokenSymbol: string,
  sellAmountHuman: string,
  _takerAddress: string,
): Promise<SwapQuoteResult> {
  const sellUpper = sellTokenSymbol.toUpperCase();
  const buyUpper  = buyTokenSymbol.toUpperCase();

  const sellAddr = TESTNET_TOKEN_ADDRESSES[sellUpper];
  const buyAddr  = TESTNET_TOKEN_ADDRESSES[buyUpper];
  if (!sellAddr || !buyAddr) {
    throw new Error(`Unsupported token pair for PancakeSwap: ${sellUpper} / ${buyUpper}`);
  }

  const sellDecimals = TESTNET_TOKEN_DECIMALS[sellUpper] ?? 18;
  const buyDecimals  = TESTNET_TOKEN_DECIMALS[buyUpper] ?? 18;

  let amountInWei: bigint;
  try {
    amountInWei = ethers.parseUnits(sellAmountHuman, sellDecimals);
  } catch {
    throw new Error('Invalid sell amount format');
  }

  if (amountInWei <= 0n) {
    throw new Error('Sell amount must be greater than 0');
  }

  const provider = new ethers.JsonRpcProvider(TESTNET_RPC_URL);
  const router = new ethers.Contract(PANCAKESWAP_ROUTER_TESTNET, PANCAKE_ROUTER_ABI, provider);

  const wbnb = TESTNET_TOKEN_ADDRESSES['WBNB'];
  let path: string[] = [];
  let amounts: bigint[] = [];

  // Determine path: direct first, routed through WBNB if needed
  if (sellAddr === buyAddr) {
    throw new Error('Cannot swap token to itself');
  }

  // 1. Try direct path
  try {
    const directPath = [sellAddr, buyAddr];
    amounts = await router.getAmountsOut(amountInWei, directPath);
    path = directPath;
  } catch (directErr: any) {
    // 2. If direct path fails and neither token is WBNB, try routing via WBNB
    if (sellAddr !== wbnb && buyAddr !== wbnb) {
      try {
        const routedPath = [sellAddr, wbnb, buyAddr];
        amounts = await router.getAmountsOut(amountInWei, routedPath);
        path = routedPath;
      } catch (routedErr: any) {
        logger.warn('PancakeSwap getAmountsOut failed both direct and routed', {
          sellTokenSymbol, buyTokenSymbol, error: routedErr.message,
        });
        throw new Error('Insufficient liquidity on PancakeSwap Testnet for this pair');
      }
    } else {
      logger.warn('PancakeSwap getAmountsOut direct path failed', {
        sellTokenSymbol, buyTokenSymbol, error: directErr.message,
      });
      throw new Error('Insufficient liquidity on PancakeSwap Testnet for this pair');
    }
  }

  const buyAmountRaw = amounts[amounts.length - 1];
  const buyAmountFormatted = Number(ethers.formatUnits(buyAmountRaw, buyDecimals)).toFixed(6);

  const rate = (parseFloat(buyAmountFormatted) / parseFloat(sellAmountHuman)).toFixed(4);

  logger.info(`PancakeSwap quote OK: ${sellUpper} -> ${buyUpper}: ${sellAmountHuman} in => ${buyAmountFormatted} out`);

  return {
    provider: 'PancakeSwap',
    chainId: 97,
    sellToken: sellUpper,
    buyToken: buyUpper,
    sellAmount: sellAmountHuman,
    buyAmountFormatted,
    buyAmountRaw: buyAmountRaw.toString(),
    exchangeRate: `1 ${sellUpper} ≈ ${rate} ${buyUpper}`,
    estimatedGas: '0.0006 tBNB',
    lwFeeBps: 0,                   // Service fee is disabled on Testnet
    lwFeeUSD: '$0.00 (Testnet)',  // Free on Testnet
    priceImpact: '< 0.5%',
    path,
    routerAddress: PANCAKESWAP_ROUTER_TESTNET,
    rawQuote: {
      provider: 'PancakeSwap',
      chainId: 97,
      routerAddress: PANCAKESWAP_ROUTER_TESTNET,
      path,
      amountIn: amountInWei.toString(),
      amountOut: buyAmountRaw.toString(),
    },
  };
}

// ─── Unified Quote Dispatcher ────────────────────────────────────────────────
export async function getSwapQuote(
  sellTokenSymbol: string,
  buyTokenSymbol: string,
  sellAmountHuman: string,
  takerAddress: string,
  chainId: number = 56,
): Promise<SwapQuoteResult> {
  if (chainId === 97) {
    return getPancakeSwapQuote(sellTokenSymbol, buyTokenSymbol, sellAmountHuman, takerAddress);
  }
  return get0xSwapQuote(sellTokenSymbol, buyTokenSymbol, sellAmountHuman, takerAddress);
}

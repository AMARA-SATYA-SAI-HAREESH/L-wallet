// mobile/src/services/swapService.ts
import { ethers } from 'ethers';
import axios from 'axios';
import { BACKEND_URL } from '../constants/config';
import { NETWORK_CONFIG, getActiveNetwork } from './walletService';
import { NetworkType } from '../store/walletStore';

// ─── Testnet PancakeSwap Configuration ───────────────────────────────────────
export const PANCAKESWAP_ROUTER_TESTNET = '0xD99D1c33F9fC3444f8101754aBC46c52416550D1';

export const TESTNET_TOKEN_ADDRESSES: Record<string, string> = {
  BNB:  '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd', // WBNB
  WBNB: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
  USDT: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
  USDC: '0x64544969ed7EBf5f083679233325356EbE738930',
};

const PANCAKE_ROUTER_ABI = [
  'function WETH() external pure returns (address)',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
  'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable',
  'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external',
  'function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external',
];

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];

export interface SwapQuoteData {
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

/**
 * Fetch swap quote from backend.
 * Automatically selects 0x for Mainnet (56) and PancakeSwap for Testnet (97).
 */
export async function fetchSwapQuote(
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  takerAddress: string,
  network: NetworkType,
): Promise<SwapQuoteData> {
  const chainId = NETWORK_CONFIG[network].chainId;
  const res = await axios.post(`${BACKEND_URL}/api/swap/quote`, {
    sellToken,
    buyToken,
    sellAmount,
    takerAddress,
    chainId,
  });
  return res.data;
}

/**
 * Check if the user has approved the router/spender to spend their ERC-20 token.
 */
export async function checkTokenAllowance(
  tokenSymbol: 'USDT' | 'USDC',
  ownerAddress: string,
  spenderAddress: string,
  network: NetworkType,
): Promise<bigint> {
  const netCfg = NETWORK_CONFIG[network];
  const tokenCfg = netCfg.tokens[tokenSymbol];
  const provider = new ethers.JsonRpcProvider(netCfg.rpcUrl);
  const contract = new ethers.Contract(tokenCfg.address, ERC20_ABI, provider);
  const allowance: bigint = await contract.allowance(ownerAddress, spenderAddress);
  return allowance;
}

/**
 * Approve the router to spend tokens on behalf of the user.
 * Locally signed on device.
 */
export async function approveTokenSpending(
  tokenSymbol: 'USDT' | 'USDC',
  privateKey: string,
  spenderAddress: string,
  network: NetworkType,
): Promise<string> {
  const netCfg = NETWORK_CONFIG[network];
  const tokenCfg = netCfg.tokens[tokenSymbol];
  const provider = new ethers.JsonRpcProvider(netCfg.rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(tokenCfg.address, ERC20_ABI, wallet);

  // Approve max uint256 so the user doesn't need to approve every single swap
  const tx = await contract.approve(spenderAddress, ethers.MaxUint256);
  await tx.wait(1);
  return tx.hash;
}

/**
 * Execute PancakeSwap trade on BSC Testnet.
 * All transactions are signed strictly on the device using privateKey.
 * Never transmits privateKey to backend!
 */
export async function executePancakeSwap(
  sellToken: string,
  buyToken: string,
  sellAmountHuman: string,
  quote: SwapQuoteData,
  privateKey: string,
  takerAddress: string,
  slippagePercent: number = 1.0, // default 1% slippage
): Promise<string> {
  const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.testnet.rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const router = new ethers.Contract(PANCAKESWAP_ROUTER_TESTNET, PANCAKE_ROUTER_ABI, wallet);

  const sellUpper = sellToken.toUpperCase();
  const buyUpper = buyToken.toUpperCase();

  const sellAmountWei = ethers.parseUnits(sellAmountHuman, 18);
  const buyAmountRaw = BigInt(quote.buyAmountRaw);

  // Apply slippage: amountOutMin = buyAmountRaw * (100 - slippage) / 100
  const slippageBps = BigInt(Math.floor(slippagePercent * 100));
  const amountOutMin = (buyAmountRaw * (10000n - slippageBps)) / 10000n;

  // Deadline: 20 minutes from now
  const deadline = Math.floor(Date.now() / 1000) + 1200;

  // Resolve path
  let path = quote.path;
  if (!path || path.length === 0) {
    const sellAddr = TESTNET_TOKEN_ADDRESSES[sellUpper];
    const buyAddr  = TESTNET_TOKEN_ADDRESSES[buyUpper];
    path = [sellAddr, buyAddr];
  }

  let tx: ethers.ContractTransactionResponse;

  if (sellUpper === 'BNB') {
    // 1. BNB -> Token
    tx = await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
      amountOutMin,
      path,
      takerAddress,
      deadline,
      { value: sellAmountWei },
    );
  } else if (buyUpper === 'BNB') {
    // 2. Token -> BNB
    tx = await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
      sellAmountWei,
      amountOutMin,
      path,
      takerAddress,
      deadline,
    );
  } else {
    // 3. Token -> Token
    tx = await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
      sellAmountWei,
      amountOutMin,
      path,
      takerAddress,
      deadline,
    );
  }

  return tx.hash;
}

/**
 * Execute Mainnet 0x trade.
 * Locally signed on device.
 */
export async function executeMainnetSwap(
  quote: SwapQuoteData,
  privateKey: string,
): Promise<string> {
  const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.mainnet.rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const rawTx = quote.rawQuote?.transaction;

  if (!rawTx) {
    throw new Error('0x quote is missing transaction data');
  }

  const tx = await wallet.sendTransaction({
    to: rawTx.to,
    data: rawTx.data,
    value: rawTx.value ? BigInt(rawTx.value) : 0n,
    gasLimit: rawTx.gas ? BigInt(rawTx.gas) : undefined,
  });

  return tx.hash;
}

/**
 * Record a completed swap to backend database.
 */
export async function recordSwapToBackend(data: {
  txHash: string;
  takerAddress: string;
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  buyAmount: string;
  lwFeeBps: number;
  lwFeeUSD: string;
  chainId: number;
}): Promise<void> {
  try {
    await axios.post(`${BACKEND_URL}/api/swap/record`, data);
  } catch (err: any) {
    console.warn('Failed to record swap to backend:', err.message);
  }
}

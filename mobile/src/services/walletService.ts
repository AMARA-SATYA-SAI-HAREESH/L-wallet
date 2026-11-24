// mobile/src/services/walletService.ts
import { ethers } from 'ethers';

/** BSC Mainnet JSON-RPC provider (Ankr public endpoint, NodeReal as fallback) */
const BSC_RPC_PRIMARY = 'https://rpc.ankr.com/bsc';
const BSC_RPC_BACKUP  = 'https://bsc-dataseed.binance.org';

function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(BSC_RPC_PRIMARY);
}

// ─── BEP-20 token addresses (BSC Mainnet) ───────────────────────────────────
export const TOKENS = {
  BNB:  { symbol: 'BNB',  decimals: 18, address: null },   // native
  USDT: {
    symbol: 'USDT',
    decimals: 18,
    address: '0x55d398326f99059fF775485246999027B3197955',
  },
  USDC: {
    symbol: 'USDC',
    decimals: 18,
    address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  },
} as const;

export type TokenSymbol = keyof typeof TOKENS;

// Minimal ERC-20 ABI for balanceOf and transfer
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];

// ─── Wallet generation / import ─────────────────────────────────────────────
export function generateMnemonic(): string {
  const wallet = ethers.Wallet.createRandom();
  if (!wallet.mnemonic) throw new Error('Failed to generate mnemonic');
  return wallet.mnemonic.phrase;
}

export function validateMnemonic(mnemonic: string): boolean {
  try {
    ethers.Mnemonic.fromPhrase(mnemonic.trim());
    return true;
  } catch {
    return false;
  }
}

export function deriveWalletFromMnemonic(mnemonic: string): {
  address: string;
  privateKey: string;
} {
  const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic.trim(), undefined, "m/44'/60'/0'/0/0");
  return { address: hdNode.address, privateKey: hdNode.privateKey };
}

// ─── Balances ────────────────────────────────────────────────────────────────
export async function getBNBBalance(address: string): Promise<string> {
  const provider = getProvider();
  const bal = await provider.getBalance(address);
  return ethers.formatEther(bal);
}

export async function getTokenBalance(
  address: string,
  tokenSymbol: 'USDT' | 'USDC',
): Promise<string> {
  const token = TOKENS[tokenSymbol];
  const provider = getProvider();
  const contract = new ethers.Contract(token.address!, ERC20_ABI, provider);
  const bal = await contract.balanceOf(address);
  return ethers.formatUnits(bal, token.decimals);
}

// ─── Send BNB ────────────────────────────────────────────────────────────────
export async function sendBNB(
  privateKey: string,
  to: string,
  amountEth: string,
): Promise<string> {
  const provider = getProvider();
  const wallet = new ethers.Wallet(privateKey, provider);
  const tx = await wallet.sendTransaction({
    to,
    value: ethers.parseEther(amountEth),
  });
  return tx.hash;
}

// ─── Send BEP-20 token ───────────────────────────────────────────────────────
export async function sendToken(
  privateKey: string,
  to: string,
  amountHuman: string,
  tokenSymbol: 'USDT' | 'USDC',
): Promise<string> {
  const token = TOKENS[tokenSymbol];
  const provider = getProvider();
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(token.address!, ERC20_ABI, wallet);
  const amount = ethers.parseUnits(amountHuman, token.decimals);
  const tx = await contract.transfer(to, amount);
  return tx.hash;
}

// ─── Gas estimate ────────────────────────────────────────────────────────────
export async function estimateGasFee(
  fromAddress: string,
  toAddress: string,
  amountEth: string,
): Promise<{ gasCostBNB: string; gasPrice: bigint; gasLimit: bigint }> {
  const provider = getProvider();
  const gasPrice = (await provider.getFeeData()).gasPrice ?? ethers.parseUnits('5', 'gwei');
  const gasLimit = await provider.estimateGas({
    from: fromAddress,
    to: toAddress,
    value: ethers.parseEther(amountEth),
  });
  const gasCostBNB = ethers.formatEther(gasPrice * gasLimit);
  return { gasCostBNB, gasPrice, gasLimit };
}

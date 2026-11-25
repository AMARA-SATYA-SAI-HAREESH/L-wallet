// mobile/src/services/walletService.ts
import { ethers } from 'ethers';
import { useWalletStore, NetworkType } from '../store/walletStore';

export const NETWORK_CONFIG: Record<
  NetworkType,
  {
    name: string;
    chainId: number;
    rpcUrl: string;
    backupRpcUrl: string;
    explorerUrl: string;
    bscscanApi: string;
    nativeSymbol: string;
    tokens: {
      BNB: { symbol: string; decimals: number; address: null };
      USDT: { symbol: string; decimals: number; address: string };
      USDC: { symbol: string; decimals: number; address: string };
    };
  }
> = {
  mainnet: {
    name: 'BNB Smart Chain',
    chainId: 56,
    rpcUrl:
      'https://rpc.ankr.com/bsc/65d4a1f2538cca99044e70d6d997404cd07fc45e4582f32e8ec01a7799d6ca9c',
    backupRpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    bscscanApi: 'https://api.bscscan.com/api',
    nativeSymbol: 'BNB',
    tokens: {
      BNB: { symbol: 'BNB', decimals: 18, address: null },
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
    },
  },
  testnet: {
    name: 'BSC Testnet',
    chainId: 97,
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    backupRpcUrl: 'https://bsc-testnet-rpc.publicnode.com',
    explorerUrl: 'https://testnet.bscscan.com',
    bscscanApi: 'https://api-testnet.bscscan.com/api',
    nativeSymbol: 'tBNB',
    tokens: {
      BNB: { symbol: 'tBNB', decimals: 18, address: null },
      USDT: {
        symbol: 'USDT',
        decimals: 18,
        address: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
      },
      USDC: {
        symbol: 'USDC',
        decimals: 18,
        address: '0x64544969ed7EBf5f083679233325356EbE738930',
      },
    },
  },
};

export function getActiveNetwork() {
  const net = useWalletStore.getState().network;
  return NETWORK_CONFIG[net];
}

function getProvider(): ethers.JsonRpcProvider {
  const cfg = getActiveNetwork();
  return new ethers.JsonRpcProvider(cfg.rpcUrl);
}

export type TokenSymbol = 'BNB' | 'USDT' | 'USDC';

// Minimal ERC-20 ABI for balanceOf, transfer, estimate
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
  try {
    const cfg = getActiveNetwork();
    const token = cfg.tokens[tokenSymbol];
    const provider = getProvider();
    const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
    const bal = await contract.balanceOf(address);
    return ethers.formatUnits(bal, token.decimals);
  } catch {
    return '0';
  }
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
  const cfg = getActiveNetwork();
  const token = cfg.tokens[tokenSymbol];
  const provider = getProvider();
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(token.address, ERC20_ABI, wallet);
  const amount = ethers.parseUnits(amountHuman, token.decimals);
  const tx = await contract.transfer(to, amount);
  return tx.hash;
}

// ─── Gas estimate ────────────────────────────────────────────────────────────
export async function estimateGasFee(
  fromAddress: string,
  toAddress: string,
  amountHuman: string,
  tokenSymbol: 'BNB' | 'USDT' | 'USDC' = 'BNB',
): Promise<{ gasCostBNB: string; gasPrice: bigint; gasLimit: bigint }> {
  const cfg = getActiveNetwork();
  const provider = getProvider();
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? ethers.parseUnits('3', 'gwei');

  let gasLimit: bigint;
  try {
    if (tokenSymbol === 'BNB') {
      gasLimit = await provider.estimateGas({
        from: fromAddress,
        to: toAddress,
        value: ethers.parseEther(amountHuman || '0'),
      });
    } else {
      const token = cfg.tokens[tokenSymbol];
      const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
      const val = ethers.parseUnits(amountHuman || '0', token.decimals);
      gasLimit = await contract.transfer.estimateGas(toAddress, val, { from: fromAddress });
    }
  } catch {
    gasLimit = tokenSymbol === 'BNB' ? 21000n : 65000n;
  }

  const gasCostBNB = ethers.formatEther(gasPrice * gasLimit);
  return { gasCostBNB, gasPrice, gasLimit };
}

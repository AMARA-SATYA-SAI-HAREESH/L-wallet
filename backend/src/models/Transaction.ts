// backend/src/models/Transaction.ts
import { Schema, model, Document } from 'mongoose';

export type TxType = 'send' | 'receive' | 'swap';
export type TxStatus = 'pending' | 'confirmed' | 'failed';

export interface ITransaction extends Document {
  txHash: string;
  type: TxType;
  fromAddress: string;
  toAddress?: string;
  tokenSymbol: string;
  amount: string;
  chainId: number;
  status: TxStatus;
  gasUsed?: string;
  blockNumber?: number;
  metadata?: Record<string, any>;
}

const TransactionSchema = new Schema<ITransaction>({
  txHash: { type: String, required: true, unique: true },
  type: { type: String, enum: ['send', 'receive', 'swap'], required: true },
  fromAddress: { type: String, required: true },
  toAddress: String,
  tokenSymbol: { type: String, required: true },
  amount: { type: String, required: true },
  chainId: { type: Number, required: true, default: 56 },
  status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
  gasUsed: String,
  blockNumber: Number,
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

export default model<ITransaction>('Transaction', TransactionSchema);

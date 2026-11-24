// src/models/Transaction.ts
import { Schema, model, Document } from 'mongoose';

export interface ITransaction extends Document {
  userId?: string; // optional if you later add auth
  txHash: string;
  type: 'send' | 'receive' | 'swap';
  token: string; // token symbol
  amount: string; // stored as string to preserve precision
  fee: string;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: String },
    txHash: { type: String, required: true, unique: true },
    type: { type: String, enum: ['send', 'receive', 'swap'], required: true },
    token: { type: String, required: true },
    amount: { type: String, required: true },
    fee: { type: String, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
  },
  { timestamps: true },
);

export default model<ITransaction>('Transaction', transactionSchema);

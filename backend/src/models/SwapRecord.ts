// backend/src/models/SwapRecord.ts
import { Schema, model, Document } from 'mongoose';

export interface ISwapRecord extends Document {
  txHash: string;
  takerAddress: string;
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  buyAmount: string;
  lwFeeBps: number;
  lwFeeUSD: string;
  status: 'pending' | 'confirmed' | 'failed';
  chainId: number;
}

const SwapRecordSchema = new Schema<ISwapRecord>({
  txHash: { type: String, required: true },
  takerAddress: { type: String, required: true },
  sellToken: { type: String, required: true },
  buyToken: { type: String, required: true },
  sellAmount: { type: String, required: true },
  buyAmount: { type: String, required: true },
  lwFeeBps: { type: Number, required: true },
  lwFeeUSD: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
  chainId: { type: Number, default: 56 },
}, { timestamps: true });

export default model<ISwapRecord>('SwapRecord', SwapRecordSchema);

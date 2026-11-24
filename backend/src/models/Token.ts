// backend/src/models/Token.ts
import { Schema, model, Document } from 'mongoose';

export interface IToken extends Document {
  symbol: string;
  name: string;
  decimals: number;
  contractAddress: string | null;
  chainId: number;
  isNative: boolean;
  logoUrl?: string;
  isActive: boolean;
}

const TokenSchema = new Schema<IToken>({
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  decimals: { type: Number, required: true },
  contractAddress: { type: String, default: null },
  chainId: { type: Number, required: true },
  isNative: { type: Boolean, default: false },
  logoUrl: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default model<IToken>('Token', TokenSchema);

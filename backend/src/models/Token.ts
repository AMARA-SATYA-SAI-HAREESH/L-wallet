// src/models/Token.ts
import { Schema, model, Document } from 'mongoose';

export interface IToken extends Document {
  name: string;
  symbol: string;
  address: string; // BEP-20 contract address
  decimals: number;
  logoUrl?: string;
}

const tokenSchema = new Schema<IToken>({
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  address: { type: String, required: true, unique: true },
  decimals: { type: Number, required: true },
  logoUrl: { type: String },
});

export default model<IToken>('Token', tokenSchema);

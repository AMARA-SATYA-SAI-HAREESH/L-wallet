// backend/src/models/Network.ts
import { Schema, model, Document } from 'mongoose';

export interface INetwork extends Document {
  name: string;
  chainId: number;
  rpcUrl: string;
  backupRpcUrl?: string;
  explorerUrl: string;
  nativeCurrency: string;
  isActive: boolean;
}

const NetworkSchema = new Schema<INetwork>({
  name: { type: String, required: true },
  chainId: { type: Number, required: true, unique: true },
  rpcUrl: { type: String, required: true },
  backupRpcUrl: String,
  explorerUrl: { type: String, required: true },
  nativeCurrency: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default model<INetwork>('Network', NetworkSchema);

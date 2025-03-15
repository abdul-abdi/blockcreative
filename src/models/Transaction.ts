import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  id: string;
  transaction_hash: string;
  transaction_type: 'project_funding' | 'script_purchase' | 'nft_minting';
  user_id: string;
  project_id?: string;
  submission_id?: string;
  recipient_id?: string;
  amount: number;
  status: 'pending' | 'verified' | 'failed';
  created_at: Date;
  metadata?: any;
}

const TransactionSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  transaction_hash: { type: String, required: true, unique: true },
  transaction_type: { 
    type: String, 
    enum: ['project_funding', 'script_purchase', 'nft_minting'], 
    required: true 
  },
  user_id: { type: String, required: true, ref: 'User' },
  project_id: { type: String, ref: 'Project' },
  submission_id: { type: String, ref: 'Submission' },
  recipient_id: { type: String, ref: 'User' },
  amount: { type: Number, required: true, default: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'verified', 'failed'], 
    default: 'pending' 
  },
  created_at: { type: Date, default: Date.now },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema); 
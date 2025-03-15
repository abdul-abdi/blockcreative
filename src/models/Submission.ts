import mongoose, { Schema, Document } from 'mongoose';

export interface ISubmission extends Document {
  id: string;
  project_id: string;
  writer_id: string;
  title: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
  updated_at: Date;
  feedback?: string;
  analysis?: any;
  is_purchased?: boolean;
  purchase_amount?: number;
  nft_minted?: boolean;
  nft_token_id?: string;
  nft_metadata?: any;
}

const SubmissionSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  project_id: { type: String, required: true, ref: 'Project' },
  writer_id: { type: String, required: true, ref: 'User' },
  title: { type: String, required: true },
  content: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  feedback: { type: String },
  analysis: { type: Schema.Types.Mixed },
  is_purchased: { type: Boolean, default: false },
  purchase_amount: { type: Number },
  nft_minted: { type: Boolean, default: false },
  nft_token_id: { type: String },
  nft_metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema); 
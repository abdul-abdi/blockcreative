import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  id: string;
  producer_id: string;
  title: string;
  description: string;
  requirements: string;
  budget?: number;
  deadline?: Date;
  status: 'open' | 'closed' | 'completed';
  created_at: Date;
  updated_at: Date;
  is_funded?: boolean;
  funding_amount?: number;
  contract_address?: string;
  blockchain_data?: any;
}

const ProjectSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  producer_id: { type: String, required: true, ref: 'User' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  requirements: { type: String, required: true },
  budget: { type: Number },
  deadline: { type: Date },
  status: { 
    type: String, 
    enum: ['open', 'closed', 'completed'], 
    default: 'open' 
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  is_funded: { type: Boolean, default: false },
  funding_amount: { type: Number },
  contract_address: { type: String },
  blockchain_data: { type: Schema.Types.Mixed }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema); 
import mongoose, { Schema, Document, SchemaDefinitionProperty } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IProject extends Document {
  id: string;
  projectId: string;
  producer: mongoose.Types.ObjectId;
  producer_id?: string;
  producer_address?: string;
  producer_wallet?: string;
  title: string;
  description: string;
  requirements?: string;
  budget?: number;
  deadline?: Date;
  status: 'draft' | 'published' | 'funded' | 'completed' | 'cancelled' | 'open';
  is_funded?: boolean;
  funding_amount?: number;
  contract_address?: string;
  blockchain_data?: Record<string, unknown>;
  onChain?: boolean;
  metadata?: Record<string, unknown>;
  genre?: string;
  type?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => `project_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
  },
  projectId: { 
    type: String, 
    required: true, 
    unique: true,
    default: () => `project_${uuidv4()}`
  },
  producer: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  producer_id: {
    type: String,
    index: true
  },
  producer_address: {
    type: String,
    lowercase: true,
    index: true
  },
  producer_wallet: {
    type: String,
    lowercase: true,
    index: true
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  requirements: { 
    type: String, 
    default: ''
  },
  budget: { 
    type: Number, 
    default: null 
  },
  deadline: { type: Date, default: null },
  status: { 
    type: String, 
    enum: ['draft', 'published', 'funded', 'completed', 'cancelled', 'open'],
    default: 'draft' 
  },
  is_funded: { type: Boolean, default: false },
  funding_amount: { type: Number },
  contract_address: { type: String },
  blockchain_data: { type: Schema.Types.Mixed },
  onChain: {
    type: Boolean,
    default: false
  },
  genre: { 
    type: String,
    default: '' 
  },
  type: { 
    type: String,
    default: '' 
  },
  metadata: {
    type: Schema.Types.Mixed as unknown as SchemaDefinitionProperty<Record<string, unknown>>,
    required: false
  }
}, {
  timestamps: true
});

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema); 
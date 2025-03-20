import mongoose, { Schema, Document, SchemaDefinitionProperty } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IProject extends Document {
  projectId: string;
  producer: mongoose.Types.ObjectId;
  title: string;
  description: string;
  requirements: string;
  budget?: number;
  deadline?: Date;
  status: 'draft' | 'published' | 'funded' | 'completed' | 'cancelled';
  is_funded?: boolean;
  funding_amount?: number;
  contract_address?: string;
  blockchain_data?: Record<string, unknown>;
  onChain?: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema({
  projectId: { 
    type: String, 
    required: true, 
    unique: true,
    default: () => uuidv4()
  },
  producer: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  requirements: { type: String, required: true },
  budget: { 
    type: Number, 
    required: false,
    default: 0 
  },
  deadline: { type: Date },
  status: { 
    type: String, 
    enum: ['draft', 'published', 'funded', 'completed', 'cancelled'],
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
  metadata: {
    type: Schema.Types.Mixed as unknown as SchemaDefinitionProperty<Record<string, unknown>>,
    required: false
  }
}, {
  timestamps: true
});

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema); 
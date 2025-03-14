import mongoose, { Schema, Document } from 'mongoose';

export interface IScript extends Document {
  id: string;
  writer_id: string;
  title: string;
  content: string;
  created_at: Date;
  updated_at: Date;
  script_hash?: string;
  status: 'draft' | 'submitted' | 'sold' | 'rejected';
}

const ScriptSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  writer_id: { type: String, required: true, ref: 'User' },
  title: { type: String, required: true },
  content: { type: String, required: true },
  script_hash: { type: String },
  status: { 
    type: String, 
    enum: ['draft', 'submitted', 'sold', 'rejected'], 
    default: 'draft' 
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.models.Script || mongoose.model<IScript>('Script', ScriptSchema); 
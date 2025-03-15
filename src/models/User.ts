import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  id: string;
  address: string;
  role: 'writer' | 'producer' | 'admin';
  created_at: Date;
  profile_data: {
    name?: string;
    bio?: string;
    avatar?: string;
    website?: string;
    social?: {
      twitter?: string;
      linkedin?: string;
      instagram?: string;
    };
  };
  onboarding_completed: boolean;
  onboarding_step: number;
}

const UserSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  address: { type: String, required: true, unique: true },
  role: { 
    type: String, 
    enum: ['writer', 'producer', 'admin'], 
    required: true 
  },
  created_at: { type: Date, default: Date.now },
  profile_data: {
    name: { type: String },
    bio: { type: String },
    avatar: { type: String },
    website: { type: String },
    social: {
      twitter: { type: String },
      linkedin: { type: String },
      instagram: { type: String }
    }
  },
  onboarding_completed: { type: Boolean, default: false },
  onboarding_step: { type: Number, default: 0 }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema); 
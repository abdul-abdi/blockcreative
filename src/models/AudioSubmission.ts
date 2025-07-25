import mongoose from "mongoose";

const AudioSubmissionSchema = new mongoose.Schema({
    title:String,
    content:String,
    createdAt: {type: Date, default: Date.now}
})

export default mongoose.models.AudioSubmission || 
    mongoose.model('AudioSubmission', AudioSubmissionSchema);
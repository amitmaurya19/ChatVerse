import mongoose, { Schema } from 'mongoose';

const MessageSchema = new mongoose.Schema({
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  editedAt: { type: Date },
});

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);

import mongoose, { Schema } from 'mongoose';

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['public', 'private'], required: true },
  passkey: { type: String },
  avatarUrl: { type: String },
  avatarFallback: { type: String },
  creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: { type: Number, default: 0 },
  memberIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Room || mongoose.model('Room', RoomSchema);


"use server";

import dbConnect from "@/lib/mongodb";
import UserModel from "@/models/user";
import RoomModel from "@/models/room";
import MessageModel from "@/models/message";
import type { User, Room, Message } from "@/lib/types";
import { revalidatePath } from "next/cache";
import mongoose, { Document, Types } from "mongoose";

// --- Type Definitions for Mongoose Documents ---

interface UserDoc extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  image?: string;
  password?: string;
}

interface RoomDoc extends Document {
    _id: Types.ObjectId;
    name: string;
    description: string;
    type: 'public' | 'private';
    passkey?: string;
    avatarUrl: string;
    avatarFallback: string;
    creatorId: Types.ObjectId;
    members: number;
    memberIds: Types.ObjectId[];
}

interface MessageDoc extends Document {
    _id: Types.ObjectId;
    roomId: Types.ObjectId;
    author: any; // Populated field
    text: string;
    timestamp: Date;
    editedAt?: Date;
}

// Lean document types (for .lean() queries)
interface UserLean {
  _id: Types.ObjectId;
  name: string;
  email: string;
  image?: string;
  password?: string;
}

interface RoomLean {
    _id: Types.ObjectId;
    name: string;
    description: string;
    type: 'public' | 'private';
    passkey?: string;
    avatarUrl: string;
    avatarFallback: string;
    creatorId: Types.ObjectId | { _id: Types.ObjectId; name: string }; // Can be populated
    members: number;
    memberIds: Types.ObjectId[];
}

interface MessageLean {
    _id: Types.ObjectId;
    roomId: Types.ObjectId;
    author: { _id: Types.ObjectId; name: string; image?: string };
    text: string;
    timestamp: Date;
    editedAt?: Date;
}


// --- User Functions ---

export const getUserByEmail = async (email: string): Promise<(User & { password?: string }) | null> => {
  await dbConnect();
  const user = await UserModel.findOne({ email }).lean<UserLean>();
  if (!user) return null;

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    image: user.image,
    password: user.password,
  };
};

export const getUserById = async (id: string): Promise<User | null> => {
    await dbConnect();
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        const user = await UserModel.findById(id).lean<UserLean>();
        if (!user) return null;
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
        };
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        return null;
    }
}

export const createUser = async (userData: Partial<User & { password?: string }>) => {
    await dbConnect();
    const newUser = new UserModel(userData);
    await newUser.save();
    const plainUser = newUser.toObject();
    return {
        id: plainUser._id.toString(),
        name: plainUser.name,
        email: plainUser.email,
        image: plainUser.image,
    };
}

export const updateUserImage = async (userId: string, imageUrl: string) => {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid User ID");
    }
    await UserModel.findByIdAndUpdate(userId, { image: imageUrl });
    revalidatePath('/profile');
}


// --- Room Functions ---

export const getAllRooms = async (): Promise<Room[]> => {
  await dbConnect();
  const rooms = await RoomModel.find().sort({ members: -1 }).populate('creatorId', 'name').lean<RoomLean[]>();
  return rooms.map((room) => ({
    id: room._id.toString(),
    name: room.name,
    description: room.description,
    type: room.type,
    passkey: room.passkey,
    avatarUrl: room.avatarUrl,
    avatarFallback: room.avatarFallback,
    creatorId: (room.creatorId as any)?._id?.toString(),
    members: room.members,
    memberIds: room.memberIds.map((id) => id.toString()),
  }));
};

export const getMyRooms = async (userId: string): Promise<Room[]> => {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(userId)) return [];
  const rooms = await RoomModel.find({ memberIds: new mongoose.Types.ObjectId(userId) }).populate('creatorId', 'name').lean<RoomLean[]>();
  return rooms.map((room) => ({
    id: room._id.toString(),
    name: room.name,
    description: room.description,
    type: room.type,
    passkey: room.passkey,
    avatarUrl: room.avatarUrl,
    avatarFallback: room.avatarFallback,
    creatorId: (room.creatorId as any)?._id?.toString(),
    members: room.members,
    memberIds: room.memberIds.map((id) => id.toString()),
  }));
};

export const getCreatedRooms = async (userId: string): Promise<Room[]> => {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(userId)) return [];
    const rooms = await RoomModel.find({ creatorId: new mongoose.Types.ObjectId(userId) }).populate('creatorId', 'name').lean<RoomLean[]>();
    return rooms.map((room) => ({
        id: room._id.toString(),
        name: room.name,
        description: room.description,
        type: room.type,
        passkey: room.passkey,
        avatarUrl: room.avatarUrl,
        avatarFallback: room.avatarFallback,
        creatorId: (room.creatorId as any)?._id?.toString(),
        members: room.members,
        memberIds: room.memberIds.map((id) => id.toString()),
      }));
};

export const getRoomById = async (id: string): Promise<Room | null> => {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const room = await RoomModel.findById(id).lean<RoomLean>();
  if (!room) return null;
  return {
    id: room._id.toString(),
    name: room.name,
    description: room.description,
    type: room.type,
    passkey: room.passkey,
    avatarUrl: room.avatarUrl,
    avatarFallback: room.avatarFallback,
    creatorId: room.creatorId.toString(),
    members: room.members,
    memberIds: room.memberIds.map((id) => id.toString()),
  };
};

export const addRoom = async (
  roomData: Omit<Room, 'id' | 'creatorId' | 'members' | 'memberIds'>,
  user: User
): Promise<Room> => {
    await dbConnect();
    const newRoom = new RoomModel({
        ...roomData,
        creatorId: user.id,
        members: 1,
        memberIds: [user.id],
    });
    const savedRoom: RoomDoc = await newRoom.save();
    revalidatePath('/home');
    return {
        id: savedRoom._id.toString(),
        name: savedRoom.name,
        description: savedRoom.description,
        type: savedRoom.type,
        passkey: savedRoom.passkey,
        avatarUrl: savedRoom.avatarUrl,
        avatarFallback: savedRoom.avatarFallback,
        creatorId: savedRoom.creatorId.toString(),
        members: savedRoom.members,
        memberIds: savedRoom.memberIds.map((id) => id.toString()),
    };
};

export const updateRoom = async (
  roomId: string,
  updates: Partial<Room>
): Promise<void> => {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(roomId)) return;
    await RoomModel.findByIdAndUpdate(roomId, updates);
    revalidatePath(`/chat/${roomId}`);
};

export const deleteRoom = async (
  roomId: string,
  userId: string
): Promise<void> => {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(roomId) || !mongoose.Types.ObjectId.isValid(userId)) return;
    const room = await RoomModel.findById(roomId);
    if (!room || room.creatorId.toString() !== userId) {
        throw new Error("Room not found or user is not the creator.");
    }
    await RoomModel.findByIdAndDelete(roomId);
    await MessageModel.deleteMany({ roomId });
    revalidatePath('/home');
    revalidatePath(`/chat/${roomId}`);
};

export const joinRoom = async (roomId: string, userId: string): Promise<void> => {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(roomId) || !mongoose.Types.ObjectId.isValid(userId)) return;
    const room = await RoomModel.findById(roomId);
    if (!room) throw new Error("Room not found");
    
    if (!room.memberIds.map((id: mongoose.Types.ObjectId) => id.toString()).includes(userId)) {
        room.memberIds.push(new mongoose.Types.ObjectId(userId));
        room.members = room.memberIds.length;
        await room.save();
    }
    revalidatePath(`/chat/${roomId}`);
    revalidatePath('/home');
};

export const leaveRoom = async (roomId: string, userId: string): Promise<void> => {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(roomId) || !mongoose.Types.ObjectId.isValid(userId)) return;
    const room = await RoomModel.findById(roomId);
    if (!room) throw new Error("Room not found");

    const initialCount = room.memberIds.length;
    const userIdObj = new mongoose.Types.ObjectId(userId);
    room.memberIds = room.memberIds.filter((id: mongoose.Types.ObjectId) => !id.equals(userIdObj));
    
    if (room.memberIds.length < initialCount) {
        room.members = room.memberIds.length;
        await room.save();
    }
    revalidatePath(`/chat/${roomId}`);
    revalidatePath('/home');
};


// --- Message Functions ---

export const getMessagesForRoom = async (roomId: string): Promise<Message[]> => {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(roomId)) return [];
  const messages = await MessageModel.find({ roomId: new mongoose.Types.ObjectId(roomId) }).sort({ timestamp: 'asc' }).populate('author', 'name image').lean<MessageLean[]>();
  return messages.map((msg) => ({
    id: msg._id.toString(),
    text: msg.text,
    timestamp: msg.timestamp.toISOString(),
    editedAt: msg.editedAt?.toISOString(),
    author: {
        id: msg.author._id.toString(),
        name: msg.author.name,
        avatarUrl: msg.author.image || '',
    }
  }));
}

export const addMessageToRoom = async (
  roomId: string,
  text: string,
  user: User
): Promise<string> => {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(roomId)) throw new Error("Invalid Room ID");
    const newMessage = new MessageModel({
        roomId,
        text,
        author: user.id,
    });
    await newMessage.save();
    revalidatePath(`/chat/${roomId}`);
    return newMessage._id.toString();
}

export const updateMessageInRoom = async (
    roomId: string,
    messageId: string,
    newText: string,
    userId: string
  ): Promise<void> => {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(roomId) || !mongoose.Types.ObjectId.isValid(messageId) || !mongoose.Types.ObjectId.isValid(userId)) return;
    const message = await MessageModel.findById(messageId);
  
    if (!message || message.author.toString() !== userId) {
      throw new Error("Message not found or you don't have permission to edit.");
    }
  
    message.text = newText;
    message.editedAt = new Date();
    await message.save();
    revalidatePath(`/chat/${roomId}`);
  };

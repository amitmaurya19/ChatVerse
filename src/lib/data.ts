import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  doc,
  updateDoc, // Make sure updateDoc is imported
  orderBy,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { User as NextAuthUser } from "next-auth";

// Base user type from NextAuth, add your custom fields if needed
export type User = NextAuthUser & {
  id: string;
};

export type Room = {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private';
  passkey?: string;
  avatarUrl: string;
  avatarFallback: string;
  creatorId: string;
  members: number;
  memberIds: string[];
  isJoined?: boolean;
  isCreator?: boolean;
};

export type Message = {
  id: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string;
  };
  text: string;
  timestamp: Timestamp | null;
};

// Helper function to convert Firestore doc to a Room object
const toRoomObject = (doc: any): Room => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    description: data.description,
    type: data.type,
    passkey: data.passkey,
    avatarUrl: data.avatarUrl,
    avatarFallback: data.avatarFallback,
    creatorId: data.creatorId,
    members: data.members,
    memberIds: data.memberIds,
  };
};

// Helper function to convert Firestore doc to a Message object
const toMessageObject = (doc: any): Message => {
  const data = doc.data();
  return {
    id: doc.id,
    author: {
      id: data.author.id,
      name: data.author.name,
      avatarUrl: data.author.avatarUrl,
    },
    text: data.text,
    timestamp: data.timestamp,
  };
};

// --- User Functions ---
export const getUserByEmail = async (email: string): Promise<User | null> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', email));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }
  const data = querySnapshot.docs[0].data();
  return {
    id: querySnapshot.docs[0].id,
    name: data.name,
    email: data.email,
    image: data.image,
  };
};

// --- Room Functions ---

export const getAllRooms = async (): Promise<Room[]> => {
  const roomsCol = collection(db, 'rooms');
  const q = query(roomsCol, orderBy('members', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(toRoomObject);
};

export const getMyRooms = async (userId: string): Promise<Room[]> => {
  const roomsCol = collection(db, 'rooms');
  const q = query(roomsCol, where('memberIds', 'array-contains', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(toRoomObject);
};

export const getCreatedRooms = async (userId: string): Promise<Room[]> => {
  const roomsCol = collection(db, 'rooms');
  const q = query(roomsCol, where('creatorId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(toRoomObject);
};

export const getRoomById = async (id: string): Promise<Room | undefined> => {
  const roomDoc = await getDoc(doc(db, 'rooms', id));
  if (roomDoc.exists()) {
    return toRoomObject(roomDoc);
  }
  return undefined;
};

export const addRoom = async (
  roomData: Omit<Room, 'id' | 'creatorId' | 'members' | 'memberIds'>,
  user: User
): Promise<Room> => {
  const newRoomData = {
    ...roomData,
    creatorId: user.id,
    members: 1,
    memberIds: [user.id],
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, 'rooms'), newRoomData);
  return {
    id: docRef.id,
    ...newRoomData,
  } as Room;
};

/**
 * ✨ This is the new function you just added
 * Updates specific fields of a room document in Firestore.
 * @param roomId - The ID of the room to update.
 * @param updates - An object containing the fields to update.
 * @returns A promise that resolves when the update is complete.
 */
export const updateRoom = async (
  roomId: string,
  updates: Partial<Pick<Room, 'name' | 'description' | 'type' | 'passkey'>>
): Promise<void> => {
  const roomRef = doc(db, 'rooms', roomId);
  // If type is changed to public, we should ensure the passkey is removed
  if (updates.type === 'public' && updates.passkey !== undefined) {
    updates.passkey = ''; // Set passkey to empty string
  }
  await updateDoc(roomRef, updates);
};


export const deleteRoom = async (
  roomId: string,
  userId: string
): Promise<void> => {
  const roomRef = doc(db, 'rooms', roomId);
  const roomDoc = await getDoc(roomRef);
  if (!roomDoc.exists() || roomDoc.data().creatorId !== userId) {
    throw new Error("Room not found or user is not the creator.");
  }
  await deleteDoc(roomRef);
};

export const joinRoom = async (roomId: string, userId: string) => {
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, {
    members: increment(1),
    memberIds: arrayUnion(userId)
  });
};

export const leaveRoom = async (roomId: string, userId: string) => {
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, {
    members: increment(-1),
    memberIds: arrayRemove(userId)
  });
};


// --- Message Functions ---

export const getMessagesForRoom = async (roomId: string): Promise<Message[]> => {
  const messagesCol = collection(db, 'rooms', roomId, 'messages');
  const q = query(messagesCol, orderBy('timestamp', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(toMessageObject);
};

export const addMessageToRoom = async (
  roomId: string,
  text: string,
  user: User
): Promise<string> => {
  const messagesCol = collection(db, 'rooms', roomId, 'messages');
  const newMessage = {
    author: {
      id: user.id,
      name: user.name ?? 'Anonymous',
      avatarUrl: user.image ?? 'https://placehold.co/40x40.png',
    },
    text,
    timestamp: serverTimestamp(),
  };
  const docRef = await addDoc(messagesCol, newMessage);
  return docRef.id;
};

export const updateMessageInRoom = async (
  roomId: string,
  messageId: string,
  newText: string,
  userId: string
) => {
  const messageRef = doc(db, 'rooms', roomId, 'messages', messageId);
  const messageDoc = await getDoc(messageRef);

  if (!messageDoc.exists() || messageDoc.data().author.id !== userId) {
    throw new Error("Message not found or you don't have permission to edit.");
  }

  await updateDoc(messageRef, {
    text: newText,
    editedAt: serverTimestamp(),
  });
};
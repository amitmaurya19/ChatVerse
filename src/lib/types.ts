
import type { User as NextAuthUser } from "next-auth";

export type User = NextAuthUser & {
  id: string;
  image?: string | null;
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
  timestamp: string; // Changed from Date to string for serialization
  editedAt?: string; // Changed from Date to string
};

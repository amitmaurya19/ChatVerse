"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAllRooms, addRoom } from '@/lib/data';
import type { Room, User } from '@/lib/data';
import { Plus, Users, Search, Lock } from 'lucide-react';
import { CreateRoomDialog } from '@/components/create-room-dialog';
import { JoinPrivateRoomDialog } from '@/components/join-private-room-dialog';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';

function RoomCard({ room, onCardClick }: { room: Room; onCardClick: (room: Room) => void; }) {
  return (
    <div onClick={() => onCardClick(room)} className="cursor-pointer h-full">
      <Card className="h-full flex flex-col hover:border-primary transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-primary/20">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-12 w-12 border-2 border-accent">
            <AvatarImage src={room.avatarUrl} alt={room.name} />
            <AvatarFallback>{room.avatarFallback}</AvatarFallback>
          </Avatar>
          <div className="w-full truncate">
            <CardTitle className="font-headline truncate flex items-center gap-2">
              {room.type === 'private' && <Lock className="h-4 w-4" />}
              {room.name}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <CardDescription>{room.description}</CardDescription>
        </CardContent>
        <CardFooter>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-2" />
            <span>{room.members} members</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isCreateRoomOpen, setCreateRoomOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isJoinRoomOpen, setJoinRoomOpen] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      setIsLoading(true);
      const allRooms = await getAllRooms();
      setRooms(allRooms);
      setIsLoading(false);
    };
    fetchRooms();
  }, []);

  const handleCreateRoom = async (newRoomData: Omit<Room, 'id' | 'creatorId' | 'members' | 'memberIds'>) => {
    if (!session?.user) return;
    try {
      const newRoom = await addRoom(newRoomData, session.user as User);
      setRooms(prevRooms => [newRoom, ...prevRooms]);
    } catch (error) {
      console.error("Failed to create room:", error);
    }
  };

  // This function decides what to do when a card is clicked
  const handleCardClick = (room: Room) => {
    if (!session?.user) return; // Ensure user is logged in

    if (room.type === 'public') {
      router.push(`/chat/${room.id}`);
    } else { // This is a private room
      // ✨ This is the key fix: Check if user is already a member
      const isAlreadyMember = room.memberIds.includes(session.user.id);
      if (isAlreadyMember) {
        // If they are a member, let them in without asking for a passkey
        router.push(`/chat/${room.id}`);
      } else {
        // If they are not a member, ask for the passkey
        setSelectedRoom(room);
        setJoinRoomOpen(true);
      }
    }
  };

  const handleRoomJoined = (roomId: string) => {
    setRooms(prevRooms =>
      prevRooms.map(room =>
        room.id === roomId
          ? { ...room, members: room.members + 1, memberIds: [...room.memberIds, session!.user!.id] } // ✨ Also update memberIds to prevent re-prompt
          : room
      )
    );
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 md:p-8 relative">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-headline">Discover Rooms</h1>
        <p className="text-muted-foreground">Browse and join public and private chat rooms from the ChatVerse community.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search rooms..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-56 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRooms.map((room) => (
            <RoomCard key={room.id} room={room} onCardClick={handleCardClick} />
          ))}
        </div>
      )}

      {session && (
        <>
          <Button 
            className="fixed bottom-20 md:bottom-8 right-8 h-16 w-16 rounded-full shadow-lg shadow-primary/30"
            onClick={() => setCreateRoomOpen(true)}
          >
            <Plus className="h-8 w-8" />
            <span className="sr-only">Create Room</span>
          </Button>

          <CreateRoomDialog 
            open={isCreateRoomOpen} 
            onOpenChange={setCreateRoomOpen} 
            onRoomCreate={handleCreateRoom}
          />

          <JoinPrivateRoomDialog 
            room={selectedRoom}
            open={isJoinRoomOpen}
            onOpenChange={setJoinRoomOpen}
            onRoomJoined={handleRoomJoined}
          />
        </>
      )}
    </div>
  );
}
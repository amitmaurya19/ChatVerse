"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAllRooms, addRoom } from '@/lib/data';
import type { Room, User } from '@/lib/data';
import { Plus, Users, Search } from 'lucide-react';
import { CreateRoomDialog } from '@/components/create-room-dialog';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';

function RoomCard({ room }: { room: Room }) {
  return (
    <Link href={`/chat/${room.id}`}>
      <Card className="h-full flex flex-col hover:border-primary transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-primary/20">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-12 w-12 border-2 border-accent">
            <AvatarImage src={room.avatarUrl} alt={room.name} />
            <AvatarFallback>{room.avatarFallback}</AvatarFallback>
          </Avatar>
          <div className="w-full truncate">
            <CardTitle className="font-headline truncate">{room.name}</CardTitle>
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
    </Link>
  );
}

export default function HomePage() {
  const { data: session } = useSession();
  const [isCreateRoomOpen, setCreateRoomOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      // TODO: Show a toast notification for the error
    }
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 md:p-8 relative">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-headline">Discover Rooms</h1>
        <p className="text-muted-foreground">Browse and join public chat rooms from the ChatVerse community.</p>
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
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-56 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRooms.map((room) => (
            <RoomCard key={room.id} room={room} />
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
        </>
      )}
    </div>
  );
}

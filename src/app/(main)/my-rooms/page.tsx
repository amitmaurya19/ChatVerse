"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getMyRooms } from '@/lib/data';
import type { Room } from '@/lib/types';
import { Users, MessageSquareDashed } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';
import { getAvatarFallback } from '@/lib/utils/avatar';

function RoomCard({ room }: { room: Room; }) {
  return (
    <Card className="h-full flex flex-col hover:border-primary transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-primary/20">
      <Link href={`/chat/${room.id}`} className="flex flex-col h-full">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-12 w-12 border-2 border-accent">
            <AvatarImage src={room.avatarUrl} alt={room.name} />
            <AvatarFallback>{getAvatarFallback(room.name)}</AvatarFallback>
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
      </Link>
    </Card>
  );
}

export default function MyRoomsPage() {
  const { data: session, status } = useSession();
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (status === 'authenticated' && session.user.id) {
      const fetchRooms = async () => {
        setIsLoading(true);
        const rooms = await getMyRooms(session.user.id);
        setMyRooms(rooms);
        setIsLoading(false);
      };
      fetchRooms();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
      setMyRooms([]);
    }
  }, [status, session]);
  
  if (isLoading) {
    return (
       <div className="container mx-auto p-4 md:p-8">
         <div className="space-y-2 mb-8">
           <Skeleton className="h-10 w-1/3" />
           <Skeleton className="h-6 w-1/2" />
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-56 rounded-lg" />)}
         </div>
       </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-headline">Your Rooms</h1>
        <p className="text-muted-foreground">A list of all the chat rooms you've joined.</p>
      </div>

      {myRooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {myRooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center border-2 border-dashed border-muted-foreground/30 rounded-lg py-24">
          <MessageSquareDashed className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold font-headline mb-2">No Rooms Yet</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">You haven't joined any rooms. Explore public rooms to find your community.</p>
          <Button asChild>
            <Link href="/home">Explore Rooms</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

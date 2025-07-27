
"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getCreatedRooms, updateUserImage } from '@/lib/data';
import type { Room } from '@/lib/types';
import { LogOut, Users, Camera } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { getAvatarFallback } from '@/lib/utils/avatar';
import { useToast } from '@/hooks/use-toast';
import { ImageCropDialog } from '@/components/image-crop-dialog';

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const { toast } = useToast();

  const [createdRooms, setCreatedRooms] = useState<Room[]>([]);
  const [isCropDialogOpen, setCropDialogOpen] = useState(false);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'authenticated' && session.user.id) {
      const fetchRooms = async () => {
        const rooms = await getCreatedRooms(session.user.id);
        setCreatedRooms(rooms);
      };
      fetchRooms();
    }
  }, [status, session]);

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
        setCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedImageUrl: string) => {
    if (!session?.user?.id) return;
    
    try {
        await updateUserImage(session.user.id, croppedImageUrl);

        // This function is provided by next-auth to update the session
        await updateSession({ image: croppedImageUrl });

        toast({
            title: "Success",
            description: "Your profile picture has been updated."
        });
        setCropDialogOpen(false);
    } catch (error) {
        console.error("Failed to update profile picture:", error);
        toast({
            title: "Error",
            description: "Failed to update your profile picture.",
            variant: "destructive"
        });
    }
  };


  if (status === 'loading' || !session?.user) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Skeleton className="h-10 w-1/3 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="grid gap-8 lg:grid-cols-3">
          <Skeleton className="lg:col-span-1 h-72 rounded-lg" />
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const { user } = session;

  return (
    <>
      <div className="container mx-auto p-4 md:p-8">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-headline">
            Your Profile
          </h1>
          <p className="text-muted-foreground">
            Manage your account and the rooms you've created.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card className="shadow-md shadow-primary/10">
              <CardHeader className="items-center text-center">
                <div className="relative group">
                   <Avatar className="h-24 w-24 mb-4 border-4 border-accent">
                    {user.image && (
                      <AvatarImage src={user.image} alt={user.name!} />
                    )}
                    <AvatarFallback>{getAvatarFallback(user.name ?? '')}</AvatarFallback>
                  </Avatar>
                  <label 
                    htmlFor="avatar-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
                  >
                    <Camera className="h-8 w-8"/>
                    <span className="sr-only">Change Picture</span>
                  </label>
                   <input
                    id="avatar-upload"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="sr-only"
                  />
                </div>
                <CardTitle className="text-2xl font-headline">
                  {user.name}
                </CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Log Out
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold font-headline mb-4">
              Rooms You've Created
            </h2>
            <Card className="shadow-md shadow-accent/10">
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {createdRooms.map((room) => (
                    <li key={room.id}>
                      <Link
                        href={`/chat/${room.id}`}
                        className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                      >
                        <Avatar className="h-10 w-10 border-2 border-accent">
                          <AvatarImage src={room.avatarUrl} alt={room.name} />
                          <AvatarFallback>
                            {getAvatarFallback(room.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{room.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center">
                            <Users className="h-4 w-4 mr-1.5" /> {room.members}{' '}
                            members
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          Manage
                        </Button>
                      </Link>
                    </li>
                  ))}
                  {createdRooms.length === 0 && (
                    <li className="p-8 text-center text-muted-foreground">
                      You haven't created any rooms yet.
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {sourceImage && (
        <ImageCropDialog
          open={isCropDialogOpen}
          onOpenChange={setCropDialogOpen}
          imageSrc={sourceImage}
          onCropComplete={handleCropComplete}
          onClose={() => {
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
      )}
    </>
  );
}

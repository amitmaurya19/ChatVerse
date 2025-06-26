"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getCreatedRooms, Room } from '@/lib/data';
import { Edit, LogOut, Users } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [createdRooms, setCreatedRooms] = useState<Room[]>([]);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  
  // States for profile picture editing
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (status === 'authenticated' && session.user.id) {
        const fetchRooms = async () => {
            const rooms = await getCreatedRooms(session.user.id);
            setCreatedRooms(rooms);
        }
        fetchRooms();
        setPreviewUrl(session.user.image || null);
    }
  }, [status, session]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async () => {
    if (!selectedFile) return;
    // TODO: Implement file upload to a service like Firebase Storage.
    // 1. Upload `selectedFile` to your storage.
    // 2. Get the public URL of the uploaded file.
    // 3. Update the user's document in Firestore with the new image URL.
    //    e.g., await updateDoc(doc(db, 'users', session.user.id), { image: newImageUrl });
    console.log("Updating profile picture... (simulation)");
    setEditDialogOpen(false);
    // You might need to trigger a session update in NextAuth to reflect the change immediately.
  };
  
  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };
  
  const resetPreview = (isOpen: boolean) => {
    if (!isOpen) {
      setPreviewUrl(session?.user?.image || null);
      setSelectedFile(null);
    }
    setEditDialogOpen(isOpen);
  }

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
    <div className="container mx-auto p-4 md:p-8">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-headline">Your Profile</h1>
        <p className="text-muted-foreground">Manage your account and the rooms you've created.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="shadow-md shadow-primary/10">
            <CardHeader className="items-center text-center">
              <Avatar className="h-24 w-24 mb-4 border-4 border-accent">
                <AvatarImage src={user.image!} alt={user.name!} />
                <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl font-headline">{user.name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                <Dialog open={isEditDialogOpen} onOpenChange={resetPreview}>
                  <DialogTrigger asChild>
                    <Button>
                      <Edit className="mr-2 h-4 w-4" /> Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription>Change your avatar. This will be updated across the platform.</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-4 pt-4">
                        <Avatar className="h-32 w-32 border-4 border-accent">
                          <AvatarImage src={previewUrl!} />
                          <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <Input id="picture" type="file" accept="image/*" onChange={handleFileChange} className="w-auto" />
                      </div>
                    <DialogFooter>
                      <Button type="button" onClick={handleProfileUpdate}>Save changes</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Log Out
                </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold font-headline mb-4">Rooms You've Created</h2>
            <Card className="shadow-md shadow-accent/10">
                <CardContent className="p-0">
                    <ul className="divide-y divide-border">
                        {createdRooms.map(room => (
                            <li key={room.id}>
                                <Link href={`/chat/${room.id}`} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                                    <Avatar className="h-10 w-10 border-2 border-accent">
                                        <AvatarImage src={room.avatarUrl} />
                                        <AvatarFallback>{room.avatarFallback}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-semibold">{room.name}</p>
                                        <p className="text-sm text-muted-foreground flex items-center">
                                            <Users className="h-4 w-4 mr-1.5"/> {room.members} members
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="sm">Manage</Button>
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
  );
}

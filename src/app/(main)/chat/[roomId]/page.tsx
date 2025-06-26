"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useParams, notFound } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  getRoomById,
  getMessagesForRoom,
  addMessageToRoom,
  updateMessageInRoom,
  deleteRoom,
  joinRoom,
  leaveRoom,
} from '@/lib/data';
import type { Message, Room, User } from '@/lib/data';
import { Users, Send, DoorOpen, DoorClosed, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';


function ChatMessage({ 
    message, 
    isCurrentUser,
    isEditing,
    editedText,
    setEditedText,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
}: { 
    message: Message, 
    isCurrentUser: boolean,
    isEditing: boolean,
    editedText: string,
    setEditedText: (text: string) => void,
    onStartEdit: (messageId: string, currentText: string) => void,
    onSaveEdit: (messageId: string) => void,
    onCancelEdit: () => void,
}) {
  const [isEditable, setIsEditable] = useState(false);

  useEffect(() => {
    if (message.timestamp) {
        const fiveMinutes = 5 * 60 * 1000;
        const messageTime = (message.timestamp as Timestamp).toMillis();
        const isWithinTimeLimit = Date.now() - messageTime < fiveMinutes;
        setIsEditable(isWithinTimeLimit);
    }
  }, [message.timestamp]);

  const messageDate = message.timestamp ? (message.timestamp as Timestamp).toDate() : new Date();

  return (
    <div className={cn("flex items-start gap-3 my-4", isCurrentUser && "flex-row-reverse")}>
      <Avatar className="h-10 w-10 border-2 border-accent">
        <AvatarImage src={message.author.avatarUrl} alt={message.author.name} />
        <AvatarFallback>{message.author.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className={cn("flex flex-col gap-1 max-w-xs md:max-w-md", isCurrentUser && "items-end")}>
        <div className="flex items-center gap-2">
            <span className="font-semibold">{message.author.name}</span>
        </div>
        <div className={cn("group relative flex items-end gap-1")}>
            <div className={cn(
                "p-3 rounded-lg", 
                isCurrentUser ? "bg-primary text-primary-foreground" : "bg-secondary"
            )}>
                {isEditing ? (
                    <div className="w-full">
                        <Textarea 
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            className="bg-background/80 text-foreground h-auto text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    onSaveEdit(message.id);
                                }
                                if (e.key === 'Escape') {
                                    onCancelEdit();
                                }
                            }}
                        />
                        <div className="flex gap-2 justify-end mt-2">
                            <Button variant="ghost" size="sm" onClick={onCancelEdit}>Cancel</Button>
                            <Button size="sm" onClick={() => onSaveEdit(message.id)}>Save changes</Button>
                        </div>
                    </div>
                ) : (
                    <div className="relative">
                        <p className="text-sm break-words whitespace-pre-wrap pr-12">{message.text}</p>
                        <span className={cn("text-xs absolute bottom-0 right-0", isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground")}>
                          {messageDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </span>
                    </div>
                )}
            </div>
             {isCurrentUser && !isEditing && isEditable && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => onStartEdit(message.id, message.text)}
                >
                    <Pencil className="h-3 w-3" />
                    <span className="sr-only">Edit Message</span>
                </Button>
            )}
        </div>
      </div>
    </div>
  )
}

export default function ChatRoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;
  const router = useRouter();
  const { data: session, status } = useSession();

  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isJoined, setIsJoined] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const fetchRoomAndMessages = useCallback(async () => {
      if (!roomId || !session?.user?.id) return;
      setIsLoading(true);
      try {
          const roomData = await getRoomById(roomId);
          if (!roomData) {
              notFound();
              return;
          }
          const messagesData = await getMessagesForRoom(roomId);
          
          const currentUser = session.user as User;
          setRoom({
              ...roomData,
              isCreator: roomData.creatorId === currentUser.id,
              isJoined: roomData.memberIds.includes(currentUser.id)
          });
          setIsJoined(roomData.memberIds.includes(currentUser.id));
          setMessages(messagesData);
      } catch (error) {
          console.error("Error fetching room data:", error);
          notFound();
      } finally {
          setIsLoading(false);
      }
  }, [roomId, session?.user?.id]);
  
  useEffect(() => {
    if (status === 'authenticated') {
        fetchRoomAndMessages();
    }
  }, [status, fetchRoomAndMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (isLoading || status === 'loading') {
    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="border-b p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                           <Skeleton className="h-6 w-48" />
                           <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex-1 p-4 container mx-auto">
                <Skeleton className="h-16 w-1/2 my-4" />
                <Skeleton className="h-20 w-1/2 my-4 ml-auto" />
                <Skeleton className="h-16 w-2/3 my-4" />
            </div>
            <div className="border-t p-4 bg-background">
                <div className="container mx-auto">
                    <Skeleton className="h-12 w-full rounded-md" />
                </div>
            </div>
        </div>
    );
  }

  if (!room) {
    notFound();
  }

  const handleToggleJoin = async () => {
    if (!session?.user?.id) return;
    const optimisticIsJoined = !isJoined;
    setIsJoined(optimisticIsJoined);
    setRoom(prev => prev ? { ...prev, members: prev.members + (optimisticIsJoined ? 1 : -1) } : null);

    try {
        if (optimisticIsJoined) {
            await joinRoom(roomId, session.user.id);
        } else {
            await leaveRoom(roomId, session.user.id);
        }
        fetchRoomAndMessages(); // Re-sync with the server
    } catch(error) {
        console.error("Failed to join/leave room:", error);
        // Revert optimistic update on failure
        setIsJoined(!optimisticIsJoined);
        setRoom(prev => prev ? { ...prev, members: prev.members + (optimisticIsJoined ? -1 : 1) } : null);
    }
  }
  
  const handleDeleteRoom = async () => {
    if (!session?.user?.id) return;
    try {
        await deleteRoom(room.id, session.user.id);
        router.push('/home');
    } catch (error) {
        console.error("Failed to delete room:", error);
        // TODO: show error toast
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !session?.user) return;
    
    const currentUser = session.user as User;
    const tempMessageId = Date.now().toString();

    // Optimistic update
    const newMessageObj: Message = {
      id: tempMessageId,
      author: {
        id: currentUser.id,
        name: currentUser.name ?? 'You',
        avatarUrl: currentUser.image ?? '',
      },
      text: newMessage,
      timestamp: Timestamp.now(),
    };
    setMessages(prev => [...prev, newMessageObj]);
    const messageText = newMessage;
    setNewMessage('');

    try {
      await addMessageToRoom(roomId, messageText, currentUser);
      fetchRoomAndMessages(); // Re-sync
    } catch (error) {
        console.error("Failed to send message:", error);
        // Revert optimistic update
        setMessages(prev => prev.filter(m => m.id !== tempMessageId));
        setNewMessage(messageText);
    }
  };
  
  const handleStartEdit = (messageId: string, currentText: string) => {
    setEditingMessageId(messageId);
    setEditedText(currentText);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditedText('');
  };

  const handleSaveEdit = async (messageId: string) => {
    if (editedText.trim() === '' || !session?.user) return;
    
    const originalText = messages.find(m => m.id === messageId)?.text;
    
    // Optimistic update
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: editedText } : m));
    handleCancelEdit();
    
    try {
        await updateMessageInRoom(roomId, messageId, editedText, session.user.id);
    } catch (error) {
        console.error("Failed to save edit:", error);
        // Revert
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: originalText! } : m));
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b p-4">
        <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
                {room.isCreator ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Avatar className="h-12 w-12 border-2 border-primary cursor-pointer transition-transform hover:scale-105">
                        <AvatarImage src={room.avatarUrl} alt={room.name} />
                        <AvatarFallback>{room.avatarFallback}</AvatarFallback>
                      </Avatar>
                    </DialogTrigger>
                    <DialogContent className="p-0 bg-transparent border-none max-w-md">
                      <img src={room.avatarUrl.replace('100x100', '400x400')} alt={room.name} className="rounded-lg w-full h-auto" />
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Avatar className="h-12 w-12 border-2 border-primary">
                    <AvatarImage src={room.avatarUrl} alt={room.name} />
                    <AvatarFallback>{room.avatarFallback}</AvatarFallback>
                  </Avatar>
                )}
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors">
                      <h1 className="text-xl font-bold font-headline">{room.name}</h1>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="h-4 w-4 mr-2" />
                        <span>{room.members} members</span>
                      </div>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">About {room.name}</h4>
                            <p className="text-sm text-muted-foreground">
                                {room.description}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 pt-4 border-t">
                            <Button variant={isJoined ? 'outline' : 'default'} onClick={handleToggleJoin} className="flex-1">
                                {isJoined ? <DoorClosed className="mr-2 h-4 w-4"/> : <DoorOpen className="mr-2 h-4 w-4"/>}
                                {isJoined ? 'Leave Room' : 'Join Room'}
                            </Button>
                            {room.isCreator && (
                                <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the room
                                        and all of its messages.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteRoom} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </div>
                  </PopoverContent>
                </Popover>
            </div>
        </div>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4">
          <div className="container mx-auto">
            {messages.map((msg) => (
                <ChatMessage 
                    key={msg.id} 
                    message={msg} 
                    isCurrentUser={msg.author.id === session?.user?.id}
                    isEditing={editingMessageId === msg.id}
                    onStartEdit={handleStartEdit}
                    onCancelEdit={handleCancelEdit}
                    onSaveEdit={handleSaveEdit}
                    editedText={editedText}
                    setEditedText={setEditedText}
                />
            ))}
            <div ref={messagesEndRef} />
          </div>
      </ScrollArea>

      {/* Input Bar */}
      {isJoined && (
        <div className="border-t p-4 bg-background">
            <div className="container mx-auto">
                <form onSubmit={handleSendMessage} className="relative">
                    <Input 
                      placeholder="Type a message..." 
                      className="pr-12 h-12 text-base"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      autoComplete="off"
                    />
                    <Button type="submit" size="icon" className="absolute right-2.5 top-1/2 -translate-y-1/2 h-9 w-9">
                        <Send className="h-5 w-5" />
                        <span className="sr-only">Send</span>
                    </Button>
                </form>
            </div>
        </div>
      )}
      {!isJoined && (
        <div className="border-t p-4 bg-background">
             <div className="container mx-auto text-center text-muted-foreground">
                <p>You must <button onClick={handleToggleJoin} className="text-primary font-bold underline">join the room</button> to send messages.</p>
             </div>
        </div>
      )}
    </div>
  );
}

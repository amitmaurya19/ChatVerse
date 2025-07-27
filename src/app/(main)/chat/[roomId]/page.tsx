"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useParams, notFound } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    getRoomById,
    getMessagesForRoom,
    addMessageToRoom,
    updateMessageInRoom,
    deleteRoom,
    joinRoom,
    leaveRoom,
    updateRoom,
} from '@/lib/data';
import type { Message, Room, User } from '@/lib/types';
import { Users, Send, DoorOpen, DoorClosed, Trash2, Pencil, Settings } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { EditRoomDialog, type RoomUpdateData } from '@/components/edit-room-dialog';
import { useToast } from '@/hooks/use-toast';
import { getAvatarFallback } from '@/lib/utils/avatar';
import React from 'react';
import { ImageViewerDialog } from '@/components/image-viewer-dialog';

function ChatMessage({
    message,
    isCurrentUser,
    isEditing,
    editedText,
    setEditedText,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    showAuthor,
}: {
    message: Message,
    isCurrentUser: boolean,
    isEditing: boolean,
    editedText: string,
    setEditedText: (text: string) => void,
    onStartEdit: (messageId: string, currentText: string) => void,
    onSaveEdit: (messageId: string) => void,
    onCancelEdit: () => void,
    showAuthor: boolean,
}) {
    const [isEditable, setIsEditable] = useState(false);

    useEffect(() => {
        if (message.timestamp) {
            const fiveMinutes = 5 * 60 * 1000;
            const messageTime = new Date(message.timestamp).getTime();
            const isWithinTimeLimit = Date.now() - messageTime < fiveMinutes;
            setIsEditable(isWithinTimeLimit);
        }
    }, [message.timestamp]);
    
    const messageDate = message.timestamp ? new Date(message.timestamp) : new Date();

    return (
        <div className={cn("flex items-start gap-2 my-1", isCurrentUser && "flex-row-reverse", !showAuthor && (isCurrentUser ? "ml-12" : "mr-12"))}>
             <div className="w-10 h-10 shrink-0">
                {showAuthor ? (
                    <Avatar className="h-10 w-10 border-2 border-accent">
                        <AvatarImage src={message.author.avatarUrl} alt={message.author.name} />
                        <AvatarFallback>{getAvatarFallback(message.author.name)}</AvatarFallback>
                    </Avatar>
                ) : (
                    <div className="h-10 w-10" />
                )}
            </div>
            <div className={cn("flex flex-col gap-1 max-w-xs md:max-w-md", isCurrentUser && "items-end")}>
                <div className="flex items-center gap-2 min-h-[1.25rem]">
                    {showAuthor && (
                        <span className="font-semibold">{message.author.name}</span>
                    )}
                </div>
                <div className="flex gap-1 items-start group w-fit relative">
                    <div className="flex flex-col">
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
                                                e.preventDefault();
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
                    </div>
                    <div className="w-4 mt-1 ml-1.5">
                        {isCurrentUser && !isEditing && (
                             <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-4 w-4 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity",
                                    !isEditable && "hidden"
                                )}
                                onClick={() => onStartEdit(message.id, message.text)}
                            >
                                <Pencil className="h-3 w-3" />
                                <span className="sr-only">Edit</span>
                            </Button>
                        )}
                    </div>
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
    const { toast } = useToast();

    const [room, setRoom] = useState<Room | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isJoined, setIsJoined] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [newMessage, setNewMessage] = useState('');

    const [isEditRoomOpen, setEditRoomOpen] = useState(false);
    const [isImageViewerOpen, setImageViewerOpen] = useState(false);

    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editedText, setEditedText] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
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
            const userIsJoined = roomData.memberIds.includes(currentUser.id);
            setRoom({ ...roomData, isCreator: roomData.creatorId === currentUser.id, isJoined: userIsJoined });
            setIsJoined(userIsJoined);
            setMessages(messagesData);
        } catch (error) {
            console.error("Error fetching room data:", error);
            notFound();
        } finally {
            setIsLoading(false);
        }
    }, [roomId, session?.user?.id, notFound]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchRoomAndMessages();
        }
    }, [status, fetchRoomAndMessages]);

    useEffect(() => {
        if (messages.length) {
            scrollToBottom('auto');
        }
    }, [messages]);
    
    useEffect(() => {
        if (isJoined && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isJoined]);

    const handleRoomUpdate = async (updatedData: RoomUpdateData) => {
        if (!room) return;
        const originalRoom = { ...room };
        const newAvatarFallback = updatedData.name ? getAvatarFallback(updatedData.name) : room.avatarFallback;
        setRoom(prev => prev ? { ...prev, ...updatedData, avatarFallback: newAvatarFallback } : null);
        try {
            await updateRoom(room.id, { ...updatedData, avatarFallback: newAvatarFallback });
            toast({ title: "Success", description: "Room details have been updated." });
        } catch (error) {
            setRoom(originalRoom);
            console.error("Failed to update room:", error);
            toast({ title: "Error", description: "Failed to update room details.", variant: "destructive" });
        }
    };

    if (isLoading || status === 'loading') {
        return (
            <div className="relative h-[calc(100vh-4rem)]">
                <div className="absolute top-0 left-0 right-0 h-16 border-b p-4">
                    <div className="container mx-auto flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[80px] border-t p-4">
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
        if (isJoined) {
            try {
                await leaveRoom(roomId, session.user.id);
                toast({ title: "You have left the room.", description: `You left ${room.name}.` });
                router.push('/home');
            } catch (error) {
                console.error("Failed to leave room:", error);
                toast({ title: "Error", description: "Failed to leave the room.", variant: "destructive" });
            }
        } else {
            try {
                await joinRoom(roomId, session.user.id);
                setIsJoined(true);
                setRoom(prev => prev ? { ...prev, members: prev.members + 1, memberIds: [...(prev.memberIds || []), session.user!.id] } : null);
                toast({ title: "You have joined the room.", description: `You joined ${room.name}.` });
            } catch (error) {
                console.error("Failed to join room:", error);
                toast({ title: "Error", description: "Failed to join the room.", variant: "destructive" });
            }
        }
    };

    const handleDeleteRoom = async () => {
        if (!room || !session?.user?.id) return;
        try {
            await deleteRoom(room.id, session.user.id);
            router.push('/home');
        } catch (error) {
            console.error("Failed to delete room:", error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !session?.user) return;
        const currentUser = session.user as User;
        const messageText = newMessage;
        setNewMessage('');
        inputRef.current?.focus();
        
        try {
            await addMessageToRoom(roomId, messageText, currentUser);
            fetchRoomAndMessages(); // Refetch messages
        } catch (error) {
            console.error("Failed to send message:", error);
            setNewMessage(messageText);
        }
    };

    const handleStartEdit = (messageId: string, currentText: string) => { setEditingMessageId(messageId); setEditedText(currentText); };
    const handleCancelEdit = () => { setEditingMessageId(null); setEditedText(''); };
    const handleSaveEdit = async (messageId: string) => {
        if (editedText.trim() === '' || !session?.user) return;
        const originalText = messages.find(m => m.id === messageId)?.text;
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: editedText } : m));
        handleCancelEdit();
        try {
            await updateMessageInRoom(roomId, messageId, editedText, session.user.id);
        } catch (error) {
            console.error("Failed to save edit:", error);
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: originalText! } : m));
        }
    };

    let previousDateString: string | null = null;

    return (
        <>
            <div className="relative h-[calc(100vh-4rem)] bg-background">
                <div className="absolute top-0 left-0 right-0 h-16 z-20 border-b bg-background/80 backdrop-blur-sm">
                    <div className="container flex h-full items-center justify-between">
                         <div className="flex items-center gap-4">
                            <Avatar 
                                className="h-12 w-12 border-2 border-primary cursor-pointer" 
                                onClick={() => setImageViewerOpen(true)}
                            >
                                <AvatarImage src={room.avatarUrl} alt={room.name} />
                                <AvatarFallback>{getAvatarFallback(room.name)}</AvatarFallback>
                            </Avatar>
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
                                            <p className="text-sm text-muted-foreground">{room.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2 pt-4 border-t">
                                            {room.isCreator ? (
                                                <>
                                                    <Button variant="outline" onClick={() => setEditRoomOpen(true)} className="flex-1"><Settings className="mr-2 h-4 w-4"/>Edit Room</Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>This action cannot be undone. This will permanently delete the room and all of its messages.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={handleDeleteRoom} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </>
                                            ) : (
                                                <Button variant={isJoined ? 'outline' : 'default'} onClick={handleToggleJoin} className="w-full">
                                                    {isJoined ? <DoorClosed className="mr-2 h-4 w-4"/> : <DoorOpen className="mr-2 h-4 w-4"/>}
                                                    {isJoined ? 'Leave Room' : 'Join Room'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>

                <div
                    ref={scrollContainerRef}
                    className="absolute top-16 bottom-[80px] left-0 right-0 overflow-y-auto"
                >
                    <div className="container mx-auto p-4">
                        {messages.map((msg, index) => {
                            const currentMessageDate = new Date(msg.timestamp);
                            const currentDayString = currentMessageDate.toISOString().split('T')[0];
                            let dateSeparator = null;
                            if (index === 0 || previousDateString !== currentDayString) {
                                dateSeparator = (
                                    <div key={`date-${currentDayString}`} className="text-center text-xs text-muted-foreground my-4 w-full">
                                        {currentMessageDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                );
                            }
                            previousDateString = currentDayString;
                            const prevMsg = messages[index - 1];
                            const isSameAuthorAsPrev = prevMsg && prevMsg.author.id === msg.author.id;
                            
                            return (
                                <React.Fragment key={msg.id}>
                                    {dateSeparator}
                                    <div className={cn(isSameAuthorAsPrev ? "mt-1" : "mt-4")}>
                                     <ChatMessage 
                                        message={msg} 
                                        isCurrentUser={msg.author.id === session?.user?.id} 
                                        isEditing={editingMessageId === msg.id} 
                                        onStartEdit={handleStartEdit} 
                                        onCancelEdit={handleCancelEdit} 
                                        onSaveEdit={handleSaveEdit} 
                                        editedText={editedText} 
                                        setEditedText={setEditedText} 
                                        showAuthor={!isSameAuthorAsPrev} 
                                     />
                                    </div>
                                </React.Fragment>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-[80px] z-20 border-t bg-background/80 backdrop-blur-sm">
                    <div className="container mx-auto flex h-full items-center">
                        {isJoined ? (
                            <form onSubmit={handleSendMessage} className="relative w-full">
                                <Input ref={inputRef} placeholder="Type a message..." className="pr-12 h-12 text-base" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} autoComplete="off" />
                                <Button type="submit" size="icon" className="absolute right-2.5 top-1/2 -translate-y-1/2 h-9 w-9">
                                    <Send className="h-5 w-5" />
                                    <span className="sr-only">Send</span>
                                </Button>
                            </form>
                        ) : (
                            <p className="text-center text-muted-foreground w-full">Join the room to send messages.</p>
                        )}
                    </div>
                </div>

                {!isJoined && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/90 backdrop-blur-sm">
                        <div className="bg-card p-8 rounded-lg shadow-xl text-center max-w-sm mx-auto border border-primary/20">
                            <h2 className="text-2xl font-bold font-headline mb-4">Join to Chat</h2>
                            <p className="text-muted-foreground mb-6">You need to join this room to view and send messages.</p>
                            <Button onClick={handleToggleJoin} className="w-full"><DoorOpen className="mr-2 h-4 w-4" /> Join Room</Button>
                        </div>
                    </div>
                )}
            </div>

            {room && (
              <ImageViewerDialog
                imageUrl={room.avatarUrl}
                roomName={room.name}
                open={isImageViewerOpen}
                onOpenChange={setImageViewerOpen}
              />
            )}

            {room.isCreator && (
                <EditRoomDialog room={room} open={isEditRoomOpen} onOpenChange={setEditRoomOpen} onRoomUpdate={handleRoomUpdate} />
            )}
        </>
    );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Room } from "@/lib/types";
import { joinRoom } from "@/lib/data";

interface JoinPrivateRoomDialogProps {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoomJoined: (roomId: string) => void;
}

export function JoinPrivateRoomDialog({
  room,
  open,
  onOpenChange,
  onRoomJoined,
}: JoinPrivateRoomDialogProps) {
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();

  const handleJoin = async () => {
    if (!room || !room.passkey || !session?.user?.id) {
      setError("This room is not a valid private room or you are not logged in.");
      return;
    }

    if (passkey === room.passkey) {
      try {
        const isAlreadyMember = room.memberIds.includes(session.user.id);
        if (!isAlreadyMember) {
          await joinRoom(room.id, session.user.id);
          onRoomJoined(room.id);
        }
        toast({
          title: "Success!",
          description: `Joining ${room.name}...`,
        });
        router.push(`/chat/${room.id}`);
        onOpenChange(false);
      } catch (error) {
        console.error("Failed to join room:", error);
        setError("An error occurred while trying to join the room.");
      }
    } else {
      setError("Incorrect passkey. Please try again.");
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setPasskey("");
      setError("");
    }
    onOpenChange(isOpen);
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleJoin();
    }
  };

  if (!room) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">
            Join "{room.name}"
          </DialogTitle>
          <DialogDescription>
            This is a private room. Please enter the passkey to join.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="passkey" className="text-right">
              Passkey
            </Label>
            <Input
              id="passkey"
              type="password"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              onKeyDown={handleKeyDown}
              className="col-span-3"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleJoin}>
            Join Room
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

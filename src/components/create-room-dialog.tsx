"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Lock, Globe } from "lucide-react";
import type { Room } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoomCreate: (
    newRoom: Omit<Room, "id" | "creatorId" | "members" | "memberIds">
  ) => void;
}

export function CreateRoomDialog({
  open,
  onOpenChange,
  onRoomCreate,
}: CreateRoomDialogProps) {
  const [roomName, setRoomName] = useState("");
  const [description, setDescription] = useState("");
  const [roomType, setRoomType] = useState<"public" | "private">("public");
  const [passkey, setPasskey] = useState("");
  const { toast } = useToast();

  const resetForm = () => {
    setRoomName("");
    setDescription("");
    setRoomType("public");
    setPasskey("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  // ✨ This function now contains your new fallback logic
  const getAvatarFallback = (name: string) => {
    const words = name.trim().split(/\s+/); // Split by one or more spaces
    if (words.length > 1) {
      return (words[0][0] + words[1][0]).toUpperCase();
    } else if (words[0]) {
      return words[0][0].toUpperCase();
    }
    return '??'; // Fallback for empty names
  };

  const handleCreateRoom = () => {
    if (roomType === "private" && passkey.trim().length < 8) {
      toast({
        title: "Passkey Too Short",
        description: "Private room passkeys must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    const newRoomData: Omit<
      Room,
      "id" | "creatorId" | "members" | "memberIds"
    > = {
      name: roomName,
      description,
      type: roomType,
      avatarUrl: "",
      // ✨ We now call our new function to generate the fallback
      avatarFallback: getAvatarFallback(roomName),
      ...(roomType === "private" && { passkey }),
    };

    onRoomCreate(newRoomData);
    handleOpenChange(false);
  };

  const isCreateDisabled =
    !roomName.trim() ||
    !description.trim() ||
    (roomType === "private" && passkey.trim().length < 8);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">
            Create New Room
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to start a new chat room.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Room Name</Label>
            <Input
              id="name"
              placeholder="e.g., Synthwave & Chill"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="A place to discuss all things retro-futuristic..."
              className="min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Room Type</Label>
            <RadioGroup
              value={roomType}
              onValueChange={(value) =>
                setRoomType(value as "public" | "private")
              }
              className="flex gap-4"
            >
              <Label className="flex items-center gap-2 cursor-pointer rounded-md border p-4 flex-1 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                <RadioGroupItem value="public" id="r1" />
                <Globe className="h-5 w-5 mr-2" />
                Public
              </Label>
              <Label className="flex items-center gap-2 cursor-pointer rounded-md border p-4 flex-1 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                <RadioGroupItem value="private" id="r2" />
                <Lock className="h-5 w-5 mr-2" />
                Private
              </Label>
            </RadioGroup>
          </div>
          {roomType === "private" && (
            <div className="grid gap-2">
              <Label htmlFor="passkey">Passkey (Min. 8 characters)</Label>
              <Input
                id="passkey"
                type="password"
                placeholder="Enter a passkey for your private room"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                minLength={8}
                autoComplete="off"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            className="font-bold"
            onClick={handleCreateRoom}
            disabled={isCreateDisabled}
          >
            Create Room
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
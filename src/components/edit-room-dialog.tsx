"use client";

import { useState, useEffect } from "react";
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

// Define the shape of the data that can be updated
export type RoomUpdateData = Partial<Pick<Room, 'description' | 'type' | 'passkey'>>;

interface EditRoomDialogProps {
  room: Room;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoomUpdate: (updatedData: RoomUpdateData) => void;
}

export function EditRoomDialog({
  room,
  open,
  onOpenChange,
  onRoomUpdate,
}: EditRoomDialogProps) {
  // State for the form fields, initialized with current room data
  const [description, setDescription] = useState(room.description);
  const [roomType, setRoomType] = useState<"public" | "private">(room.type);
  const [passkey, setPasskey] = useState(room.passkey || "");
  const { toast } = useToast();

  // Reset form to current room state if dialog is reopened or room prop changes
  useEffect(() => {
    setDescription(room.description);
    setRoomType(room.type);
    setPasskey(room.passkey || "");
  }, [room, open]);

  const handleSaveChanges = () => {
    // Validation: Ensure private rooms have a valid passkey
    if (roomType === 'private' && passkey.trim().length < 8) {
      toast({
        title: "Passkey Too Short",
        description: "Private room passkeys must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    const updatedData: RoomUpdateData = {
      description,
      type: roomType,
    };

    // Only include passkey if the room is private
    if (roomType === 'private') {
      updatedData.passkey = passkey;
    } else {
      updatedData.passkey = ''; // Explicitly clear passkey for public rooms
    }

    onRoomUpdate(updatedData);
    onOpenChange(false); // Close the dialog
  };

  const isSaveDisabled = 
    (description.trim() === room.description && 
     roomType === room.type && 
     passkey === (room.passkey || '')) ||
    (roomType === 'private' && passkey.trim().length < 8);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">
            Edit "{room.name}"
          </DialogTitle>
          <DialogDescription>
            Make changes to your room's details below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
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
              onValueChange={(value) => setRoomType(value as "public" | "private")}
              className="flex gap-4"
            >
              <Label className="flex items-center gap-2 cursor-pointer rounded-md border p-4 flex-1 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                <RadioGroupItem value="public" id="r-edit-1" />
                <Globe className="h-5 w-5 mr-2" />
                Public
              </Label>
              <Label className="flex items-center gap-2 cursor-pointer rounded-md border p-4 flex-1 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                <RadioGroupItem value="private" id="r-edit-2" />
                <Lock className="h-5 w-5 mr-2" />
                Private
              </Label>
            </RadioGroup>
          </div>
          {roomType === "private" && (
            <div className="grid gap-2">
              <Label htmlFor="passkey">Passkey (Min. 8 characters)</Label>
              <Input
                id="passkey-edit"
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
            onClick={handleSaveChanges}
            disabled={isSaveDisabled}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
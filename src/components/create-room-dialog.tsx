"use client";

import { useState, type ChangeEvent } from "react";
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
import { ImagePlus, Lock, Globe } from "lucide-react";
import type { Room } from "@/lib/data";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // 🛠️ Upload to Firebase
  const uploadImageToFirebase = async (file: File): Promise<string> => {
    const fileName = `rooms/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, fileName);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  };

  // 🎯 Handle file upload and get permanent URL
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setPreviewUrl(URL.createObjectURL(file)); // temp preview
      setUploading(true);
      try {
        const firebaseUrl = await uploadImageToFirebase(file);
        setPreviewUrl(firebaseUrl); // use real Firebase URL now!
      } catch (error) {
        console.error("Image upload failed:", error);
        alert("Image upload failed.");
      } finally {
        setUploading(false);
      }
    }
  };

  const resetForm = () => {
    setRoomName("");
    setDescription("");
    setRoomType("public");
    setPreviewUrl(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  // 🔥 Called when user clicks "Create Room"
  const handleCreateRoom = () => {
    if (!roomName.trim() || !description.trim()) return;

    const newRoomData: Omit<
      Room,
      "id" | "creatorId" | "members" | "memberIds"
    > = {
      name: roomName,
      description,
      type: roomType,
      avatarUrl:
        previewUrl || "https://placehold.co/100x100/03DAC6/121212.png",
      avatarFallback: roomName.slice(0, 2).toUpperCase(),
    };

    onRoomCreate(newRoomData);
    handleOpenChange(false);
  };

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
          <div className="flex items-center gap-4">
            <Label
              htmlFor="room-image-upload"
              className="w-24 h-24 rounded-lg border-2 border-dashed border-accent flex items-center justify-center cursor-pointer hover:bg-accent/10 overflow-hidden"
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Room preview"
                  className="h-full w-full object-cover rounded-lg"
                />
              ) : uploading ? (
                <span className="text-xs animate-pulse">Uploading...</span>
              ) : (
                <ImagePlus className="h-8 w-8 text-accent" />
              )}
            </Label>
            <Input
              id="room-image-upload"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*"
            />
            <div className="grid gap-2 flex-1">
              <Label htmlFor="name">Room Name</Label>
              <Input
                id="name"
                placeholder="e.g., Synthwave & Chill"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />
            </div>
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
              <Label htmlFor="passkey">Passkey (Optional)</Label>
              <Input
                id="passkey"
                type="password"
                placeholder="Enter a passkey for your private room"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            className="font-bold"
            onClick={handleCreateRoom}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Create Room"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

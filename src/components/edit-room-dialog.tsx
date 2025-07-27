"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
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
import { Lock, Globe, ImagePlus, X } from "lucide-react";
import type { Room } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ImageCropDialog } from "./image-crop-dialog";

export type RoomUpdateData = Partial<Pick<Room, 'name' | 'description' | 'type' | 'passkey' | 'avatarUrl'>>;

interface EditRoomDialogProps {
  room: Room;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoomUpdate: (updatedData: RoomUpdateData) => void;
}

const imageLoader = ({ src }: { src: string }) => {
    return src
}

export function EditRoomDialog({
  room,
  open,
  onOpenChange,
  onRoomUpdate,
}: EditRoomDialogProps) {
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description);
  const [roomType, setRoomType] = useState<"public" | "private">(room.type);
  const [passkey, setPasskey] = useState(room.passkey || "");
  const [avatarUrl, setAvatarUrl] = useState(room.avatarUrl || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(room.avatarUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [sourceImage, setSourceImage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(room.name);
      setDescription(room.description);
      setRoomType(room.type);
      setPasskey(room.passkey || "");
      setAvatarUrl(room.avatarUrl || "");
      setAvatarPreview(room.avatarUrl || null);
      setSourceImage(null);
    }
  }, [room, open]);

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

  const handleCropComplete = (croppedImageUrl: string) => {
    setAvatarUrl(croppedImageUrl);
    setAvatarPreview(croppedImageUrl);
    setCropDialogOpen(false);
  };

  const clearAvatar = () => {
    setAvatarPreview(null);
    setAvatarUrl("");
    setSourceImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveChanges = () => {
    if (roomType === 'private' && passkey.trim().length < 8) {
      toast({
        title: "Passkey Too Short",
        description: "Private room passkeys must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    const updatedData: RoomUpdateData = {
      name,
      description,
      type: roomType,
      avatarUrl
    };

    if (roomType === 'private') {
      updatedData.passkey = passkey;
    } else {
      updatedData.passkey = '';
    }

    onRoomUpdate(updatedData);
    onOpenChange(false);
  };

  const isSaveDisabled =
    (!name.trim() ||
     (name.trim() === room.name &&
      description.trim() === room.description &&
      roomType === room.type &&
      passkey === (room.passkey || "") &&
      avatarUrl === (room.avatarUrl || ""))) ||
    (roomType === "private" && passkey.trim().length < 8);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">
            Edit Room
          </DialogTitle>
          <DialogDescription>
            Make changes to your room's details below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">

            <div className="grid gap-2">
                <Label>Room Avatar</Label>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Label htmlFor="avatar-edit-upload" className={cn(
                            "cursor-pointer flex items-center justify-center h-24 w-24 rounded-lg bg-muted hover:bg-muted/80 border-2 border-dashed border-border transition-all overflow-hidden",
                            avatarPreview && "border-solid"
                        )}>
                            {avatarPreview ? (
                               <div className="relative h-full w-full">
                                <Image 
                                    loader={imageLoader} 
                                    src={avatarPreview} 
                                    alt="Avatar Preview" 
                                    fill 
                                    sizes="96px" 
                                    className="object-cover" />
                               </div>
                            ) : (
                                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                    <ImagePlus className="h-8 w-8" />
                                    <span className="text-xs">Upload</span>
                                </div>
                            )}
                        </Label>
                        <Input id="avatar-edit-upload" type="file" onChange={handleFileChange} accept="image/*" className="sr-only" ref={fileInputRef} />
                        {avatarPreview && (
                            <Button variant="destructive" size="icon" onClick={clearAvatar} className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                     <div className="text-sm text-muted-foreground">
                        <p>Upload a square image.</p>
                        <p>We'll help you crop it.</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="name-edit">Room Name</Label>
                <Input
                    id="name-edit"
                    placeholder="e.g., Synthwave & Chill"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

          <div className="grid gap-2">
            <Label htmlFor="description-edit">Description</Label>
            <Textarea
              id="description-edit"
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
              <Label htmlFor="passkey-edit">Passkey (Min. 8 characters)</Label>
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
    {sourceImage && (
        <ImageCropDialog
          open={cropDialogOpen}
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

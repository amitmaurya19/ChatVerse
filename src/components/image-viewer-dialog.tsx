"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Image from "next/image";

interface ImageViewerDialogProps {
  imageUrl: string;
  roomName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageViewerDialog({
  imageUrl,
  roomName,
  open,
  onOpenChange,
}: ImageViewerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-2">
        <DialogHeader className="p-4 pb-0 text-center">
            <DialogTitle className="font-headline text-xl">{roomName}</DialogTitle>
            <DialogDescription>
                Room Avatar
            </DialogDescription>
        </DialogHeader>
          <div className="relative w-full aspect-square">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={`Avatar for ${roomName}`}
                fill
                className="object-cover rounded-md"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-muted rounded-md">
                <span className="text-muted-foreground">No Image</span>
              </div>
            )}
          </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useRef } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onClose?: () => void;
}

function getCroppedImg(
  image: HTMLImageElement,
  crop: Crop
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return Promise.reject(new Error('Failed to get canvas context'));
  }

  // Calculate scale factors to convert from displayed size to natural size
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  // Handle both percentage and pixel units
  let cropX, cropY, cropWidth, cropHeight;
  
  if (crop.unit === '%') {
    // Convert percentage to pixels first, then scale
    cropX = (crop.x / 100) * image.width * scaleX;
    cropY = (crop.y / 100) * image.height * scaleY;
    cropWidth = (crop.width / 100) * image.width * scaleX;
    cropHeight = (crop.height / 100) * image.height * scaleY;
  } else {
    // Already in pixels, just scale
    cropX = crop.x * scaleX;
    cropY = crop.y * scaleY;
    cropWidth = crop.width * scaleX;
    cropHeight = crop.height * scaleY;
  }

  // Set canvas size to match the crop size
  canvas.width = cropWidth;
  canvas.height = cropHeight;

  // Draw the cropped portion of the image
  ctx.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  );

  return new Promise((resolve) => {
    // Always return base64 data URL instead of blob URL
    // Base64 data URLs persist and don't disappear on refresh
    resolve(canvas.toDataURL('image/jpeg', 0.95));
  });
}

export function ImageCropDialog({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  onClose
}: ImageCropDialogProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: "px", // Use pixels instead of percentage
          width: Math.min(width, height) * 0.8,
        },
        1, // aspect ratio 1:1
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  }

  async function handleCrop() {
    if (imgRef.current && crop?.width && crop?.height) {
      try {
        const croppedImageUrl = await getCroppedImg(
          imgRef.current,
          crop
        );
        onCropComplete(croppedImageUrl);
        onOpenChange(false);
      } catch (error) {
        console.error('Error cropping image:', error);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if(!isOpen && onClose) {
        onClose();
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crop your new picture</DialogTitle>
          <DialogDescription>
            Adjust the crop area to select the part of the image you want to use as your avatar.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            aspect={1}
            circularCrop
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={imageSrc}
              onLoad={onImageLoad}
              className="max-h-[70vh] max-w-full"
              style={{ display: 'block' }}
            />
          </ReactCrop>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleCrop}>
            Crop and Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
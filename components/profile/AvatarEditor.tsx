"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cropImage } from "@/lib/image-utils";

interface AvatarEditorProps {
    imageSrc: string | null;
    open: boolean;
    onClose: () => void;
    onSave: (croppedBlob: Blob) => void;
}

export function AvatarEditor({ imageSrc, open, onClose, onSave }: AvatarEditorProps) {
    const [zoom, setZoom] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Reset state when opening new image
    useEffect(() => {
        if (open) {
            setZoom(1);
            setPosition({ x: 0, y: 0 });
        }
    }, [open, imageSrc]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;

        // Simple panning logic
        // We could add boundaries here, but keeping it simple for now
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        const touch = e.touches[0];
        setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        setPosition({
            x: touch.clientX - dragStart.x,
            y: touch.clientY - dragStart.y,
        });
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    const handleSave = async () => {
        if (!imgRef.current || !containerRef.current) return;

        try {
            // Need to calculate the visible area relative to the image
            // Container is 200x200 (fixed for avatar preview)
            // Image is scaled by zoom and translated by position

            // This is a simplified "what you see is what you get" crop
            // For high precision, we'd map screen coordinates back to image native resolution
            // Since we resize client side before this anyway, we are working with likely a safe resolution

            // Actually, we should probably just use the native image size for better quality
            // calculate the crop rectangle in image coordinates

            const image = imgRef.current;
            const container = containerRef.current;

            // Image Displayed Width/Height
            const displayWidth = image.naturalWidth * zoom;
            const displayHeight = image.naturalHeight * zoom;

            // The center of the container is (100, 100)
            // We need to map the 200x200 crop box (centered in container) 
            // to the image coordinates.

            // Wait, our simple implementation below centers the image via flexbox if we didn't have absolute positioning.
            // But we are using transform translate.

            // Let's rely on a simpler approach:
            // Since our "cropper" is just a visual box, we can calculate the top-left of the box relative to the image.

            // For now, to ensure we ship a working version quickly without complex math bugs:
            // We will use the Canvas API to draw exactly what's visible in the 'viewport'

            // Actually, let's look at `react-easy-crop` math logic but simplify it.
            // Or use a naive approach: draw the image to a canvas with the same transformations

            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');

            if (!ctx) return;

            // Fill background (optional, for transparent images)
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, 200, 200);

            // We want to draw the image such that the visible part in the 200x200 div
            // is drawn to the 200x200 canvas.

            // The image is translated by 'position.x', 'position.y' from the CENTER?
            // No, our CSS implementation will determine that.

            // Let's align CSS and Math:
            // Img style: transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`
            // Origin: center?

            // Let's assume the image is centered in the container initially.
            const centerX = 100;
            const centerY = 100;

            // Draw image with transforms
            ctx.translate(centerX + position.x, centerY + position.y);
            ctx.scale(zoom, zoom);
            // Draw image centered at origin
            ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

            canvas.toBlob((blob) => {
                if (blob) onSave(blob);
            }, 'image/webp', 0.9);

        } catch (error) {
            console.error("Failed to crop", error);
        }
    };

    if (!imageSrc) return null;

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Avatar</DialogTitle>
                    <DialogDescription>
                        Drag to position and use the slider to zoom.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-6 py-4">
                    {/* Viewport - Circular Mask */}
                    <div
                        ref={containerRef}
                        className="relative h-[200px] w-[200px] overflow-hidden rounded-full border-2 border-primary shadow-inner bg-black/5 cursor-move"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {/* Image Layer */}
                        <img
                            ref={imgRef}
                            src={imageSrc}
                            alt="Avatar Preview"
                            className="absolute max-w-none select-none"
                            style={{
                                top: '50%',
                                left: '50%',
                                transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                                transformOrigin: 'center center'
                            }}
                            draggable={false}
                        />
                    </div>

                    {/* Constraints */}
                    <div className="flex items-center gap-4 w-full px-8">
                        <span className="text-sm text-muted-foreground">-</span>
                        <input
                            type="range"
                            min="1"
                            max="3"
                            step="0.1"
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <span className="text-sm text-muted-foreground">+</span>
                    </div>
                </div>

                <DialogFooter className="sm:justify-between gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        Save Avatar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

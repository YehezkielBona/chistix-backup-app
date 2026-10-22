"use client";

import * as React from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";

// Interface untuk tipe data media (bisa gambar atau video)
export interface EventMedia {
  id: string;
  type: "image" | "video";
  url: string;
  alt?: string;
  thumbnailUrl?: string; // Opsional: poster untuk video lokal
}

interface EventMediaCarouselProps {
  mediaList: EventMedia[];
}

export function EventMediaCarousel({ mediaList }: EventMediaCarouselProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <Carousel className="w-full">
        <CarouselContent>
          {mediaList.map((media) => (
            <CarouselItem key={media.id}>
              <div className="p-1">
                <Card className="overflow-hidden border-none shadow-md">
                  <CardContent className="flex aspect-video items-center justify-center p-0 relative bg-black/90 rounded-lg overflow-hidden">
                    {media.type === "image" ? (
                      /* --- Render Gambar dengan Next.js Image --- */
                      <div className="relative w-full h-full min-h-[300px] md:min-h-[450px]">
                        <Image
                          src={media.url}
                          alt={media.alt || "Event media"}
                          fill
                          className="object-cover"
                          priority
                        />
                      </div>
                    ) : (
                      /* --- Render Video --- */
                      <div className="relative w-full h-full min-h-[300px] md:min-h-[450px] flex items-center justify-center">
                        {media.url.includes("youtube.com") || media.url.includes("youtu.be") ? (
                          /* Jika video dari link YouTube Embed */
                          <iframe
                            src={media.url}
                            className="w-full h-full absolute inset-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="Event Video"
                          />
                        ) : (
                          /* Jika video file lokal / direct link (.mp4) */
                          <video
                            controls
                            playsInline
                            poster={media.thumbnailUrl}
                            className="w-full h-full object-cover"
                          >
                            <source src={media.url} type="video/mp4" />
                            Browser kamu tidak mendukung pemutaran video.
                          </video>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4 bg-white/80 hover:bg-white text-black" />
        <CarouselNext className="right-4 bg-white/80 hover:bg-white text-black" />
      </Carousel>
    </div>
  );
}
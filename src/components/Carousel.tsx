
import React, { useState, useEffect, useRef, type ReactNode } from "react";

interface Image {
  src: string;
  alt: string;
  description: string;
}

interface CarouselProps {
  images: Image[];
  autoSlide?: boolean;
  autoSlideInterval?: number;
}

export default function Carousel({
  images,
  autoSlide = true,
  autoSlideInterval = 6000,
}: CarouselProps) {
  // We add clones to the beginning and end for seamless looping
  const extendedImages = [
    images[images.length - 1],
    ...images,
    images[0],
  ];

  const [curr, setCurr] = useState(1); // Start at 1 because 0 is a clone
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset timer helper
  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoSlide && !isDragging) {
      timerRef.current = setInterval(next, autoSlideInterval);
    }
  };

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoSlide, autoSlideInterval, isDragging, isTransitioning]); // Re-run when dragging status changes


  const handleTransitionEnd = () => {
    setIsTransitioning(false);
    if (curr === 0) {
      setCurr(images.length); // Jump to real last
    } else if (curr === images.length + 1) {
      setCurr(1); // Jump to real first
    }
  };

  const prev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurr((c) => c - 1);
    resetTimer();
  };

  const next = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurr((c) => c + 1);
    resetTimer();
  };


  // --- Unified Touch/Mouse Handlers ---

  const handleStart = (clientX: number) => {
    if (curr === 0) {
      setCurr(images.length);
    } else if (curr === extendedImages.length - 1) {
      setCurr(1);
    }
    setIsDragging(true);
    setStartX(clientX);
    setDragOffset(0);
    setIsTransitioning(false); // Disable transition during drag for 1:1 movement
    if (timerRef.current) clearInterval(timerRef.current); // Pause timer
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    const currentX = clientX;
    setDragOffset(currentX - startX);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 50; 
    
    if (dragOffset > threshold) {
      // Swipe Right -> Prev
      setIsTransitioning(true);
      setCurr((c) => c - 1);
    } else if (dragOffset < -threshold) {
       // Swipe Left -> Next
      setIsTransitioning(true);
      setCurr((c) => c + 1);
    } else {
      // Snap back if didn't move enough
      setIsTransitioning(true);
    }
    
    setDragOffset(0);
    resetTimer();
  };


  // Mouse Events
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent image drag default browser behavior
    handleStart(e.clientX);
  };
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => {
     if (isDragging) handleEnd();
  };

  // Touch Events
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.targetTouches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.targetTouches[0].clientX);
  const onTouchEnd = () => handleEnd();


  return (
    <div className="overflow-hidden relative w-full max-w-[90vw] md:max-w-none md:w-96 group mx-auto touch-pan-y">
      <div
        className="flex w-full"
        style={{
          transform: `translateX(calc(-${curr * 100}% + ${dragOffset}px))`,
          transition: isDragging ? 'none' : isTransitioning ? 'transform 0.5s ease-out' : 'none',
        }}
        onTransitionEnd={handleTransitionEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {extendedImages.map((img, index) => (
          <div key={index} className="w-full flex-shrink-0 flex justify-center items-start select-none cursor-grab active:cursor-grabbing px-4">
             <div className="relative flex flex-col items-center justify-center w-full h-full text-center text-small md:w-80 pointer-events-none"> 
                <div className="relative flex items-center justify-center w-full max-w-[300px] overflow-visible"> {/* User requested wrapper kind of approach */}
                    <img src={img.src} alt={img.alt} className="mx-auto mb-2 max-w-full h-auto max-h-[70vh] object-contain rounded-md" />
                </div>
                <p>*{img.description || img.alt}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Buttons: Visible on small screens (block), hidden on medium+ (md:hidden) */}
      <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none md:hidden">
          <button onClick={(e) => { e.stopPropagation(); prev(); }} className="p-2 rounded-full shadow bg-white/40 text-gray-800 hover:bg-white/60 pointer-events-auto cursor-pointer transition-colors backdrop-blur-sm">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); next(); }} className="p-2 rounded-full shadow bg-white/40 text-gray-800 hover:bg-white/60 pointer-events-auto cursor-pointer transition-colors backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
      </div>
    </div>
  );
}

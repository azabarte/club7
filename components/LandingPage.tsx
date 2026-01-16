import React, { useState, useRef, useEffect } from 'react';
import { LANDING_VIDEO_URLS } from '../constants';
import { ArrowRight, Volume2, VolumeX, ChevronRight } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [sliderX, setSliderX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  // Randomly select one video on component mount
  const [videoUrl] = useState(() => {
    const randomIndex = Math.floor(Math.random() * LANDING_VIDEO_URLS.length);
    return LANDING_VIDEO_URLS[randomIndex];
  });

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.log("Autoplay blocked, falling back to muted", error);
        setIsMuted(true);
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play();
        }
      });
    }
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const getMaxSlide = () => {
    if (!sliderRef.current) return 200;
    return sliderRef.current.offsetWidth - 64; // 64px is the button width
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !sliderRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const rect = sliderRef.current.getBoundingClientRect();
    const newX = Math.min(Math.max(0, clientX - rect.left - 32), getMaxSlide());
    setSliderX(newX);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // If dragged more than 80%, unlock
    if (sliderX > getMaxSlide() * 0.8) {
      setUnlocked(true);
      setSliderX(getMaxSlide());
      setTimeout(() => {
        onEnter();
      }, 300);
    } else {
      // Spring back
      setSliderX(0);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => handleDragEnd();
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && sliderRef.current) {
        const rect = sliderRef.current.getBoundingClientRect();
        const newX = Math.min(Math.max(0, e.clientX - rect.left - 32), getMaxSlide());
        setSliderX(newX);
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && sliderRef.current) {
        const rect = sliderRef.current.getBoundingClientRect();
        const newX = Math.min(Math.max(0, e.touches[0].clientX - rect.left - 32), getMaxSlide());
        setSliderX(newX);
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isDragging, sliderX]);

  const progress = sliderX / getMaxSlide();

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Video Background */}
      <video
        ref={videoRef}
        src={videoUrl}
        loop
        playsInline
        muted={isMuted}
        className="absolute top-0 left-0 w-full h-full object-cover"
      />

      {/* Overlay Content */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between">

        {/* Top Bar - Volume Control */}
        <div className="mt-16 mr-6 flex justify-end">
          <button
            onClick={toggleMute}
            className="bg-black/30 backdrop-blur-md p-3 rounded-full text-white/80 border border-white/10 hover:bg-black/50 transition-colors"
          >
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
        </div>

        {/* Bottom Section - Slide to Unlock */}
        <div className="w-full px-0">
          <div
            ref={sliderRef}
            className="relative w-full h-20 bg-black/40 backdrop-blur-xl overflow-hidden"
          >
            {/* Sliding text */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ opacity: 1 - progress }}
            >
              <div className="flex items-center gap-2 text-white/70 text-lg font-medium animate-pulse">
                <span>Desliza para entrar</span>
                <ChevronRight className="w-5 h-5" />
                <ChevronRight className="w-5 h-5 -ml-3" />
                <ChevronRight className="w-5 h-5 -ml-3" />
              </div>
            </div>

            {/* Progress fill */}
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500/50 to-pink-500/50 transition-all"
              style={{ width: `${sliderX + 64}px` }}
            />

            {/* Draggable button */}
            <div
              className={`absolute top-2 left-2 w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center cursor-grab shadow-lg shadow-pink-500/30 transition-transform ${isDragging ? 'scale-110 cursor-grabbing' : ''} ${unlocked ? 'scale-125' : ''}`}
              style={{
                transform: `translateX(${sliderX}px)`,
                transition: isDragging ? 'none' : 'transform 0.3s ease-out'
              }}
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
            >
              <ArrowRight className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
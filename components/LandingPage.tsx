import React, { useState, useRef, useEffect } from 'react';
import { LANDING_VIDEO_URLS } from '../constants';
import { Volume2, VolumeX, ChevronRight } from 'lucide-react';

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
    if (!sliderRef.current) return 280;
    return sliderRef.current.offsetWidth - 72;
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (sliderX > getMaxSlide() * 0.75) {
      setUnlocked(true);
      setSliderX(getMaxSlide());
      setTimeout(() => onEnter(), 400);
    } else {
      setSliderX(0);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && sliderRef.current) {
        const rect = sliderRef.current.getBoundingClientRect();
        const newX = Math.min(Math.max(0, e.clientX - rect.left - 36), getMaxSlide());
        setSliderX(newX);
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && sliderRef.current) {
        const rect = sliderRef.current.getBoundingClientRect();
        const newX = Math.min(Math.max(0, e.touches[0].clientX - rect.left - 36), getMaxSlide());
        setSliderX(newX);
      }
    };
    const handleEnd = () => handleDragEnd();

    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isDragging, sliderX]);

  const progress = sliderX / getMaxSlide();

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-[#1a0533] via-[#0d1b2a] to-[#0a1628]">
      {/* Video Background */}
      <video
        ref={videoRef}
        src={videoUrl}
        loop
        playsInline
        muted={isMuted}
        className="absolute top-0 left-0 w-full h-full object-cover opacity-90"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a1628]/80" />

      {/* Content */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between">

        {/* Top Section - Title & Volume */}
        <div className="pt-12 px-6">
          {/* Title */}
          <div className="text-center mb-8">
            <h1
              className="text-4xl md:text-5xl font-bold"
              style={{
                fontFamily: "'Pacifico', cursive",
                background: 'linear-gradient(90deg, #FF6B6B 0%, #FFE66D 20%, #4ECDC4 40%, #45B7D1 60%, #FF6B9D 80%, #FF6B6B 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 4px 30px rgba(255,107,107,0.3)'
              }}
            >
              BestieSocial
            </h1>
            <p className="text-white/60 text-sm mt-2 tracking-wider">Explore. Share. Safe.</p>
          </div>

          {/* Volume Button - lowered */}
          <div className="flex justify-end mt-4">
            <button
              onClick={toggleMute}
              className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white/80 border border-white/20 hover:bg-white/20 transition-all"
            >
              {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
            </button>
          </div>
        </div>

        {/* Bottom Section - Improved Slide to Unlock */}
        <div className="w-full p-4 pb-8">
          <div
            ref={sliderRef}
            className="relative w-full h-16 rounded-full overflow-hidden"
            style={{
              background: 'linear-gradient(90deg, rgba(78,205,196,0.15) 0%, rgba(255,107,157,0.15) 100%)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 4px 30px rgba(0,0,0,0.3), inset 0 0 20px rgba(78,205,196,0.1)'
            }}
          >
            {/* Progress fill */}
            <div
              className="absolute top-0 left-0 h-full rounded-full transition-all"
              style={{
                width: `${sliderX + 72}px`,
                background: 'linear-gradient(90deg, rgba(78,205,196,0.4) 0%, rgba(255,107,157,0.4) 100%)',
                opacity: isDragging ? 1 : 0.7
              }}
            />

            {/* Hint text */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ opacity: 1 - progress * 1.5 }}
            >
              <div className="flex items-center gap-1 text-white/50 text-sm font-medium">
                <span>Desliza para entrar</span>
                <div className="flex animate-slide-hint">
                  <ChevronRight size={18} className="text-white/40" />
                  <ChevronRight size={18} className="-ml-2 text-white/30" />
                  <ChevronRight size={18} className="-ml-2 text-white/20" />
                </div>
              </div>
            </div>

            {/* Draggable button */}
            <div
              className={`absolute top-1 left-1 w-14 h-14 rounded-full flex items-center justify-center cursor-grab transition-transform ${isDragging ? 'scale-110 cursor-grabbing' : ''} ${unlocked ? 'scale-125' : ''}`}
              style={{
                transform: `translateX(${sliderX}px)`,
                transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                background: 'linear-gradient(135deg, #4ECDC4 0%, #45B7D1 50%, #FF6B9D 100%)',
                boxShadow: unlocked
                  ? '0 0 30px rgba(78,205,196,0.8), 0 0 60px rgba(255,107,157,0.5)'
                  : '0 4px 20px rgba(78,205,196,0.5), 0 0 40px rgba(78,205,196,0.2)'
              }}
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
            >
              <ChevronRight size={28} className="text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
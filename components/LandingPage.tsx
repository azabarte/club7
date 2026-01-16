import React, { useState, useRef, useEffect } from 'react';
import { LANDING_VIDEO_URLS } from '../constants';
import { ArrowRight, Volume2, VolumeX } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  useEffect(() => {
    // Attempt to play video with sound on mount
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.log("Autoplay with sound blocked, falling back to muted", error);
        setIsMuted(true);
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play();
        }
      });
    }
  }, [currentVideoIndex]);

  const handleVideoEnded = () => {
    // Switch to the next video in the array (alternating)
    setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % LANDING_VIDEO_URLS.length);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Video Background */}
      <video
        ref={videoRef}
        key={currentVideoIndex} // Force re-render when video changes
        playsInline
        muted={isMuted}
        onEnded={handleVideoEnded}
        className="absolute top-0 left-0 w-full h-full object-cover z-0 opacity-100"
      >
        <source src={LANDING_VIDEO_URLS[currentVideoIndex]} type="video/mp4" />
        {/* Fallback if video fails */}
        <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900"></div>
      </video>

      {/* Overlay Content */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-6">

        {/* Top Bar - Volume Control Only (Right aligned) */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={toggleMute}
            className="bg-black/30 backdrop-blur-md p-3 rounded-full text-white/80 border border-white/10 hover:bg-black/50 transition-colors"
          >
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
        </div>

        {/* Bottom Section - Only Enter Button */}
        <div className="mb-8 w-full flex justify-center">
          <button
            onClick={onEnter}
            className="w-full max-w-sm bg-white/10 backdrop-blur-lg border border-white/30 hover:bg-white/20 text-white font-bold py-5 rounded-3xl text-xl shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95"
          >
            <span className="drop-shadow-md flex items-center gap-2">Entrar al Club <ArrowRight /></span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
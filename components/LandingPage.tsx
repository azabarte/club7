import React, { useState, useRef, useEffect } from 'react';
import { LANDING_VIDEO_URLS } from '../constants';
import { ArrowRight, Volume2, VolumeX } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [activeVideo, setActiveVideo] = useState<1 | 2>(1);

  useEffect(() => {
    const video1 = video1Ref.current;
    const video2 = video2Ref.current;

    if (!video1 || !video2) return;

    // Set sources
    video1.src = LANDING_VIDEO_URLS[0];
    video2.src = LANDING_VIDEO_URLS[1];

    // Preload both videos
    video1.load();
    video2.load();

    // Start playing video1
    video1.play().catch((error) => {
      console.log("Autoplay blocked, falling back to muted", error);
      setIsMuted(true);
      video1.muted = true;
      video2.muted = true;
      video1.play();
    });
  }, []);

  const handleVideo1Ended = () => {
    const video1 = video1Ref.current;
    const video2 = video2Ref.current;
    if (!video1 || !video2) return;

    // Start video2 immediately, then fade
    video2.currentTime = 0;
    video2.play();
    setActiveVideo(2);

    // Reset video1 for next cycle
    video1.currentTime = 0;
  };

  const handleVideo2Ended = () => {
    const video1 = video1Ref.current;
    const video2 = video2Ref.current;
    if (!video1 || !video2) return;

    // Start video1 immediately, then fade
    video1.currentTime = 0;
    video1.play();
    setActiveVideo(1);

    // Reset video2 for next cycle
    video2.currentTime = 0;
  };

  const toggleMute = () => {
    const video1 = video1Ref.current;
    const video2 = video2Ref.current;
    if (video1 && video2) {
      video1.muted = !isMuted;
      video2.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Video 1 */}
      <video
        ref={video1Ref}
        playsInline
        muted={isMuted}
        onEnded={handleVideo1Ended}
        className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 ${activeVideo === 1 ? 'opacity-100 z-1' : 'opacity-0 z-0'
          }`}
      />

      {/* Video 2 */}
      <video
        ref={video2Ref}
        playsInline
        muted={isMuted}
        onEnded={handleVideo2Ended}
        className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 ${activeVideo === 2 ? 'opacity-100 z-1' : 'opacity-0 z-0'
          }`}
      />

      {/* Overlay Content */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-6">

        {/* Top Bar - Volume Control (moved down to not cover title) */}
        <div className="mt-16 flex justify-end">
          <button
            onClick={toggleMute}
            className="bg-black/30 backdrop-blur-md p-3 rounded-full text-white/80 border border-white/10 hover:bg-black/50 transition-colors"
          >
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
        </div>

        {/* Bottom Section - Enter Button (moved down more to not cover avatars) */}
        <div className="mb-4 w-full flex justify-center">
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
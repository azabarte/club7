import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';

interface FaceFiltersProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    activeFilter: string | null;
    onReady?: () => void;
}

// Filter definitions with emoji overlays and effects
const FILTERS = {
    // Animal masks
    dog: { emoji: '🐕', positions: ['nose', 'ears'], color: '#8B4513' },
    cat: { emoji: '🐱', positions: ['nose', 'ears'], color: '#FFA500' },
    bunny: { emoji: '🐰', positions: ['nose', 'ears'], color: '#FFB6C1' },

    // Accessories
    crown: { emoji: '👑', positions: ['top'], color: '#FFD700' },
    glasses: { emoji: '🕶️', positions: ['eyes'], color: '#000000' },
    party: { emoji: '🎉', positions: ['top', 'sides'], color: '#FF69B4' },
    hearts: { emoji: '💕', positions: ['floating'], color: '#FF1493' },
    stars: { emoji: '⭐', positions: ['floating'], color: '#FFD700' },

    // Fun effects
    alien: { emoji: '👽', positions: ['face'], color: '#00FF00' },
    clown: { emoji: '🤡', positions: ['nose'], color: '#FF0000' },
    devil: { emoji: '😈', positions: ['top'], color: '#8B0000' },
    angel: { emoji: '😇', positions: ['top'], color: '#FFFFFF' },
};

export const AVAILABLE_FILTERS = Object.keys(FILTERS);

export const FaceFilters: React.FC<FaceFiltersProps> = ({ videoRef, activeFilter, onReady }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const animationRef = useRef<number>();
    const particlesRef = useRef<Array<{ x: number, y: number, vx: number, vy: number, emoji: string, size: number }>>([]);

    // Load face-api models
    useEffect(() => {
        const loadModels = async () => {
            try {
                // Use CDN for models
                const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1/model';

                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
                ]);

                setModelsLoaded(true);
                onReady?.();
            } catch (error) {
                console.error('Error loading face-api models:', error);
            }
        };

        loadModels();
    }, [onReady]);

    // Face detection and rendering loop
    const detectAndRender = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || !modelsLoaded || !activeFilter) {
            animationRef.current = requestAnimationFrame(detectAndRender);
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx || video.readyState !== 4) {
            animationRef.current = requestAnimationFrame(detectAndRender);
            return;
        }

        // Match canvas size to video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        try {
            const detections = await faceapi
                .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
                .withFaceLandmarks(true);

            if (detections.length > 0) {
                const filter = FILTERS[activeFilter as keyof typeof FILTERS];

                for (const detection of detections) {
                    const landmarks = detection.landmarks;
                    const box = detection.detection.box;

                    // Get key points
                    const nose = landmarks.getNose()[3];
                    const leftEye = landmarks.getLeftEye()[0];
                    const rightEye = landmarks.getRightEye()[3];
                    const mouth = landmarks.getMouth()[0];
                    const jaw = landmarks.getJawOutline();

                    const eyeCenter = {
                        x: (leftEye.x + rightEye.x) / 2,
                        y: (leftEye.y + rightEye.y) / 2
                    };

                    const faceWidth = box.width;
                    const faceHeight = box.height;

                    // Draw filter based on positions
                    filter.positions.forEach(position => {
                        ctx.font = `${Math.floor(faceWidth * 0.4)}px Arial`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';

                        switch (position) {
                            case 'nose':
                                ctx.font = `${Math.floor(faceWidth * 0.3)}px Arial`;
                                ctx.fillText(filter.emoji, nose.x, nose.y);
                                break;

                            case 'ears':
                                ctx.font = `${Math.floor(faceWidth * 0.35)}px Arial`;
                                // Left ear
                                ctx.fillText(filter.emoji, box.x + faceWidth * 0.15, box.y - faceHeight * 0.1);
                                // Right ear  
                                ctx.fillText(filter.emoji, box.x + faceWidth * 0.85, box.y - faceHeight * 0.1);
                                break;

                            case 'eyes':
                                ctx.font = `${Math.floor(faceWidth * 0.5)}px Arial`;
                                ctx.fillText(filter.emoji, eyeCenter.x, eyeCenter.y);
                                break;

                            case 'top':
                                ctx.font = `${Math.floor(faceWidth * 0.5)}px Arial`;
                                ctx.fillText(filter.emoji, box.x + faceWidth / 2, box.y - faceHeight * 0.2);
                                break;

                            case 'sides':
                                ctx.font = `${Math.floor(faceWidth * 0.25)}px Arial`;
                                ctx.fillText('🎊', box.x - faceWidth * 0.1, box.y + faceHeight * 0.3);
                                ctx.fillText('🎊', box.x + faceWidth * 1.1, box.y + faceHeight * 0.3);
                                break;

                            case 'face':
                                ctx.font = `${Math.floor(faceWidth * 0.8)}px Arial`;
                                ctx.globalAlpha = 0.7;
                                ctx.fillText(filter.emoji, box.x + faceWidth / 2, box.y + faceHeight / 2);
                                ctx.globalAlpha = 1;
                                break;

                            case 'floating':
                                // Add floating particles
                                if (particlesRef.current.length < 15) {
                                    particlesRef.current.push({
                                        x: box.x + Math.random() * faceWidth,
                                        y: box.y + faceHeight,
                                        vx: (Math.random() - 0.5) * 3,
                                        vy: -2 - Math.random() * 2,
                                        emoji: filter.emoji,
                                        size: 20 + Math.random() * 20
                                    });
                                }
                                break;
                        }
                    });
                }
            }

            // Render floating particles
            if (activeFilter && FILTERS[activeFilter as keyof typeof FILTERS]?.positions.includes('floating')) {
                particlesRef.current = particlesRef.current.filter(p => {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.05; // Gravity

                    ctx.font = `${p.size}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.fillText(p.emoji, p.x, p.y);

                    return p.y < canvas.height + 50 && p.y > -50;
                });
            }

        } catch (error) {
            // Silent fail for detection errors
        }

        animationRef.current = requestAnimationFrame(detectAndRender);
    }, [videoRef, activeFilter, modelsLoaded]);

    // Start/stop detection loop
    useEffect(() => {
        if (modelsLoaded && activeFilter) {
            setIsDetecting(true);
            animationRef.current = requestAnimationFrame(detectAndRender);
        } else {
            setIsDetecting(false);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            // Clear canvas
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
            particlesRef.current = [];
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [modelsLoaded, activeFilter, detectAndRender]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 10 }}
        />
    );
};

// Filter selector component
interface FilterSelectorProps {
    activeFilter: string | null;
    onSelectFilter: (filter: string | null) => void;
}

export const FilterSelector: React.FC<FilterSelectorProps> = ({ activeFilter, onSelectFilter }) => {
    const filters = [
        { id: null, emoji: '✖️', label: 'Sin filtro' },
        { id: 'dog', emoji: '🐕', label: 'Perrito' },
        { id: 'cat', emoji: '🐱', label: 'Gatito' },
        { id: 'bunny', emoji: '🐰', label: 'Conejito' },
        { id: 'crown', emoji: '👑', label: 'Corona' },
        { id: 'glasses', emoji: '🕶️', label: 'Gafas' },
        { id: 'party', emoji: '🎉', label: 'Fiesta' },
        { id: 'hearts', emoji: '💕', label: 'Corazones' },
        { id: 'stars', emoji: '⭐', label: 'Estrellas' },
        { id: 'devil', emoji: '😈', label: 'Diablito' },
        { id: 'angel', emoji: '😇', label: 'Angelito' },
        { id: 'clown', emoji: '🤡', label: 'Payaso' },
    ];

    return (
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 px-1">
            {filters.map(filter => (
                <button
                    key={filter.id || 'none'}
                    onClick={() => onSelectFilter(filter.id)}
                    className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all ${activeFilter === filter.id
                            ? 'bg-white/30 scale-110'
                            : 'bg-white/10 hover:bg-white/20'
                        }`}
                >
                    <span className="text-2xl">{filter.emoji}</span>
                    <span className="text-[10px] text-white font-medium">{filter.label}</span>
                </button>
            ))}
        </div>
    );
};

export default FaceFilters;

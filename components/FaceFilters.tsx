import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as faceapi from '@vladmandic/face-api';

interface FaceFiltersProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    activeFilter: string | null;
    onReady?: () => void;
}

// Handle to expose to parent
export interface FaceFiltersHandle {
    getCanvas: () => HTMLCanvasElement | null;
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

export const FaceFilters = forwardRef<FaceFiltersHandle, FaceFiltersProps>(({ videoRef, activeFilter, onReady }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Expose canvas to parent via ref
    useImperativeHandle(ref, () => ({
        getCanvas: () => canvasRef.current
    }));
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [useStaticMode, setUseStaticMode] = useState(false); // Fallback mode
    const animationRef = useRef<number>();
    const particlesRef = useRef<Array<{ x: number, y: number, vx: number, vy: number, emoji: string, size: number }>>([]);
    const loadingTimeoutRef = useRef<NodeJS.Timeout>();

    // Load face-api models
    useEffect(() => {
        const loadModels = async () => {
            try {
                // Set a timeout to fallback to static mode if models take too long
                loadingTimeoutRef.current = setTimeout(() => {
                    if (!modelsLoaded) {
                        console.warn('Face API models taking too long, switching to static mode');
                        setUseStaticMode(true);
                        setModelsLoaded(true); // Pretend loaded to unblock
                        onReady?.();
                    }
                }, 3000); // 3 seconds timeout

                // Use CDN for models - Vlad Mandic's build requires specific path structure
                // Trying a known working path or potentially local if we had it
                // For now, let's stick to the CDN but handle failure
                const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1/model';

                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
                ]);

                if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
                setUseStaticMode(false);
                setModelsLoaded(true);
                onReady?.();
            } catch (error) {
                console.error('Error loading face-api models:', error);
                // Fallback to static mode immediately on error
                if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
                setUseStaticMode(true);
                setModelsLoaded(true);
                onReady?.();
            }
        };

        if (!modelsLoaded && !useStaticMode) {
            loadModels();
        }

        return () => {
            if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
        };
    }, [onReady]);

    // Face detection and rendering loop
    const detectAndRender = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || !activeFilter) {
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

        // Horizontal flip for selfie mode (matched with video CSS)
        // We need to draw the text flipped if we want it to look right? 
        // Actually the canvas is overlaid on a flipped video. 
        // If we draw regular text, it will look flipped to the user if we flip the canvas.
        // Let's keep canvas 1:1 with video coordinate space.

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const filter = FILTERS[activeFilter as keyof typeof FILTERS];
        if (!filter) return;

        // Use static mode if: 1) explicitly in static mode, OR 2) models haven't loaded yet
        const shouldUseStaticMode = useStaticMode || !modelsLoaded;

        if (shouldUseStaticMode) {
            // RENDER STATIC OVERLAY (FALLBACK)
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const faceWidth = canvas.width * 0.5; // Guess face size
            const faceHeight = canvas.height * 0.4;

            filter.positions.forEach(position => {
                ctx.font = `${Math.floor(faceWidth * 0.4)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                switch (position) {
                    case 'nose':
                        ctx.fillText(filter.emoji, centerX, centerY);
                        break;
                    case 'eyes':
                        ctx.font = `${Math.floor(faceWidth * 0.6)}px Arial`;
                        ctx.fillText(filter.emoji, centerX, centerY - faceHeight * 0.1);
                        break;
                    case 'top':
                        ctx.fillText(filter.emoji, centerX, centerY - faceHeight * 0.5);
                        break;
                    case 'ears':
                        ctx.fillText(filter.emoji, centerX - faceWidth * 0.3, centerY - faceHeight * 0.3);
                        ctx.fillText(filter.emoji, centerX + faceWidth * 0.3, centerY - faceHeight * 0.3);
                        break;
                    case 'face':
                        ctx.font = `${Math.floor(faceWidth * 0.8)}px Arial`;
                        ctx.globalAlpha = 0.5;
                        ctx.fillText(filter.emoji, centerX, centerY);
                        ctx.globalAlpha = 1;
                        break;
                    case 'sides':
                        ctx.fillText('✨', centerX - faceWidth * 0.6, centerY);
                        ctx.fillText('✨', centerX + faceWidth * 0.6, centerY);
                        break;
                }
            });

            // Add static particles
            if (filter.positions.includes('floating')) {
                ctx.font = `${Math.floor(faceWidth * 0.3)}px Arial`;
                ctx.fillText(filter.emoji, centerX - faceWidth * 0.6, centerY - faceHeight * 0.6);
                ctx.fillText(filter.emoji, centerX + faceWidth * 0.6, centerY + faceHeight * 0.6);
                ctx.fillText(filter.emoji, centerX, centerY + faceHeight * 0.8);
            }

        } else {
            // RENDER AI TRACKED OVERLAY
            try {
                // Use a lighter detector setting
                const detections = await faceapi
                    .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 }))
                    .withFaceLandmarks();

                if (detections.length > 0) {
                    for (const detection of detections) {
                        const landmarks = detection.landmarks;
                        const box = detection.detection.box;

                        // Get key points
                        const nose = landmarks.getNose()[3];
                        const leftEye = landmarks.getLeftEye()[0];
                        const rightEye = landmarks.getRightEye()[3];
                        // const mouth = landmarks.getMouth()[0];
                        const jaw = landmarks.getJawOutline();
                        const jawBottom = jaw[8]; // Bottom of chin

                        const eyeCenter = {
                            x: (leftEye.x + rightEye.x) / 2,
                            y: (leftEye.y + rightEye.y) / 2
                        };

                        // Calculate slightly better face dimensions from landmarks
                        const faceWidth = box.width;
                        const faceHeight = box.height;

                        // Draw filter based on positions
                        filter.positions.forEach(position => {
                            ctx.font = `${Math.floor(faceWidth * 0.4)}px Arial`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';

                            switch (position) {
                                case 'nose':
                                    ctx.font = `${Math.floor(faceWidth * 0.35)}px Arial`;
                                    ctx.fillText(filter.emoji, nose.x, nose.y);
                                    break;

                                case 'ears':
                                    ctx.font = `${Math.floor(faceWidth * 0.4)}px Arial`;
                                    // Estimate ear positions relative to eyes and width
                                    ctx.fillText(filter.emoji, leftEye.x - faceWidth * 0.2, leftEye.y - faceHeight * 0.25);
                                    ctx.fillText(filter.emoji, rightEye.x + faceWidth * 0.2, rightEye.y - faceHeight * 0.25);
                                    break;

                                case 'eyes':
                                    ctx.font = `${Math.floor(faceWidth * 0.6)}px Arial`;
                                    ctx.fillText(filter.emoji, eyeCenter.x, eyeCenter.y);
                                    break;

                                case 'top':
                                    ctx.font = `${Math.floor(faceWidth * 0.6)}px Arial`;
                                    // Top of forehead estimate
                                    ctx.fillText(filter.emoji, box.x + box.width / 2, box.y - faceHeight * 0.1);
                                    break;

                                case 'sides':
                                    ctx.font = `${Math.floor(faceWidth * 0.3)}px Arial`;
                                    ctx.fillText('✨', box.x - faceWidth * 0.1, box.y + faceHeight * 0.5);
                                    ctx.fillText('✨', box.x + faceWidth * 1.1, box.y + faceHeight * 0.5);
                                    break;

                                case 'face':
                                    ctx.font = `${Math.floor(faceWidth * 0.9)}px Arial`;
                                    ctx.globalAlpha = 0.6;
                                    ctx.fillText(filter.emoji, box.x + box.width / 2, box.y + box.height / 2);
                                    ctx.globalAlpha = 1;
                                    break;

                                case 'floating':
                                    // Add floating particles logic
                                    if (particlesRef.current.length < 15) {
                                        particlesRef.current.push({
                                            x: box.x + Math.random() * faceWidth,
                                            y: box.y + faceHeight,
                                            vx: (Math.random() - 0.5) * 5,
                                            vy: -3 - Math.random() * 4,
                                            emoji: filter.emoji,
                                            size: 20 + Math.random() * 30
                                        });
                                    }
                                    break;
                            }
                        });
                    }
                }
            } catch (error) {
                // If AI detection errors repeatedly, maybe switch to static?
                // For now just ignore frame
            }
        }

        // Render particles (shared for both modes for 'floating')
        if (filter.positions.includes('floating')) {
            particlesRef.current = particlesRef.current.filter(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1; // Gravity

                ctx.font = `${p.size}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText(p.emoji, p.x, p.y);

                return p.y < canvas.height + 100 && p.y > -100;
            });

            // Replenish in static mode since we don't have the detection loop adding them
            if (useStaticMode && particlesRef.current.length < 10) {
                particlesRef.current.push({
                    x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width,
                    y: canvas.height,
                    vx: (Math.random() - 0.5) * 5,
                    vy: -5 - Math.random() * 5,
                    emoji: filter.emoji,
                    size: 30 + Math.random() * 20
                });
            }
        }

        animationRef.current = requestAnimationFrame(detectAndRender);
    }, [videoRef, activeFilter, modelsLoaded, useStaticMode]);

    // Start/stop detection loop - starts immediately when filter is selected
    useEffect(() => {
        if (activeFilter) {
            // Start rendering immediately (will use static mode until models load)
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
    }, [activeFilter, detectAndRender]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 10, transform: 'scaleX(-1)' }} // Canvas itself should fail to flip if we want direct overlay match with flipped video
        />
    );
});

FaceFilters.displayName = 'FaceFilters';

// Filter selector component remains same...
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
        { id: 'alien', emoji: '👽', label: 'Alien' },
    ];

    return (
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 px-1">
            {filters.map(filter => (
                <button
                    key={filter.id || 'none'}
                    onClick={() => onSelectFilter(filter.id)}
                    className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all ${activeFilter === filter.id
                        ? 'bg-purple-600 shadow-lg scale-110 border border-purple-400'
                        : 'bg-black/40 hover:bg-black/60 border border-white/10'
                        }`}
                >
                    <span className="text-2xl drop-shadow-md">{filter.emoji}</span>
                    <span className="text-[10px] text-white font-bold">{filter.label}</span>
                </button>
            ))}
        </div>
    );
};

export default FaceFilters;

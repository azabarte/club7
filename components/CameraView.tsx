import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../lib/store';
import { RefreshCcw, Zap, X, Image as ImageIcon, Loader2, Check, Video, Camera, Sparkles } from 'lucide-react';

interface CameraViewProps {
  onClose: () => void;
}

type FilterType = 'none' | 'warm' | 'cool' | 'vintage' | 'bw' | 'vibrant';

const filters: { id: FilterType; name: string; css: string }[] = [
  { id: 'none', name: '✨', css: '' },
  { id: 'warm', name: '🌅', css: 'sepia(30%) saturate(140%) brightness(110%)' },
  { id: 'cool', name: '❄️', css: 'saturate(120%) hue-rotate(15deg) brightness(105%)' },
  { id: 'vintage', name: '📷', css: 'sepia(50%) contrast(90%) brightness(90%)' },
  { id: 'bw', name: '🖤', css: 'grayscale(100%) contrast(110%)' },
  { id: 'vibrant', name: '🌈', css: 'saturate(180%) contrast(110%) brightness(105%)' },
];

const CameraView: React.FC<CameraViewProps> = ({ onClose }) => {
  const { addNewPost, addNewPostFromUrl } = useStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedStickers, setSelectedStickers] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('none');
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState<'capture' | 'edit'>('capture');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [flashOn, setFlashOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxRecordingTimeRef = useRef<NodeJS.Timeout | null>(null);

  const stickers = ['🔥', '❤️', '😍', '🤩', '🎉', '✨', '🌈', '🦄', '⭐', '🎭'];
  const MAX_RECORDING_SECONDS = 30; // Max video duration

  // Initialize camera
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      setCameraError(null);

      // Check if getUserMedia is available (requires HTTPS)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Tu navegador no soporta la cámara. Asegúrate de estar usando HTTPS.');
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } }, // Reduced resolution for smaller files
        audio: true
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);

      // Provide specific error messages based on the error type
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraError('Permiso de cámara denegado. Ve a la configuración de tu navegador y permite el acceso a la cámara.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setCameraError('No se encontró ninguna cámara en tu dispositivo.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setCameraError('La cámara está siendo usada por otra aplicación. Ciérrala e inténtalo de nuevo.');
      } else if (error.name === 'OverconstrainedError') {
        setCameraError('La cámara no soporta la configuración solicitada.');
      } else if (error.name === 'TypeError') {
        setCameraError('Error de configuración. Asegúrate de estar usando HTTPS.');
      } else {
        setCameraError('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
    // Note: Flash control requires specific track capabilities
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack.getCapabilities && 'torch' in (videoTrack.getCapabilities() as any)) {
        videoTrack.applyConstraints({ advanced: [{ torch: !flashOn } as any] });
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
      setStep('edit');
      stopCamera();
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Apply filter
    const filter = filters.find(f => f.id === selectedFilter);
    if (filter?.css) {
      ctx.filter = filter.css;
    }

    // Mirror if front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedFile(file);
        setPreview(canvas.toDataURL('image/jpeg'));
        setStep('edit');
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const startRecording = () => {
    if (!stream) return;

    chunksRef.current = [];

    // Use lower bitrate for smaller file size (500kbps video + 64kbps audio)
    const options: MediaRecorderOptions = {
      mimeType: 'video/webm',
      videoBitsPerSecond: 500000,  // 500kbps - much smaller files
      audioBitsPerSecond: 64000    // 64kbps audio
    };

    const mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `video_${Date.now()}.webm`, { type: 'video/webm' });
      setSelectedFile(file);
      setPreview(URL.createObjectURL(blob));
      setStep('edit');
      stopCamera();

      // Clear max time timeout
      if (maxRecordingTimeRef.current) {
        clearTimeout(maxRecordingTimeRef.current);
      }
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    setRecordingTime(0);

    // Count up timer
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    // Auto-stop after max duration
    maxRecordingTimeRef.current = setTimeout(() => {
      stopRecording();
    }, MAX_RECORDING_SECONDS * 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (maxRecordingTimeRef.current) {
        clearTimeout(maxRecordingTimeRef.current);
      }
    }
  };

  const toggleSticker = (sticker: string) => {
    setSelectedStickers(prev =>
      prev.includes(sticker) ? prev.filter(s => s !== sticker) : [...prev, sticker]
    );
  };

  const handlePublish = async () => {
    if (!preview) return;

    setIsUploading(true);

    let success = false;
    if (selectedFile) {
      const type = selectedFile.type.startsWith('video') ? 'video' : 'image';
      success = await addNewPost(type, selectedFile, caption, selectedStickers);
    } else {
      success = await addNewPostFromUrl('image', preview, caption, selectedStickers);
    }

    setIsUploading(false);
    if (success) onClose();
  };

  const handleBack = () => {
    if (step === 'edit') {
      setStep('capture');
      setPreview(null);
      setSelectedFile(null);
      setCaption('');
      setSelectedStickers([]);
      setSelectedFilter('none');
      startCamera();
    } else {
      stopCamera();
      onClose();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentFilter = filters.find(f => f.id === selectedFilter);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,video/*"
        capture="environment"
        onChange={handleFileSelect}
      />
      <canvas ref={canvasRef} className="hidden" />

      {step === 'capture' ? (
        <>
          {/* Camera View */}
          <div className="relative flex-1 bg-gray-900 rounded-b-3xl overflow-hidden">
            {cameraError ? (
              <div className="absolute inset-0 flex items-center justify-center text-white text-center p-6">
                <div>
                  <p className="text-lg mb-4">{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="bg-indigo-600 px-6 py-3 rounded-full font-bold"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                  filter: currentFilter?.css || 'none'
                }}
              />
            )}

            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-600 px-4 py-2 rounded-full flex items-center gap-2">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                <span className="text-white font-bold">{formatTime(recordingTime)}</span>
              </div>
            )}

            {/* Top controls */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pt-12">
              <button onClick={handleBack} className="bg-black/40 backdrop-blur-md p-3 rounded-full text-white">
                <X />
              </button>
              <div className="flex gap-3">
                <button
                  onClick={toggleFlash}
                  className={`bg-black/40 backdrop-blur-md p-3 rounded-full ${flashOn ? 'text-yellow-400' : 'text-white'}`}
                >
                  <Zap size={20} />
                </button>
                <button onClick={toggleCamera} className="bg-black/40 backdrop-blur-md p-3 rounded-full text-white">
                  <RefreshCcw size={20} />
                </button>
              </div>
            </div>

            {/* Filter selector */}
            <div className="absolute bottom-24 left-0 right-0 px-4">
              <div className="flex justify-center gap-3">
                {filters.map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter.id)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${selectedFilter === filter.id
                      ? 'bg-white/30 scale-110 ring-2 ring-white'
                      : 'bg-black/30'
                      }`}
                  >
                    {filter.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Capture controls */}
          <div className="h-32 bg-black flex items-center justify-between px-8 pb-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-white flex flex-col items-center gap-1"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center border border-gray-700">
                <ImageIcon size={22} className="text-white/80" />
              </div>
              <span className="text-[10px] uppercase font-bold text-gray-400">Galería</span>
            </button>

            {/* Main capture button */}
            <div className="flex flex-col items-center gap-2">
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                onClick={!isRecording ? handleCapture : undefined}
                className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all ${isRecording
                  ? 'border-red-500 bg-red-500/20'
                  : 'border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                  }`}
              >
                <div className={`rounded-full transition-all ${isRecording ? 'w-8 h-8 bg-red-500 rounded-lg' : 'w-16 h-16 bg-white'
                  }`} />
              </button>
              <span className="text-[10px] text-gray-400">
                {isRecording ? 'Suelta para parar' : 'Toca = Foto, Mantén = Video'}
              </span>
            </div>

            <div className="w-12 h-12" />
          </div>
        </>
      ) : (
        <>
          {/* Edit step */}
          <div className="relative flex-1 bg-gray-900 overflow-hidden">
            {preview && (
              selectedFile?.type.startsWith('video') ? (
                <video src={preview} controls className="w-full h-full object-contain" />
              ) : (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                  style={{ filter: currentFilter?.css || 'none' }}
                />
              )
            )}

            {/* Stickers overlay */}
            {selectedStickers.length > 0 && (
              <div className="absolute bottom-4 right-4 flex gap-2">
                {selectedStickers.map((s, i) => (
                  <span
                    key={i}
                    className="text-5xl drop-shadow-lg animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            <div className="absolute top-0 left-0 right-0 p-6 pt-12">
              <button onClick={handleBack} className="bg-black/40 backdrop-blur-md p-3 rounded-full text-white">
                <X />
              </button>
            </div>
          </div>

          {/* Edit controls */}
          <div className="bg-black p-6 space-y-4">
            <input
              type="text"
              placeholder="Añade un pie de foto..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-2xl px-4 py-3 placeholder-gray-500 border border-gray-700 focus:border-[#4ECDC4] outline-none"
            />

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {stickers.map(sticker => (
                <button
                  key={sticker}
                  onClick={() => toggleSticker(sticker)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${selectedStickers.includes(sticker)
                    ? 'bg-gradient-to-br from-[#4ECDC4] to-[#FF6B9D] scale-110'
                    : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                >
                  {sticker}
                </button>
              ))}
            </div>

            <button
              onClick={handlePublish}
              disabled={isUploading}
              className="w-full bg-gradient-to-r from-[#4ECDC4] to-[#FF6B9D] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform disabled:opacity-70"
            >
              {isUploading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Publicar
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CameraView;
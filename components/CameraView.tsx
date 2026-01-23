import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../lib/store';
import { RefreshCcw, Zap, X, Image as ImageIcon, Loader2, Sparkles, Camera } from 'lucide-react';

interface CameraViewProps {
  onClose: () => void;
  onCapture?: (file: File, action: 'use' | 'ai') => void;
  mode?: 'post' | 'avatar';
}

type FilterType = 'none' | 'warm' | 'cool' | 'vintage' | 'bw' | 'vibrant' | 'noir' | 'dramatic' | 'glow' | 'polaroid' | 'cyber' | 'ocean' | 'autumn' | 'pastel';

const filters: { id: FilterType; name: string; css: string }[] = [
  { id: 'none', name: '✨', css: '' },
  { id: 'warm', name: '🌅', css: 'sepia(20%) saturate(130%) brightness(105%)' },
  { id: 'cool', name: '❄️', css: 'saturate(110%) hue-rotate(10deg) brightness(105%)' },
  { id: 'vintage', name: '🎞️', css: 'sepia(40%) contrast(90%) brightness(95%) saturate(80%)' },
  { id: 'bw', name: '🖤', css: 'grayscale(100%) contrast(110%)' },
  { id: 'vibrant', name: '🌈', css: 'saturate(170%) contrast(110%)' },
  { id: 'noir', name: '🎬', css: 'grayscale(100%) contrast(150%) brightness(80%)' },
  { id: 'dramatic', name: '🎭', css: 'contrast(140%) brightness(90%) saturate(110%)' },
  { id: 'glow', name: '🌟', css: 'brightness(120%) saturate(110%) contrast(90%)' },
  { id: 'polaroid', name: '📸', css: 'sepia(20%) contrast(110%) brightness(110%) saturate(120%)' },
  { id: 'cyber', name: '👾', css: 'hue-rotate(280deg) saturate(150%) contrast(110%)' },
  { id: 'ocean', name: '🌊', css: 'hue-rotate(180deg) saturate(120%) brightness(105%)' },
  { id: 'autumn', name: '🍂', css: 'sepia(30%) hue-rotate(-15deg) saturate(140%)' },
  { id: 'pastel', name: '🍭', css: 'saturate(70%) brightness(110%) contrast(90%)' },
];

const CameraView: React.FC<CameraViewProps> = ({ onClose, onCapture, mode = 'post' }) => {
  const { addNewPost, addNewPostFromUrl } = useStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('none');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'capture' | 'edit'>('capture');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [flashOn, setFlashOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxRecordingTimeRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_RECORDING_SECONDS = 30;

  useEffect(() => {
    if (mode === 'avatar') {
      setFacingMode('user');
    }
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Tu navegador no soporta la cámara. Asegúrate de estar usando HTTPS.');
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraError('Permiso de cámara denegado. Permite el acceso para tomar fotos.');
      } else {
        setCameraError('No se pudo acceder a la cámara. Revisa tu configuración.');
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
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack.getCapabilities && 'torch' in (videoTrack.getCapabilities() as any)) {
        videoTrack.applyConstraints({ advanced: [{ torch: !flashOn } as any] });
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []) as File[];
    if (files.length === 0) return;

    // Check for videos - only allow single video
    const hasVideo = files.some((f: File) => f.type.startsWith('video'));
    if (hasVideo && files.length > 1) {
      alert('Solo puedes subir un video a la vez.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (hasVideo) {
      const videoFile = files[0];
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > MAX_RECORDING_SECONDS) {
          alert(`El video no puede durar más de ${MAX_RECORDING_SECONDS} segundos.`);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
        setSelectedFiles([videoFile]);
        setPreviews([URL.createObjectURL(videoFile)]);
        setCurrentPreviewIndex(0);
        setStep('edit');
        stopCamera();
      };
      video.src = URL.createObjectURL(videoFile);
    } else {
      // Multiple images (limit to 10)
      const imageFiles = files.slice(0, 10);
      const urls = imageFiles.map((f: File) => URL.createObjectURL(f));
      setSelectedFiles(imageFiles);
      setPreviews(urls);
      setCurrentPreviewIndex(0);
      setStep('edit');
      stopCamera();
    }
  };

  const takePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Limit max dimension to 1080px for faster uploads
    const maxDimension = 1080;
    let targetWidth = video.videoWidth;
    let targetHeight = video.videoHeight;

    if (targetWidth > maxDimension || targetHeight > maxDimension) {
      if (targetWidth > targetHeight) {
        targetHeight = Math.round((targetHeight / targetWidth) * maxDimension);
        targetWidth = maxDimension;
      } else {
        targetWidth = Math.round((targetWidth / targetHeight) * maxDimension);
        targetHeight = maxDimension;
      }
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    const currentFilter = filters.find(f => f.id === selectedFilter);
    if (currentFilter?.css) {
      ctx.filter = currentFilter.css;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Use 0.75 quality for faster upload (still looks great)
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        // Use blob URL directly for instant preview (instead of slow toDataURL)
        const previewUrl = URL.createObjectURL(blob);
        setSelectedFiles([file]);
        setPreviews([previewUrl]);
        setCurrentPreviewIndex(0);
        setIsProcessing(false);
        setStep('edit');
        stopCamera();
      } else {
        setIsProcessing(false);
      }
    }, 'image/jpeg', 0.75);
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
    let selectedMimeType = '';
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        break;
      }
    }

    try {
      const mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMimeType });
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: selectedMimeType || 'video/webm' });
        const extension = selectedMimeType.includes('mp4') ? 'mp4' : 'webm';
        const file = new File([blob], `video_${Date.now()}.${extension}`, { type: selectedMimeType || 'video/webm' });
        setSelectedFiles([file]);
        setPreviews([URL.createObjectURL(blob)]);
        setCurrentPreviewIndex(0);
        setStep('edit');
        stopCamera();
      };
      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
      maxRecordingTimeRef.current = setTimeout(() => stopRecording(), MAX_RECORDING_SECONDS * 1000);
    } catch (e) {
      console.error('Recording error:', e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (maxRecordingTimeRef.current) clearTimeout(maxRecordingTimeRef.current);
    }
  };

  const handlePublish = async () => {
    if (previews.length === 0) return;
    setIsUploading(true);
    let success = false;
    if (selectedFiles.length > 0) {
      const type = selectedFiles[0].type.startsWith('video') ? 'video' : 'image';
      success = await addNewPost(type, selectedFiles, caption, []);
    } else if (previews.length > 0) {
      success = await addNewPostFromUrl('image', previews[0], caption, []);
    }
    setIsUploading(false);
    if (success) onClose();
  };

  const handleBack = () => {
    if (step === 'edit') {
      setStep('capture');
      setPreviews([]);
      setSelectedFiles([]);
      setCurrentPreviewIndex(0);
      setCaption('');
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
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" multiple onChange={handleFileSelect} />
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative flex-1 bg-gray-900 rounded-b-3xl overflow-hidden shadow-2xl">
        {step === 'capture' ? (
          <>
            {cameraError ? (
              <div className="absolute inset-0 flex items-center justify-center text-white text-center p-6 bg-gray-900/80 backdrop-blur-sm">
                <div>
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="text-red-500" size={32} />
                  </div>
                  <p className="text-lg font-bold mb-4">{cameraError}</p>
                  <button onClick={startCamera} className="bg-indigo-600 px-8 py-3 rounded-full font-black shadow-lg shadow-indigo-500/30 uppercase tracking-widest text-sm">Reintentar</button>
                </div>
              </div>
            ) : (
              <>
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

                {/* Processing overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                    <p className="text-white font-bold text-lg">Procesando foto...</p>
                    <p className="text-white/60 text-sm mt-1">Espera un momento</p>
                  </div>
                )}

                {isRecording && (
                  <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-600/90 backdrop-blur-md px-5 py-2 rounded-full flex items-center gap-3 border border-red-400 shadow-lg animate-pulse">
                    <div className="w-2.5 h-2.5 bg-white rounded-full" />
                    <span className="text-white font-black text-sm tracking-tighter">{formatTime(recordingTime)}</span>
                  </div>
                )}

                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pt-12 z-20">
                  <button onClick={handleBack} className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white border border-white/10 hover:bg-white/20 transition-all">
                    <X size={24} />
                  </button>
                  <div className="flex gap-3">
                    <button onClick={toggleFlash} className={`bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/10 transition-all ${flashOn ? 'text-yellow-400' : 'text-white'}`}>
                      <Zap size={22} />
                    </button>
                    <button onClick={toggleCamera} className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white border border-white/10 hover:bg-white/20 transition-all">
                      <RefreshCcw size={22} />
                    </button>
                  </div>
                </div>

                <div className="absolute bottom-6 left-0 right-0 px-4 z-20">
                  <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar pb-2">
                    {filters.map(filter => (
                      <button
                        key={filter.id}
                        onClick={() => setSelectedFilter(filter.id)}
                        className={`min-w-[56px] h-14 rounded-2xl flex flex-col items-center justify-center transition-all border-2 ${selectedFilter === filter.id
                          ? 'bg-white text-black border-white scale-110 shadow-xl'
                          : 'bg-black/40 text-white border-white/20'
                          }`}
                      >
                        <span className="text-xl">{filter.name}</span>
                        <span className="text-[8px] font-black uppercase tracking-tight opacity-50">{filter.id}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black relative">
            {previews.length > 0 && (
              selectedFiles[0]?.type.startsWith('video') ? (
                <video src={previews[currentPreviewIndex]} controls className="w-full h-full object-contain" />
              ) : (
                <>
                  <img src={previews[currentPreviewIndex]} alt="Preview" className="w-full h-full object-contain" style={{ filter: currentFilter?.css || 'none' }} />
                  {/* Carousel indicators and navigation */}
                  {previews.length > 1 && (
                    <>
                      {/* Dots indicator */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                        {previews.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentPreviewIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${idx === currentPreviewIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                          />
                        ))}
                      </div>
                      {/* Navigation arrows */}
                      {currentPreviewIndex > 0 && (
                        <button
                          onClick={() => setCurrentPreviewIndex(prev => prev - 1)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white w-10 h-10 rounded-full flex items-center justify-center z-30"
                        >
                          ‹
                        </button>
                      )}
                      {currentPreviewIndex < previews.length - 1 && (
                        <button
                          onClick={() => setCurrentPreviewIndex(prev => prev + 1)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white w-10 h-10 rounded-full flex items-center justify-center z-30"
                        >
                          ›
                        </button>
                      )}
                      {/* Image count badge */}
                      <div className="absolute top-16 right-4 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full z-30">
                        {currentPreviewIndex + 1} / {previews.length}
                      </div>
                    </>
                  )}
                </>
              )
            )}
            <div className="absolute top-12 left-6 z-20">
              <button onClick={handleBack} className="bg-black/60 backdrop-blur-md p-3 rounded-full text-white border border-white/10 shadow-xl">
                <X size={24} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-black h-40 flex items-center justify-between px-10 relative">
        {step === 'capture' ? (
          <>
            <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1 group">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-active:scale-95 transition-all">
                <ImageIcon size={22} className="text-white/60" />
              </div>
              <span className="text-[10px] uppercase font-black tracking-widest text-white/40">Galería</span>
            </button>

            <div className="flex flex-col items-center gap-2 -mt-4 relative">
              {/* Progress Circle for Recording */}
              {isRecording && (
                <svg className="absolute top-0 left-0 w-24 h-24 -rotate-90 pointer-events-none z-10">
                  <circle
                    cx="48"
                    cy="48"
                    r="46"
                    stroke="white"
                    strokeWidth="4"
                    fill="none"
                    className="opacity-30"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="46"
                    stroke="#ef4444"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={2 * Math.PI * 46 * (1 - recordingTime / MAX_RECORDING_SECONDS)}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
              )}

              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                onClick={!isRecording ? takePhoto : undefined}
                className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all ${isRecording ? 'border-transparent p-4 scale-90' : 'border-white p-1 shadow-2xl'}`}
              >
                <div className={`transition-all ${isRecording ? 'w-full h-full bg-red-500 rounded-2xl' : 'w-full h-full bg-white rounded-full'}`} />
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50 animate-pulse">
                {isRecording ? 'Grabando...' : 'TOCA / MANTÉN'}
              </span>
            </div>

            <div className="flex flex-col items-center gap-1 opacity-20 pointer-events-none">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                <Sparkles size={22} className="text-white/60" />
              </div>
              <span className="text-[10px] uppercase font-black tracking-widest text-white/40">Efectos</span>
            </div>
          </>
        ) : (
          <div className="w-full flex flex-col gap-4">
            {mode === 'post' ? (
              <div className="w-full space-y-4">
                <input
                  type="text"
                  placeholder="Escribe algo sobre este momento..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-white/10 text-white rounded-2xl px-6 py-4 placeholder-white/30 border border-white/10 focus:border-indigo-500 outline-none transition-all text-lg font-medium"
                />
                <button
                  onClick={handlePublish}
                  disabled={isUploading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50 uppercase tracking-widest"
                >
                  {isUploading ? <><Loader2 size={24} className="animate-spin" /> Subiendo...</> : <><Sparkles size={22} /> Publicar Moment</>}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 w-full">
                <button
                  onClick={() => { if (selectedFiles[0] && onCapture) { onCapture(selectedFiles[0], 'use'); onClose(); } }}
                  className="bg-white/10 text-white py-4 rounded-2xl font-black border border-white/10 active:scale-95 transition-all uppercase tracking-widest text-sm"
                >
                  Usar Directa
                </button>
                <button
                  onClick={() => { if (selectedFiles[0] && onCapture) { onCapture(selectedFiles[0], 'ai'); onClose(); } }}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-500/20 active:scale-95 transition-all uppercase tracking-widest text-sm"
                >
                  Mejorar con IA ✨
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraView;
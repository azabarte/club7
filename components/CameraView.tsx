import React, { useState, useRef } from 'react';
import { useStore } from '../lib/store';
import { RefreshCcw, Zap, X, Image as ImageIcon, Loader2, Check } from 'lucide-react';

interface CameraViewProps {
  onClose: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onClose }) => {
  const { addNewPost, addNewPostFromUrl, currentUser } = useStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedStickers, setSelectedStickers] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState<'capture' | 'edit'>('capture');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stickers = ['🔥', '❤️', '😍', '🤩', '🎉', '✨', '🌈', '🦄'];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
      setStep('edit');
    }
  };

  const handleCapture = () => {
    // For now, simulate with placeholder images
    // In real app, would use getUserMedia for camera access
    const mockImages = [
      'https://picsum.photos/400/600?random=100',
      'https://picsum.photos/400/600?random=101',
      'https://picsum.photos/400/600?random=102'
    ];
    const randomImage = mockImages[Math.floor(Math.random() * mockImages.length)];
    setPreview(randomImage);
    setStep('edit');
  };

  const toggleSticker = (sticker: string) => {
    setSelectedStickers(prev =>
      prev.includes(sticker)
        ? prev.filter(s => s !== sticker)
        : [...prev, sticker]
    );
  };

  const handlePublish = async () => {
    if (!preview) return;

    setIsUploading(true);

    let success = false;
    if (selectedFile) {
      // Upload actual file
      const type = selectedFile.type.startsWith('video') ? 'video' : 'image';
      success = await addNewPost(type, selectedFile, caption, selectedStickers);
    } else {
      // Use URL directly (for mock captures)
      success = await addNewPostFromUrl('image', preview, caption, selectedStickers);
    }

    setIsUploading(false);

    if (success) {
      onClose();
    }
  };

  const handleBack = () => {
    if (step === 'edit') {
      setStep('capture');
      setPreview(null);
      setSelectedFile(null);
      setCaption('');
      setSelectedStickers([]);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,video/*"
        onChange={handleFileSelect}
      />

      {step === 'capture' ? (
        <>
          {/* Viewfinder */}
          <div className="relative flex-1 bg-gray-900 rounded-b-3xl overflow-hidden">
            {/* Camera placeholder */}
            <div className="absolute inset-0 opacity-40">
              <img
                src="https://picsum.photos/600/1000?grayscale"
                className="w-full h-full object-cover"
                alt="Camera Preview"
              />
            </div>

            {/* Top controls */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pt-12">
              <button onClick={handleBack} className="bg-black/30 backdrop-blur-md p-3 rounded-full text-white">
                <X />
              </button>
              <div className="flex gap-4">
                <button className="bg-black/30 backdrop-blur-md p-3 rounded-full text-white"><Zap size={20} /></button>
                <button className="bg-black/30 backdrop-blur-md p-3 rounded-full text-white"><RefreshCcw size={20} /></button>
              </div>
            </div>

            {/* Center focus */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-white/50 rounded-3xl border-dashed opacity-50"></div>
            </div>

            <div className="absolute bottom-6 left-0 right-0 px-6">
              <p className="text-center text-white/80 font-bold mb-4 drop-shadow-md">
                Toca para capturar o selecciona de galería
              </p>
            </div>
          </div>

          {/* Capture controls */}
          <div className="h-32 bg-black flex items-center justify-between px-10 pb-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-white flex flex-col items-center gap-1 active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center border border-gray-700">
                <ImageIcon size={24} className="text-white/80" />
              </div>
              <span className="text-[10px] uppercase font-bold text-gray-400">Galería</span>
            </button>

            <button
              onClick={handleCapture}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              <div className="w-16 h-16 rounded-full bg-white"></div>
            </button>

            <div className="w-12 h-12"></div>
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
                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
              )
            )}

            {/* Selected stickers overlay */}
            {selectedStickers.length > 0 && (
              <div className="absolute bottom-4 right-4 flex gap-2">
                {selectedStickers.map((s, i) => (
                  <span key={i} className="text-4xl drop-shadow-lg animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>{s}</span>
                ))}
              </div>
            )}

            {/* Back button */}
            <div className="absolute top-0 left-0 right-0 p-6 pt-12">
              <button onClick={handleBack} className="bg-black/30 backdrop-blur-md p-3 rounded-full text-white">
                <X />
              </button>
            </div>
          </div>

          {/* Edit controls */}
          <div className="bg-black p-6 space-y-4">
            {/* Caption input */}
            <input
              type="text"
              placeholder="Añade un pie de foto..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-2xl px-4 py-3 placeholder-gray-500 border border-gray-700 focus:border-indigo-500 outline-none"
            />

            {/* Sticker selector */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {stickers.map(sticker => (
                <button
                  key={sticker}
                  onClick={() => toggleSticker(sticker)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${selectedStickers.includes(sticker)
                      ? 'bg-indigo-600 scale-110'
                      : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                >
                  {sticker}
                </button>
              ))}
            </div>

            {/* Publish button */}
            <button
              onClick={handlePublish}
              disabled={isUploading}
              className="w-full bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 active:scale-[0.98] transition-transform disabled:opacity-70"
            >
              {isUploading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Check size={20} />
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
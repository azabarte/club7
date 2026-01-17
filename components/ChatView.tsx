import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../lib/store';
import { Send, Image as ImageIcon, Mic, Loader2, Smile, Trash2, Square, Play, Pause } from 'lucide-react';
import { Message } from '../lib/supabase';

const ChatView: React.FC = () => {
  const { currentUser, members, messages, sendNewMessage, isLoading, deleteMessageAction } = useStore();
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioRecordingTime, setAudioRecordingTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getMember = (id: string) => members.find(m => m.id === id);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    const success = await sendNewMessage('text', inputText.trim());
    if (success) {
      setInputText('');
    }
    setIsSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSendSticker = async (emoji: string) => {
    setIsSending(true);
    await sendNewMessage('sticker', emoji);
    setShowEmojis(false);
    setIsSending(false);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSending(true);
    await sendNewMessage('image', undefined, file);
    setIsSending(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Audio recording functions
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 64000 // Keep file size small
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Send the audio message
        setIsSending(true);
        await sendNewMessage('audio', undefined, file);
        setIsSending(false);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecordingAudio(true);
      setAudioRecordingTime(0);

      // Update recording time
      recordingIntervalRef.current = setInterval(() => {
        setAudioRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting audio recording:', error);
      alert('No se pudo acceder al micrófono. Verifica los permisos.');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const quickStickers = ['🔥', '❤️', '😂', '🤩', '👍', '🎉', '😍', '🙌'];

  // Group messages by date
  const groupedMessages = messages.reduce((groups: Record<string, Message[]>, msg) => {
    const date = new Date(msg.created_at).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  const handleDeleteMessage = async (messageId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
      await deleteMessageAction(messageId);
    }
  };

  const onlineCount = Math.min(members.length, Math.floor(Math.random() * 4) + 2);

  // Audio player component
  const AudioPlayer: React.FC<{ url: string }> = ({ url }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
      }
    };

    return (
      <div className="flex items-center gap-2 min-w-[120px]">
        <audio ref={audioRef} src={url} onEnded={() => setIsPlaying(false)} />
        <button
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <div className="flex-1 h-1 bg-white/30 rounded-full">
          <div className="h-full w-0 bg-white rounded-full" />
        </div>
        <span className="text-xs opacity-70">🎵</span>
      </div>
    );
  };

  return (
    <div className="pt-16 pb-24 h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-2xl shadow-md">
              💬
            </div>
            {onlineCount > 0 && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">
                {onlineCount}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-800">BestieSocial Chat 💬</h3>
            <p className="text-xs text-green-500 font-bold">● {onlineCount} en línea</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="text-center text-gray-400 text-xs my-4 font-medium">
                {new Date(date).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' })}
              </div>
              {msgs.map((msg) => {
                const isMe = msg.user_id === currentUser?.id;
                const user = getMember(msg.user_id);

                return (
                  <div key={msg.id} className={`flex gap-2 mb-3 ${isMe ? 'flex-row-reverse' : ''} group`}>
                    {!isMe && (
                      <img
                        src={user?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.name || 'user'}`}
                        className="w-8 h-8 rounded-full self-end mb-1 bg-gray-100"
                        alt={user?.name}
                      />
                    )}
                    <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!isMe && (
                        <span className="text-xs text-gray-400 mb-1 ml-2 font-medium">{user?.name}</span>
                      )}
                      <div className="relative">
                        <div className={`p-3 rounded-2xl ${isMe
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none'
                          : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-sm'
                          }`}>
                          {msg.type === 'text' && <p className="break-words">{msg.content}</p>}
                          {msg.type === 'sticker' && <span className="text-5xl">{msg.content}</span>}
                          {msg.type === 'image' && msg.media_url && (
                            <img src={msg.media_url} className="rounded-xl max-w-full" alt="Imagen" />
                          )}
                          {msg.type === 'audio' && msg.media_url && (
                            <AudioPlayer url={msg.media_url} />
                          )}
                        </div>
                        {/* Delete button - visible for admins or message owner */}
                        {(currentUser?.is_admin || isMe) && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                            title="Eliminar mensaje"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      <span className={`text-[10px] text-gray-400 mt-1 ${isMe ? 'mr-2' : 'ml-2'}`}>
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker */}
      {showEmojis && (
        <div className="px-4 mb-2">
          <div className="bg-white rounded-2xl p-3 shadow-lg border border-gray-100 flex gap-2 overflow-x-auto">
            {quickStickers.map((emoji, i) => (
              <button
                key={i}
                onClick={() => handleSendSticker(emoji)}
                disabled={isSending}
                className="w-12 h-12 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-2xl transition-colors active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4">
        {/* Recording indicator */}
        {isRecordingAudio && (
          <div className="mb-2 bg-red-50 border border-red-200 rounded-full px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-600 font-medium">Grabando audio...</span>
              <span className="text-red-500 text-sm">{formatRecordingTime(audioRecordingTime)}</span>
            </div>
            <button
              onClick={stopAudioRecording}
              className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium hover:bg-red-600 flex items-center gap-1"
            >
              <Square size={12} fill="white" />
              Enviar
            </button>
          </div>
        )}

        <div className="bg-white rounded-full p-2 pl-4 flex items-center shadow-lg border border-gray-100">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || isRecordingAudio}
            className="p-2 text-gray-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
          >
            <ImageIcon size={20} />
          </button>
          <button
            onClick={() => setShowEmojis(!showEmojis)}
            disabled={isRecordingAudio}
            className={`p-2 transition-colors ${showEmojis ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-600'}`}
          >
            <Smile size={20} />
          </button>
          <input
            type="text"
            placeholder="Escribe algo..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending || isRecordingAudio}
            className="flex-1 bg-transparent border-none outline-none px-2 text-gray-700 placeholder-gray-400"
          />

          {/* Audio record button - show when no text */}
          {!inputText.trim() && !isRecordingAudio && (
            <button
              onClick={startAudioRecording}
              disabled={isSending}
              className="p-2 text-gray-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
              title="Grabar audio"
            >
              <Mic size={20} />
            </button>
          )}

          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isSending || isRecordingAudio}
            className={`w-10 h-10 rounded-full flex items-center justify-center ml-2 shadow-md transition-all ${inputText.trim() && !isSending
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white active:scale-95'
              : 'bg-gray-200 text-gray-400'
              }`}
          >
            {isSending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
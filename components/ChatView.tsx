import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../lib/store';
import { Send, Image as ImageIcon, Mic, Loader2, Smile, Trash2 } from 'lucide-react';
import { Message } from '../lib/supabase';

const ChatView: React.FC = () => {
  const { currentUser, members, messages, sendNewMessage, isLoading, deleteMessageAction } = useStore();
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
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

  return (
    <div className="flex flex-col h-full pt-20 pb-20 bg-gray-50">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageSelect}
      />

      {/* Chat Header */}
      <div className="px-4 mb-4">
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="flex -space-x-3">
            {members.slice(0, 4).map(m => (
              <img
                key={m.id}
                src={m.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${m.name}`}
                className="w-10 h-10 rounded-full border-2 border-white bg-gray-100"
                alt={m.name}
              />
            ))}
            {members.length > 4 && (
              <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-500">
                +{members.length - 4}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-800">BestieSocial Chat 💬</h3>
            <p className="text-xs text-green-500 font-bold">● {onlineCount} en línea</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">💬</div>
            <p className="text-gray-500 font-medium">¡Empieza la conversación!</p>
            <p className="text-gray-400 text-sm">Envía el primer mensaje al grupo</p>
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
                        </div>
                        {/* Admin delete button */}
                        {currentUser?.is_admin && (
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
            {quickStickers.map(emoji => (
              <button
                key={emoji}
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
        <div className="bg-white rounded-full p-2 pl-4 flex items-center shadow-lg border border-gray-100">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            className="p-2 text-gray-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
          >
            <ImageIcon size={20} />
          </button>
          <button
            onClick={() => setShowEmojis(!showEmojis)}
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
            disabled={isSending}
            className="flex-1 bg-transparent border-none outline-none px-2 text-gray-700 placeholder-gray-400"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
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
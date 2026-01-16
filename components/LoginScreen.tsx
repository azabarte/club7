import React, { useState, useEffect } from 'react';
import { useStore } from '../lib/store';
import { getMembers } from '../lib/supabase';
import { ClubMember } from '../lib/supabase';
import { Lock, ArrowRight, Loader2, Users } from 'lucide-react';

interface LoginScreenProps {
    onSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
    const { login } = useStore();
    const [pin, setPin] = useState('');
    const [members, setMembers] = useState<ClubMember[]>([]);
    const [selectedMember, setSelectedMember] = useState<string | null>(null);
    const [step, setStep] = useState<'pin' | 'member'>('pin');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Preload members
        getMembers().then(setMembers);
    }, []);

    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pin.length !== 4) {
            setError('El PIN debe tener 4 dígitos');
            return;
        }
        setStep('member');
        setError('');
    };

    const handleMemberSelect = async (memberId: string) => {
        setSelectedMember(memberId);
        setIsLoading(true);
        setError('');

        const success = await login(pin, memberId);
        if (success) {
            onSuccess();
        } else {
            setError('PIN incorrecto. Inténtalo de nuevo.');
            setStep('pin');
            setPin('');
        }
        setIsLoading(false);
    };

    const handlePinChange = (value: string) => {
        if (/^\d{0,4}$/.test(value)) {
            setPin(value);
            setError('');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a0533] via-[#0d1b2a] to-[#0a1628] flex items-center justify-center p-6">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1
                        className="text-4xl font-bold"
                        style={{
                            fontFamily: "'Pacifico', cursive",
                            background: 'linear-gradient(90deg, #FF6B6B, #FFE66D, #4ECDC4, #45B7D1, #FF6B9D)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}
                    >
                        BestieSocial
                    </h1>
                    <p className="text-white/60 mt-2">Tu mundo privado 🔐</p>
                </div>

                {step === 'pin' ? (
                    <form onSubmit={handlePinSubmit} className="space-y-6">
                        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
                                    <Lock className="w-8 h-8 text-white" />
                                </div>
                            </div>

                            <h2 className="text-xl font-bold text-white text-center mb-6">
                                Ingresa el código secreto
                            </h2>

                            <div className="flex justify-center gap-3 mb-6">
                                {[0, 1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${pin.length > i
                                            ? 'bg-white/20 border-white text-white'
                                            : 'bg-white/5 border-white/20 text-white/30'
                                            }`}
                                    >
                                        {pin[i] ? '●' : ''}
                                    </div>
                                ))}
                            </div>

                            <input
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={4}
                                value={pin}
                                onChange={(e) => handlePinChange(e.target.value)}
                                className="sr-only"
                                autoFocus
                            />

                            {/* Number Pad */}
                            <div className="grid grid-cols-3 gap-3">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((num, i) => {
                                    if (num === null) return <div key={i} />;
                                    if (num === 'del') {
                                        return (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setPin(p => p.slice(0, -1))}
                                                className="h-14 rounded-xl bg-white/5 text-white/60 font-bold hover:bg-white/10 transition-colors"
                                            >
                                                ←
                                            </button>
                                        );
                                    }
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => handlePinChange(pin + num)}
                                            className="h-14 rounded-xl bg-white/10 text-white text-xl font-bold hover:bg-white/20 transition-colors active:scale-95"
                                        >
                                            {num}
                                        </button>
                                    );
                                })}
                            </div>

                            {error && (
                                <p className="text-red-400 text-sm text-center mt-4 animate-pulse">
                                    {error}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={pin.length !== 4}
                            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${pin.length === 4
                                ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-lg shadow-pink-500/30 active:scale-95'
                                : 'bg-white/10 text-white/40 cursor-not-allowed'
                                }`}
                        >
                            Continuar <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
                            <div className="flex justify-center mb-4">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                            </div>

                            <h2 className="text-xl font-bold text-white text-center mb-2">
                                ¿Quién eres?
                            </h2>
                            <p className="text-white/50 text-sm text-center mb-6">
                                Selecciona tu perfil
                            </p>

                            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                                {members.map((member) => (
                                    <button
                                        key={member.id}
                                        onClick={() => handleMemberSelect(member.id)}
                                        disabled={isLoading}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${selectedMember === member.id
                                            ? 'bg-white/20 border-white'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30'
                                            } ${isLoading ? 'opacity-50' : ''}`}
                                    >
                                        <img
                                            src={member.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.name}`}
                                            alt={member.name}
                                            className="w-14 h-14 rounded-full border-2 border-white/20"
                                        />
                                        <span className="text-white font-medium text-sm">
                                            {member.name}
                                        </span>
                                        {isLoading && selectedMember === member.id && (
                                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {error && (
                                <p className="text-red-400 text-sm text-center mt-4 animate-pulse">
                                    {error}
                                </p>
                            )}
                        </div>

                        <button
                            onClick={() => {
                                setStep('pin');
                                setError('');
                            }}
                            className="w-full py-3 rounded-2xl bg-white/5 text-white/60 font-medium hover:bg-white/10 transition-colors"
                        >
                            ← Volver
                        </button>
                    </div>
                )}

                <p className="text-white/30 text-xs text-center mt-6">
                    PIN por defecto: 7777
                </p>
            </div>
        </div>
    );
};

export default LoginScreen;

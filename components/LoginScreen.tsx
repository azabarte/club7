import React, { useState, useEffect } from 'react';
import { useStore } from '../lib/store';
import { getMembers } from '../lib/supabase';
import { ClubMember } from '../lib/supabase';
import { Lock, ArrowRight, Loader2, Users, Shield } from 'lucide-react';

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
                                Ingresa tu contraseña
                            </h2>

                            {/* Password Display */}
                            <div className="flex justify-center mb-6 h-14 items-center gap-2">
                                {pin.length === 0 ? (
                                    <span className="text-white/30 text-lg">****</span>
                                ) : (
                                    Array(pin.length).fill(0).map((_, i) => (
                                        <div key={i} className="w-4 h-4 rounded-full bg-white animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                                    ))
                                )}
                            </div>

                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => {
                                    setPin(e.target.value);
                                    setError('');
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-xl tracking-widest focus:outline-none focus:border-indigo-500 transition-colors mb-4"
                                placeholder="Contraseña"
                                autoFocus
                            />

                            {/* On-screen NumPad (Optional utility) */}
                            <div className="grid grid-cols-3 gap-3">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((num, i) => {
                                    if (num === null) return <div key={i} />;
                                    if (num === 'del') {
                                        return (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setPin(p => p.slice(0, -1))}
                                                className="h-12 rounded-xl bg-white/5 text-white/60 font-bold hover:bg-white/10 transition-colors flex items-center justify-center"
                                            >
                                                ←
                                            </button>
                                        );
                                    }
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => {
                                                setPin(prev => prev + num);
                                                setError('');
                                            }}
                                            className="h-12 rounded-xl bg-white/10 text-white text-xl font-bold hover:bg-white/20 transition-colors active:scale-95"
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
                            disabled={pin.length === 0}
                            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${pin.length > 0
                                ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-lg shadow-pink-500/30 active:scale-95'
                                : 'bg-white/10 text-white/40 cursor-not-allowed'
                                }`}
                        >
                            Entrar <ArrowRight className="w-5 h-5" />
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
                                {/* Filter out admin users from regular login selection */}
                                {members.filter(m => !m.is_admin).map((member) => (
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

                <p className="text-white/30 text-xs text-center mt-6 mb-2">
                    PIN por defecto: 7777 (Solo acceso inicial)
                </p>

                {/* Admin Access Button */}
                <div className="flex justify-center">
                    <button
                        onClick={() => {
                            const adminUser = members.find(m => m.name === 'Admin' || m.is_admin);
                            if (adminUser) {
                                handleMemberSelect(adminUser.id);
                            } else {
                                setError('Usuario Admin no encontrado');
                            }
                        }}
                        className="text-indigo-400 text-xs font-bold hover:text-indigo-300 transition-colors flex items-center gap-1 opacity-50 hover:opacity-100"
                    >
                        <Shield size={12} />
                        Acceso Admin
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;

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
    const [step, setStep] = useState<'access' | 'member' | 'password'>('access');
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Preload members
        getMembers().then(setMembers);
    }, []);

    const handleAccessPinSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (pin === '7777') {
            setIsAdminMode(false);
            setStep('member');
            setPin('');
            setError('');
        } else if (pin === '1607') {
            setIsAdminMode(true);
            setStep('member');
            setPin('');
            setError('');
        } else {
            setError('Código incorrecto');
            setPin('');
        }
    };

    const handleMemberSelect = (memberId: string) => {
        setSelectedMember(memberId);
        setStep('password');
        setPin('');
        setError('');
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember) return;

        setIsLoading(true);
        const success = await login(pin, selectedMember);

        if (success) {
            onSuccess();
        } else {
            setError('Contraseña incorrecta');
            setPin('');
        }
        setIsLoading(false);
    };

    const handlePinChange = (value: string) => {
        // Allow longer pins for passwords
        if (/^\d{0,8}$/.test(value)) {
            setPin(value);
            setError('');
        }
    };

    // Filter members based on access mode
    const visibleMembers = isAdminMode
        ? members
        : members.filter(m => !m.is_admin && m.name !== 'Admin');

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

                {step === 'access' && (
                    <form onSubmit={handleAccessPinSubmit} className="space-y-6">
                        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg animate-pulse">
                                    <Lock className="w-8 h-8 text-white" />
                                </div>
                            </div>

                            <h2 className="text-xl font-bold text-white text-center mb-2">
                                Código de Acceso
                            </h2>
                            <p className="text-white/50 text-xs text-center mb-6">
                                Ingresa el PIN para entrar
                            </p>

                            {/* PIN Dots */}
                            <div className="flex justify-center mb-6 h-8 gap-3">
                                {[0, 1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className={`w-4 h-4 rounded-full border-2 border-white/30 transition-all ${pin.length > i ? 'bg-white border-white scale-110' : 'bg-transparent'
                                            }`}
                                    />
                                ))}
                            </div>

                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => handlePinChange(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-xl tracking-widest focus:outline-none focus:border-indigo-500 transition-colors mb-4"
                                autoFocus
                                autoComplete="off"
                            />

                            {/* NumPad */}
                            <div className="grid grid-cols-3 gap-3">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((num, i) => {
                                    if (num === null) return <div key={i} />;
                                    if (num === 'del') {
                                        return (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setPin(p => p.slice(0, -1))}
                                                className="h-12 rounded-xl bg-white/5 text-white/60 font-bold hover:bg-white/10 flex items-center justify-center"
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
                                            className="h-12 rounded-xl bg-white/10 text-white text-xl font-bold hover:bg-white/20 active:scale-95"
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
                            disabled={pin.length < 4}
                            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${pin.length >= 4
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg active:scale-95'
                                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                                }`}
                        >
                            Verificar <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>
                )}

                {step === 'member' && (
                    <div className="space-y-6">
                        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
                            <h2 className="text-xl font-bold text-white text-center mb-2">
                                ¿Quién eres?
                            </h2>
                            <p className="text-white/50 text-sm text-center mb-6">
                                Selecciona tu perfil
                            </p>

                            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
                                {visibleMembers.map((member) => (
                                    <button
                                        key={member.id}
                                        onClick={() => handleMemberSelect(member.id)}
                                        className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all flex flex-col items-center gap-2"
                                    >
                                        <img
                                            src={member.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.name}`}
                                            alt={member.name}
                                            className="w-14 h-14 rounded-full border-2 border-white/20"
                                        />
                                        <span className="text-white font-medium text-sm">
                                            {member.name}
                                        </span>
                                        {member.is_admin && (
                                            <span className="text-[10px] bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full border border-purple-500/20">
                                                Admin
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setStep('access');
                                setPin('');
                                setIsAdminMode(false);
                            }}
                            className="w-full py-3 rounded-2xl bg-white/5 text-white/60 font-medium hover:bg-white/10 transition-colors"
                        >
                            ← Volver al inicio
                        </button>
                    </div>
                )}

                {step === 'password' && (
                    <form onSubmit={handlePasswordSubmit} className="space-y-6">
                        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                            <h2 className="text-xl font-bold text-white text-center mb-6">
                                Login de Usuario
                            </h2>

                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => handlePinChange(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-xl tracking-widest focus:outline-none focus:border-indigo-500 transition-colors mb-4"
                                placeholder="Tu contraseña personal"
                                autoFocus
                            />

                            {/* Same NumPad */}
                            <div className="grid grid-cols-3 gap-3">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((num, i) => {
                                    if (num === null) return <div key={i} />;
                                    if (num === 'del') {
                                        return (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setPin(p => p.slice(0, -1))}
                                                className="h-12 rounded-xl bg-white/5 text-white/60 font-bold hover:bg-white/10 flex items-center justify-center"
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
                                            className="h-12 rounded-xl bg-white/10 text-white text-xl font-bold hover:bg-white/20 active:scale-95"
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

                        <div className="flex flex-col gap-3">
                            <button
                                type="submit"
                                disabled={pin.length === 0 || isLoading}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-lg shadow-lg active:scale-95 disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Entrar'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setStep('member');
                                    setPin('');
                                    setError('');
                                }}
                                className="w-full py-3 rounded-2xl bg-white/5 text-white/60 font-medium hover:bg-white/10 transition-colors"
                            >
                                ← Cambiar de usuario
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default LoginScreen;

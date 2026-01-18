import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { Event } from '../lib/supabase';
import { Calendar, Plus, Trash2, X, Gift, BookOpen, PartyPopper, Star, CalendarDays } from 'lucide-react';

const AgendaView: React.FC = () => {
    const { events, currentUser, addEventAction, deleteEventAction } = useStore();
    const [isAddingEvent, setIsAddingEvent] = useState(false);
    const [newEvent, setNewEvent] = useState<Partial<Event>>({
        title: '',
        description: '',
        event_date: new Date().toISOString().split('T')[0],
        event_type: 'general',
        emoji: '📅'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const eventTypes = [
        { type: 'birthday', label: 'Cumpleaños', emoji: '🎂', icon: Gift, color: 'text-pink-500 bg-pink-100' },
        { type: 'exam', label: 'Examen', emoji: '📚', icon: BookOpen, color: 'text-blue-500 bg-blue-100' },
        { type: 'party', label: 'Fiesta', emoji: '🎉', icon: PartyPopper, color: 'text-purple-500 bg-purple-100' },
        { type: 'special', label: 'Especial', emoji: '⭐', icon: Star, color: 'text-amber-500 bg-amber-100' },
        { type: 'general', label: 'General', emoji: '📅', icon: CalendarDays, color: 'text-gray-500 bg-gray-100' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !newEvent.title || !newEvent.event_date) return;

        setIsSubmitting(true);
        try {
            const success = await addEventAction({
                user_id: currentUser.id,
                title: newEvent.title,
                description: newEvent.description || null,
                event_date: newEvent.event_date!,
                event_type: newEvent.event_type as any || 'general',
                emoji: newEvent.emoji || '📅'
            });

            if (success) {
                setIsAddingEvent(false);
                setNewEvent({
                    title: '',
                    description: '',
                    event_date: new Date().toISOString().split('T')[0],
                    event_type: 'general',
                    emoji: '📅'
                });
            } else {
                alert('Error al crear el evento');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este evento?')) return;
        await deleteEventAction(id);
    };

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    };

    const getDaysUntil = (dateString: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eventDate = new Date(dateString);
        eventDate.setHours(0, 0, 0, 0);

        const diffTime = eventDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'Pasado';
        if (diffDays === 0) return '¡Hoy!';
        if (diffDays === 1) return 'Mañana';
        return `En ${diffDays} días`;
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm z-10 sticky top-0 flex justify-between items-center">
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
                    <Calendar className="text-indigo-500" />
                    Agenda del Grupo
                </h1>
                <button
                    onClick={() => setIsAddingEvent(true)}
                    className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition shadow-lg"
                >
                    <Plus size={24} />
                </button>
            </div>

            {/* Event List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Calendar size={48} className="mb-2 opacity-50" />
                        <p>No hay eventos próximos</p>
                        <p className="text-sm">¡Añade el primero!</p>
                    </div>
                ) : (
                    events.map((event) => {
                        const typeInfo = eventTypes.find(t => t.type === event.event_type) || eventTypes[4];
                        const isOwner = currentUser?.id === event.user_id;
                        const canDelete = isOwner || currentUser?.is_admin;
                        const daysUntil = getDaysUntil(event.event_date);

                        return (
                            <div key={event.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex gap-4 transition hover:shadow-md">
                                <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl ${typeInfo.color} flex-shrink-0`}>
                                    <span className="text-2xl">{event.emoji}</span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-gray-800 truncate">{event.title}</h3>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${daysUntil === '¡Hoy!' ? 'bg-red-100 text-red-600' :
                                                daysUntil === 'Mañana' ? 'bg-orange-100 text-orange-600' :
                                                    daysUntil === 'Pasado' ? 'bg-gray-100 text-gray-400' :
                                                        'bg-green-100 text-green-600'
                                            }`}>
                                            {daysUntil}
                                        </span>
                                    </div>
                                    <p className="text-sm text-indigo-600 font-medium">{formatDate(event.event_date)}</p>
                                    {event.description && (
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                                    )}
                                </div>

                                {canDelete && (
                                    <button
                                        onClick={() => handleDelete(event.id)}
                                        className="text-gray-300 hover:text-red-500 self-start -mt-1 -mr-1 p-2"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Add Event Modal */}
            {isAddingEvent && (
                <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="font-bold text-lg">Nuevo Evento</h2>
                            <button onClick={() => setIsAddingEvent(false)} className="text-gray-500 hover:text-gray-800">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Ej: Examen de Matemáticas, Cumpleaños de..."
                                    value={newEvent.title}
                                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={newEvent.event_date}
                                        onChange={e => setNewEvent({ ...newEvent, event_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                    <div className="relative">
                                        <select
                                            className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                                            value={newEvent.event_type}
                                            onChange={e => {
                                                const type = eventTypes.find(t => t.type === e.target.value);
                                                setNewEvent({
                                                    ...newEvent,
                                                    event_type: e.target.value as any,
                                                    emoji: type ? type.emoji : '📅'
                                                });
                                            }}
                                        >
                                            {eventTypes.map(t => (
                                                <option key={t.type} value={t.type}>{t.emoji} {t.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (Opcional)</label>
                                <textarea
                                    className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
                                    placeholder="Detalles adicionales..."
                                    value={newEvent.description || ''}
                                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition disabled:opacity-50"
                            >
                                {isSubmitting ? 'Creando...' : 'Guardar Evento'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgendaView;

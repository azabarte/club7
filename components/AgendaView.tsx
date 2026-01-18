import React, { useState, useMemo } from 'react';
import { useStore } from '../lib/store';
import { Event } from '../lib/supabase';
import { Plus, Trash2, X, Gift, BookOpen, PartyPopper, Star, CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, Share2 } from 'lucide-react';

const AgendaView: React.FC = () => {
    const { events, currentUser, addEventAction, deleteEventAction } = useStore();
    const [isAddingEvent, setIsAddingEvent] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // Form state
    const [newEvent, setNewEvent] = useState<Partial<Event> & { createPost: boolean }>({
        title: '',
        description: '',
        event_date: new Date().toISOString().split('T')[0],
        event_time: '',
        location: '',
        event_type: 'general',
        emoji: '📅',
        createPost: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const eventTypes = [
        { type: 'birthday', label: 'Cumpleaños', emoji: '🎂', icon: Gift, color: 'text-pink-500 bg-pink-100 ring-pink-500' },
        { type: 'exam', label: 'Examen', emoji: '📚', icon: BookOpen, color: 'text-blue-500 bg-blue-100 ring-blue-500' },
        { type: 'party', label: 'Fiesta', emoji: '🎉', icon: PartyPopper, color: 'text-purple-500 bg-purple-100 ring-purple-500' },
        { type: 'special', label: 'Especial', emoji: '⭐', icon: Star, color: 'text-amber-500 bg-amber-100 ring-amber-500' },
        { type: 'general', label: 'General', emoji: '📅', icon: CalendarDays, color: 'text-gray-500 bg-gray-100 ring-gray-500' },
    ];

    // Calendar Helper Functions
    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay(); // 0 = Sunday

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDateClick = (day: number) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(newDate);
        setNewEvent(prev => ({
            ...prev,
            event_date: newDate.toISOString().split('T')[0]
        }));
    };

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const eventsForSelectedDate = useMemo(() => {
        return events.filter(e => isSameDay(new Date(e.event_date), selectedDate))
            .sort((a, b) => (a.event_time || '').localeCompare(b.event_time || ''));
    }, [events, selectedDate]);

    const upcomingEvents = useMemo(() => {
        // Show next 3 events if no specific date selected or empty day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return events.filter(e => new Date(e.event_date) >= today)
            .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
            .slice(0, 3);
    }, [events]);

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
                event_time: newEvent.event_time || undefined,
                location: newEvent.location || undefined,
                event_type: newEvent.event_type as any || 'general',
                emoji: newEvent.emoji || '📅'
            }, newEvent.createPost);

            if (success) {
                setIsAddingEvent(false);
                setNewEvent({
                    title: '',
                    description: '',
                    event_date: selectedDate.toISOString().split('T')[0], // Reset to currently selected
                    event_time: '',
                    location: '',
                    event_type: 'general',
                    emoji: '📅',
                    createPost: false
                });
            } else {
                alert('Error al crear el evento');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('¿Eliminar este evento?')) return;
        await deleteEventAction(id);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    // Calendar Grid Generation
    const totalDays = daysInMonth(currentDate);
    const startDay = firstDayOfMonth(currentDate); // 0 (Sun) - 6 (Sat)
    // Adjust for Monday start (Spain standard) -> 0=Mon, 6=Sun
    const renderStartDay = startDay === 0 ? 6 : startDay - 1;

    const calendarDays = [];
    // Empty cells for previous month
    for (let i = 0; i < renderStartDay; i++) {
        calendarDays.push(<div key={`empty-${i}`} className="h-10 sm:h-12 border-b border-gray-50 bg-gray-50/30" />);
    }

    // Days
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dayEvents = events.filter(e => isSameDay(new Date(e.event_date), date));
        const isSelected = isSameDay(date, selectedDate);
        const isToday = isSameDay(date, new Date());

        calendarDays.push(
            <button
                key={day}
                onClick={() => handleDateClick(day)}
                className={`h-10 sm:h-12 border-b border-r border-gray-100 flex flex-col items-center justify-start py-1 relative transition-colors
                    ${isSelected ? 'bg-indigo-50 ring-inset ring-2 ring-indigo-500' : 'hover:bg-gray-50'}
                    ${isToday ? 'font-bold text-indigo-600' : 'text-gray-700'}
                `}
            >
                <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-100' : ''}`}>
                    {day}
                </span>

                {/* Event Dots */}
                <div className="flex gap-0.5 mt-1 px-1 flex-wrap justify-center w-full">
                    {dayEvents.slice(0, 3).map((ev, i) => {
                        const typeInfo = eventTypes.find(t => t.type === ev.event_type) || eventTypes[4];
                        // Extract tailwind color class for background
                        const bgClass = typeInfo.color.split(' ')[1] || 'bg-gray-400';
                        return (
                            <div key={ev.id} className={`w-1.5 h-1.5 rounded-full ${bgClass}`} />
                        );
                    })}
                    {dayEvents.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
                </div>
            </button>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm z-10 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <CalendarDays className="text-indigo-600" />
                    <h1 className="text-xl font-bold text-gray-800">Agenda</h1>
                </div>
                <button
                    onClick={() => setIsAddingEvent(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition shadow-md flex items-center gap-1 font-medium text-sm"
                >
                    <Plus size={18} />
                    Evento
                </button>
            </div>

            <div className="flex-1 overflow-y-auto w-full">
                <div className="max-w-2xl mx-auto w-full pb-20">

                    {/* Calendar Control */}
                    <div className="p-4 flex justify-between items-center">
                        <h2 className="text-lg font-bold capitalize text-gray-800">
                            {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                        </h2>
                        <div className="flex gap-2">
                            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-indigo-600">
                                <ChevronLeft size={20} />
                            </button>
                            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-indigo-600">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 border-b border-gray-200">
                        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                            <div key={d} className="text-center text-xs font-bold text-gray-400 py-2">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 bg-white shadow-sm mb-6">
                        {calendarDays}
                    </div>

                    {/* Selected Date Events */}
                    <div className="px-4">
                        <h3 className="text-indigo-900 font-bold mb-3 flex items-center gap-2 border-b pb-2">
                            <span className="capitalize">{formatDate(selectedDate)}</span>
                            {isSameDay(selectedDate, new Date()) && <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">Hoy</span>}
                        </h3>

                        <div className="space-y-3">
                            {eventsForSelectedDate.length > 0 ? (
                                eventsForSelectedDate.map((event) => {
                                    const typeInfo = eventTypes.find(t => t.type === event.event_type) || eventTypes[4];
                                    const canDelete = currentUser?.id === event.user_id || currentUser?.role === 'admin';

                                    return (
                                        <div key={event.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 transition hover:shadow-md flex gap-4 group">
                                            <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl ${typeInfo.color.split(' ')[1]} flex-shrink-0 text-2xl`}>
                                                {event.emoji}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-gray-800 truncate">{event.title}</h4>
                                                    {event.event_time && (
                                                        <div className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                                            <Clock size={10} />
                                                            {event.event_time}
                                                        </div>
                                                    )}
                                                </div>

                                                {event.location && (
                                                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                                        <MapPin size={12} />
                                                        <span className="truncate">{event.location}</span>
                                                    </div>
                                                )}

                                                {event.description && (
                                                    <p className="text-sm text-gray-500 mt-2 line-clamp-2 bg-gray-50 p-2 rounded-lg text-xs italic">
                                                        "{event.description}"
                                                    </p>
                                                )}
                                            </div>

                                            {canDelete && (
                                                <button
                                                    onClick={(e) => handleDelete(event.id, e)}
                                                    className="text-gray-300 hover:text-red-500 self-start p-1 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                                    <p className="mb-2">No hay eventos este día</p>
                                    <button
                                        onClick={() => setIsAddingEvent(true)}
                                        className="text-indigo-600 font-bold text-sm hover:underline"
                                    >
                                        + Añadir evento
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Event Modal */}
            {isAddingEvent && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 h-[90vh] sm:h-auto flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
                            <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                <Plus size={20} className="text-indigo-600" /> Nuevo Evento
                            </h2>
                            <button onClick={() => setIsAddingEvent(false)} className="bg-white p-1 rounded-full text-gray-500 hover:text-gray-800 shadow-sm border hover:bg-gray-100 transition">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Title and Type */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Título del Evento</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full p-3.5 border border-gray-200 rounded-2xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition outline-none text-lg font-medium placeholder:font-normal text-gray-900"
                                            placeholder="Ej: Examen de Matemáticas"
                                            value={newEvent.title}
                                            onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Evento</label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {eventTypes.map(t => (
                                                <button
                                                    key={t.type}
                                                    type="button"
                                                    onClick={() => setNewEvent({ ...newEvent, event_type: t.type as any, emoji: t.emoji })}
                                                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${newEvent.event_type === t.type
                                                        ? `border-${t.color.split('-')[1]}-500 bg-${t.color.split('-')[1]}-50 ring-2 ring-${t.color.split('-')[1]}-200`
                                                        : 'border-gray-100 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <span className="text-xl mb-1">{t.emoji}</span>
                                                    <span className="text-[10px] font-bold text-gray-600 truncate w-full text-center">{t.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Date and Time */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Fecha</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                required
                                                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none pl-10 text-gray-900"
                                                value={newEvent.event_date}
                                                onChange={e => setNewEvent({ ...newEvent, event_date: e.target.value })}
                                            />
                                            <CalendarDays className="absolute left-3 top-3.5 text-gray-400 pointer-events-none" size={18} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Hora (Opcional)</label>
                                        <div className="relative">
                                            <input
                                                type="time"
                                                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none pl-10 text-gray-900"
                                                value={newEvent.event_time}
                                                onChange={e => setNewEvent({ ...newEvent, event_time: e.target.value })}
                                            />
                                            <Clock className="absolute left-3 top-3.5 text-gray-400 pointer-events-none" size={18} />
                                        </div>
                                    </div>
                                </div>

                                {/* Location */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Lugar (Opcional)</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none pl-10 text-gray-900"
                                            placeholder="Ej: Aula 3B, Casa de..."
                                            value={newEvent.location}
                                            onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                                        />
                                        <MapPin className="absolute left-3 top-3.5 text-gray-400 pointer-events-none" size={18} />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Notas</label>
                                    <textarea
                                        className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-20 text-gray-900"
                                        placeholder="Detalles adicionales..."
                                        value={newEvent.description || ''}
                                        onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                    />
                                </div>

                                {/* Auto-Post Option */}
                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
                                    <div className="pt-0.5">
                                        <input
                                            type="checkbox"
                                            id="createPost"
                                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                            checked={newEvent.createPost}
                                            onChange={e => setNewEvent({ ...newEvent, createPost: e.target.checked })}
                                        />
                                    </div>
                                    <label htmlFor="createPost" className="cursor-pointer">
                                        <span className="block font-bold text-indigo-900 text-sm">Publicar aviso en el muro</span>
                                        <span className="block text-indigo-700/70 text-xs mt-0.5">
                                            Se creará automáticamente una publicación visible para todos anunciando este evento.
                                        </span>
                                    </label>
                                </div>
                            </form>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 bg-white border-t flex gap-3 shrink-0">
                            <button
                                onClick={() => setIsAddingEvent(false)}
                                className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>Guardando...</>
                                ) : (
                                    <>
                                        {newEvent.createPost && <Share2 size={18} />}
                                        Guardar Evento
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgendaView;

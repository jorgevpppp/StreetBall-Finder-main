import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import MapComponent from '../components/MapComponent';
import { getAllCourts, getActiveCheckins, doCheckin } from '../services/courtService';
import { getAllEvents, createEvent, joinEvent, leaveEvent, deleteEvent } from '../services/eventService';
import { getCurrentUser, logout } from '../services/authService';

const Home = () => {
    const navigate = useNavigate();
    const [courts, setCourts] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourt, setSelectedCourt] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [checkins, setCheckins] = useState([]);
    const [user, setUser] = useState(null);
    const [currentView, setCurrentView] = useState('home'); // 'home', 'map', 'events'
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showCreateEventModal, setShowCreateEventModal] = useState(false);
    const [joinCounts, setJoinCounts] = useState({});
    const [newEventData, setNewEventData] = useState({ title: '', description: '', date: '', type: 'pickup', court_id: '', max_participants: 10 });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const currentUser = getCurrentUser();
                setUser(currentUser);
                
                console.log("Starting parallel data fetch...");
                
                // Fetch in parallel to avoid blocking
                const [courtsRes, checkinsRes, eventsRes] = await Promise.allSettled([
                    getAllCourts(),
                    getActiveCheckins(),
                    getAllEvents()
                ]);

                // Process Courts
                if (courtsRes.status === 'fulfilled') {
                    setCourts(Array.isArray(courtsRes.value) ? courtsRes.value : []);
                } else {
                    console.error("Fallo al cargar pistas:", courtsRes.reason);
                }

                // Process Checkins
                if (checkinsRes.status === 'fulfilled') {
                    setCheckins(Array.isArray(checkinsRes.value) ? checkinsRes.value : []);
                } else {
                    console.error("Fallo al cargar checkins:", checkinsRes.reason);
                }

                // Process Events
                if (eventsRes.status === 'fulfilled') {
                    console.log("Events fetched successfully:", eventsRes.value);
                    setEvents(Array.isArray(eventsRes.value) ? eventsRes.value : []);
                } else {
                    console.error("Fallo al cargar eventos:", eventsRes.reason);
                }

            } catch (error) {
                console.error("Error general al iniciar datos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        
        // Polling para actualizar checkins y eventos
        const interval = setInterval(async () => {
            try {
                // Parallel polling too
                const [checkinsRes, eventsRes] = await Promise.allSettled([
                    getActiveCheckins(),
                    getAllEvents()
                ]);

                if (checkinsRes.status === 'fulfilled' && Array.isArray(checkinsRes.value)) {
                    setCheckins(checkinsRes.value);
                }
                
                if (eventsRes.status === 'fulfilled' && Array.isArray(eventsRes.value)) {
                    const newEvents = eventsRes.value;
                    // Only update if length changed or something simple to avoid re-renders if needed
                    // For now, always update to be safe
                    setEvents(newEvents);
                }
            } catch (e) {
                // Silent catch for polling
            }
        }, 10000); // Reducido a 10s para mejor respuesta

        return () => clearInterval(interval);
    }, []);

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            console.log("Enviando evento:", newEventData);
            if (!newEventData.court_id) {
                alert("Por favor selecciona una pista.");
                return;
            }
            
            // Asegurar que court_id es número
            const payload = {
                ...newEventData,
                court_id: parseInt(newEventData.court_id)
            };

            await createEvent(payload, user);
            
            // 1. Cerrar Modal
            setShowCreateEventModal(false);
            
            // 2. Limpiar Formulario
            setNewEventData({ title: '', description: '', date: '', type: 'pickup', court_id: '', max_participants: 10 });
            
            // 3. Refrescar lista de eventos
            const updatedEvents = await getAllEvents();
            setEvents(Array.isArray(updatedEvents) ? updatedEvents : []);
            
            // 4. Cambiar a la vista de eventos para que el usuario vea su creación
            setCurrentView('events');
            
            // 5. Feedback
            // alert("¡Evento creado correctamente!"); // Eliminamos alert intrusivo
        } catch (error) {
            console.error("Error creating event:", error);
            alert("Error al crear el evento: " + (error.response?.data?.message || error.message));
        }
    };

    const handleJoinEvent = async (eventId) => {
        try {
            const count = joinCounts[eventId] || 1;
            await joinEvent(eventId, count);
            const updatedEvents = await getAllEvents();
            setEvents(updatedEvents || []);
        } catch (error) {
            console.error("Error joining event:", error);
            alert("Error al unirse al evento.");
        }
    };

    const handleLeaveEvent = async (eventId) => {
        try {
            await leaveEvent(eventId);
            const updatedEvents = await getAllEvents();
            setEvents(updatedEvents);
        } catch (error) {
            console.error("Error leaving event:", error);
            alert("Error al salir del evento.");
        }
    };
    const handleDeleteEvent = async (eventId) => {
        if (window.confirm("¿Seguro que quieres eliminar este evento?")) {
            try {
                await deleteEvent(eventId);
                const updatedEvents = await getAllEvents();
                setEvents(updatedEvents || []);
            } catch (error) {
                console.error("Error deleting event:", error);
                alert("Error al eliminar el evento.");
            }
        }
    };
    const handleCheckin = async (count = 1) => {
        if (!selectedCourt) return;
        
        // Verificación de autenticación
        const token = localStorage.getItem('token');
        if (!token) {
            if (window.confirm("Debes iniciar sesión para apuntarte a una pista. ¿Quieres ir a iniciar sesión?")) {
                navigate('/login');
            }
            return;
        }
        
        try {
            await doCheckin(selectedCourt.id, count);
            // Actualizar checkins inmediatamente
            const updatedCheckins = await getActiveCheckins();
            setCheckins(updatedCheckins);
            // alert("¡Te has apuntado correctamente!");
        } catch (error) {
            console.error("Error al hacer check-in:", error);
            if (error.response && error.response.status === 401) {
                alert("Sesión expirada. Por favor, inicia sesión de nuevo.");
                navigate('/login');
            } else {
                alert("Hubo un error al apuntarte. Inténtalo de nuevo.");
            }
        }
    };

    const getCourtCheckinsCount = (courtId) => {
        if (!checkins || !Array.isArray(checkins)) return 0;
        return checkins
            .filter(c => c.court_id === courtId)
            .reduce((sum, c) => sum + (c.people_count || 1), 0);
    };

    const filteredCourts = Array.isArray(courts) ? courts.filter(court => 
        (court.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    const handleCourtClick = (court) => {
        console.log("CLICK DETECTADO EN HOME:", court.name);
        // alert(`Has seleccionado: ${court.name}`); 
        setSelectedCourt(court);
    };


    // DEBUG: Ver si los datos llegan bien
    useEffect(() => {
        console.log("Courts cargadas:", courts);
        if (courts.length > 0) {
            console.log("Primera cancha lat/lng:", courts[0].lat, courts[0].lng, typeof courts[0].lat);
        }
    }, [courts]);

    return (
        <div className="flex h-screen bg-white overflow-hidden font-sans">
            


            {/* 1. SECCIÓN IZQUIERDA (LISTA/MENÚ/CONTENIDO) - Ocupa ancho total en 'map' o 'events', o 40% en 'home' desktop */}
            <div className={`flex flex-col h-full border-r border-gray-200 bg-gray-50 relative z-10 shadow-xl transition-all duration-300 w-full ${currentView === 'home' ? 'md:w-[40%] lg:w-[35%]' : 'md:w-full'}`}>
                
                {/* Header Fijo */}
                <div className="bg-white p-4 shadow-sm border-b border-gray-200 z-20 flex flex-col gap-4">
                    
                    {/* 1. TÍTULO Y LOGO + HAMBURGER */}
                    <div className="flex items-center justify-between h-10 w-full relative">
                        <div className="relative">
                            <button 
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className={`
                                    font-black text-xs px-3 py-2 rounded-lg transition-colors z-50 relative flex items-center gap-2
                                    ${isSidebarOpen ? 'bg-basket-orange text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}
                                `}
                            >
                                {isSidebarOpen ? 'CERRAR' : 'MENÚ'}
                            </button>

                             {/* MENU DESPLEGABLE TIPO PANEL LATERAL (BAJO EL HEADER) */}
                             {isSidebarOpen && (
                                <div className="fixed top-[0] left-0 bottom-0 w-64 bg-white shadow-2xl border-r border-gray-100 p-4 z-40 animate-in slide-in-from-left-10 duration-200 flex flex-col gap-1 overflow-y-auto mt-[60px]">
                                    <nav className="flex flex-col space-y-2">
                                        <button onClick={() => { setIsSidebarOpen(false); setCurrentView('home'); navigate('/'); }} className={`w-full text-left flex items-center gap-3 font-bold p-3 rounded-lg transition-colors text-sm ${currentView === 'home' ? 'bg-orange-50 text-basket-orange' : 'text-gray-700 hover:bg-gray-50'}`}>
                                            🏀 Página Principal
                                        </button>
                                        
                                        <button onClick={() => { setIsSidebarOpen(false); setCurrentView('map'); }} className={`w-full text-left flex items-center gap-3 font-bold p-3 rounded-lg transition-colors text-sm ${currentView === 'map' ? 'bg-orange-50 text-basket-orange' : 'text-gray-700 hover:bg-gray-50'}`}>
                                            🗺️ Mapa
                                        </button>
                                        
                                        <button onClick={() => { setIsSidebarOpen(false); setCurrentView('events'); }} className={`w-full text-left flex items-center gap-3 font-bold p-3 rounded-lg transition-colors text-sm ${currentView === 'events' ? 'bg-orange-50 text-basket-orange' : 'text-gray-700 hover:bg-gray-50'}`}>
                                            📅 Eventos (Próximamente)
                                        </button>

                                        <div className="border-t border-gray-100 my-2"></div>

                                        {user ? (
                                            <button onClick={() => { logout(); setIsSidebarOpen(false); }} className="w-full text-left flex items-center gap-3 text-red-600 font-bold hover:bg-red-50 p-3 rounded-lg transition-colors text-sm">
                                                🚪 Cerrar Sesión
                                            </button>
                                        ) : (
                                            <button onClick={() => { setIsSidebarOpen(false); navigate('/login'); }} className="w-full text-left flex items-center gap-3 text-basket-orange font-bold hover:bg-orange-50 p-3 rounded-lg transition-colors text-sm">
                                                👤 Iniciar Sesión
                                            </button>
                                        )}
                                    </nav>
                                </div>
                             )}
                        </div>
                        
                        <h1 className="text-xl font-black text-gray-800 tracking-tight text-center flex-1">STREETBALL FINDER</h1>

                        {/* Espaciador invisible para equilibrar el centro */}
                        <div className="w-[50px]"></div>
                    </div>
                
                    {/* 2. BUSCADOR DE PISTAS */}
                    <div className="relative w-full">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Buscar pista por nombre..." 
                            className="w-full bg-gray-100 border-2 border-transparent focus:bg-white focus:border-basket-orange text-gray-800 font-bold text-sm py-3 pl-10 pr-4 rounded-xl outline-none transition-all placeholder-gray-400 shadow-inner"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    {/* 3. BOTONES DE ACCIÓN (Mapa y Login ahora fuera, sólo en Menú o PC) */}
                    <div className="flex items-center justify-between">
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            {filteredCourts.length} Pistas
                        </span>
                        
                        {/* Botones visibles en desktop (solo como atajos, el menú principal está en sidebar) */}
                        <div className="hidden md:flex items-center gap-2">
                            {/* Opcional: Filtros rápidos o vistas */}
                        </div>
                    </div>
                </div>

                {/* CONTENIDO PRINCIPAL SEGÚN VISTA SELECCIONADA */}
                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar relative">
                    
                    {/* VISTA HOME: LISTA DE PISTAS */}
                    {currentView === 'home' && (
                        <>
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-40 opacity-50 space-y-2">
                                     <div className="w-8 h-8 border-4 border-basket-orange border-t-transparent rounded-full animate-spin"></div>
                                     <span className="text-xs font-bold text-gray-400">Cargando pistas...</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2 pb-20">
                                    {filteredCourts.map(court => (
                                        <div 
                                            key={court.id}
                                            onClick={() => handleCourtClick(court)}
                                            className={`
                                                aspect-[3/4] relative rounded-lg border-[3px] border-white shadow-sm overflow-hidden cursor-pointer
                                                bg-white transition-all duration-200 group
                                                ${selectedCourt?.id === court.id 
                                                    ? 'ring-4 ring-basket-orange z-10 shadow-xl scale-105' 
                                                    : 'hover:shadow-md hover:scale-[1.02]'}
                                            `}
                                        >
                                            {/* Imagen Cromo */}
                                            <div className="h-2/3 w-full bg-slate-200 relative border-b-2 border-white">
                                                {court.image ? (
                                                    <img 
                                                        src={court.image} 
                                                        alt={court.name}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full w-full">
                                                        <span className="text-2xl filter drop-shadow opacity-60">🏀</span>
                                                    </div>
                                                )}
                                                {/* Rating Badge */}
                                                <div className="absolute top-1 right-1 bg-yellow-400 text-yellow-900 w-5 h-5 flex items-center justify-center rounded-full text-[8px] font-black shadow-sm border border-yellow-200 z-10">
                                                    {court.rating}
                                                </div>

                                                {/* Active Event Badge - Solo futuros o de hoy */}
                                                {events.some(e => e.court_id === court.id && new Date(e.date) >= new Date(new Date().setHours(0,0,0,0))) && (
                                                    <div className="absolute top-1 left-1 bg-red-600 text-white px-1.5 py-0.5 rounded text-[8px] font-black tracking-tighter shadow-sm border border-red-400 z-10 animate-pulse">
                                                        EVENTO ACTIVO
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Info Cromo */}
                                            <div className="h-1/3 p-1.5 flex flex-col justify-center items-center text-center bg-white relative">
                                                <h3 className="text-[9px] font-black text-gray-800 leading-tight mb-1 line-clamp-2 w-full">
                                                    {court.name}
                                                </h3>
                                                <div className="flex items-center gap-1 justify-center w-full">
                                                    {court.lighting && (
                                                        <span className="text-[7px] bg-green-100 text-green-700 px-1 rounded border border-green-200 font-bold">
                                                            CON LUZ
                                                        </span>
                                                    )}
                                                    {/* Indicador de gente en miniatura */}
                                                    {getCourtCheckinsCount(court.id) > 0 && (
                                                        <span className="text-[7px] bg-basket-orange text-white px-1 rounded font-bold animate-pulse">
                                                            👥 {getCourtCheckinsCount(court.id)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!loading && filteredCourts.length === 0 && (
                                <div className="text-center py-10 opacity-50">
                                     <span className="text-4xl">🏀</span>
                                     <p className="text-xs font-bold text-gray-400 mt-2">Sin resultados</p>
                                </div>
                            )}
                        </>
                    )}

                    {currentView === 'events' && (
                        <div className="pb-20 space-y-4 relative z-10 w-full">
                            <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-30 border-b border-gray-100 py-3 -mx-3 px-3 flex items-center justify-between shadow-sm">
                                <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter flex items-center gap-2">
                                    🏀 <span className="hidden xs:inline">Eventos</span>
                                </h2>
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log("Create + button CLICKED manually");
                                        const currentUser = getCurrentUser();
                                        if (!currentUser) {
                                            if (window.confirm("Debes iniciar sesión para crear eventos. ¿Quieres ir a iniciar sesión?")) {
                                                navigate('/login');
                                            }
                                            return;
                                        }
                                        setShowCreateEventModal(true);
                                    }}
                                    className="bg-basket-orange hover:bg-orange-600 text-white px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all border-2 border-black flex items-center gap-2 cursor-pointer select-none"
                                >
                                    <span className="text-lg leading-none mb-0.5">+</span> CREAR
                                </button>
                            </div>

                            {events.length === 0 ? (
                                <div className="text-center py-10 opacity-50 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
                                     <span className="text-4xl block mb-2">📅</span>
                                     <p className="text-sm font-bold text-gray-500">No hay eventos próximos.</p>
                                     <p className="text-xs text-gray-400">¡Sé el primero en organizar uno!</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {events.map(event => {
                                        const isJoined = user && event.participants.some(p => p.id === user.id);
                                        const isCreator = user && event.creator.id === user.id;
                                        
                                        // Calcular total real de participantes sumando la propiedad count de la tabla intermedia
                                        // Usamos optional chaining y valores default para evitar crashes si el backend no envía el campo
                                        const totalParticipants = Array.isArray(event.participants) ? event.participants.reduce((sum, p) => {
                                            const throughData = p.EventParticipant || {};
                                            const count = throughData.count ? parseInt(throughData.count) : 1;
                                            return sum + count;
                                        }, 0) : 0;

                                        return (
                                            <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                                <div className="flex">
                                                    {/* Fecha (Columna Izq) */}
                                                    <div className="bg-gray-100 p-3 flex flex-col items-center justify-center border-r border-gray-200 min-w-[70px]">
                                                        <span className="text-xs font-bold text-gray-500 uppercase">
                                                            {new Date(event.date).toLocaleDateString('es-ES', { month: 'short' })}
                                                        </span>
                                                        <span className="text-2xl font-black text-basket-orange leading-none">
                                                            {new Date(event.date).getDate()}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-bold">
                                                            {new Date(event.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>

                                                    {/* Contenido */}
                                                    <div className="p-3 flex-1 flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${event.type === 'tournament' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                                    {event.type === 'tournament' ? '🏆 Torneo' : '🏀 Quedada'}
                                                                </span>
                                                                <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                                                    📍 {event.Court?.name || 'Pista desconocida'}
                                                                </span>
                                                            </div>
                                                            <h3 className="text-lg font-black text-gray-800 leading-tight mb-1">
                                                                {event.title}
                                                            </h3>
                                                            <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                                                                {event.description}
                                                            </p>
                                                        </div>

                                                        {/* Footer Card */}
                                                        <div className="flex justify-between items-center mt-2 border-t border-gray-100 pt-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex -space-x-2">
                                                                    {Array.isArray(event.participants) && event.participants.slice(0, 3).map((p, i) => {
                                                                        const pCount = p.EventParticipant?.count ? parseInt(p.EventParticipant.count) : 1;
                                                                        return (
                                                                        <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gray-600 relative group overflow-visible cursor-help">
                                                                                {/* Avatar Initials */}
                                                                                {p.username ? p.username.charAt(0).toUpperCase() : '?'}
                                                                                
                                                                                {/* Badge de contador individual si es > 1 */}
                                                                                {(pCount > 1) && (
                                                                                    <div className="absolute -top-2 -right-2 bg-black text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center border border-white z-10">
                                                                                        +{pCount}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                                <span className="text-xs text-gray-500 font-bold">
                                                                    {totalParticipants} / {event.max_participants}
                                                                </span>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-2">
                                                                {/* Botón de Borrado: Solo para Admin */}
                                                                {(user?.email === 'admin@gmail.com') && (
                                                                    <button 
                                                                        onClick={() => handleDeleteEvent(event.id)}
                                                                        className="text-xs font-bold text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                                                        title="Borrar como Admin"
                                                                    >
                                                                        🗑️
                                                                    </button>
                                                                )}

                                                                {isJoined ? (
                                                                    <button 
                                                                        onClick={() => handleLeaveEvent(event.id)}
                                                                        className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-red-200"
                                                                    >
                                                                        Salir
                                                                    </button>
                                                                ) : (
                                                                    <div className="flex items-center gap-2">
                                                                        <select 
                                                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-[10px] font-bold rounded-lg p-1 outline-none focus:border-basket-orange cursor-pointer"
                                                                            value={joinCounts[event.id] || 1}
                                                                            onChange={(e) => setJoinCounts({...joinCounts, [event.id]: parseInt(e.target.value)})}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} pax</option>)}
                                                                        </select>
                                                                        <button 
                                                                            onClick={() => user ? handleJoinEvent(event.id) : navigate('/login')}
                                                                            className="text-xs font-bold text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                                                                            disabled={totalParticipants >= event.max_participants}
                                                                        >
                                                                            {totalParticipants >= event.max_participants ? 'LLENO' : 'ME APUNTO'}
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>

                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* CREAR EVENTO MODAL MOVIDO AL ROOT */}
                        </div>
                    )}

                    {/* VISTA MAPA (Visible en el área principal si se selecciona en menú) */}
                    {currentView === 'map' && (
                        <div className="h-full w-full rounded-xl overflow-hidden shadow-inner border border-gray-200">
                             <MapComponent 
                                key={`main-map-${filteredCourts.length}`}
                                courts={filteredCourts} 
                                activeCourt={selectedCourt} 
                                onCourtSelect={handleCourtClick} 
                            />
                        </div>
                    )}

                </div>
            </div>

            {/* 2. AREA DEL MAPA (Derecha) */}
            {currentView === 'home' ? (
                 <div className="hidden md:block w-3/5 duration-300 relative bg-gray-200 z-0 border-l border-gray-300">
                     <MapComponent 
                        key={filteredCourts.length || 'map-sidebar'}
                        courts={filteredCourts} 
                        activeCourt={selectedCourt} 
                        onCourtSelect={handleCourtClick} 
                    />
                 </div>
            ) : null}
            
            {/* MODAL / POPUP DE LA CANCHA SELECCIONADA - SUPERPOSICION TOTAL */}
            {selectedCourt && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        zIndex: 2147483647, /* MAX INT */
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'auto'
                    }}
                    onClick={() => {
                        console.log("Cerrando modal por click fuera");
                        setSelectedCourt(null);
                    }}
                >
                    <div 
                        className="bg-basket-orange w-full max-w-4xl rounded-3xl overflow-hidden flex flex-col md:flex-row relative border-4 border-white" 
                        style={{ maxHeight: '90vh', overflowY: 'auto' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            console.log("Click dentro del contenido");
                        }}
                    >
                        
                        {/* Botón Cerrar */}
                        <button 
                            onClick={() => setSelectedCourt(null)} 
                            className="absolute top-4 right-4 z-50 bg-white hover:bg-gray-100 p-2 rounded-full font-bold shadow-lg transition-all"
                            style={{ color: '#FF6B00' }}
                        >
                            ✕
                        </button>

                        {/* IMAGEN (Izquierda) */}
                        <div className="w-full md:w-1/2 h-64 md:h-auto relative bg-gray-900 border-r-4 border-white">
                             <img 
                                src={selectedCourt.image || 'https://via.placeholder.com/600x400?text=No+Image'} 
                                alt={selectedCourt.name}
                                className="w-full h-full object-cover opacity-90"
                            />
                            <div className="absolute top-4 left-4 text-white px-3 py-1 rounded-full text-xs font-black shadow-lg border-2 border-white transform rotate-2" style={{ backgroundColor: '#FF6B00' }}>
                                ⭐ {selectedCourt.rating} / 5
                            </div>
                        </div>

                        {/* DETALLES (Derecha - Formulario) */}
                        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center overflow-y-auto" style={{ backgroundColor: 'white', color: '#111827' }}>
                            <div>
                                <h2 className="text-4xl font-black leading-tight mb-2 uppercase tracking-tighter drop-shadow-sm" style={{ color: '#FF6B00' }}>
                                    {selectedCourt.name}
                                </h2>
                                <p className="text-sm font-bold mb-6 flex items-center gap-2 text-gray-600">
                                    📍 {selectedCourt.address}
                                </p>
                                
                                <div className="flex flex-wrap gap-2 mb-8">
                                    {selectedCourt.lighting ? (
                                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold border border-yellow-200 flex items-center gap-1">
                                            💡 Con Iluminación
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold border border-gray-200 flex items-center gap-1">
                                            🌑 Sin Iluminación
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-4 p-6 rounded-2xl border border-gray-200 shadow-sm" style={{ backgroundColor: '#F9FAFB' }}>
                                {/* CONTADOR EN TIEMPO REAL */}
                                <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                                    <span className="text-sm font-bold uppercase tracking-wider text-gray-500">Jugadores en pista</span>
                                    <div className="flex items-end gap-1 bg-white border border-gray-200 px-3 py-1 rounded-lg">
                                        <span className="text-3xl font-black leading-none" style={{ color: '#FF6B00' }}>
                                            {getCourtCheckinsCount(selectedCourt.id)}
                                        </span>
                                        <span className="text-xs font-bold text-gray-400 mb-1">personas</span>
                                    </div>
                                </div>

                                {/* FORMULARIO DE CHECK-IN */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-bold uppercase tracking-wider text-gray-700">
                                        ¿Cuántos sois? (Max 10)
                                    </label>
                                    <div className="flex gap-2">
                                        <select 
                                            className="bg-white border-2 border-gray-300 text-gray-900 font-bold rounded-xl px-4 py-3 w-24 outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 text-center text-lg cursor-pointer transition-all"
                                            defaultValue="1"
                                            id="people-count"
                                        >
                                            {[1,2,3,4,5,6,7,8,9,10].map(num => (
                                                <option key={num} value={num}>{num}</option>
                                            ))}
                                        </select>
                                        
                                        <button 
                                            onClick={() => {
                                                try {
                                                    const selectEl = document.getElementById('people-count');
                                                    if (!selectEl) {
                                                        console.error("No se encuentra el selector de personas");
                                                        handleCheckin(1);
                                                        return;
                                                    }
                                                    const count = selectEl.value;
                                                    handleCheckin(parseInt(count)); 
                                                } catch(e) {
                                                    console.error("Error al leer count:", e);
                                                    handleCheckin(1);
                                                }
                                            }}
                                            className="flex-1 text-white py-3 rounded-xl text-lg font-black uppercase tracking-widest shadow-lg transform transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                                            style={{ backgroundColor: '#16a34a', borderBottom: '4px solid #14532d' }}
                                        >
                                            👋 ME APUNTO!
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-center text-gray-500 font-medium mt-2">
                                        El check-in dura 2 horas automáticamente.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* MODAL DE MAPA PARA MOVIL (Flotante) */}
            <div className="md:hidden absolute bottom-4 right-4 z-50">
               {/* Botón flotante para activar mapa si no se ve el header */}
            </div>

            {/* CREAR EVENTO MODAL (USANDO PORTAL PARA GARANTIZAR CENTRADO) */}
            {showCreateEventModal && createPortal(
                <div 
                    className="fixed inset-0 z-[99999] flex items-center justify-center w-screen h-screen"
                    style={{ backgroundColor: 'rgba(0,0,0,0.85)', position: 'fixed', top: 0, left: 0 }}
                    onClick={() => {
                        // Click fuera no cierra para evitar cierres accidentales
                    }}
                >
                   <div 
                        className="bg-white text-black w-[500px] h-auto max-h-[600px] relative shadow-2xl flex flex-col m-4 rounded-xl overflow-hidden border border-gray-200 force-white-bg"
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                        style={{ aspectRatio: '1/1', maxHeight: '90vh', width: 'min(90vw, 500px)', height: 'auto', backgroundColor: '#ffffff', color: '#000000' }} 
                    >
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowCreateEventModal(false);
                            }}
                            className="absolute top-3 right-3 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-all z-[100]"
                        >
                            ✕
                        </button>
                        <h3 className="text-xl font-black text-black mb-0 uppercase text-center border-b border-gray-100 pb-4 tracking-tighter bg-white pt-6 w-full sticky top-0 z-50 overflow-hidden" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
                           📢 Crear Nuevo Evento
                        </h3>
                        
                        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar bg-white" style={{ backgroundColor: '#ffffff' }}>
                            <form onSubmit={handleCreateEvent} className="space-y-4" onClick={(e) => e.stopPropagation()}>
                                <div>
                                    <label className="block text-xs font-bold text-gray-800 uppercase mb-1" style={{ color: '#1f2937' }}>Título del Evento</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="Ej: Partido 3x3 Amistoso"
                                        className="w-full bg-white text-black font-bold p-3 border border-gray-300 rounded-lg focus:border-black outline-none transition-all placeholder-gray-400 focus:ring-1 focus:ring-black/5"
                                        style={{ backgroundColor: '#ffffff', color: '#000000' }}
                                        value={newEventData.title}
                                        onChange={e => setNewEventData({...newEventData, title: e.target.value})}
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-800 uppercase mb-1" style={{ color: '#1f2937' }}>Fecha y Hora</label>
                                        <input 
                                            type="datetime-local" 
                                            required
                                            className="w-full bg-white text-black font-bold p-3 text-xs border border-gray-300 rounded-lg focus:border-black outline-none transition-all [color-scheme:light] focus:ring-1 focus:ring-black/5"
                                            style={{ backgroundColor: '#ffffff', color: '#000000' }}
                                            value={newEventData.date}
                                            onChange={e => setNewEventData({...newEventData, date: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-800 uppercase mb-1" style={{ color: '#1f2937' }}>Tipo de Evento</label>
                                        <select 
                                            className="w-full bg-white text-black font-bold p-3 text-xs border border-gray-300 rounded-lg focus:border-black outline-none transition-all appearance-none cursor-pointer focus:ring-1 focus:ring-black/5"
                                            style={{ backgroundColor: '#ffffff', color: '#000000' }}
                                            value={newEventData.type}
                                            onChange={e => setNewEventData({...newEventData, type: e.target.value})}
                                        >
                                            <option value="pickup">🏀 Quedada</option>
                                            <option value="tournament">🏆 Torneo</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-800 uppercase mb-1" style={{ color: '#1f2937' }}>Selecciona Pista</label>
                                    <select 
                                        required
                                        className="w-full bg-white text-black font-bold p-3 text-xs border border-gray-300 rounded-lg focus:border-black outline-none transition-all appearance-none cursor-pointer focus:ring-1 focus:ring-black/5"
                                        style={{ backgroundColor: '#ffffff', color: '#000000' }}
                                        value={newEventData.court_id}
                                        onChange={e => setNewEventData({...newEventData, court_id: e.target.value})}
                                    >
                                        <option value="">-- Elige una pista --</option>
                                        {courts.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-800 uppercase mb-1" style={{ color: '#1f2937' }}>Descripción (Opcional)</label>
                                    <textarea 
                                        className="w-full bg-white text-black font-bold p-3 text-xs border border-gray-300 rounded-lg focus:border-black outline-none resize-none h-24 transition-all placeholder-gray-400 focus:ring-1 focus:ring-black/5"
                                        style={{ backgroundColor: '#ffffff', color: '#000000' }}
                                        placeholder="Reglas, nivel requerido, material necesario..."
                                        value={newEventData.description}
                                        onChange={e => setNewEventData({...newEventData, description: e.target.value})}
                                    ></textarea>
                                </div>

                                <button 
                                    type="submit" 
                                    className="w-full bg-basket-orange hover:bg-orange-600 text-white font-black uppercase py-4 rounded-lg shadow-lg active:translate-y-1 active:shadow-none transition-all text-sm tracking-wide mt-6 border-b-4 border-orange-700 active:border-b-0"
                                    style={{ backgroundColor: '#FF6B00', color: '#ffffff' }}
                                >
                                    ✨ Publicar Evento
                                </button>
                            </form>
                        </div>

                    </div>
                </div>,
                document.body
            )}
            
        </div>
    );
};

export default Home;
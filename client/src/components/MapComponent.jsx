import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix para los iconos de Leaflet (ESENCIAL para que se vean)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Componente para controlar la vista del mapa
const MapController = ({ activeCourt }) => {
    const map = useMap();
    
    useEffect(() => {
        if (activeCourt && activeCourt.lat && activeCourt.lng) {
            try {
                map.flyTo([parseFloat(activeCourt.lat), parseFloat(activeCourt.lng)], 16, {
                    duration: 1.5
                });
            } catch (e) {
                console.error("Error al volar al mapa:", e);
            }
        }
    }, [activeCourt, map]);

    return null;
};

const MapComponent = ({ courts, activeCourt, onCourtSelect }) => {
    const center = [40.416775, -3.703790]; // Madrid Centro
    const zoom = 12;

    return (
        <MapContainer 
            center={center} 
            zoom={zoom} 
            style={{ height: "100%", width: "100%", zIndex: 0 }}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapController activeCourt={activeCourt} />

            {courts.map(court => (
                // Validamos coordenadas antes de renderizar marcador
                (court.lat && court.lng && !isNaN(court.lat)) && (
                    <Marker 
                        key={court.id} 
                        position={[parseFloat(court.lat), parseFloat(court.lng)]}
                        eventHandlers={{
                            click: () => {
                                console.log("CLICK DETECTADO EN MAPA:", court.name);
                                onCourtSelect(court);
                            },
                        }}
                    >
                    </Marker>
                )
            ))}
        </MapContainer>
    );
};

export default MapComponent;
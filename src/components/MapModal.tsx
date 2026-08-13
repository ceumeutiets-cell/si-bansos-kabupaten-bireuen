import React, { useEffect, useRef } from 'react';
import { MapPin, X, ExternalLink } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  latitude?: number;
  longitude?: number;
  title?: string;
  address?: string;
  onSelectCoordinates?: (lat: number, lng: number) => void;
  isPicker?: boolean;
}

export const MapModal: React.FC<MapModalProps> = ({
  isOpen,
  onClose,
  latitude = 5.2045, // Bireuen default lat
  longitude = 96.7012, // Bireuen default lng
  title = 'Lokasi Penerima Bantuan Sosial',
  address = 'Kabupaten Bireuen',
  onSelectCoordinates,
  isPicker = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Fix leaflet marker default icon path
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const initialLat = latitude || 5.2045;
    const initialLng = longitude || 96.7012;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      const marker = L.marker([initialLat, initialLng], { draggable: isPicker }).addTo(map);
      marker.bindPopup(`<b>${title}</b><br>${address}`).openPopup();

      if (isPicker) {
        marker.on('dragend', (e) => {
          const latLng = e.target.getLatLng();
          if (onSelectCoordinates) {
            onSelectCoordinates(Number(latLng.lat.toFixed(6)), Number(latLng.lng.toFixed(6)));
          }
        });

        map.on('click', (e) => {
          marker.setLatLng(e.latlng);
          if (onSelectCoordinates) {
            onSelectCoordinates(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
          }
        });
      }

      mapInstanceRef.current = map;
      markerRef.current = marker;
    } else {
      mapInstanceRef.current.setView([initialLat, initialLng], 14);
      if (markerRef.current) {
        markerRef.current.setLatLng([initialLat, initialLng]);
        markerRef.current.getPopup()?.setContent(`<b>${title}</b><br>${address}`);
      }
    }

    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, latitude, longitude, isPicker, title, address, onSelectCoordinates]);

  if (!isOpen) return null;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs print:hidden">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl p-5 relative animate-scale-up text-white flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400">{address}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Container */}
        <div className="my-4 rounded-xl overflow-hidden border border-slate-700/60 shadow-inner flex-1 min-h-[350px] relative z-0">
          <div ref={mapContainerRef} className="w-full h-full min-h-[350px]" />
        </div>

        {/* Footer Coordinate info & buttons */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
            <span>Latitude: <strong className="text-emerald-400">{latitude}</strong></span>
            <span className="mx-2">|</span>
            <span>Longitude: <strong className="text-emerald-400">{longitude}</strong></span>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-colors flex items-center gap-1.5 font-medium"
            >
              <ExternalLink className="w-4 h-4 text-sky-400" />
              <span>Buka di Google Maps</span>
            </a>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

'use client';

import { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para ícones do Leaflet no Next.js
if (typeof window !== 'undefined') {
  // @ts-ignore - _getIconUrl é propriedade interna do Leaflet
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

interface Localizacao {
  id: number;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  capturedAt: Date;
  tagType: string | null;
  tagDetail: string | null;
}

interface LeafletMapComponentProps {
  localizacoes: Localizacao[];
  formatDateTime: (date: Date) => string;
}

export default function LeafletMapComponent({ localizacoes, formatDateTime }: LeafletMapComponentProps) {
  // Calcular centro do mapa
  const getMapCenter = (): [number, number] => {
    if (localizacoes.length === 0) return [0, 0];
    const avgLat = localizacoes.reduce((sum, loc) => sum + loc.latitude, 0) / localizacoes.length;
    const avgLng = localizacoes.reduce((sum, loc) => sum + loc.longitude, 0) / localizacoes.length;
    return [avgLat, avgLng];
  };

  // Calcular zoom baseado na área coberta
  const getZoom = (): number => {
    if (localizacoes.length <= 1) return 15;

    const minLat = Math.min(...localizacoes.map(loc => loc.latitude));
    const maxLat = Math.max(...localizacoes.map(loc => loc.latitude));
    const minLng = Math.min(...localizacoes.map(loc => loc.longitude));
    const maxLng = Math.max(...localizacoes.map(loc => loc.longitude));

    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);

    if (maxDiff > 0.1) return 11;
    if (maxDiff > 0.05) return 12;
    if (maxDiff > 0.01) return 13;
    if (maxDiff > 0.005) return 14;
    return 15;
  };

  // Converter localizações para formato Leaflet [lat, lng]
  const getPolylinePositions = (): [number, number][] => {
    return localizacoes.map(loc => [loc.latitude, loc.longitude]);
  };

  // Criar ícone customizado com número da ordem
  const createNumberedIcon = (order: number) => {
    return L.divIcon({
      className: 'custom-numbered-marker',
      html: `
        <div style="
          position: relative;
          width: 30px;
          height: 30px;
          background-color: #1890ff;
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          ${order}
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    });
  };

  if (localizacoes.length === 0) {
    return null;
  }

  return (
    <MapContainer
      center={getMapCenter()}
      zoom={getZoom()}
      style={{ height: '100%', width: '100%', zIndex: 0 }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Linha conectando todas as localizações */}
      {localizacoes.length > 1 && (
        <Polyline
          positions={getPolylinePositions()}
          pathOptions={{
            color: '#1890ff',
            weight: 4,
            opacity: 0.7,
          }}
        />
      )}

      {/* Marcadores para cada localização */}
      {localizacoes.map((loc, index) => {
        const order = index + 1;
        return (
          <Marker
            key={loc.id}
            position={[loc.latitude, loc.longitude]}
            icon={createNumberedIcon(order)}
          >
            {/* Tooltip que aparece ao passar o mouse sobre o pin */}
            <Tooltip permanent={false} direction="top" offset={[0, -10]}>
              <div style={{ textAlign: 'center', lineHeight: '1.4' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                  Ordem: {order}
                </div>
                {loc.tagType && (
                  <div style={{ fontSize: '12px', marginTop: '2px' }}>
                    Tipo: {loc.tagType}
                  </div>
                )}
              </div>
            </Tooltip>
            {/* Popup que aparece ao clicar no pin */}
            <Popup>
              <div>
                <div><strong>Ponto {order}</strong></div>
                <div>{formatDateTime(loc.capturedAt)}</div>
                <div>Lat: {loc.latitude.toFixed(6)}</div>
                <div>Lng: {loc.longitude.toFixed(6)}</div>
                {loc.accuracy && (
                  <div>Precisão: {loc.accuracy.toFixed(0)}m</div>
                )}
                {loc.tagType && (
                  <div>Tipo: {loc.tagType}</div>
                )}
                {loc.tagDetail && (
                  <div>{loc.tagDetail}</div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

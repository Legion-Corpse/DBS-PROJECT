import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const CITY_COORDS = {
  Delhi: [28.6139, 77.2090],
  Mumbai: [19.0760, 72.8777],
  Bangalore: [12.9716, 77.5946],
  Chennai: [13.0827, 80.2707],
  Hyderabad: [17.3850, 78.4867],
  Kolkata: [22.5726, 88.3639],
  Pune: [18.5204, 73.8567],
  Ahmedabad: [23.0225, 72.5714],
  Jaipur: [26.9124, 75.7873],
  Lucknow: [26.8467, 80.9462],
};

function getCoords(cityName) {
  if (!cityName) return null;
  const key = Object.keys(CITY_COORDS).find(
    (c) => c.toLowerCase() === cityName.toLowerCase()
  );
  return key ? CITY_COORDS[key] : null;
}

export default function MapView({ areas = [], centerCity }) {
  const markers = areas
    .map((a) => {
      const city = a.CITY_NAME || a.city_name;
      const coords = getCoords(city);
      return coords ? { ...a, coords, city } : null;
    })
    .filter(Boolean);

  const center = centerCity
    ? getCoords(centerCity)
    : markers[0]?.coords || [20.5937, 78.9629];

  if (!center) return null;

  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={centerCity ? 11 : 5}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((m, i) => (
          <Marker key={i} position={m.coords}>
            <Popup>
              <strong>{m.city}</strong>
              {m.REGION_CODE || m.region_code
                ? ` — ${m.REGION_CODE || m.region_code}`
                : ''}
            </Popup>
          </Marker>
        ))}
        {centerCity && getCoords(centerCity) && (
          <Circle
            center={getCoords(centerCity)}
            radius={8000}
            pathOptions={{ color: '#6B4EFF', fillColor: '#EDE9FF', fillOpacity: 0.25 }}
          />
        )}
      </MapContainer>
    </div>
  );
}

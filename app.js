// Initialize Map with optimized settings for mobile/desktop
const map = L.map('map', {
    zoomControl: false, // Custom UI
    attributionControl: false,
    tap: false, // Fixes some click issues on mobile
    bounceAtZoomLimits: false
}).setView([20, 0], 3);

// High Quality Dark Tiles
const darkMatter = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    minZoom: 2
}).addTo(map);

// DOM Elements
const searchPanel = document.getElementById('search-panel');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const locateBtn = document.getElementById('locate-btn');
const latVal = document.getElementById('lat-val');
const lngVal = document.getElementById('lng-val');

// Update Coords with high precision
map.on('move', () => {
    const center = map.getCenter();
    latVal.textContent = center.lat.toFixed(6);
    lngVal.textContent = center.lng.toFixed(6);
});

// Precise Search
async function searchLocation() {
    const query = searchInput.value.trim();
    if (!query) return;

    searchPanel.style.borderColor = "var(--gps-accent)";
    searchInput.placeholder = "Buscando...";

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        const data = await response.json();

        if (data.length > 0) {
            const { lat, lon, display_name } = data[0];
            const target = [parseFloat(lat), parseFloat(lon)];

            map.flyTo(target, 16, {
                duration: 2,
                easeLinearity: 0.25
            });

            L.circleMarker(target, {
                radius: 10,
                fillColor: "#00e5ff",
                color: "#fff",
                weight: 2,
                fillOpacity: 0.7
            }).addTo(map).bindPopup(display_name).openPopup();
        }
    } catch (e) {
        console.error(e);
    } finally {
        searchInput.placeholder = "Buscar ubicación...";
        searchPanel.style.borderColor = "var(--gps-border)";
    }
}

searchBtn.addEventListener('click', searchLocation);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchLocation();
});

// Exact Geolocation
locateBtn.addEventListener('click', () => {
    map.locate({
        setView: true,
        maxZoom: 18,
        enableHighAccuracy: true
    });
});

map.on('locationfound', (e) => {
    L.circle(e.latlng, e.accuracy / 2, {
        color: '#00e5ff',
        weight: 1,
        fillOpacity: 0.1
    }).addTo(map);

    L.circleMarker(e.latlng, {
        radius: 8,
        fillColor: "#00e5ff",
        color: "#fff",
        weight: 2,
        fillOpacity: 1
    }).addTo(map);
});

// Click for exact coords
map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    L.popup()
        .setLatLng(e.latlng)
        .setContent(`<div style="text-align:center; font-size:0.9rem;">
            <b>COORDENADAS</b><br>${lat.toFixed(6)}, ${lng.toFixed(6)}
        </div>`)
        .openOn(map);
});

// Fix for window resize
window.addEventListener('resize', () => {
    map.invalidateSize();
});

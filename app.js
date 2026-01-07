// Initialize Map
const map = L.map('map', {
    zoomControl: true,
    attributionControl: false
}).setView([20, 0], 2);

// Tile Layers
const darkMatter = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 20
}).addTo(map);

const voyager = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 20
});

// DOM Elements
const searchPanel = document.getElementById('search-panel');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const locateBtn = document.getElementById('locate-btn');
const themeBtn = document.getElementById('theme-btn');
const latVal = document.getElementById('lat-val');
const lngVal = document.getElementById('lng-val');

// Update Coords on Move
map.on('move', () => {
    const center = map.getCenter();
    latVal.textContent = center.lat.toFixed(6);
    lngVal.textContent = center.lng.toFixed(6);
});

// Search Functionality with improved accuracy
async function searchLocation() {
    const query = searchInput.value;
    if (!query) return;

    searchPanel.classList.add('loading');
    searchInput.placeholder = "Localizando...";

    try {
        // Using Nominatim with more parameters for better results
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`);
        const data = await response.json();

        if (data.length > 0) {
            const { lat, lon, display_name } = data[0];
            const target = [parseFloat(lat), parseFloat(lon)];

            // Higher zoom level for better precision (18 is close enough to see streets)
            map.flyTo(target, 18, {
                duration: 2.5,
                easeLinearity: 0.25
            });

            // Add Marker
            const marker = L.circleMarker(target, {
                radius: 12,
                fillColor: "#00e5ff",
                color: "#fff",
                weight: 3,
                opacity: 1,
                fillOpacity: 0.6
            }).addTo(map);

            marker.bindPopup(`<div style="font-family: 'Outfit'; padding: 5px;">
                <b style="color: #00e5ff; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 1px;">Ubicación Encontrada</b><br>
                <span style="font-size: 0.9rem;">${display_name}</span>
            </div>`).openPopup();
        } else {
            alert("No se encontró la ubicación.");
        }
    } catch (error) {
        console.error("Error de conexión:", error);
    } finally {
        setTimeout(() => {
            searchPanel.classList.remove('loading');
            searchInput.placeholder = "Buscar ubicación...";
        }, 500);
    }
}

searchBtn.addEventListener('click', searchLocation);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchLocation();
});

// Locate User with High Accuracy
locateBtn.addEventListener('click', () => {
    map.locate({
        setView: true,
        maxZoom: 18,
        enableHighAccuracy: true // Crucial for exact location
    });
});

map.on('locationfound', (e) => {
    // Clear previous location markers if any
    map.eachLayer((layer) => {
        if (layer instanceof L.Circle || layer instanceof L.CircleMarker) {
            if (layer.options.className === 'user-location') {
                map.removeLayer(layer);
            }
        }
    });

    L.circle(e.latlng, e.accuracy / 2, {
        color: '#00e5ff',
        fillColor: '#00e5ff',
        fillOpacity: 0.05,
        weight: 1,
        className: 'user-location'
    }).addTo(map);

    L.circleMarker(e.latlng, {
        radius: 8,
        fillColor: "#00e5ff",
        color: "#fff",
        weight: 2,
        fillOpacity: 1,
        className: 'user-location'
    }).addTo(map);
});

map.on('locationerror', (e) => {
    alert("Error al obtener ubicación: " + e.message);
});

// Theme Toggle
themeBtn.addEventListener('click', () => {
    if (map.hasLayer(darkMatter)) {
        map.removeLayer(darkMatter);
        map.addLayer(voyager);
    } else {
        map.removeLayer(voyager);
        map.addLayer(darkMatter);
    }
});

// Click to get exact coords
map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    L.popup()
        .setLatLng(e.latlng)
        .setContent(`<div style="font-family: 'Outfit'; text-align: center; padding: 10px;">
            <b style="color: #00e5ff; letter-spacing: 2px; font-size: 0.7rem;">COORDENADAS EXACTAS</b><br>
            <span style="font-family: monospace; font-size: 1rem;">${lat.toFixed(6)}, ${lng.toFixed(6)}</span>
        </div>`)
        .openOn(map);
});

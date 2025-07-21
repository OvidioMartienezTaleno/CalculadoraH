let map;
let points = [];
let markers = [];
let polygon = null;
let polyline = null;
let userLocationMarker = null;
let watchId = null;

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleBtn');
    
    sidebar.classList.toggle('active');
    toggleBtn.innerHTML = sidebar.classList.contains('active') ? '✕' : '☰';
}

function closeSidebarOnMobile() {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('toggleBtn');
        
        if (sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            toggleBtn.innerHTML = '☰';
        }
    }
}

// Obtener ubicación actual
function getCurrentLocation() {
    const locationBtn = document.getElementById('locationBtn');
    const locationText = document.getElementById('locationText');
    
    if (!navigator.geolocation) {
        alert('Tu navegador no soporta geolocalización');
        return;
    }
    
    locationBtn.disabled = true;
    locationText.textContent = '🔄 Obteniendo ubicación...';
    locationBtn.classList.add('loading');
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;
            
            map.setView([lat, lng], 16);
            
            if (userLocationMarker) {
                map.removeLayer(userLocationMarker);
            }
            
            userLocationMarker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'user-location-marker',
                    html: `<div style="
                        background: #3b82f6;
                        color: white;
                        border-radius: 50%;
                        width: 20px;
                        height: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 12px;
                        border: 3px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                        position: relative;
                    ">📍</div>
                    <div style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: ${Math.min(accuracy * 2, 100)}px;
                        height: ${Math.min(accuracy * 2, 100)}px;
                        background: rgba(59, 130, 246, 0.2);
                        border: 2px solid rgba(59, 130, 246, 0.5);
                        border-radius: 50%;
                        pointer-events: none;
                    "></div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            }).addTo(map);
            
            userLocationMarker.bindPopup(`
                <div style="text-align: center;">
                    <strong>📍 Tu ubicación</strong><br>
                    <small>Lat: ${lat.toFixed(6)}<br>
                    Lng: ${lng.toFixed(6)}<br>
                    Precisión: ±${Math.round(accuracy)}m</small><br>
                    <button onclick="addCurrentLocationAsPoint()" style="
                        background: #2563eb;
                        color: white;
                        border: none;
                        padding: 4px 8px;
                        border-radius: 4px;
                        cursor: pointer;
                        margin-top: 5px;
                    ">Agregar como punto</button>
                </div>
            `).openPopup();
            
            locationBtn.disabled = false;
            locationText.textContent = '📍 Mi Ubicación';
            locationBtn.classList.remove('loading');
            
            closeSidebarOnMobile();
        },
        function(error) {
            locationBtn.disabled = false;
            locationText.textContent = '📍 Mi Ubicación';
            locationBtn.classList.remove('loading');
            
            let errorMsg = 'Error al obtener ubicación';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg = 'Permiso de ubicación denegado. Habilítalo en la configuración de tu navegador.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg = 'Ubicación no disponible. Verifica tu conexión GPS/WiFi.';
                    break;
                case error.TIMEOUT:
                    errorMsg = 'Tiempo de espera agotado. Intenta nuevamente.';
                    break;
            }
            alert(errorMsg);
        },
        {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0
        }
    );
}

function addCurrentLocationAsPoint() {
    if (userLocationMarker) {
        const latlng = userLocationMarker.getLatLng();
        addPoint(latlng);
        map.closePopup();
    }
}

// Centrar en Costa Rica
function centerOnCostaRica() {
    map.setView([9.7489, -83.7534], 8);
    closeSidebarOnMobile();
}

// Inicializar el mapa centrado en Costa Rica
function initMap() {
    map = L.map('map').setView([9.7489, -83.7534], 8);
    
    let googleSatellite = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google',
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });
    
    let googleHybrid = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google',
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });
    
    let esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri &mdash; Source: Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
        maxZoom: 18
    });
    
    let bingSatellite = L.tileLayer('https://ecn.t{s}.tiles.virtualearth.net/tiles/a{q}.jpeg?g=587&mkt=en-gb&n=z', {
        attribution: '&copy; Microsoft Bing Maps',
        maxZoom: 18,
        subdomains: '0123',
        customParams: function(tilemap) {
            return L.Util.template(this._url, L.extend({
                q: this._quadKey(tilemap.x, tilemap.y, tilemap.z),
                s: this._getSubdomain(tilemap)
            }, this.options));
        },
        _quadKey: function(x, y, z) {
            var quadKey = [];
            for (var i = z; i > 0; i--) {
                var digit = '0';
                var mask = 1 << (i - 1);
                if ((x & mask) != 0) {
                    digit++;
                }
                if ((y & mask) != 0) {
                    digit++;
                    digit++;
                }
                quadKey.push(digit);
            }
            return quadKey.join('');
        }
    });
    
    // Usar una implementación más simple para Bing
    let bingSatelliteSimple = L.tileLayer('https://ecn.t0.tiles.virtualearth.net/tiles/a{q}.jpeg?g=587', {
        attribution: '&copy; Microsoft Bing Maps',
        maxZoom: 18
    });
    
    let openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    });
    
    let cartoPositron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors, &copy; CARTO',
        maxZoom: 18
    });
    
    googleSatellite.addTo(map);
    
    let baseMaps = {
        "🛰️ Google Satélite": googleSatellite,
        "🗺️ Google Híbrido": googleHybrid,
        "🌍 Esri Satélite": esriSatellite,
        "📍 OpenStreetMap": openStreetMap,
        "⚪ Carto Light": cartoPositron
    };
    
    L.control.layers(baseMaps).addTo(map);
    
    map.on('click', function(e) {
        addPoint(e.latlng);
        closeSidebarOnMobile();
    });

    window.addEventListener('resize', function() {
        setTimeout(function() {
            map.invalidateSize();
        }, 100);
    });
}

// Agregar un punto
function addPoint(latlng) {
    points.push(latlng);
    
    let marker = L.marker(latlng, {
        icon: L.divIcon({
            className: 'point-marker',
            html: `<div style="
                background: #2563eb;
                color: white;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">${points.length}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        })
    }).addTo(map);
    
    markers.push(marker);
    updateDisplay();
}

// Calcular área usando la fórmula del shoelace
function calculateArea(coords) {
    if (coords.length < 3) return 0;
    
    let area = 0;
    let j = coords.length - 1;
    
    for (let i = 0; i < coords.length; i++) {
        // Convertir coordenadas geográficas a metros aproximadamente
        let xi = coords[i].lng * 111320 * Math.cos(coords[i].lat * Math.PI / 180);
        let yi = coords[i].lat * 110540;
        let xj = coords[j].lng * 111320 * Math.cos(coords[j].lat * Math.PI / 180);
        let yj = coords[j].lat * 110540;
        
        area += (xj + xi) * (yj - yi);
        j = i;
    }
    
    return Math.abs(area / 2);
}

// Calcular perímetro
function calculatePerimeter(coords) {
    if (coords.length < 2) return 0;
    
    let perimeter = 0;
    for (let i = 0; i < coords.length; i++) {
        let j = (i + 1) % coords.length;
        let distance = calculateDistance(coords[i], coords[j]);
        perimeter += distance;
    }
    
    return perimeter;
}

// Calcular distancia entre dos puntos (fórmula de Haversine)
function calculateDistance(point1, point2) {
    const R = 6371000; // Radio de la Tierra en metros
    const lat1 = point1.lat * Math.PI / 180;
    const lat2 = point2.lat * Math.PI / 180;
    const deltaLat = (point2.lat - point1.lat) * Math.PI / 180;
    const deltaLng = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

// Actualizar visualización
function updateDisplay() {
    // Actualizar contador de puntos
    document.getElementById('pointCount').textContent = points.length;
    
    // Actualizar lista de coordenadas
    updateCoordinatesList();
    
    if (polygon) {
        map.removeLayer(polygon);
        polygon = null;
    }
    if (polyline) {
        map.removeLayer(polyline);
        polyline = null;
    }
    
    if (points.length >= 2) {

        polyline = L.polyline(points, {
            color: '#2563eb',
            weight: 3,
            opacity: 0.8
        }).addTo(map);
    }
    
    if (points.length >= 3) {
        // Dibujar polígono
        polygon = L.polygon(points, {
            color: '#2563eb',
            fillColor: '#3b82f6',
            weight: 3,
            opacity: 0.8,
            fillOpacity: 0.3
        }).addTo(map);
        

        let area = calculateArea(points);
        let perimeter = calculatePerimeter(points);
        
        document.getElementById('areaSquareMeters').textContent = area.toLocaleString('es-ES', {maximumFractionDigits: 2}) + ' m²';
        document.getElementById('areaHectares').textContent = (area / 10000).toLocaleString('es-ES', {maximumFractionDigits: 4}) + ' ha';
        document.getElementById('perimeter').textContent = perimeter.toLocaleString('es-ES', {maximumFractionDigits: 2}) + ' m';
    } else {

        document.getElementById('areaSquareMeters').textContent = '0.00 m²';
        document.getElementById('areaHectares').textContent = '0.00 ha';
        document.getElementById('perimeter').textContent = '0.00 m';
    }
}

// Actualizar lista de coordenadas
function updateCoordinatesList() {
    let list = document.getElementById('coordinatesList');
    list.innerHTML = '';
    
    points.forEach((point, index) => {
        let item = document.createElement('div');
        item.className = 'coordinate-item';
        item.innerHTML = `
            <span>${index + 1}. ${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}</span>
            <button class="remove-point" onclick="removePoint(${index})" title="Eliminar punto">×</button>
        `;
        list.appendChild(item);
    });
}

// Remover un punto específico
function removePoint(index) {
    if (markers[index]) {
        map.removeLayer(markers[index]);
    }
    points.splice(index, 1);
    markers.splice(index, 1);
    
    // Actualizar números de los marcadores restantes
    markers.forEach((marker, i) => {
        marker.setIcon(L.divIcon({
            className: 'point-marker',
            html: `<div style="
                background: #2563eb;
                color: white;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">${i + 1}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        }));
    });
    
    updateDisplay();
}

// Limpiar todo
function clearAll() {
    points = [];
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    if (polygon) {
        map.removeLayer(polygon);
        polygon = null;
    }
    if (polyline) {
        map.removeLayer(polyline);
        polyline = null;
    }
    
    updateDisplay();
}

// Deshacer último punto
function undoLastPoint() {
    if (points.length > 0) {
        let lastIndex = points.length - 1;
        if (markers[lastIndex]) {
            map.removeLayer(markers[lastIndex]);
        }
        points.pop();
        markers.pop();
        updateDisplay();
    }
}

// Inicializar la aplicación cuando carga la página
window.addEventListener('DOMContentLoaded', function() {
    initMap();
});

// 1. Initialisation de la carte centrée sur le Japon
const map = L.map('map').setView([35.682839, 139.759455], 5);

// 2. Chargement du fond de carte OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// 3. Chargement de tes points KML sur la carte
const runLayer = omnivore.kml('japon.kml')
    .on('ready', function() {
        // Ajuste automatiquement le zoom pour afficher tous tes points KML
        map.fitBounds(runLayer.getBounds());
    })
    .addTo(map);
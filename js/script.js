//Coordonnées de chaque etape

const premierPoint = [47.74695880403098, 7.338670211454569]; // Place de la Réunion
//Valeur test
//const premierPoint = [48.01965653270442, 7.296198454381838]; //test

const secondPoint = [47.74568759007926, 7.33833040531314]; // Musée beaux arts
//Valeur test
//const secondPoint = [48.01912643143712, 7.2964316632502015] //test

const troisiemePoint = [47.74568759007926, 7.33833040531314]; //Musée beaux arts
//Valeur test
//const troisiemePoint = [48.018337186829676, 7.295897293902218]; //test 

const quatriemePoint = [47.74643990512586, 7.339232970100119]; //Valeur à changer
//Valeur test
//const quatriemePoint = [48.0186600562757, 7.294803037709174]; //test


//Faire le passage des etapes
const params = new URLSearchParams(window.location.search);
let etape = params.get("etape");


//Faire la Map
const map = L.map('map').setView(premierPoint, 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OSM contributors',
}).addTo(map);

const Marker = L.marker(premierPoint).addTo(map).bindPopup("🎯 Etape 1");

let userMarker = null;
let routeLine = null;
let jeu1 = "false";
let jeu2 = "false";
let jeu3 = "false";
let jeu4 = "false";
let destination = premierPoint;
let tRef = 0;

const userIcon = L.icon({
    iconUrl: 'images/211857_man_icon.svg',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

if (etape === "2") {
    jeu1 = "true";
    map.removeLayer(Marker);
    L.marker(secondPoint).addTo(map).bindPopup("🎯 Etape 2");
    destination = secondPoint;
    map.setView(secondPoint, 15);
}

if (etape === "3") {
    jeu2 = "true";
    map.removeLayer(Marker);
    map.removeLayer(secondPoint);
    L.marker(troisiemePoint).addTo(map).bindPopup("🎯 Etape 3");
    destination = troisiemePoint;
    map.setView(troisiemePoint, 15);
}

if (etape === "4") {
    jeu3 = "true";
    map.removeLayer(Marker);
    map.removeLayer(troisiemePoint);
    L.marker(quatriemePoint).addTo(map).bindPopup("🎯 Etape 4");
    destination = quatriemePoint;
    map.setView(quatriemePoint, 15);
}

if (etape === "fin") {
    jeu4 = "true";
    map.removeLayer(Marker);
    map.removeLayer(quatriemePoint);
    alert("Bravo, vous avez terminé le jeu ! Vous pouvez maintenant quitter la page.");
}


if ("geolocation" in navigator) {
    navigator.geolocation.watchPosition(
        position => {
            const userPos = [position.coords.latitude, position.coords.longitude];

            if (!userMarker) {
                userMarker = L.marker(userPos, { icon: userIcon }).addTo(map).bindPopup("📍 Vous êtes ici");
            } else {
                userMarker.setLatLng(userPos);
            }

            const distance = L.latLng(userPos).distanceTo(L.latLng(premierPoint));
            const distance2 = L.latLng(userPos).distanceTo(L.latLng(secondPoint));
            const distance3 = L.latLng(userPos).distanceTo(L.latLng(troisiemePoint));
            const distance4 = L.latLng(userPos).distanceTo(L.latLng(quatriemePoint));

            if (distance < 10 && (jeu1 === "false")) {
                window.location.href = "game1/index.html";
            }

            if (distance2 < 10 && (jeu2 === "false") && (jeu1 === "true")) {
                window.location.href = "game2/index.html";
            }

            if (distance3 < 10 && (jeu3 === "false") && (jeu2 === "true")) {
                window.location.href = "game3/index.html";
            }

            if (distance4 < 10 && (jeu4 === "false") && (jeu3 === "true")) {
                window.location.href = "game4/index.html";
            }


            // Met à jour l'itinéraire toutes les 5 secondes
            if (performance.now() - tRef > 5000) {
                tRef = performance.now();

                const url = `https://router.project-osrm.org/route/v1/driving/${userPos[1]},${userPos[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`;

                fetch(url)
                    .then(res => res.json())
                    .then(data => {
                        const coords = data.routes[0].geometry;

                        if (routeLine) {
                            map.removeLayer(routeLine);
                        }

                        routeLine = L.geoJSON(coords, { color: 'red' }).addTo(map);
                        map.fitBounds(routeLine.getBounds());

                        const distance = (data.routes[0].distance / 1000).toFixed(2);
                        const duration = Math.round(data.routes[0].duration / 60);

                        L.popup()
                            .setLatLng(destination)
                            .setContent(`<b>Distance :</b> ${distance} km<br><b>Durée :</b> ~${duration} min en voiture`)
                            .openOn(map);
                    });
            }
        },
        error => {
            alert("Erreur de géolocalisation : " + error.message);
        },
        {
            enableHighAccuracy: true
        }
    );
} else {
    alert("La géolocalisation n’est pas disponible sur votre navigateur.");
}
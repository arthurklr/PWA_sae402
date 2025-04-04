document.addEventListener('DOMContentLoaded', function () {
    // Créer une section pour la carte dans le HTML
    const mapSection = document.createElement('section');
    mapSection.id = 'map-section';
    mapSection.innerHTML = `
        <h2>Découvrez les Escape Games de Mulhouse</h2>
        <div id="map" style="height: 400px; width: 100%; margin-bottom: 20px;"></div>
        <div id="directions"></div>
    `;

    // Insérer la section de carte après la section hero
    const heroSection = document.querySelector('.hero-section');
    if (heroSection && heroSection.nextElementSibling) {
        heroSection.parentNode.insertBefore(mapSection, heroSection.nextElementSibling);
    } else if (heroSection) {
        heroSection.parentNode.appendChild(mapSection);
    } else {
        document.querySelector('.container').appendChild(mapSection);
    }

    // Ajouter les liens CSS pour Leaflet
    const leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    leafletCSS.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    leafletCSS.crossOrigin = '';
    document.head.appendChild(leafletCSS);

    // Ajouter le script Leaflet
    const leafletScript = document.createElement('script');
    leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    leafletScript.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    leafletScript.crossOrigin = '';
    document.head.appendChild(leafletScript);

    // Ajouter le script pour le routage
    const routingScript = document.createElement('script');
    routingScript.src = 'https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.js';
    document.head.appendChild(routingScript);

    // Ajouter le CSS pour le routage
    const routingCSS = document.createElement('link');
    routingCSS.rel = 'stylesheet';
    routingCSS.href = 'https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css';
    document.head.appendChild(routingCSS);

    // Attendre que Leaflet soit chargé
    leafletScript.onload = function () {
        // Liste des escape games à Mulhouse
        const escapeGames = [
            {
                id: 1,
                name: "Escape 1",
                description: "Escape games immersifs pour tous",
                address: "84 Rue des Machines, 68200 Mulhouse",
                location: [47.73114794106034, 7.301366876065549],
                difficulty: "Moyen à Difficile",
                duration: "60 minutes"
            },
            {
                id: 2,
                name: "Escape 2",
                description: "Énigmes et aventures captivantes",
                address: "12 Rue de la Sinne, 68100 Mulhouse",
                location: [47.729951037662794, 7.300505018567932],
                difficulty: "Facile à Moyen",
                duration: "45-60 minutes"
            },
            {
                id: 3,
                name: "Escape 3",
                description: "Expériences d'évasion uniques",
                address: "25 Avenue du Président Kennedy, 68200 Mulhouse",
                location: [47.72949714341961, 7.301355372585623],
                difficulty: "Difficile",
                duration: "75 minutes"
            }
        ];

        // Initialiser la carte au centre de Mulhouse
        const map = L.map('map').setView([47.750839, 7.335888], 13);

        // Ajouter la couche de tuiles OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Variable pour stocker la position de l'utilisateur
        let userLocation = null;
        let userMarker = null;
        let routingControl = null;

        // Ajouter les marqueurs pour chaque escape game
        escapeGames.forEach(game => {
            const marker = L.marker(game.location).addTo(map);
            marker.bindPopup(`
                <div class="escape-game-popup">
                    <h3>${game.name}</h3>
                    <p>${game.description}</p>
                    <p><strong>Adresse:</strong> ${game.address}</p>
                    <p><strong>Difficulté:</strong> ${game.difficulty}</p>
                    <p><strong>Durée:</strong> ${game.duration}</p>
                    <button class="route-button" data-id="${game.id}">S'y rendre</button>
                </div>
            `);

            marker.on('popupopen', function () {
                // Ajouter un écouteur d'événement au bouton dans le popup
                setTimeout(() => {
                    const routeButton = document.querySelector(`.route-button[data-id="${game.id}"]`);
                    if (routeButton) {
                        routeButton.addEventListener('click', function () {
                            createRoute(game);
                        });
                    }
                }, 100);
            });
        });

        // Fonction pour créer un itinéraire
        function createRoute(game) {
            if (!userLocation) {
                document.getElementById('directions').innerHTML = `
                    <p class="error">Veuillez d'abord localiser votre position.</p>
                `;
                return;
            }

            const start = L.latLng(userLocation[0], userLocation[1]);
            const end = L.latLng(game.location[0], game.location[1]);

            updateRoute(start, end);

            // Ajuster la vue pour voir l'itinéraire complet
            const bounds = L.latLngBounds([userLocation, game.location]);
            map.fitBounds(bounds, { padding: [50, 50] });
        }

        // Fonction pour obtenir la localisation de l'utilisateur et la suivre en continu
        function startLocationTracking() {
            if (navigator.geolocation) {
                navigator.geolocation.watchPosition(
                    function (position) {
                        userLocation = [position.coords.latitude, position.coords.longitude];

                        if (userMarker) {
                            map.removeLayer(userMarker);
                        }

                        userMarker = L.marker(userLocation).addTo(map);
                        userMarker.bindPopup("Vous êtes ici");

                        if (!map.getBounds().contains(L.latLng(userLocation[0], userLocation[1]))) {
                            map.setView(userLocation, 13);
                        }

                        if (routingControl && routingControl._selectedRoute) {
                            const currentDestination = routingControl.getWaypoints()[1].latLng;
                            updateRoute(L.latLng(userLocation[0], userLocation[1]), currentDestination);
                        }
                    },
                    function (error) {
                        let errorMessage;
                        switch (error.code) {
                            case error.PERMISSION_DENIED:
                                errorMessage = "Vous avez refusé la demande de géolocalisation.";
                                break;
                            case error.POSITION_UNAVAILABLE:
                                errorMessage = "Les informations de localisation ne sont pas disponibles.";
                                break;
                            case error.TIMEOUT:
                                errorMessage = "La demande de localisation a expiré.";
                                break;
                            case error.UNKNOWN_ERROR:
                                errorMessage = "Une erreur inconnue s'est produite.";
                                break;
                        }
                        document.getElementById('directions').innerHTML = `<p class="error">${errorMessage}</p>`;
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    }
                );
            } else {
                document.getElementById('directions').innerHTML = "<p class='error'>Votre navigateur ne prend pas en charge la géolocalisation.</p>";
            }
        }

        // Lancer le suivi de localisation dès le chargement de la carte
        startLocationTracking();

        // Fonction pour calculer la distance entre deux points (en km)
        function calculateDistance(point1, point2) {
            const lat1 = point1[0];
            const lon1 = point1[1];
            const lat2 = point2[0];
            const lon2 = point2[1];

            const R = 6371; // Rayon de la Terre en km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            return distance;
        }

        // Fonction pour mettre à jour l'itinéraire
        function updateRoute(start, end) {
            if (routingControl) {
                map.removeControl(routingControl);
            }

            const apiKey = '5b3ce3597851110001cf62485db0521f758f4936958e6672c3857aa2'; // Remplacer par votre clé API

            routingControl = L.Routing.control({
                waypoints: [
                    start,
                    end
                ],
                routeWhileDragging: false,
                showAlternatives: false,
                lineOptions: {
                    styles: [{ color: '#FF4500', weight: 6, opacity: 0.9, dashArray: '10, 10' }]
                },
                router: L.Routing.osrmv1({
                    serviceUrl: `https://api.openrouteservice.org/v2/directions/foot-walking/geojson?api_key=${apiKey}`, // Ajout de la clé API dans l'URL
                    profile: '',
                    routingOptions: {
                        travelMode: 'foot-walking'
                    }
                }),
                createMarker: function () { return null; }
            }).addTo(map);

            routingControl.on('routesfound', function (e) {
                const routes = e.routes;
                const summary = routes[0].summary;
                const instructions = routes[0].instructions;

                const destLat = end.lat;
                const destLng = end.lng;
                const game = escapeGames.find(g =>
                    Math.abs(g.location[0] - destLat) < 0.0001 &&
                    Math.abs(g.location[1] - destLng) < 0.0001
                );

                if (game) {
                    const distance = calculateDistance([userLocation[0], userLocation[1]], [game.location[0], game.location[1]]);
                    const duration = summary.totalTime / 60; // Convertir en minutes

                    document.getElementById('directions').innerHTML = `
                        <p>Distance: ${distance.toFixed(2)} km</p>
                        <p>Durée estimée: ${Math.round(duration)} minutes</p>
                        <div class="instructions">
                            ${instructions.map(instruction => `
                                <div class="instruction">
                                    <p>${instruction.text}</p>
                                    <p>${instruction.distance} m</p>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }
            });
        }

        // Ajouter du CSS pour les éléments de la carte
        const style = document.createElement('style');
        style.textContent = `
            #map-section {
                margin: 40px 0;
                padding: 20px;
                background-color: #f9f9f9;
                border-radius: 8px;
            }
            
            .route-button {
                background-color: #FF4500;
                color: white;
                border: none;
                padding: 8px 15px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                margin-top: 10px;
            }
            
            .route-button:hover {
                background-color: #E03E00;
            }
            
            .directions-summary {
                background-color: #f0f0f0;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 15px;
            }
            
            .directions-steps {
                background-color: #fff;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            
            .directions-steps li {
                margin-bottom: 10px;
                padding-bottom: 10px;
                border-bottom: 1px solid #eee;
            }
            
            .error {
                color: #D8000C;
                background-color: #FFD2D2;
                padding: 10px;
                border-radius: 4px;
            }
            
            .escape-game-popup h3 {
                margin-top: 0;
                color: #333;
            }
            
            .escape-game-popup p {
                margin: 5px 0;
            }
        `;
        document.head.appendChild(style);
    };
});
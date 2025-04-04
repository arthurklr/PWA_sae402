// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', function () {
    // Créer une section pour la carte dans le HTML
    const mapSection = document.createElement('section');
    mapSection.id = 'map-section';
    mapSection.innerHTML = `
        <h2>Découvrez les Escape Games de Mulhouse</h2>
        <div id="map" style="height: 400px; width: 100%; margin-bottom: 20px;"></div>
        <button id="get-location" class="explore">Localiser ma position</button>
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
    routingScript.src = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js';
    document.head.appendChild(routingScript);

    // Ajouter le CSS pour le routage
    const routingCSS = document.createElement('link');
    routingCSS.rel = 'stylesheet';
    routingCSS.href = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css';
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
                location: [47.74691132809389, 7.3386484567601995],
                difficulty: "Moyen à Difficile",
                duration: "60 minutes"
            },
            {
                id: 2,
                name: "Escape 2",
                description: "Énigmes et aventures captivantes",
                address: "12 Rue de la Sinne, 68100 Mulhouse",
                location: [47.74570161101235, 7.338345483442383],
                difficulty: "Facile à Moyen",
                duration: "45-60 minutes"
            },
            {
                id: 3,
                name: "Escape 3",
                description: "Expériences d'évasion uniques",
                address: "25 Avenue du Président Kennedy, 68200 Mulhouse",
                location: [47.74570161101235, 7.338345483442383],
                difficulty: "Difficile",
                duration: "75 minutes"
            },
            {
                id: 4,
                name: "Escape 4",
                description: "Expériences d'évasion uniques",
                address: "25 Avenue du Président Kennedy, 68200 Mulhouse",
                location: [47.74645786986951, 7.339211764661519],
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
                    <p class="error">Veuillez d'abord localiser votre position en cliquant sur "Localiser ma position".</p>
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

        // Fonction pour obtenir la localisation de l'utilisateur
        document.getElementById('get-location').addEventListener('click', function () {
            if (navigator.geolocation) {
                // Obtenir la position initiale
                navigator.geolocation.getCurrentPosition(
                    function (position) {
                        userLocation = [position.coords.latitude, position.coords.longitude];

                        // Supprimer le marqueur précédent s'il existe
                        if (userMarker) {
                            map.removeLayer(userMarker);
                        }

                        // Ajouter un marqueur pour l'utilisateur
                        userMarker = L.marker(userLocation).addTo(map);
                        userMarker.bindPopup("Vous êtes ici").openPopup();

                        // Centrer la carte sur la position de l'utilisateur
                        map.setView(userLocation, 13);

                        // Mettre à jour le texte du bouton
                        document.getElementById('get-location').textContent = "Position localisée";
                        document.getElementById('get-location').classList.add('located');

                        // Démarrer le suivi de position en continu
                        const watchId = navigator.geolocation.watchPosition(
                            function (newPosition) {
                                const newLocation = [newPosition.coords.latitude, newPosition.coords.longitude];

                                // Vérifier si la position a suffisamment changé (plus de 10 mètres)
                                if (!userLocation || calculateDistance(userLocation, newLocation) > 0.01) {
                                    userLocation = newLocation;

                                    // Mettre à jour le marqueur de l'utilisateur
                                    if (userMarker) {
                                        map.removeLayer(userMarker);
                                    }
                                    userMarker = L.marker(userLocation).addTo(map);
                                    userMarker.bindPopup("Vous êtes ici");

                                    // Mettre à jour l'itinéraire si un itinéraire est actif
                                    if (routingControl && routingControl._selectedRoute) {
                                        const currentDestination = routingControl.getWaypoints()[1].latLng;
                                        updateRoute(L.latLng(userLocation[0], userLocation[1]), currentDestination);
                                    }
                                }
                            },
                            function (error) {
                                console.error("Erreur lors du suivi de position:", error);
                            },
                            {
                                enableHighAccuracy: true,
                                timeout: 10000,
                                maximumAge: 0
                            }
                        );

                        // Stocker l'ID du suivi pour pouvoir l'arrêter plus tard si nécessaire
                        window.positionWatchId = watchId;
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
        });

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
            // Supprimer l'itinéraire précédent s'il existe
            if (routingControl) {
                map.removeControl(routingControl);
            }

            // Créer le nouvel itinéraire
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
                    serviceUrl: 'https://router.project-osrm.org/route/v1',
                    profile: 'walking'
                }),
                createMarker: function () { return null; }
            }).addTo(map);

            // Afficher les instructions d'itinéraire
            routingControl.on('routesfound', function (e) {
                const routes = e.routes;
                const summary = routes[0].summary;
                const instructions = routes[0].instructions;

                // Trouver l'escape game correspondant à la destination
                const destLat = end.lat;
                const destLng = end.lng;
                const game = escapeGames.find(g =>
                    Math.abs(g.location[0] - destLat) < 0.0001 &&
                    Math.abs(g.location[1] - destLng) < 0.0001
                );

                let directionsHTML = `
                    <div class="directions-summary">
                        <h3>Itinéraire vers ${game ? game.name : 'la destination'}</h3>
                        <p>Distance: ${(summary.totalDistance / 1000).toFixed(2)} km</p>
                        <p>Durée estimée: ${Math.round(summary.totalTime / 60)} minutes</p>
                    </div>
                    <ol class="directions-steps">
                `;

                instructions.forEach(function (instruction) {
                    directionsHTML += `<li>${instruction.text}</li>`;
                });

                directionsHTML += '</ol>';
                document.getElementById('directions').innerHTML = directionsHTML;
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
            
            #get-location {
                background-color: #4CAF50;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                margin-bottom: 20px;
            }
            
            #get-location:hover {
                background-color: #45a049;
            }
            
            #get-location.located {
                background-color: #2196F3;
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

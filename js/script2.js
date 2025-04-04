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

    // Ajouter les liens CSS pour OpenLayers
    const olCSS = document.createElement('link');
    olCSS.rel = 'stylesheet';
    olCSS.href = 'https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v6.15.1/css/ol.css';
    document.head.appendChild(olCSS);

    // Ajouter le script OpenLayers
    const olScript = document.createElement('script');
    olScript.src = 'https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v6.15.1/build/ol.js';
    document.head.appendChild(olScript);

    // Attendre que OpenLayers soit chargé
    olScript.onload = function () {
        // Liste des escape games à Mulhouse
        const escapeGames = [
            {
                id: 1,
                name: "Escape 1",
                description: "Escape games immersifs pour tous",
                address: "84 Rue des Machines, 68200 Mulhouse",
                location: [7.301366876065549, 47.73114794106034], // [lon, lat] pour OpenLayers
                difficulty: "Moyen à Difficile",
                duration: "60 minutes"
            },
            {
                id: 2,
                name: "Escape 2",
                description: "Énigmes et aventures captivantes",
                address: "12 Rue de la Sinne, 68100 Mulhouse",
                location: [7.300505018567932, 47.729951037662794],
                difficulty: "Facile à Moyen",
                duration: "45-60 minutes"
            },
            {
                id: 3,
                name: "Escape 3",
                description: "Expériences d'évasion uniques",
                address: "25 Avenue du Président Kennedy, 68200 Mulhouse",
                location: [7.301355372585623, 47.72949714341961],
                difficulty: "Difficile",
                duration: "75 minutes"
            }
        ];

        // Initialiser la carte au centre de Mulhouse
        const map = new ol.Map({
            target: 'map',
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([7.335888, 47.750839]),
                zoom: 13
            })
        });

        // Variable pour stocker la position de l'utilisateur
        let userLocation = null;
        let userMarker = null;
        let routeLayer = null;

        // Ajouter les marqueurs pour chaque escape game
        const features = escapeGames.map(game => {
            const feature = new ol.Feature({
                geometry: new ol.geom.Point(ol.proj.fromLonLat(game.location)),
                name: game.name,
                description: game.description,
                address: game.address,
                difficulty: game.difficulty,
                duration: game.duration,
                id: game.id
            });
            return feature;
        });

        const vectorSource = new ol.source.Vector({
            features: features
        });

        const vectorLayer = new ol.layer.Vector({
            source: vectorSource,
            style: new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 6,
                    fill: new ol.style.Fill({ color: 'red' }),
                    stroke: new ol.style.Stroke({ color: 'white', width: 2 })
                })
            })
        });

        map.addLayer(vectorLayer);

        // Ajouter un popup
        const popup = new ol.Overlay({
            element: document.createElement('div'),
            positioning: 'bottom-center',
            stopEvent: false,
            offset: [0, -10]
        });
        map.addOverlay(popup);

        map.on('click', function (evt) {
            const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
                return feature;
            });
            if (feature) {
                const coordinates = feature.getGeometry().getCoordinates();
                popup.getElement().innerHTML = `
                    <div class="escape-game-popup">
                        <h3>${feature.get('name')}</h3>
                        <p>${feature.get('description')}</p>
                        <p><strong>Adresse:</strong> ${feature.get('address')}</p>
                        <p><strong>Difficulté:</strong> ${feature.get('difficulty')}</p>
                        <p><strong>Durée:</strong> ${feature.get('duration')}</p>
                        <button class="route-button" data-id="${feature.get('id')}">S'y rendre</button>
                    </div>
                `;
                popup.setPosition(coordinates);

                setTimeout(() => {
                    const routeButton = document.querySelector(`.route-button[data-id="${feature.get('id')}"]`);
                    if (routeButton) {
                        routeButton.addEventListener('click', function () {
                            createRoute(escapeGames.find(game => game.id === feature.get('id')));
                        });
                    }
                }, 100);
            } else {
                popup.setPosition(undefined);
            }
        });

        // Fonction pour créer un itinéraire
        function createRoute(game) {
            if (!userLocation) {
                document.getElementById('directions').innerHTML = `<p class="error">Veuillez d'abord localiser votre position.</p>`;
                return;
            }

            const start = ol.proj.fromLonLat(userLocation);
            const end = ol.proj.fromLonLat(game.location);

            updateRoute(start, end);

            // Ajuster la vue pour voir l'itinéraire complet
            const extent = ol.extent.boundingExtent([start, end]);
            map.getView().fit(extent, { padding: [50, 50] });
        }

        // Fonction pour obtenir la localisation de l'utilisateur et la suivre en continu
        function startLocationTracking() {
            if (navigator.geolocation) {
                navigator.geolocation.watchPosition(
                    function (position) {
                        userLocation = [position.coords.longitude, position.coords.latitude];
        
                        if (userMarker) {
                            map.removeLayer(userMarker);
                        }
        
                        userMarker = new ol.layer.Vector({
                            source: new ol.source.Vector({
                                features: [new ol.Feature({
                                    geometry: new ol.geom.Point(ol.proj.fromLonLat(userLocation))
                                })]
                            }),
                            style: new ol.style.Style({
                                image: new ol.style.Circle({
                                    radius: 6,
                                    fill: new ol.style.Fill({ color: 'blue' }),
                                    stroke: new ol.style.Stroke({ color: 'white', width: 2 })
                                })
                            })
                        });
                        map.addLayer(userMarker);
        
                        // Correction ici
                        if (!ol.extent.containsCoordinate(map.getView().calculateExtent(map.getSize()), ol.proj.fromLonLat(userLocation))) {
                            map.getView().setCenter(ol.proj.fromLonLat(userLocation));
                        }
        
                        if (routeLayer) {
                            const currentDestination = routeLayer.getSource().getFeatures()[1].getGeometry().getCoordinates();
                            updateRoute(ol.proj.fromLonLat(userLocation), currentDestination);
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

        // Fonction pour mettre à jour l'itinéraire
        function updateRoute(start, end) {
            if (routeLayer) {
                map.removeLayer(routeLayer);
            }
        
            const routeSource = new ol.source.Vector();
            routeLayer = new ol.layer.Vector({
                source: routeSource,
                style: new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#FF4500',
                        width: 6,
                        lineDash: [10, 10]
                    })
                })
            });
            map.addLayer(routeLayer);
        
            const apiKey = '5b3ce3597851110001cf62485db0521f758f4936958e6672c3857aa2'; // Remplacez par votre clé API OpenRouteService (facultatif)
            const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${start[0]},${start[1]}&end=${end[0]},${end[1]}`;
        
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    const geometry = data.features[0].geometry;
                    const routeFeature = new ol.format.GeoJSON().readFeature(geometry, {
                        dataProjection: 'EPSG:4326',
                        featureProjection: 'EPSG:3857'
                    });
                    routeSource.addFeature(routeFeature);
        
                    const summary = data.features[0].properties.summary;
                    const distance = summary.distance / 1000;
                    const duration = summary.duration / 60;
        
                    const game = escapeGames.find(g =>
                        Math.abs(g.location[0] - ol.proj.toLonLat(end)[0]) < 0.0001 &&
                        Math.abs(g.location[1] - ol.proj.toLonLat(end)[1]) < 0.0001
                    );
        
                    let directionsHTML = `
                        <div class="directions-summary">
                            <h3>Itinéraire vers ${game ? game.name : 'la destination'}</h3>
                            <p>Distance: ${distance.toFixed(2)} km</p>
                            <p>Durée estimée: ${Math.round(duration)} minutes</p>
                        </div>
                    `;
                    document.getElementById('directions').innerHTML = directionsHTML;
                })
                .catch(error => {
                    console.error('Erreur lors du calcul de l\'itinéraire:', error);
                    document.getElementById('directions').innerHTML = `<p class="error">Erreur lors du calcul de l'itinéraire.</p>`;
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
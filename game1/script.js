
let isAccessibilityMode = false;
// Gestionnaire d'événement pour le bouton d'accessibilité
const accessibilityButton = document.getElementById('accessibilityButton');
if (accessibilityButton) {
    accessibilityButton.addEventListener('click', () => {
        isAccessibilityMode = true;
        startGame();
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const speechTextElement = document.querySelector('.speech-text');
    const fullText = speechTextElement.textContent;
    speechTextElement.textContent = '';

    let charIndex = 0;
    let synth = window.speechSynthesis;
    let utterance = new SpeechSynthesisUtterance();

    function typeWriter() {
        if (charIndex < fullText.length) {
            speechTextElement.textContent += fullText.charAt(charIndex);
            charIndex++;
            setTimeout(typeWriter, 50);
        } else {
            if (isAccessibilityMode) {
                speakText(fullText);
            }
        }
    }

    typeWriter();

    function speakText(text) {
        utterance.text = text;

        const voices = synth.getVoices();
        const frenchVoice = voices.find(voice => voice.lang === 'fr-FR');

        if (frenchVoice) {
            utterance.voice = frenchVoice;
        }

        synth.speak(utterance);
    }
});

const storyElement = document.getElementById('story');
const optionsElement = document.getElementById('options');

let previousState = null;
let currentTextAnimation = null;
let currentUtterance = null;

let currentGameState = 'intro';
let gameCompleted = false;

let currentText = '';
let isTyping = false;

// Fonction pour mettre à jour le texte dans la bulle de dialogue
function updateSpeechBubble(text) {
    const speechTextElement = document.querySelector('.speech-text');

    // Interrompre la synthèse vocale en cours si elle existe
    if (currentUtterance) {
        window.speechSynthesis.cancel();
        currentUtterance = null;
    }

    // Interrompre l'animation en cours si elle existe
    if (currentTextAnimation) {
        clearTimeout(currentTextAnimation);
        speechTextElement.textContent = currentText; // Afficher le texte actuel sans animation
        isTyping = false;
    }

    currentText = text;
    speechTextElement.textContent = '';

    let charIndex = 0;
    let synth = window.speechSynthesis;
    let utterance = new SpeechSynthesisUtterance();

    // Démarrer la lecture à voix haute immédiatement
    if (isAccessibilityMode) {
        utterance.text = text;
        const voices = synth.getVoices();
        const frenchVoice = voices.find(voice => voice.lang === 'fr-FR');
        if (frenchVoice) {
            utterance.voice = frenchVoice;
        }
        synth.speak(utterance);
        currentUtterance = utterance;
    }

    function typeWriter() {
        if (charIndex < text.length) {
            speechTextElement.textContent += text.charAt(charIndex);
            charIndex++;
            currentTextAnimation = setTimeout(typeWriter, 50); // Stocker l'ID du timeout
        } else {
            isTyping = false;
            currentTextAnimation = null; // Réinitialiser l'ID
        }
    }

    isTyping = true;
    typeWriter();
}


// Fonction utilitaire pour attendre la fin de l'animation du texte
function waitForSpeech() {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (!isTyping) {
                clearInterval(interval);
                // Ajouter un délai de 2 secondes après la fin de l'animation
                setTimeout(resolve, 2000);
            }
        }, 100);
    });
}

/*
=====================================================

Fonction pour le début des jeux

=====================================================
*/

function startGame() {

    currentGameState = 'intro';
    gameCompleted = false;
    currentText = '';
    isTyping = false;

    // Réinitialiser l'affichage
    storyElement.classList.remove('hidden');
    optionsElement.classList.remove('hidden');
    const canvas = document.getElementById('mazeCanvas');
    if (canvas) {
        canvas.style.display = 'none';
    }
    if (currentUtterance) {
        window.speechSynthesis.cancel();
        currentUtterance = null;
    }
    if (currentTextAnimation) {
        clearTimeout(currentTextAnimation);
        currentTextAnimation = null;
    }

    updateSpeechBubble("Bonjour, voyageur ! Mulhouse est menacée ! Les Tisserands ont caché un plan secret sur cette place.");

    // Utiliser Promise pour attendre la fin de l'animation
    waitForSpeech().then(() => {
        updateSpeechBubble("Comme tu peux le voir, le plus grand bâtiment est le temple. Allons le voir !");
        waitForSpeech().then(() => {
            document.body.style.backgroundImage = "url('img/porte.webp')";
            updateSpeechBubble("Arriver devant la porte de la crypte du temple, tu trouve un mot caché par la poussière.");
            waitForSpeech().then(() => {
                updateSpeechBubble("C'est parti pour le premier défi ! Secoue ton téléphone pour enlever la poussière !");
                setTimeout(puzzleChallenge, 3000);
            });
        });
    });
}

/*
=====================================================

Fonction pour faire vibrer le téléphone

=====================================================
*/
function vibratePhone() {
    if (navigator.vibrate) {
        navigator.vibrate(200); // Vibre pendant 200 ms
    } else {
        console.log("Vibration non supportée par ce navigateur.");
    }
}

/*
=====================================================

Jeu 1 : Secouez le téléphone

=====================================================
*/

function puzzleChallenge() {
    // Variables pour détecter les secousses
    let lastX = 0;
    let lastY = 0;
    let lastZ = 0;
    let shakeThreshold = 500; // Augmentation du seuil pour une détection plus précise
    let shakeCount = 0;
    let requiredShakes = 3; // Nombre de secousses nécessaires
    let shakeTime = null;

    window.addEventListener('devicemotion', handleMotion);
    function handleMotion(event) {
        const acceleration = event.accelerationIncludingGravity;
        const { x, y, z } = acceleration;

        // Calculer la différence entre les valeurs actuelles et précédentes
        const deltaX = Math.abs(x - lastX);
        const deltaY = Math.abs(y - lastY);
        const deltaZ = Math.abs(z - lastZ);

        // Mettre à jour les valeurs précédentes
        lastX = x;
        lastY = y;
        lastZ = z;

        // Calculer la force de la secousse
        const shakeForce = deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ;

        // Vérifier si la force dépasse le seuil
        if (shakeForce > shakeThreshold) {
            // Vérifier si ce n'est pas une secousse trop récente
            const now = new Date().getTime();
            if (!shakeTime || (now - shakeTime > 500)) { // Réduire le délai à 500ms
                shakeCount++;
                shakeTime = now;

                // Vérifier si le nombre de secousses requis est atteint
                if (shakeCount >= requiredShakes) {
                    window.removeEventListener('devicemotion', handleMotion);
                    navigator.vibrate(200);
                    waitForSpeech().then(() => {
                        updateSpeechBubble("Une phrase est apparue, elle dit 'Entre dans la crypte'");
                        waitForSpeech().then(() => {
                            document.body.style.backgroundImage = "url('img/crypte.jpg')";
                            updateSpeechBubble("Arriver dans la crypte, tu trouve une boite, tu essaye de l'ouvrir mais tu n'y arrive pas.");
                            waitForSpeech().then(() => {
                                updateSpeechBubble("C'est parti pour le deuxième défi ! Guide la balle dans le trou !");
                                setTimeout(puzzleChallenge2, 3000);
                            });
                        });
                    })
                }
            }
        }
    }
}

/*
=====================================================

Jeu 2 : Mettre Balle dans le trou, Style labyrinthe

=====================================================
*/

// Fonction qui démarre le jeu
function puzzleChallenge2() {
    setTimeout(initializeGame, 3000);
}


// Variable globale pour le contexte audio
let audioContext;
let oscillator;

let oscillatorEnabled = false;
// Fonction pour initialiser le son
class Particule {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.ax = 0;
        this.ay = 0;
        this.radius = 10;

        // Initialiser le contexte audio et l'oscillateur
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.connect(audioContext.destination);
    }

    update() {
        this.vx += this.ax;
        this.vy += this.ay;
        this.x += this.vx;
        this.y += this.vy;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();
    }

    checkCollision(width, height) {
        // Collision avec les bords
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx = -this.vx * 0.5;
        } else if (this.x + this.radius > width) {
            this.x = width - this.radius;
            this.vx = -this.vx * 0.5;
        }

        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vy = -this.vy * 0.5;
        } else if (this.y + this.radius > height) {
            this.y = height - this.radius;
            this.vy = -this.vy * 0.5;
        }
    }

    checkHole(holeX, holeY) {
        const dx = this.x - holeX;
        const dy = this.y - holeY;
        const distance = Math.sqrt(dx * dx + dy * dy);
    
        // Ajuster la fréquence selon la distance uniquement si isAccessibilityMode est true
        if (isAccessibilityMode) {
            if (!oscillatorEnabled) {
                oscillator.start();
                oscillatorEnabled = true;
            }
            if (distance < 200) {
                // La fréquence augmente quand on s'approche (500 Hz à 2000 Hz)
                const targetFrequency = 500 + (1500 * (1 - (distance / 200)));
                oscillator.frequency.setValueAtTime(targetFrequency, audioContext.currentTime);
            } else {
                // Réduire la fréquence quand on s'éloigne
                oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
            }
        } else {
            if (oscillatorEnabled) {
                oscillator.stop();
                oscillatorEnabled = false;
            }
        }
    
        // Si la balle est dans le trou
        if (distance < this.radius) {
            // Arrêter le son quand on gagne
            if (oscillatorEnabled) {
                oscillator.stop();
                oscillatorEnabled = false;
            }
            return true;
        }
        return false;
    }
}

//Fonction pour faire le jeu
function initializeGame() {
    storyElement.classList.add('hidden');
    optionsElement.classList.add('hidden');

    const canvas = document.getElementById('mazeCanvas');
    const ctx = canvas.getContext('2d');
    canvas.style.display = 'block';

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const bille = new Particule(50, 50);

    const holeX = canvas.width / 2;
    const holeY = canvas.height / 2;

    let lastTime = 0;
    const gravity = 0.6;

    function updateAcceleration(alpha, beta, gamma) {
        const angleX = (gamma / 90) * 2;
        const angleY = (beta / 90) * 2;
        bille.ax = angleX * gravity;
        bille.ay = angleY * gravity;
        bille.vx *= 0.95;
        bille.vy *= 0.95;
    }

    function drawHole() {
        ctx.beginPath();
        ctx.arc(holeX, holeY, 20, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();
    }

    function animate(timestamp) {
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        bille.update();
        bille.checkCollision(canvas.width, canvas.height);
        drawHole();
        bille.draw(ctx);
    
        if (bille.checkHole(holeX, holeY)) {
            canvas.style.display = 'none';
            storyElement.classList.remove('hidden');
            optionsElement.classList.remove('hidden');
            vibratePhone();
            updateSpeechBubble("La boite s'ouvre enfin ! Un mot s'y trouve et dit 'avance' !");
            waitForSpeech().then(() => {
                updateSpeechBubble("Plus loin, tu trouve un coffre avec un crochet.");
                waitForSpeech().then(() => {
                    updateSpeechBubble("C'est parti pour le troisième défi ! Tape l'écran quand tu entend le bruit du crochet du coffre !");
                    setTimeout(puzzleChallenge3, 4000);
                });
            });
            return;
        }
        requestAnimationFrame(animate);
    }

    window.addEventListener('deviceorientation', (event) => {
        const alpha = event.alpha;
        const beta = event.beta;
        const gamma = event.gamma;

        updateAcceleration(alpha, beta, gamma);
    });

    if (!window.DeviceOrientationEvent) {
        storyElement.innerText = "Votre navigateur ne supporte pas l'API Device Orientation";
        return;
    }

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    requestAnimationFrame(animate);
                } else {
                    storyElement.innerText = "Permission refusée pour l'API Device Orientation";
                }
            })
            .catch(console.error);
    } else {
        requestAnimationFrame(animate);
    }
}


/*
=====================================================

Jeu 3 : Labyrinthe invisible

=====================================================
*/

function puzzleChallenge3() {
    let startTime;
    let isReady = false;

    function playBeep() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        setTimeout(() => {
            oscillator.stop();
            startTime = performance.now();
            isReady = true;
        }, 300);
    }


    /* Joue le bip et active le click sur l'écran  */
    setTimeout(playBeep, Math.random() * 5000 + 2000); // Joue le bip entre 2 et 7 secondes
    window.addEventListener("click", handleTap);

    /* Fonction pour gerer le clic de l'ecran */
    function handleTap() {
        if (!isReady) return;

        const reactionTime = performance.now() - startTime;
        isReady = false;

        if (reactionTime < 1) {
            storyElement.innerText = "Trop rapide ! Vous avez anticipé.";
            navigator.vibrate(300);
        } else {
            if (reactionTime < 300) {
                updateSpeechBubble("Ton temps de reaction est incroyable, le coffre s'ouvre !");
                waitForSpeech().then(() => {
                    updateSpeechBubble("Tu as trouvé le plan ! Maintenant, suit le !");
                    window.location.href="../index.html";
                });
                navigator.vibrate([200, 100, 200]);
            }
            else {
                updateSpeechBubble("Tu as pris trop de temps à réagir, recommence");
                setTimeout(puzzleChallenge3, 3000);
            }
        }
        window.removeEventListener("click", handleTap);
    }
}

/*
=====================================================

Appel de la fonction pour lancer l'ensemble des jeux

=====================================================
*/
//startGame();

// Fonction pour rediriger vers la page d'accueil
alert("Vous avez terminé le premier jeu ! Vous pouvez maintenant avancer dans l'aventure.");
window.location.href="../index.html?etape=2";




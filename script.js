// CONFIGURATION DU VOYAGE
const DEPART_AVION = new Date("2026-11-15T10:00:00").getTime(); 
const ARRIVEE_TOKYO = new Date("2026-11-16T08:00:00").getTime();

// Liste de messages funs
const messagesFuns = [
    "🍣 Adieu jambon-beurre, bonjour SUSHI !",
    "✈️ Attache ta ceinture, on décolle !",
    "⛩️ Objectif : Devenir un vrai Ninja.",
    "🍜 Alerte : Niveau de Ramen critique !",
    "🚅 Shinkansen activé. Destination : Futur.",
    "🍜 On est là pour la culture... et surtout pour les Ramen."

];

// Choisir un message au hasard (une seule fois quand ça arrive à zéro)
let messageChoisi = messagesFuns[Math.floor(Math.random() * messagesFuns.length)];

function updateApp() {
    const now = new Date().getTime();
    const diff = DEPART_AVION - now;

    const timerElement = document.getElementById("timer");
    if (timerElement) {
        if (diff <= 0) {
            // Affiche le message fun avec une petite animation si tu veux
            timerElement.innerHTML = `<span style="font-size: 20px; color: #BC4749;">${messageChoisi}</span>`;
            
            // Optionnel : masquer le label "Avant l'aventure" qui est juste en dessous
            const label = document.querySelector('.countdown-section .label');
            if(label) label.style.display = 'none';
            
        } else {
            // Le reste de ton code pour le timer (jours, heures, mins...)
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            timerElement.innerHTML = 
                `${days}j : ${hours.toString().padStart(2, '0')}h : ${minutes.toString().padStart(2, '0')}m : ${seconds.toString().padStart(2, '0')}s`;
        }
    }

    // 2. GESTION DE LA PROCHAINE ÉTAPE DYNAMIQUE
    const statusElement = document.getElementById('next-step');
    if (statusElement) {
        const dayOfVoyage = Math.floor((now - ARRIVEE_TOKYO) / (1000 * 60 * 60 * 24)) + 1;

        if (now < DEPART_AVION) {
            statusElement.innerText = "En préparation...";
        } else if (now >= DEPART_AVION && now < ARRIVEE_TOKYO) {
            statusElement.innerText = "Dans l'avion ✈️";
        } else if (dayOfVoyage >= 1 && dayOfVoyage <= 5) {
            statusElement.innerText = "Étape 1 : Tokyo 🗼";
        } else if (dayOfVoyage >= 6 && dayOfVoyage <= 7) {
            statusElement.innerText = "Étape 2 : Kawaguchiko 🗻";
        } else if (dayOfVoyage >= 8 && dayOfVoyage <= 9) {
            statusElement.innerText = "Étape 3 : Vallée de Kiso 🌲";
        } else if (dayOfVoyage >= 10 && dayOfVoyage <= 13) {
            statusElement.innerText = "Étape 4 : Kyoto ⛩️";
        } else if (dayOfVoyage >= 14 && dayOfVoyage <= 15) {
            statusElement.innerText = "Étape 5 : Hiroshima 🕊️";
        } else if (dayOfVoyage >= 16 && dayOfVoyage <= 18) {
            statusElement.innerText = "Étape 6 : Osaka 🐙";
        } else if (dayOfVoyage >= 19 && dayOfVoyage <= 20) {
            statusElement.innerText = "Étape 7 : Tokyo (Retour) 🗼";
        } else {
            statusElement.innerText = "Voyage terminé ❤️";
        }
    }
}

// Lancer la mise à jour toutes les secondes
setInterval(updateApp, 1000);
updateApp();

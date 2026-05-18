// --- 1. DATES CLÉS DU VOYAGE (CALIBRÉES 2026) ---
const DEPART_AVION = new Date("2026-11-15T10:00:00").getTime(); 
const ARRIVEE_TOKYO = new Date("2026-11-16T08:00:00").getTime();
const FIN_VOYAGE = new Date("2026-12-05T20:00:00").getTime(); 

// --- 2. MESSAGES FUNS ---
const messagesFuns = [
    "🍣 Adieu jambon-beurre, bonjour SUSHI !",
    "✈️ Attache ta ceinture, on décolle !",
    "⛩️ Objectif : Devenir un vrai Ninja.",
    "🍜 Alerte : Niveau de Ramen critique !",
    "🚅 Shinkansen activé. Destination : Futur.",
    "🍜 On est là pour la culture... et surtout pour les Ramen."
];
const messageChoisi = messagesFuns[Math.floor(Math.random() * messagesFuns.length)];

// --- 3. CACHE DES ÉLÉMENTS DOM ---
const timerElement = document.getElementById("timer");
const labelElement = document.querySelector(".countdown-section .label"); // Le petit badge (ex: AVANT L'AVENTURE)
const statusElement = document.getElementById("next-step");

// --- 4. FONCTION PRINCIPALE DE MISE À JOUR ---
function updateApp() {
    const now = new Date().getTime();
    const diff = DEPART_AVION - now;

    // Calcul précis du jour de voyage (15 Nov = Jour 0, 16 Nov = Jour 1)
    const dayOfVoyage = Math.floor((now - ARRIVEE_TOKYO) / (1000 * 60 * 60 * 24)) + 1;

    // -----------------------------------------------------
    // A. GESTION DU TIMER & DU BADGE CENTRAL
    // -----------------------------------------------------
    if (timerElement) {
        if (now < DEPART_AVION) {
            // PHASE 1 : AVANT LE DÉPART (Format strict 000 : 00 : 00 : 00)
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            // Rendu propre qui s'imbrique parfaitement dans tes blocs HTML
            timerElement.innerHTML = `${days.toString().padStart(3, '0')} : ${hours.toString().padStart(2, '0')} : ${minutes.toString().padStart(2, '0')} : ${seconds.toString().padStart(2, '0')}`;
            
            if (labelElement) labelElement.innerHTML = "AVANT L'AVENTURE";

        } else if (now >= DEPART_AVION && now <= FIN_VOYAGE) {
            // PHASE 2 : PENDANT LE VOYAGE
            timerElement.innerHTML = `<span style="font-size: 20px; color: #ffffff; line-height: 1.4; font-weight: 700;">${messageChoisi}</span>`;
            
            if (labelElement) {
                if (now < ARRIVEE_TOKYO) {
                    labelElement.innerHTML = "DANS L'AVION ✈️";
                } else {
                    labelElement.innerHTML = `JOUR ${dayOfVoyage} DU PÉRIPLE`; 
                }
            }

        } else {
            // PHASE 3 : LE RETOUR
            timerElement.innerHTML = "MATANÉ ! 🌸";
            if (labelElement) labelElement.innerHTML = "SOUVENIRS ÉTERNELS";
        }
    }

    // -----------------------------------------------------
    // B. GESTION DU TEXTE "STATUT DU VOYAGE" (COHÉRENT AVEC TES PAGES)
    // -----------------------------------------------------
    if (statusElement) {
        if (now < DEPART_AVION) {
            statusElement.innerText = "Tokyo (Départ)";
        } else if (now >= DEPART_AVION && now < ARRIVEE_TOKYO) {
            statusElement.innerText = "Dans l'avion ✈️";
        } else if (now > FIN_VOYAGE) {
            statusElement.innerText = "Voyage terminé ❤️";
        } else {
            // Changement dynamique basé sur le calendrier exact validé ensemble
            if (dayOfVoyage >= 1 && dayOfVoyage <= 5) {
                statusElement.innerText = "Actuellement : Tokyo (Aller) 🗼";
            } else if (dayOfVoyage >= 5 && dayOfVoyage <= 7) {
                statusElement.innerText = "Actuellement : Kawaguchiko 🗻";
            } else if (dayOfVoyage >= 7 && dayOfVoyage <= 8) {
                statusElement.innerText = "Actuellement : Vallée de Kiso 🌲";
            } else if (dayOfVoyage >= 8 && dayOfVoyage <= 13) {
                statusElement.innerText = "Actuellement : Kyoto ⛩️";
            } else if (dayOfVoyage >= 13 && dayOfVoyage <= 14) {
                statusElement.innerText = "Actuellement : Hiroshima 🕊️";
            } else if (dayOfVoyage >= 14 && dayOfVoyage <= 17) {
                statusElement.innerText = "Actuellement : Osaka 🐙";
            } else if (dayOfVoyage >= 17 && dayOfVoyage <= 20) {
                statusElement.innerText = "Actuellement : Tokyo (Retour) 🗼";
            } else {
                statusElement.innerText = "Profitez bien ! ✨";
            }
        }
    }
}

// Lancement immédiat puis boucle toutes les secondes
updateApp();
setInterval(updateApp, 1000);

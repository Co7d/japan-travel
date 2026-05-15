// --- 1. DATES CLÉS DU VOYAGE ---
const DEPART_AVION = new Date("2026-11-15T10:00:00").getTime(); 
const ARRIVEE_TOKYO = new Date("2026-11-16T08:00:00").getTime();

// 💡 AJOUT : La date de votre vol retour (à ajuster avec la vraie date)
const FIN_VOYAGE = new Date("2026-12-05T20:00:00").getTime(); 

// --- 2. MESSAGES FUNS (Au moment du départ) ---
const messagesFuns = [
    "🍣 Adieu jambon-beurre, bonjour SUSHI !",
    "✈️ Attache ta ceinture, on décolle !",
    "⛩️ Objectif : Devenir un vrai Ninja.",
    "🍜 Alerte : Niveau de Ramen critique !",
    "🚅 Shinkansen activé. Destination : Futur.",
    "🍜 On est là pour la culture... et surtout pour les Ramen."
];

// Choix aléatoire d'un message (calculé une seule fois)
const messageChoisi = messagesFuns[Math.floor(Math.random() * messagesFuns.length)];

// --- 3. OPTIMISATION : CACHE DES ÉLÉMENTS DOM ---
// On les stocke ici pour ne pas les recharger toutes les secondes !
const timerElement = document.getElementById("timer");
const labelElement = document.querySelector(".countdown-section .label");
const statusElement = document.getElementById("next-step");

// --- 4. FONCTION PRINCIPALE DE MISE À JOUR ---
function updateApp() {
    const now = new Date().getTime();
    const diff = DEPART_AVION - now;

    // Calcul du jour actuel (1 = premier jour post-arrivée à Tokyo)
    const dayOfVoyage = Math.floor((now - ARRIVEE_TOKYO) / (1000 * 60 * 60 * 24)) + 1;

    // -----------------------------------------------------
    // A. GESTION DU GROS TIMER & DU PETIT LABEL ROUGE
    // -----------------------------------------------------
    if (timerElement && labelElement) {
        if (now < DEPART_AVION) {
            // PHASE 1 : AVANT LE DÉPART (Compte à rebours)
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            timerElement.innerHTML = `${days}j : ${hours.toString().padStart(2, '0')}h : ${minutes.toString().padStart(2, '0')}m : ${seconds.toString().padStart(2, '0')}s`;
            labelElement.innerHTML = "DESTINATION JAPON"; // Ton texte de base

        } else if (now >= DEPART_AVION && now <= FIN_VOYAGE) {
            // PHASE 2 : PENDANT LE VOYAGE
            timerElement.innerHTML = `<span style="font-size: 20px; color: var(--text-main); line-height: 1.4;">${messageChoisi}</span>`;
            
            // Le label se met à jour selon si on est dans l'avion ou sur place
            if (now < ARRIVEE_TOKYO) {
                labelElement.innerHTML = "DANS L'AVION ✈️";
            } else {
                // Ça affichera "JOUR 1", "JOUR 2", etc.
                labelElement.innerHTML = `JOUR ${dayOfVoyage} DU PÉRIPLE`; 
            }

        } else {
            // PHASE 3 : LE RETOUR
            timerElement.innerHTML = "MATANÉ ! 🌸";
            labelElement.innerHTML = "SOUVENIRS ÉTERNELS";
        }
    }

    // -----------------------------------------------------
    // B. GESTION DE LA CARTE "STATUT / PROCHAINE ÉTAPE"
    // -----------------------------------------------------
    if (statusElement) {
        if (now < DEPART_AVION) {
            statusElement.innerText = "En préparation...";
        } else if (now >= DEPART_AVION && now < ARRIVEE_TOKYO) {
            statusElement.innerText = "Dans l'avion ✈️";
        } else if (now > FIN_VOYAGE) {
            statusElement.innerText = "Voyage terminé ❤️";
        } else {
            // Le déroulé des étapes
            if (dayOfVoyage >= 1 && dayOfVoyage <= 5) {
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
                statusElement.innerText = "Profitez bien ! ✨";
            }
        }
    }
}

// Lancement immédiat puis boucle toutes les secondes
updateApp();
setInterval(updateApp, 1000);

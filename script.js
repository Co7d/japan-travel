document.addEventListener("DOMContentLoaded", () => {
    
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
    // Le message est choisi UNE SEULE FOIS au chargement de la page
    const messageChoisi = messagesFuns[Math.floor(Math.random() * messagesFuns.length)];

    // --- 3. CACHE DES ÉLÉMENTS DOM ---
    const timerElement = document.getElementById("timer");
    const labelElement = document.querySelector(".countdown-section .label");
    const statusElement = document.getElementById("next-step");

    // Variable de contrôle pour éviter de réécrire le message statique à chaque seconde
    let isPhase2Initialized = false;

    // --- 4. FONCTION PRINCIPALE DE MISE À JOUR ---
    function updateApp() {
        const now = new Date().getTime();

        // -----------------------------------------------------
        // A. GESTION DU TIMER & DU BADGE CENTRAL
        // -----------------------------------------------------
        if (!timerElement) return; // Garde-fou de sécurité

        if (now < DEPART_AVION) {
            // PHASE 1 : AVANT LE DÉPART (Format strict 000 : 00 : 00 : 00)
            const diff = DEPART_AVION - now;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            timerElement.textContent = `${days.toString().padStart(3, '0')} : ${hours.toString().padStart(2, '0')} : ${minutes.toString().padStart(2, '0')} : ${seconds.toString().padStart(2, '0')}`;
            
            if (labelElement && labelElement.textContent !== "AVANT L'AVENTURE") {
                labelElement.textContent = "AVANT L'AVENTURE";
            }

        } else if (now >= DEPART_AVION && now <= FIN_VOYAGE) {
            // PHASE 2 : PENDANT LE VOYAGE
            // On ne met à jour le texte du timer qu'une seule fois pour économiser le DOM
            if (!isPhase2Initialized) {
                timerElement.textContent = messageChoisi;
                isPhase2Initialized = true;
            }
            
            if (labelElement) {
                if (now < ARRIVEE_TOKYO) {
                    labelElement.textContent = "DANS L'AVION ✈️";
                } else {
                    // Calcul du jour réel (ex: 16 nov = Jour 1)
                    const dayOfVoyage = Math.floor((now - ARRIVEE_TOKYO) / (1000 * 60 * 60 * 24)) + 1;
                    if (labelElement.textContent !== `JOUR ${dayOfVoyage} DU PÉRIPLE`) {
                        labelElement.textContent = `JOUR ${dayOfVoyage} DU PÉRIPLE`;
                    }
                }
            }

        } else {
            // PHASE 3 : LE RETOUR
            if (timerElement.textContent !== "MATANÉ ! 🌸") {
                timerElement.textContent = "MATANÉ ! 🌸";
                if (labelElement) labelElement.textContent = "SOUVENIRS ÉTERNELS";
            }
        }

        // -----------------------------------------------------
        // B. GESTION DU TEXTE "STATUT DU VOYAGE"
        // -----------------------------------------------------
        if (statusElement) {
            let currentStatus = "";

            if (now < DEPART_AVION) {
                currentStatus = "Tokyo (Départ)";
            } else if (now >= DEPART_AVION && now < ARRIVEE_TOKYO) {
                currentStatus = "Dans l'avion ✈️";
            } else if (now > FIN_VOYAGE) {
                currentStatus = "Voyage terminé ❤️";
            } else {
                const dayOfVoyage = Math.floor((now - ARRIVEE_TOKYO) / (1000 * 60 * 60 * 24)) + 1;

                // Résolution propre des plages de jours pour éviter les chevauchements
                if (dayOfVoyage <= 5) {
                    currentStatus = "Actuellement : Tokyo (Aller) 🗼";
                } else if (dayOfVoyage <= 7) {
                    currentStatus = "Actuellement : Kawaguchiko 🗻";
                } else if (dayOfVoyage <= 8) {
                    currentStatus = "Actuellement : Vallée de Kiso 🌲";
                } else if (dayOfVoyage <= 13) {
                    currentStatus = "Actuellement : Kyoto ⛩️";
                } else if (dayOfVoyage <= 14) {
                    currentStatus = "Actuellement : Hiroshima 🕊️";
                } else if (dayOfVoyage <= 17) {
                    currentStatus = "Actuellement : Osaka 🐙";
                } else if (dayOfVoyage <= 20) {
                    currentStatus = "Actuellement : Tokyo (Retour) 🗼";
                } else {
                    currentStatus = "Profitez bien ! ✨";
                }
            }

            // Évite les recalculs graphiques si le texte n'a pas changé
            if (statusElement.textContent !== currentStatus) {
                statusElement.textContent = currentStatus;
            }
        }
    }

    // Lancement immédiat et configuration de l'intervalle
    updateApp();
    setInterval(updateApp, 1000);
});

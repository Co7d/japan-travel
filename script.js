document.addEventListener("DOMContentLoaded", () => {

    // ==========================================================================
    // 1. DONNÉES ET ÉTATS INITIAUX
    // ==========================================================================
    const DEFAULT_DATA = {
        tokyo: {
            name: "Tokyo", vibe: "Urbain / Shopping", dates: "16 Nov — 20 Nov • 4 nuits", color: "var(--city-tokyo)",
            hotels: [{ name: "Hôtel Shibuya", desc: "Proche gare", taxi: "東京都渋谷区宇田川町1-1" }],
            activities: [{ name: "Shibuya Sky", desc: "Vue panoramique 360°", map: "https://maps.google.com" }],
            food: [{ name: "Ichiran Ramen", desc: "Ramen Tonkotsu", map: "https://maps.google.com" }]
        },
        kawaguchiko: {
            name: "Kawaguchiko", vibe: "Nature & Mont Fuji", dates: "20 Nov — 22 Nov • 2 nuits", color: "var(--city-kawaguchiko)",
            hotels: [], activities: [], food: []
        },
        kiso: {
            name: "Vallée de Kiso", vibe: "Histoire & Rando", dates: "22 Nov — 23 Nov • 1 nuit", color: "var(--city-kiso)",
            hotels: [], activities: [], food: []
        },
        kyoto: {
            name: "Kyoto", vibe: "Tradition & Temples", dates: "23 Nov — 28 Nov • 5 nuits", color: "var(--city-kyoto)",
            hotels: [], activities: [], food: []
        },
        hiroshima: {
            name: "Hiroshima", vibe: "Histoire & Culture", dates: "28 Nov — 29 Nov • 1 nuit", color: "var(--city-hiroshima)",
            hotels: [], activities: [], food: []
        },
        osaka: {
            name: "Osaka", vibe: "Gastronomie & Street Food", dates: "29 Nov — 02 Déc • 3 nuits", color: "var(--city-osaka)",
            hotels: [], activities: [], food: []
        }
    };

    const LEXICON_DATA = [
        { cat: "Général", fr: "Bonjour", jp: "Konnichiwa" },
        { cat: "Général", fr: "Merci", jp: "Arigatō gozaimasu" },
        { cat: "Général", fr: "S'il vous plaît", jp: "Onegashimasu" },
        { cat: "Général", fr: "Excusez-moi / SVP", jp: "Sumimasen" },
        { cat: "Restaurant", fr: "L'addition SVP", jp: "O-kaikei onegashimasu" },
        { cat: "Restaurant", fr: "C'était délicieux", jp: "Gochisōsama deshita" },
        { cat: "Restaurant", fr: "De l'eau SVP", jp: "Mizu o onegashimasu" },
        { cat: "Orientation", fr: "Où sont les toilettes ?", jp: "Toire wa doko desu ka ?" },
        { cat: "Orientation", fr: "Où est la gare ?", jp: "Eki wa doko desu ka ?" }
    ];

    // Chargement LocalStorage ou Défaut
    let appData = JSON.parse(localStorage.getItem("japan_app_data")) || DEFAULT_DATA;
    let currentSelectedCity = "tokyo";

    // ==========================================================================
    // 2. TIMINGS PRÉCIS DES VOLS & PÉRIPLE (TIMEZONES)
    // ==========================================================================
    const DEPART_MARSEILLE = new Date("2026-11-15T08:00:00+01:00").getTime();
    const ARRIVEE_TOKYO = new Date("2026-11-16T08:55:00+09:00").getTime();
    const FIN_VOYAGE = new Date("2026-12-05T23:15:00+01:00").getTime();

    const FUN_MESSAGES = [
        "🍣 Adieu jambon-beurre, bonjour SUSHI !",
        "✈️ Attache ta ceinture, on décolle !",
        "⛩️ Objectif : Devenir un vrai Ninja.",
        "🍜 Alerte : Niveau de Ramen critique !",
        "🚅 Shinkansen activé. Destination : Futur.",
        "🍡 Un petit Dango pour la route ?"
    ];
    let funMsgIndex = 0;

    // ==========================================================================
    // 3. NAVEGATION PAR SWIPE & INDICATEUR À POINTS
    // ==========================================================================
    const swipeContainer = document.getElementById("swipe-container");
    const dots = document.querySelectorAll("#dots-container .dot");

    swipeContainer.addEventListener("scroll", () => {
        const pageIndex = Math.round(swipeContainer.scrollLeft / window.innerWidth);
        dots.forEach((dot, idx) => {
            dot.classList.toggle("active", idx === pageIndex);
        });
    });

    // ==========================================================================
    // 4. TIMING, TIMER & CHANGEMENT MESSAGE TOUTES LES 10S
    // ==========================================================================
    const timerElement = document.getElementById("timer");
    const labelElement = document.getElementById("countdown-label");
    const statusElement = document.getElementById("next-step");

    function updateTimer() {
        const now = new Date().getTime();

        if (now < DEPART_MARSEILLE) {
            // AVANT DEPART
            const diff = DEPART_MARSEILLE - now;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);

            timerElement.textContent = `${days.toString().padStart(3, '0')} : ${hours.toString().padStart(2, '0')} : ${mins.toString().padStart(2, '0')} : ${secs.toString().padStart(2, '0')}`;
            labelElement.textContent = "AVANT L'AVENTURE";
            statusElement.textContent = "Tokyo (Départ Marseille 08:00)";

        } else if (now >= DEPART_MARSEILLE && now < ARRIVEE_TOKYO) {
            // EN VOL
            timerElement.textContent = FUN_MESSAGES[funMsgIndex];
            labelElement.textContent = "EN VOL ✈️";
            statusElement.textContent = "Vol Marseille ➔ Munich ➔ Tokyo";

        } else if (now >= ARRIVEE_TOKYO && now <= FIN_VOYAGE) {
            // VOYAGE EN COURS (BONJOUR LE JAPON)
            const dayOfVoyage = Math.floor((now - ARRIVEE_TOKYO) / (1000 * 60 * 60 * 24)) + 1;
            timerElement.textContent = FUN_MESSAGES[funMsgIndex];
            labelElement.textContent = `JOUR ${dayOfVoyage} DU PÉRIPLE 🇯🇵`;
            statusElement.textContent = `Au Japon - Jour ${dayOfVoyage}`;

        } else {
            // RETOUR
            timerElement.textContent = "MATANÉ ! 🌸";
            labelElement.textContent = "SOUVENIRS ÉTERNELS";
            statusElement.textContent = "Voyage terminé ❤️";
        }
    }

    // Rotation messages funs toutes les 10 sec
    setInterval(() => {
        funMsgIndex = (funMsgIndex + 1) % FUN_MESSAGES.length;
    }, 10000);

    setInterval(updateTimer, 1000);
    updateTimer();

    // ==========================================================================
    // 5. CONVERTISSEUR DE DEVISES YEN ↔ EURO (LIVE + FALLBACK)
    // ==========================================================================
    let exchangeRate = 165.0; // Taux par défaut hors-ligne
    const jpyInput = document.getElementById("jpy-input");
    const eurInput = document.getElementById("eur-input");
    const rateInfoText = document.getElementById("rate-info-text");

    async function fetchExchangeRate() {
        try {
            const res = await fetch("https://open.er-api.com/v6/latest/JPY");
            const data = await res.json();
            if (data && data.rates && data.rates.EUR) {
                const jpyToEur = data.rates.EUR;
                exchangeRate = 1 / jpyToEur;
                rateInfoText.textContent = `Taux direct : 1 € = ${exchangeRate.toFixed(2)} ¥`;
            }
        } catch (e) {
            rateInfoText.textContent = `Taux fixe (Hors-ligne) : 1 € = ${exchangeRate.toFixed(2)} ¥`;
        }
    }
    fetchExchangeRate();

    jpyInput.addEventListener("input", () => {
        const val = parseFloat(jpyInput.value);
        eurInput.value = isNaN(val) ? "" : (val / exchangeRate).toFixed(2);
    });

    eurInput.addEventListener("input", () => {
        const val = parseFloat(eurInput.value);
        jpyInput.value = isNaN(val) ? "" : Math.round(val * exchangeRate);
    });

    // ==========================================================================
    // 6. AFFICHAGE DYNAMIQUE DES VILLES & LIEUX
    // ==========================================================================
    const pills = document.querySelectorAll(".pill");

    function renderCityDetails(cityKey) {
        currentSelectedCity = cityKey;
        const cityData = appData[cityKey];

        // Accent Couleur
        document.documentElement.style.setProperty("--active-color", cityData.color);

        document.getElementById("current-city-title").textContent = cityData.name;
        document.getElementById("current-city-vibe").textContent = cityData.vibe;
        document.getElementById("current-city-dates").textContent = cityData.dates;

        pills.forEach(p => p.classList.toggle("active", p.dataset.city === cityKey));

        // Rendu Hôtels, Activités, Food
        renderCategoryList("hotels-list", cityData.hotels, true);
        renderCategoryList("activities-list", cityData.activities, false);
        renderCategoryList("food-list", cityData.food, false);
    }

    function renderCategoryList(containerId, items, isHotel) {
        const container = document.getElementById(containerId);
        if (!items || items.length === 0) {
            container.innerHTML = `<div class="detail-row"><span class="place-desc">Aucun lieu enregistré. Cliquez sur + pour ajouter.</span></div>`;
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="detail-row">
                <div class="detail-left">
                    <span class="place-name">${item.name}</span>
                    ${item.desc ? `<span class="place-desc">${item.desc}</span>` : ''}
                    ${isHotel && item.taxi ? `<button class="btn-taxi-trigger" data-taxi="${item.taxi}">Adresse Taxi 🚕</button>` : ''}
                </div>
                ${item.map ? `<a href="${item.map}" target="_blank" class="chevron">📍</a>` : ''}
            </div>
        `).join("");
    }

    pills.forEach(pill => {
        pill.addEventListener("click", () => renderCityDetails(pill.dataset.city));
    });

    renderCityDetails("tokyo");

    // ==========================================================================
    // 7. TIMELINE DE L'ACCUEIL
    // ==========================================================================
    const timelineList = document.getElementById("timeline-list");
    timelineList.innerHTML = Object.keys(appData).map(key => {
        const city = appData[key];
        return `
            <div class="timeline-item" data-city="${key}">
                <div class="timeline-left">
                    <span class="timeline-icon">⛩️</span>
                    <div class="timeline-info">
                        <span class="city-title">${city.name}</span>
                        <span class="city-dates">${city.dates}</span>
                    </div>
                </div>
                <span class="vibe-badge">${city.vibe.split("/")[0]}</span>
            </div>
        `;
    }).join("");

    document.querySelectorAll(".timeline-item").forEach(item => {
        item.addEventListener("click", () => {
            renderCityDetails(item.dataset.city);
            // Swipe vers la page 2
            swipeContainer.scrollTo({ left: window.innerWidth, behavior: 'smooth' });
        });
    });

    // ==========================================================================
    // 8. MODAL AJOUT LIEU (+) & SAUVEGARDE / EXPORT JSON
    // ==========================================================================
    const addModal = document.getElementById("add-modal");
    const taxiModal = document.getElementById("taxi-modal");

    document.getElementById("open-add-modal").addEventListener("click", () => {
        document.getElementById("form-city").value = currentSelectedCity;
        addModal.classList.add("active");
    });

    document.getElementById("close-add-modal").addEventListener("click", () => addModal.classList.remove("active"));
    document.getElementById("close-taxi-modal").addEventListener("click", () => taxiModal.classList.remove("active"));

    // Affichage dynamique adresse taxi si sélection Hôtel
    document.getElementById("form-category").addEventListener("change", (e) => {
        document.getElementById("taxi-address-group").style.display = e.target.value === "hotels" ? "flex" : "none";
    });

    // Formulaire Submission
    document.getElementById("add-place-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const city = document.getElementById("form-city").value;
        const cat = document.getElementById("form-category").value;
        const title = document.getElementById("form-title").value;
        const desc = document.getElementById("form-desc").value;
        const map = document.getElementById("form-map").value;
        const taxi = document.getElementById("form-taxi").value;

        const newItem = { name: title, desc: desc };
        if (map) newItem.map = map;
        if (cat === "hotels" && taxi) newItem.taxi = taxi;

        appData[city][cat].push(newItem);
        localStorage.setItem("japan_app_data", JSON.stringify(appData));

        renderCityDetails(city);
        addModal.classList.remove("active");
        e.target.reset();
    });

    // Écouteur pour bouton Taxi
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("btn-taxi-trigger")) {
            const addr = e.target.dataset.taxi;
            document.getElementById("taxi-modal-address").textContent = addr;
            taxiModal.classList.add("active");
        }
    });

    // Export JSON
    document.getElementById("btn-export-json").addEventListener("click", () => {
        const jsonStr = JSON.stringify(appData, null, 2);
        navigator.clipboard.writeText(jsonStr).then(() => {
            alert("Données JSON copiées dans le presse-papier ! 📋");
        }).catch(() => {
            prompt("Copiez le texte ci-dessous :", jsonStr);
        });
    });

    // Import JSON
    document.getElementById("btn-import-json").addEventListener("click", () => {
        const inputStr = prompt("Collez vos données JSON ici :");
        if (inputStr) {
            try {
                const parsed = JSON.parse(inputStr);
                appData = parsed;
                localStorage.setItem("japan_app_data", JSON.stringify(appData));
                renderCityDetails(currentSelectedCity);
                alert("Données importées avec succès !");
            } catch (err) {
                alert("Erreur de format JSON.");
            }
        }
    });

    // ==========================================================================
    // 9. RECHERCHE LEXIQUE
    // ==========================================================================
    const lexiconContainer = document.getElementById("lexicon-container");
    const lexiconSearch = document.getElementById("lexicon-search");

    function renderLexicon(filter = "") {
        const filtered = LEXICON_DATA.filter(item =>
            item.fr.toLowerCase().includes(filter.toLowerCase()) ||
            item.jp.toLowerCase().includes(filter.toLowerCase())
        );

        lexiconContainer.innerHTML = filtered.map(item => `
            <div class="lexicon-item">
                <span class="lex-fr">${item.fr} (${item.cat})</span>
                <span class="lex-jp">${item.jp}</span>
            </div>
        `).join("");
    }

    lexiconSearch.addEventListener("input", (e) => renderLexicon(e.target.value));
    renderLexicon();
});
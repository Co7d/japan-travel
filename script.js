document.addEventListener("DOMContentLoaded", () => {

    document.addEventListener("touchstart", () => {}, { passive: true });

    function hapticFeedback() {
        if ("vibrate" in navigator) {
            try {
                navigator.vibrate(15);
            } catch (e) {}
        }
    }

    const DEFAULT_DATA = {
        tokyo: {
            name: "Tokyo", vibe: "URBAIN",
            color: "var(--c-tokyo1)", icon: "🗼",
            steps: [
                { label: "Partie 1", dates: "16 Nov ➔ 20 Nov", nights: "4 nuits" },
                { label: "Partie 2", dates: "02 Déc ➔ 05 Déc", nights: "3 nuits" }
            ],
            totalNights: "7 nuits au total",
            hotels: [{ name: "Hôtel Shibuya", desc: "Proche gare", taxi: "東京都渋谷区宇田川町1-1" }],
            activities: [{ name: "Shibuya Sky", desc: "Vue 360° au coucher du soleil", query: "Shibuya Sky Tokyo" }],
            food: [{ name: "Ichiran Ramen", desc: "Tonkotsu extra épicé", query: "Ichiran Ramen Shibuya Tokyo" }]
        },
        kawaguchiko: {
            name: "Kawaguchiko", vibe: "NATURE",
            color: "var(--c-kawaguchiko)", icon: "🗻",
            steps: [{ label: "Séjour", dates: "20 Nov ➔ 22 Nov", nights: "2 nuits" }],
            hotels: [], activities: [], food: []
        },
        kiso: {
            name: "Vallée de Kiso", vibe: "HISTOIRE",
            color: "var(--c-kiso)", icon: "🌲",
            steps: [{ label: "Séjour", dates: "22 Nov ➔ 23 Nov", nights: "1 nuit" }],
            hotels: [], activities: [], food: []
        },
        kyoto: {
            name: "Kyoto", vibe: "TRADITION",
            color: "var(--c-kyoto)", icon: "⛩️",
            steps: [{ label: "Séjour", dates: "23 Nov ➔ 28 Nov", nights: "5 nuits" }],
            hotels: [], activities: [], food: []
        },
        hiroshima: {
            name: "Hiroshima", vibe: "CULTURE",
            color: "var(--c-hiroshima)", icon: "🕊️",
            steps: [{ label: "Séjour", dates: "28 Nov ➔ 29 Nov", nights: "1 nuit" }],
            hotels: [], activities: [], food: []
        },
        osaka: {
            name: "Osaka", vibe: "FOOD",
            color: "var(--c-osaka)", icon: "🐙",
            steps: [{ label: "Séjour", dates: "29 Nov ➔ 02 Déc", nights: "3 nuits" }],
            hotels: [], activities: [], food: []
        }
    };

    const TIMELINE_NODES = [
        { cityKey: "tokyo", stepIdx: 0, icon: "🗼", interTransport: "🚆 Train Limited Express \"Fuji Excursion\"" },
        { cityKey: "kawaguchiko", stepIdx: 0, icon: "🗻", interTransport: "🚗 Voiture" },
        { cityKey: "kiso", stepIdx: 0, icon: "🌲", interTransport: "🚗 Voiture puis 🚅 Shinkansen" },
        { cityKey: "kyoto", stepIdx: 0, icon: "⛩️", interTransport: "🚅 Shinkansen" },
        { cityKey: "hiroshima", stepIdx: 0, icon: "🕊️", interTransport: "🚅 Shinkansen" },
        { cityKey: "osaka", stepIdx: 0, icon: "🐙", interTransport: "🚅 Shinkansen (Retour Tokyo)" },
        { cityKey: "tokyo", stepIdx: 1, icon: "🏮", interTransport: null }
    ];

    const LEXICON_DATA = [
        { cat: "🚨 Survie", fr: "Pardon / SVP / Merci (Le mot magique)", jp: "Sumimasen" },
        { cat: "🚨 Survie", fr: "Donnez-moi ceci SVP (en montrant)", jp: "Kore kudasai" },
        { cat: "🚨 Survie", fr: "Merci beaucoup (Polis/Commerçants)", jp: "Arigatō gozaimasu" },
        { cat: "🚨 Survie", fr: "Où sont les toilettes ?", jp: "Toire wa doko desu ka ?" },
        { cat: "🚨 Survie", fr: "Où est la gare ?", jp: "Eki wa doko desu ka ?" },
        { cat: "🚨 Survie", fr: "C'est OK / Non merci (Ça ira)", jp: "Daijōbu desu" },
        { cat: "🚨 Survie", fr: "Combien ça coûte ?", jp: "Kore wa ikura desu ka ?" },
        { cat: "🚨 Survie", fr: "Je ne comprends pas", jp: "Wakarimasen" },
        { cat: "🚨 Survie", fr: "Anglais OK ?", jp: "Eigo OK desu ka ?" },
        { cat: "🍜 Resto", fr: "L'addition s'il vous plaît", jp: "O-kaikei onegashimasu" },
        { cat: "🍜 Resto", fr: "C'était délicieux (Au chef en partant)", jp: "Gochisōsama deshita" },
        { cat: "🍜 Resto", fr: "Payer séparément", jp: "Betsu-betsu de" },
        { cat: "🚕 Taxi", fr: "Aller à [Lieu] s'il vous plaît", jp: "... made onegashimasu" }
    ];

    let appData = JSON.parse(localStorage.getItem("japan_app_data"));
    if (!appData || !appData.tokyo || !appData.tokyo.steps) {
        appData = DEFAULT_DATA;
        localStorage.setItem("japan_app_data", JSON.stringify(appData));
    }

    let currentSelectedCity = "tokyo";
    let pendingMapQuery = null;

    const DEPART_MARSEILLE = new Date("2026-11-15T08:00:00+01:00").getTime();
    const ARRIVEE_TOKYO = new Date("2026-11-16T08:55:00+09:00").getTime();
    const FIN_VOYAGE = new Date("2026-12-05T23:15:00+01:00").getTime();

    const FUN_MESSAGES = [
        "🍣 Adieu jambon-beurre, bonjour SUSHI !",
        "✈️ Attache ta ceinture, on décolle !",
        "⛩️ Objectif : Devenir un vrai Ninja.",
        "🍜 Alerte : Niveau de Ramen critique !",
        "🚅 Shinkansen activé. Destination : Futur."
    ];
    let funMsgIndex = 0;

    function updateTimer() {
        const now = new Date().getTime();
        const timerElement = document.getElementById("timer");
        const labelElement = document.getElementById("countdown-label");
        const statusElement = document.getElementById("next-step");

        if (now < DEPART_MARSEILLE) {
            const diff = DEPART_MARSEILLE - now;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);

            timerElement.textContent = `${days.toString().padStart(3, '0')} : ${hours.toString().padStart(2, '0')} : ${mins.toString().padStart(2, '0')} : ${secs.toString().padStart(2, '0')}`;
            labelElement.textContent = "AVANT L'AVENTURE";
            statusElement.textContent = "Tokyo (Départ Marseille 08:00)";
        } else if (now >= DEPART_MARSEILLE && now < ARRIVEE_TOKYO) {
            timerElement.textContent = FUN_MESSAGES[funMsgIndex];
            labelElement.textContent = "EN VOL ✈️";
            statusElement.textContent = "Vol Marseille ➔ Munich ➔ Tokyo";
        } else if (now >= ARRIVEE_TOKYO && now <= FIN_VOYAGE) {
            const dayOfVoyage = Math.floor((now - ARRIVEE_TOKYO) / (1000 * 60 * 60 * 24)) + 1;
            timerElement.textContent = FUN_MESSAGES[funMsgIndex];
            labelElement.textContent = `JOUR ${dayOfVoyage} DU PÉRIPLE 🇯🇵`;
            statusElement.textContent = `Au Japon - Jour ${dayOfVoyage}`;
        } else {
            timerElement.textContent = "MATANÉ ! 🌸";
            labelElement.textContent = "SOUVENIRS ÉTERNELS";
            statusElement.textContent = "Voyage terminé ❤️";
        }
    }

    setInterval(() => { funMsgIndex = (funMsgIndex + 1) % FUN_MESSAGES.length; }, 10000);
    setInterval(updateTimer, 1000);
    updateTimer();

    const swipeContainer = document.getElementById("swipe-container");
    const dots = document.querySelectorAll("#dots-container .dot");

    swipeContainer.addEventListener("scroll", () => {
        const pageIndex = Math.round(swipeContainer.scrollLeft / window.innerWidth);
        dots.forEach((dot, idx) => dot.classList.toggle("active", idx === pageIndex));
    });

    function generateTicketHTML(steps, totalNights = null, accentColor = "var(--active-color)") {
        return `
            <div class="ticket-date-box" style="--accent-color: ${accentColor}">
                ${steps.map(step => `
                    <div class="ticket-step">
                        <span class="ticket-dates">📅 ${step.dates}</span>
                        <span class="ticket-nights">🌙 ${step.nights}</span>
                    </div>
                `).join("")}
                ${totalNights ? `<div class="ticket-total">🏆 ${totalNights}</div>` : ''}
            </div>
        `;
    }

    function renderTimeline() {
        const timelineList = document.getElementById("timeline-list");
        timelineList.innerHTML = TIMELINE_NODES.map(node => {
            const city = appData[node.cityKey];
            const currentStep = city.steps[node.stepIdx];
            return `
                <div class="thread-node" style="--node-color: ${city.color}">
                    <div class="node-bullet">${node.icon}</div>
                    <div class="thread-card" data-city="${node.cityKey}">
                        <div class="thread-header">
                            <span class="thread-title">${city.name}</span>
                            <span class="vibe-badge">${city.vibe}</span>
                        </div>
                        ${generateTicketHTML([currentStep], null, city.color)}
                    </div>
                    ${node.interTransport ? `
                        <div class="inter-transport">
                            <span>${node.interTransport}</span>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join("");

        document.querySelectorAll(".thread-card").forEach(card => {
            card.addEventListener("click", () => {
                hapticFeedback();
                renderCityDetails(card.dataset.city);
                swipeContainer.scrollTo({ left: window.innerWidth, behavior: 'smooth' });
            });
        });
    }

    const pills = document.querySelectorAll(".pill");

    function renderCityDetails(cityKey) {
        currentSelectedCity = cityKey;
        const cityData = appData[cityKey];

        document.documentElement.style.setProperty("--active-color", cityData.color);

        document.getElementById("current-city-title").textContent = cityData.name;
        document.getElementById("current-city-vibe").textContent = cityData.vibe;
        
        document.getElementById("current-city-dates-container").innerHTML = generateTicketHTML(cityData.steps, cityData.totalNights, cityData.color);

        pills.forEach(p => p.classList.toggle("active", p.dataset.city === cityKey));

        renderCategoryStack("hotels-list", cityData.hotels, "Hôtel", true);
        renderCategoryStack("activities-list", cityData.activities, "Visite", false);
        renderCategoryStack("food-list", cityData.food, "Resto", false);
    }

    function renderCategoryStack(containerId, items, defaultCategoryTag, isHotel) {
        const container = document.getElementById(containerId);
        if (!items || items.length === 0) {
            container.innerHTML = `<div class="place-card"><div class="place-info"><span class="place-desc">Aucun lieu enregistré. Cliquez sur + pour ajouter.</span></div></div>`;
            return;
        }

        container.innerHTML = items.map((item) => `
            <div class="place-card">
                <div class="place-info">
                    <div class="place-header-line">
                        <span class="place-title">${item.name}</span>
                        <span class="category-tag">${defaultCategoryTag}</span>
                    </div>
                    ${item.desc ? `<span class="place-desc">${item.desc}</span>` : ''}
                </div>
                ${isHotel ? `
                    <div class="action-zone-dual">
                        <button class="dual-btn dual-btn-maps trigger-gps" data-query="${item.query || item.name}">
                            <span class="action-icon">🗺️</span>
                        </button>
                        ${item.taxi ? `
                            <button class="dual-btn dual-btn-taxi trigger-taxi" data-taxi="${item.taxi}">
                                <span class="action-icon">🚕</span>
                            </button>
                        ` : ''}
                    </div>
                ` : `
                    <div class="action-zone-single trigger-gps" data-query="${item.query || item.name}">
                        <span class="action-icon">🗺️</span>
                        <span class="action-label">MAPS</span>
                    </div>
                `}
            </div>
        `).join("");
    }

    pills.forEach(pill => {
        pill.addEventListener("click", () => {
            hapticFeedback();
            renderCityDetails(pill.dataset.city);
        });
    });

    const mapsModal = document.getElementById("maps-modal");
    const mapsSelect = document.getElementById("maps-preference-select");

    let mapsPreference = localStorage.getItem("japan_maps_pref") || "ask";
    mapsSelect.value = mapsPreference;

    mapsSelect.addEventListener("change", (e) => {
        mapsPreference = e.target.value;
        localStorage.setItem("japan_maps_pref", mapsPreference);
    });

    document.addEventListener("click", (e) => {
        const gpsBtn = e.target.closest(".trigger-gps");
        if (gpsBtn) {
            hapticFeedback();
            pendingMapQuery = gpsBtn.dataset.query;
            if (mapsPreference === "apple") {
                openAppleMaps(pendingMapQuery);
            } else if (mapsPreference === "google") {
                openGoogleMaps(pendingMapQuery);
            } else {
                mapsModal.classList.add("active");
            }
        }

        const taxiBtn = e.target.closest(".trigger-taxi");
        if (taxiBtn) {
            hapticFeedback();
            document.getElementById("taxi-modal-address").textContent = taxiBtn.dataset.taxi;
            document.getElementById("taxi-modal").classList.add("active");
        }
    });

    function openAppleMaps(q) {
        window.open(`https://maps.apple.com/?q=${encodeURIComponent(q)}`, '_blank');
    }

    function openGoogleMaps(q) {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`, '_blank');
    }

    document.getElementById("btn-open-apple").addEventListener("click", () => {
        if (document.getElementById("remember-maps-choice").checked) {
            mapsPreference = "apple";
            localStorage.setItem("japan_maps_pref", "apple");
            mapsSelect.value = "apple";
        }
        openAppleMaps(pendingMapQuery);
        mapsModal.classList.remove("active");
    });

    document.getElementById("btn-open-google").addEventListener("click", () => {
        if (document.getElementById("remember-maps-choice").checked) {
            mapsPreference = "google";
            localStorage.setItem("japan_maps_pref", "google");
            mapsSelect.value = "google";
        }
        openGoogleMaps(pendingMapQuery);
        mapsModal.classList.remove("active");
    });

    document.getElementById("close-maps-modal").addEventListener("click", () => mapsModal.classList.remove("active"));
    document.getElementById("close-taxi-modal").addEventListener("click", () => document.getElementById("taxi-modal").classList.remove("active"));

    let exchangeRate = 165.0;
    const jpyInput = document.getElementById("jpy-input");
    const eurInput = document.getElementById("eur-input");

    async function fetchExchangeRate() {
        try {
            const res = await fetch("https://open.er-api.com/v6/latest/JPY");
            const data = await res.json();
            if (data && data.rates && data.rates.EUR) {
                exchangeRate = 1 / data.rates.EUR;
                document.getElementById("rate-info-text").textContent = `Taux direct : 1 € = ${exchangeRate.toFixed(2)} ¥`;
            }
        } catch (e) {
            document.getElementById("rate-info-text").textContent = `Taux fixe (Hors-ligne) : 1 € = ${exchangeRate.toFixed(2)} ¥`;
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

    const addModal = document.getElementById("add-modal");

    document.getElementById("open-add-modal").addEventListener("click", () => {
        hapticFeedback();
        document.getElementById("form-city").value = currentSelectedCity;
        addModal.classList.add("active");
    });

    document.getElementById("close-add-modal").addEventListener("click", () => addModal.classList.remove("active"));

    document.getElementById("form-category").addEventListener("change", (e) => {
        document.getElementById("taxi-address-group").style.display = e.target.value === "hotels" ? "flex" : "none";
    });

    document.getElementById("add-place-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const city = document.getElementById("form-city").value;
        const cat = document.getElementById("form-category").value;
        const title = document.getElementById("form-title").value;
        const desc = document.getElementById("form-desc").value;
        const map = document.getElementById("form-map").value;
        const taxi = document.getElementById("form-taxi").value;

        const newItem = { name: title, desc: desc, query: map || title };
        if (cat === "hotels" && taxi) newItem.taxi = taxi;

        appData[city][cat].push(newItem);
        localStorage.setItem("japan_app_data", JSON.stringify(appData));

        renderCityDetails(city);
        addModal.classList.remove("active");
        e.target.reset();
    });

    document.getElementById("btn-export-json").addEventListener("click", () => {
        const jsonStr = JSON.stringify(appData, null, 2);
        navigator.clipboard.writeText(jsonStr).then(() => {
            alert("Données JSON copiées dans le presse-papier ! 📋");
        }).catch(() => {
            prompt("Copiez le texte ci-dessous :", jsonStr);
        });
    });

    document.getElementById("btn-import-json").addEventListener("click", () => {
        const inputStr = prompt("Collez vos données JSON ici :");
        if (inputStr) {
            try {
                appData = JSON.parse(inputStr);
                localStorage.setItem("japan_app_data", JSON.stringify(appData));
                renderTimeline();
                renderCityDetails(currentSelectedCity);
                alert("Données importées avec succès !");
            } catch (err) {
                alert("Erreur de format JSON.");
            }
        }
    });

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

    renderTimeline();
    renderCityDetails("tokyo");
    renderLexicon();
});

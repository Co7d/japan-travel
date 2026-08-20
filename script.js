document.addEventListener("DOMContentLoaded", async () => {
    let appData = null;
    let currentCityKey = "tokyo";
    let exchangeRate = 165.0;

    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./sw.js").catch(err => console.error(err));
    }

    try {
        const response = await fetch("./data.json");
        appData = await response.json();
        exchangeRate = appData.defaultExchangeRate || 165.0;
    } catch (e) {
        console.error("Erreur de chargement des données JSON", e);
        return;
    }

    const swipeContainer = document.getElementById("swipe-container");
    const dots = document.querySelectorAll("#dots-container .dot");
    const pages = Array.from(document.querySelectorAll(".tab-page"));

    function navigateToTab(index) {
        if (pages[index]) {
            pages[index].scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
        }
    }

    function initDefaultTab() {
        navigateToTab(2);
    }

    swipeContainer.addEventListener("scroll", () => {
        const pageIndex = Math.round(swipeContainer.scrollLeft / window.innerWidth);
        dots.forEach((dot, idx) => {
            dot.classList.toggle("active", idx === pageIndex);
        });
    });

    dots.forEach((dot) => {
        dot.addEventListener("click", () => {
            const idx = parseInt(dot.dataset.index, 10);
            navigateToTab(idx);
        });
    });

    function escapeHtml(str) {
        if (!str) return "";
        return str.replace(/[&<>"']/g, m => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[m]));
    }

    function getTokyoDateString() {
        const options = { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" };
        const formatter = new Intl.DateTimeFormat("en-CA", options);
        return formatter.format(new Date());
    }

    function renderTodaySchedule() {
        const todayStr = getTokyoDateString();
        const container = document.getElementById("today-schedule-container");
        const titleEl = document.getElementById("today-title");
        const subTitleEl = document.getElementById("today-subtitle");

        const daySchedule = (appData.schedule || []).find(s => s.date === todayStr);

        if (!daySchedule) {
            titleEl.textContent = "Aucune activité prévue";
            subTitleEl.textContent = "Profitez de votre journée libre !";
            container.innerHTML = `<div class="card"><p class="place-desc">Aucun événement programmé à la date du jour.</p></div>`;
            return;
        }

        titleEl.textContent = daySchedule.title;
        subTitleEl.textContent = appData.cities[daySchedule.cityKey]?.name || "";

        container.innerHTML = `
            <div class="card details-card">
                ${daySchedule.items.map(item => `
                    <div class="detail-row">
                        <div class="detail-left">
                            <span class="place-name">${escapeHtml(item.label)}</span>
                            <span class="place-desc">${escapeHtml(item.time)}</span>
                        </div>
                    </div>
                `).join("")}
            </div>
        `;
    }

    function renderTimeline() {
        const container = document.getElementById("timeline-list");
        container.innerHTML = Object.keys(appData.cities).map(key => {
            const city = appData.cities[key];
            return `
                <div class="timeline-item" data-city="${key}">
                    <div class="timeline-left">
                        <span class="timeline-icon">${escapeHtml(city.icon)}</span>
                        <div class="timeline-info">
                            <span class="city-title">${escapeHtml(city.name)}</span>
                            <span class="city-dates">${escapeHtml(city.dates)}</span>
                        </div>
                    </div>
                    <span class="vibe-badge">${escapeHtml(city.vibe.split("/")[0])}</span>
                </div>
            `;
        }).join("");

        container.querySelectorAll(".timeline-item").forEach(item => {
            item.addEventListener("click", () => {
                renderCityDetails(item.dataset.city);
                navigateToTab(3);
            });
        });
    }

    function renderCityPills() {
        const container = document.getElementById("city-pills");
        container.innerHTML = Object.keys(appData.cities).map(key => {
            const city = appData.cities[key];
            return `<button class="pill ${key === currentCityKey ? 'active' : ''}" data-city="${key}">${escapeHtml(city.name)}</button>`;
        }).join("");

        container.querySelectorAll(".pill").forEach(pill => {
            pill.addEventListener("click", () => renderCityDetails(pill.dataset.city));
        });
    }

    function renderCityDetails(cityKey) {
        currentCityKey = cityKey;
        const city = appData.cities[cityKey];
        if (!city) return;

        document.body.setAttribute("data-theme", city.theme || "tokyo");

        document.getElementById("current-city-title").textContent = city.name;
        document.getElementById("current-city-vibe").textContent = city.vibe;
        document.getElementById("current-city-dates").textContent = city.dates;

        document.querySelectorAll("#city-pills .pill").forEach(p => {
            p.classList.toggle("active", p.dataset.city === cityKey);
        });

        renderCategoryList("hotels-list", city.hotels, true);
        renderCategoryList("activities-list", city.activities, false);
        renderCategoryList("food-list", city.food, false);
    }

    function renderCategoryList(containerId, items, isHotel) {
        const container = document.getElementById(containerId);
        if (!items || items.length === 0) {
            container.innerHTML = `<div class="detail-row"><span class="place-desc">Aucun lieu enregistré.</span></div>`;
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="detail-row">
                <div class="detail-left">
                    <span class="place-name">${escapeHtml(item.name)}</span>
                    ${item.desc ? `<span class="place-desc">${escapeHtml(item.desc)}</span>` : ""}
                    ${isHotel && item.taxi ? `<button class="btn-taxi-trigger" data-taxi="${escapeHtml(item.taxi)}">Adresse Taxi 🚕</button>` : ""}
                </div>
                ${item.map ? `<a href="${escapeHtml(item.map)}" target="_blank" rel="noopener" class="chevron">📍</a>` : ""}
            </div>
        `).join("");
    }

    const jpyInput = document.getElementById("jpy-input");
    const eurInput = document.getElementById("eur-input");
    const rateInfoText = document.getElementById("rate-info-text");

    async function setupExchangeRate() {
        let cached = localStorage.getItem("japan_rate_cache");
        let rateDate = null;

        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                exchangeRate = parsed.rate;
                rateDate = new Date(parsed.timestamp);
            } catch (e) {
                console.error("Erreur lecture cache taux", e);
            }
        }

        if (navigator.onLine) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                const res = await fetch("https://open.er-api.com/v6/latest/EUR", { signal: controller.signal });
                clearTimeout(timeoutId);

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.rates && data.rates.JPY) {
                        exchangeRate = data.rates.JPY;
                        rateDate = new Date();
                        localStorage.setItem("japan_rate_cache", JSON.stringify({
                            rate: exchangeRate,
                            timestamp: rateDate.toISOString()
                        }));
                    }
                }
            } catch (e) {
            }
        }

        if (rateDate) {
            const dateStr = rateDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
            const timeStr = rateDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
            rateInfoText.textContent = `Taux direct (${dateStr} à ${timeStr}) : 1 € = ${exchangeRate.toFixed(2)} ¥`;
        } else {
            rateInfoText.textContent = `Taux par défaut : 1 € = ${exchangeRate.toFixed(2)} ¥`;
        }
    }

    jpyInput.addEventListener("input", () => {
        const val = parseFloat(jpyInput.value);
        eurInput.value = isNaN(val) ? "" : (val / exchangeRate).toFixed(2);
    });

    eurInput.addEventListener("input", () => {
        const val = parseFloat(eurInput.value);
        jpyInput.value = isNaN(val) ? "" : Math.round(val * exchangeRate);
    });

    const lexiconContainer = document.getElementById("lexicon-container");
    const lexiconSearch = document.getElementById("lexicon-search");

    function renderLexicon(filter = "") {
        const filtered = (appData.lexicon || []).filter(item =>
            item.fr.toLowerCase().includes(filter.toLowerCase()) ||
            item.jp.toLowerCase().includes(filter.toLowerCase())
        );

        lexiconContainer.innerHTML = filtered.map(item => `
            <div class="lexicon-item">
                <span class="lex-fr">${escapeHtml(item.fr)} (${escapeHtml(item.cat)})</span>
                <span class="lex-jp">${escapeHtml(item.jp)}</span>
            </div>
        `).join("");
    }

    lexiconSearch.addEventListener("input", (e) => renderLexicon(e.target.value));

    const taxiModal = document.getElementById("taxi-modal");

    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("btn-taxi-trigger")) {
            document.getElementById("taxi-modal-address").textContent = e.target.dataset.taxi;
            taxiModal.classList.add("active");
        }
    });

    taxiModal.addEventListener("click", (e) => {
        if (e.target === taxiModal || e.target.id === "close-taxi-modal") {
            taxiModal.classList.remove("active");
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && taxiModal.classList.contains("active")) {
            taxiModal.classList.remove("active");
        }
    });

    renderCityPills();
    renderTodaySchedule();
    renderTimeline();
    renderCityDetails("tokyo");
    renderLexicon();
    await setupExchangeRate();
    initDefaultTab();
});

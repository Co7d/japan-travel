document.addEventListener("DOMContentLoaded", async () => {
    let appData = null;
    let currentCityKey = "tokyo";
    const EXCHANGE_RATE = 165.0;

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(err => console.error(err));
    }

    try {
        const response = await fetch("./data.json");
        appData = await response.json();
    } catch (e) {
        console.error("Erreur de chargement des données JSON", e);
        return;
    }

    const swipeContainer = document.getElementById("swipe-container");
    const dots = document.querySelectorAll("#dots-container .dot");

    function initDefaultTab() {
        swipeContainer.scrollLeft = window.innerWidth * 2;
    }
    initDefaultTab();

    swipeContainer.addEventListener("scroll", () => {
        const pageIndex = Math.round(swipeContainer.scrollLeft / window.innerWidth);
        dots.forEach((dot, idx) => {
            dot.classList.toggle("active", idx === pageIndex);
        });
    });

    function escapeHtml(str) {
        if (!str) return "";
        return str.replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m]));
    }

    function renderTodaySchedule() {
        const todayStr = new Date().toISOString().split('T')[0];
        const container = document.getElementById("today-schedule-container");
        const titleEl = document.getElementById("today-title");
        const subTitleEl = document.getElementById("today-subtitle");

        const daySchedule = appData.schedule.find(s => s.date === todayStr);

        if (!daySchedule) {
            titleEl.textContent = "Aucune activité prévus";
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

    // Section ciblée : Remplacement dans renderTimeline()
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
            swipeContainer.scrollTo({ left: window.innerWidth * 3, behavior: 'smooth' });
        });
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
                    ${item.desc ? `<span class="place-desc">${escapeHtml(item.desc)}</span>` : ''}
                    ${isHotel && item.taxi ? `<button class="btn-taxi-trigger" data-taxi="${escapeHtml(item.taxi)}">Adresse Taxi 🚕</button>` : ''}
                </div>
                ${item.map ? `<a href="${escapeHtml(item.map)}" target="_blank" class="chevron">📍</a>` : ''}
            </div>
        `).join("");
    }

    document.querySelectorAll("#city-pills .pill").forEach(pill => {
        pill.addEventListener("click", () => renderCityDetails(pill.dataset.city));
    });

    const jpyInput = document.getElementById("jpy-input");
    const eurInput = document.getElementById("eur-input");

    jpyInput.addEventListener("input", () => {
        const val = parseFloat(jpyInput.value);
        eurInput.value = isNaN(val) ? "" : (val / EXCHANGE_RATE).toFixed(2);
    });

    eurInput.addEventListener("input", () => {
        const val = parseFloat(eurInput.value);
        jpyInput.value = isNaN(val) ? "" : Math.round(val * EXCHANGE_RATE);
    });

    const lexiconContainer = document.getElementById("lexicon-container");
    const lexiconSearch = document.getElementById("lexicon-search");

    function renderLexicon(filter = "") {
        const filtered = appData.lexicon.filter(item =>
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

    document.getElementById("close-taxi-modal").addEventListener("click", () => {
        taxiModal.classList.remove("active");
    });

    renderTodaySchedule();
    renderTimeline();
    renderCityDetails("tokyo");
    renderLexicon();
});

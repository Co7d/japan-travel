document.addEventListener("DOMContentLoaded", async () => {
  const body = document.body;
  let data = null;
  try { data = await fetch("./data.json", {cache:"no-store"}).then(r=>r.json()); } catch {}

  const restorePlanningTheme = () => {
    if (!data) return;
    const active = document.querySelector(".day-choice.active");
    const day = data.schedule?.find(d => d.date === active?.dataset.date) || data.schedule?.[0];
    if (day?.cityKey) body.dataset.theme = day.cityKey;
  };

  document.querySelectorAll(".nav-item").forEach(item => item.addEventListener("click", () => {
    if (item.dataset.page !== "cities") setTimeout(restorePlanningTheme, 0);
  }, true));

  window.addEventListener("popstate", () => setTimeout(() => {
    const detail = document.getElementById("city-detail-view");
    if (detail?.classList.contains("hidden")) restorePlanningTheme();
  }, 0));

  const colorItineraryCities = () => {
    document.querySelectorAll(".journey-stop").forEach(stop => {
      const city = stop.dataset.city;
      if (city) stop.style.setProperty("--stop-color", `var(--${city})`);
    });
  };

  const enhanceCitySections = () => {
    const root = document.getElementById("city-categories");
    if (!root) return;
    root.querySelectorAll(".city-block:not([data-enhanced])").forEach(block => {
      const kicker = block.querySelector(":scope > .section-kicker");
      if (!kicker) return;
      block.dataset.enhanced = "1";
      const label = kicker.textContent.trim();
      const content = document.createElement("div");
      content.className = "city-section-content";
      [...block.children].forEach(child => { if (child !== kicker) content.appendChild(child); });
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "section-toggle";
      toggle.setAttribute("aria-expanded", "true");
      toggle.innerHTML = `<span>${label}</span><span class="section-toggle-mark">›</span>`;
      kicker.replaceWith(toggle);
      block.appendChild(content);
      toggle.addEventListener("click", () => {
        const collapsed = block.classList.toggle("collapsed");
        toggle.setAttribute("aria-expanded", String(!collapsed));
      });
    });
  };

  const enhanceTransportIcons = () => {
    document.querySelectorAll(".schedule-connector").forEach(row => {
      const mode = row.querySelector(".connector-mode")?.textContent.toLowerCase() || "";
      const icon = row.querySelector(".connector-symbol");
      if (!icon) return;
      icon.textContent = mode.includes("train") || mode.includes("shinkansen") ? "↠" : mode.includes("voiture") || mode.includes("car") ? "⌁" : mode.includes("bus") ? "⇢" : "→";
      icon.setAttribute("aria-hidden", "true");
    });
  };

  const observer = new MutationObserver(() => {
    colorItineraryCities();
    enhanceCitySections();
    enhanceTransportIcons();
  });
  observer.observe(document.body, {subtree:true, childList:true});
  colorItineraryCities();
  enhanceCitySections();
  enhanceTransportIcons();

  document.getElementById("day-strip")?.addEventListener("click", () => setTimeout(restorePlanningTheme, 0));
});

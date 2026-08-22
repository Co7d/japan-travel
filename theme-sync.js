(() => {
  let data = null;
  fetch("./data.json", {cache:"no-store"}).then(r=>r.json()).then(d=>data=d).catch(()=>{});
  const sync = async () => {
    if (!data) { try { data = await fetch("./data.json", {cache:"no-store"}).then(r=>r.json()); } catch { return; } }
    const cityView = document.getElementById("city-detail-view");
    const citiesPage = document.getElementById("page-cities");
    if (cityView && !cityView.classList.contains("hidden")) return;
    const pages=[...document.querySelectorAll(".top-page")];
    const current=pages.reduce((best,p)=>Math.abs(p.getBoundingClientRect().left)<Math.abs(best.getBoundingClientRect().left)?p:best,pages[0]);
    if(current?.dataset.page === "cities") return;
    const active=document.querySelector(".day-choice.active");
    const day=data.schedule.find(d=>d.date===active?.dataset.date) || data.schedule[0];
    if(day) document.body.dataset.theme=data.cities[day.cityKey]?.theme || "tokyo";
  };
  document.getElementById("app-shell")?.addEventListener("scrollend", sync, {passive:true});
  document.querySelectorAll(".nav-item").forEach(n=>n.addEventListener("click",()=>setTimeout(sync,450)));
})();


// CONFIGURATION DU VOYAGE
const DEPART_DATE = new Date("2026-10-15T09:00:00").getTime(); // Change ta date ici

function updateCountdown() {
    const now = new Date().getTime();
    const diff = DEPART_DATE - now;

    if (diff <= 0) {
        document.getElementById("timer").innerHTML = "C'EST LE DÉPART !";
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById("timer").innerHTML = 
        `${days}j : ${hours.toString().padStart(2, '0')}h : ${minutes.toString().padStart(2, '0')}m : ${seconds.toString().padStart(2, '0')}s`;
}

// Lancer le timer si on est sur l'index
if (document.getElementById("timer")) {
    setInterval(updateCountdown, 1000);
    updateCountdown();
}

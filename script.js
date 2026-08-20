let globalData = { lieux: [], planning: [] };

document.addEventListener("DOMContentLoaded", () => {
    chargerDonnees();
});

// Chargement du fichier data.json
async function chargerDonnees() {
    try {
        const response = await fetch('data.json');
        globalData = await response.json();
        
        initialiserNavigation();
        afficherPlanning();
    } catch (erreur) {
        console.error("Erreur lors du chargement des données :", erreur);
        document.getElementById('app-content').innerHTML = `<div class="loading">Erreur de chargement des données.</div>`;
    }
}

// Génération automatique des onglets de villes dans le menu
function initialiserNavigation() {
    const nav = document.getElementById('main-nav');
    
    // Extrait la liste des villes uniques depuis les lieux
    const villes = [...new Set(globalData.lieux.map(lieu => lieu.ville))];

    villes.forEach(ville => {
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        btn.innerText = ville;
        btn.onclick = (e) => {
            definirOngletActif(e.target);
            afficherVille(ville);
        };
        nav.appendChild(btn);
    });
}

function definirOngletActif(boutonCible) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    boutonCible.classList.add('active');
}

// Génère le lien GPS (Apple Maps sur iPhone, Google Maps sinon)
function creerLienMaps(lat, lng, nom) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
        return `https://maps.apple.com/?q=${encodeURIComponent(nom)}&ll=${lat},${lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

// Vue PLANNING
function afficherPlanning() {
    const conteneur = document.getElementById('app-content');
    let html = '';

    globalData.planning.forEach(item => {
        html += `
            <div class="card">
                <h2 class="card-title">${item.jour} : ${item.titre} (${item.ville})</h2>
        `;

        item.lieuxIds.forEach(id => {
            const lieu = globalData.lieux.find(l => l.id === id);
            if (lieu) {
                const urlMaps = creerLienMaps(lieu.lat, lieu.lng, lieu.nom);
                html += `
                    <div class="lieu-item">
                        <div class="lieu-info">
                            <span class="lieu-nom">${lieu.nom}</span>
                            <span class="lieu-adresse">${lieu.adresse || lieu.categorie}</span>
                        </div>
                        <a href="${urlMaps}" target="_blank" class="btn-map">Maps</a>
                    </div>
                `;
            }
        });

        html += `</div>`;
    });

    conteneur.innerHTML = html;
}

// Vue VILLE
function afficherVille(nomVille) {
    const conteneur = document.getElementById('app-content');
    
    // Filtre les lieux de la ville
    const lieuxVille = globalData.lieux.filter(l => l.ville === nomVille);
    
    // Regroupe par catégorie
    const categories = [...new Set(lieuxVille.map(l => l.categorie))];

    let html = `<h2 style="margin-top:0;">📍 ${nomVille}</h2>`;

    categories.forEach(cat => {
        html += `
            <div class="card">
                <div class="category-title">${cat}</div>
        `;

        const lieuxCat = lieuxVille.filter(l => l.categorie === cat);
        lieuxCat.forEach(lieu => {
            const urlMaps = creerLienMaps(lieu.lat, lieu.lng, lieu.nom);
            html += `
                <div class="lieu-item">
                    <div class="lieu-info">
                        <span class="lieu-nom">${lieu.nom}</span>
                        <span class="lieu-adresse">${lieu.adresse || ''}</span>
                    </div>
                    <a href="${urlMaps}" target="_blank" class="btn-map">Maps</a>
                </div>
            `;
        });

        html += `</div>`;
    });

    conteneur.innerHTML = html;
}

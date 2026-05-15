import React, { useState, useEffect } from 'react';

// --- FENÊTRE D'AJOUT (MODAL) ---
const AddLocationModal = ({ isOpen, onClose, onAdd, type }) => {
  const [name, setName] = useState('');
  const [link, setLink] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <h3 className="text-2xl font-bold mb-6 text-zinc-900">Ajouter {type === 'Hébergement' ? 'un hôtel' : 'un resto'}</h3>
        <div className="space-y-4">
          <input
            autoFocus
            className="w-full bg-zinc-100 border-none rounded-2xl p-4 focus:ring-2 focus:ring-black outline-none"
            placeholder="Nom du lieu"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full bg-zinc-100 border-none rounded-2xl p-4 focus:ring-2 focus:ring-black outline-none"
            placeholder="Adresse ou lien Google Maps"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </div>
        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-4 font-semibold text-zinc-500">Annuler</button>
          <button 
            onClick={() => { if(name) { onAdd(name, link); setName(''); setLink(''); onClose(); } }}
            className="flex-1 bg-black text-white rounded-2xl py-4 font-bold shadow-lg"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default function JapanExpressTravelCompanion() {
  // SAUVEGARDE AUTOMATIQUE SUR L'IPHONE
  const [userData, setUserData] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('japan_2026_v3');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const [modalConfig, setModalConfig] = useState({ open: false, cityId: null, type: null });

  useEffect(() => {
    localStorage.setItem('japan_2026_v3', JSON.stringify(userData));
  }, [userData]);

  const addEntry = (cityId, category, name, link) => {
    const cityData = userData[cityId] || {};
    const categoryData = cityData[category] || [];
    setUserData({
      ...userData,
      [cityId]: {
        ...cityData,
        [category]: [...categoryData, { name, link, id: Date.now() }]
      }
    });
  };

  const deleteEntry = (cityId, category, id) => {
    const updated = userData[cityId][category].filter(item => item.id !== id);
    setUserData({
      ...userData,
      [cityId]: { ...userData[cityId], [category]: updated }
    });
  };

  const sections = [
    { id: 'tokyo', title: '🏙️ Tokyo', days: '4j', trans: 'Métro', activities: ['Shibuya', 'Shinjuku', 'TeamLab'] },
    { id: 'fuji', title: '🗻 Fuji', days: '2j', trans: 'Voiture', activities: ['Onsen privé', 'Tour des lacs'] },
    { id: 'kiso', title: '🥾 Kiso', days: '2j', trans: 'Roadtrip', activities: ['Magome → Tsumago'] },
    { id: 'kyoto', title: '⛩️ Kyoto', days: '4j', trans: 'Train', activities: ['Fushimi Inari', 'Uji Matcha'] },
    { id: 'hiroshima', title: '🕊️ Hiroshima', days: '2j', trans: 'Ferry', activities: ['Miyajima', 'Mémorial'] },
    { id: 'osaka', title: '🎮 Osaka', days: '4j', trans: 'Métro', activities: ['Nintendo World', 'Dotonbori'] },
  ];

  const renderList = (cityId, category) => {
    const items = userData[cityId]?.[category] || [];
    return (
      <div className="space-y-3 mt-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between bg-white/60 p-4 rounded-2xl border border-white shadow-sm">
            <div className="flex flex-col">
              <span className="font-bold text-zinc-900">{item.name}</span>
              {item.link && (
                <a 
                  href={`maps://?q=${encodeURIComponent(item.name + ' ' + item.link)}`}
                  className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1"
                >
                  🗺️ OUVRIR DANS PLANS
                </a>
              )}
            </div>
            <button onClick={() => deleteEntry(cityId, category, item.id)} className="text-zinc-300 px-2 text-xl">✕</button>
          </div>
        ))}
        {items.length === 0 && <p className="text-zinc-400 text-xs italic ml-1">Appuyez sur + pour ajouter</p>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans pb-10">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-zinc-200 px-6 py-5">
        <h1 className="text-2xl font-black tracking-tighter">🇯🇵 JAPAN EXPRESS</h1>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-8">
        {sections.map((city) => (
          <section key={city.id} className="bg-zinc-200/50 rounded-[3rem] p-6 border border-zinc-200 shadow-inner">
            <div className="mb-6 ml-2">
              <h2 className="text-3xl font-black">{city.title}</h2>
              <p className="text-zinc-500 font-bold text-sm uppercase">{city.days} • {city.trans}</p>
            </div>

            <div className="space-y-4">
              <div className="bg-zinc-50/50 rounded-[2rem] p-5 border border-zinc-200">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-sm tracking-widest text-zinc-400">🏨 HÉBERGEMENTS</h3>
                  <button 
                    onClick={() => setModalConfig({ open: true, cityId: city.id, type: 'Hébergement' })}
                    className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-2xl shadow-lg active:scale-90 transition"
                  >+</button>
                </div>
                {renderList(city.id, 'Hébergement')}
              </div>

              <div className="bg-zinc-50/50 rounded-[2rem] p-5 border border-zinc-200">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-sm tracking-widest text-zinc-400">🍜 RESTAURANTS</h3>
                  <button 
                    onClick={() => setModalConfig({ open: true, cityId: city.id, type: 'Restaurant' })}
                    className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-2xl shadow-lg active:scale-90 transition"
                  >+</button>
                </div>
                {renderList(city.id, 'Restaurant')}
              </div>
            </div>
          </section>
        ))}
      </main>

      <AddLocationModal 
        isOpen={modalConfig.open} 
        type={modalConfig.type}
        onClose={() => setModalConfig({ open: false, cityId: null, type: null })}
        onAdd={(name, link) => addEntry(modalConfig.cityId, modalConfig.type, name, link)}
      />
    </div>
  );
}
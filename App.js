import React, { useState, useEffect } from 'react';

// --- MODAL D'AJOUT ---
const AddLocationModal = ({ isOpen, onClose, onAdd, type }) => {
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <h3 className="text-2xl font-black mb-6 text-zinc-900 italic uppercase">Ajouter {type}</h3>
        <div className="space-y-4">
          <input autoFocus className="w-full bg-zinc-100 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-black" placeholder="Nom du lieu" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="w-full bg-zinc-100 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-black" placeholder="Lien Maps ou Adresse" value={link} onChange={(e) => setLink(e.target.value)} />
        </div>
        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-4 font-semibold text-zinc-400">Annuler</button>
          <button onClick={() => { if(name) { onAdd(name, link); setName(''); setLink(''); onClose(); } }} className="flex-1 bg-black text-white rounded-2xl py-4 font-bold shadow-lg">Enregistrer</button>
        </div>
      </div>
    </div>
  );
};

export default function JapanExpressTravelCompanion() {
  // --- GESTION DES DONNÉES ---
  const [userData, setUserData] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('japan_trip_vfinal') : null;
    return saved ? JSON.parse(saved) : {};
  });

  const [modalConfig, setModalConfig] = useState({ open: false, cityId: null, type: null });

  useEffect(() => {
    localStorage.setItem('japan_trip_vfinal', JSON.stringify(userData));
  }, [userData]);

  const addEntry = (cityId, category, name, link) => {
    const cityData = userData[cityId] || {};
    const categoryData = cityData[category] || [];
    setUserData({ ...userData, [cityId]: { ...cityData, [category]: [...categoryData, { name, link, id: Date.now() }] } });
  };

  const deleteEntry = (cityId, category, id) => {
    const updated = userData[cityId][category].filter(item => item.id !== id);
    setUserData({ ...userData, [cityId]: { ...userData[cityId], [category]: updated } });
  };

  // --- SECTIONS & CARTES ---
  const sections = [
    { id: 'transport', title: '✈️ Transport Aérien' },
    { id: 'map', title: '🗾 Carte du Voyage' },
    { id: 'tokyo', title: '🏙️ Tokyo', days: '4 jours', transport: 'Métro', activities: ['Shibuya', 'Shinjuku', 'Asakusa', 'TeamLab'] },
    { id: 'fuji', title: '🗻 Fuji', days: '2 jours', transport: 'Voiture', activities: ['Onsen privé', 'Tour des lacs'] },
    { id: 'kiso', title: '🥾 Kiso', days: '2 jours', transport: 'Roadtrip', activities: ['Magome → Tsumago'] },
    { id: 'kyoto', title: '⛩️ Kyoto', days: '4 jours', transport: 'Shinkansen', activities: ['Fushimi Inari', 'Pavillon d’Or', 'Uji Matcha'] },
    { id: 'hiroshima', title: '🕊️ Hiroshima', days: '2 jours', transport: 'Ferry', activities: ['Miyajima', 'Mémorial'] },
    { id: 'osaka', title: '🎮 Osaka', days: '4 jours', transport: 'Métro', activities: ['Nintendo World', 'Dotonbori'] },
    { id: 'return', title: '🚄 Retour Tokyo', days: '2 jours', transport: 'Shinkansen', activities: ['Shopping final'] },
    { id: 'driving', title: '🚗 Conduite' },
    { id: 'checklist', title: '✅ Check-list' },
    { id: 'lexicon', title: '🗣️ Lexique' },
  ];

  const renderDynamicList = (cityId, category) => {
    const items = userData[cityId]?.[category] || [];
    return (
      <div className="space-y-2 mt-4">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-zinc-200 shadow-sm">
            <div className="flex flex-col">
              <span className="font-bold text-sm text-zinc-900">{item.name}</span>
              {item.link && (
                <a href={`maps://?q=${encodeURIComponent(item.name + ' ' + item.link)}`} className="text-[10px] text-emerald-600 font-black uppercase mt-1">🗺️ Apple Plans</a>
              )}
            </div>
            <button onClick={() => deleteEntry(cityId, category, item.id)} className="text-zinc-300 hover:text-red-500 px-2">✕</button>
          </div>
        ))}
      </div>
    );
  };

  const cityCard = (city) => (
    <section id={city.id} key={city.id} className="bg-white rounded-[2.5rem] shadow-xl p-6 md:p-8 border border-zinc-200 scroll-mt-24">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-8">
        <div>
          <h2 className="text-4xl font-black tracking-tighter italic uppercase text-zinc-900">{city.title}</h2>
          <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest mt-1">{city.days} • {city.transport}</p>
        </div>
        <div className="bg-zinc-100 rounded-2xl px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-tighter">Japan Express 2026</div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h3 className="text-lg font-black uppercase mb-4 italic text-zinc-400 tracking-widest">Activités prévues</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {city.activities.map((activity, index) => (
              <div key={index} className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-black text-white flex-shrink-0 flex items-center justify-center text-xs font-black">{index + 1}</div>
                <p className="font-bold text-zinc-800 text-sm">{activity}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {['Hébergements', 'Restaurants'].map(type => (
            <div key={type} className="bg-zinc-50 rounded-[2rem] p-5 border border-zinc-200 shadow-inner">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-widest italic text-zinc-400">{type === 'Hébergements' ? '🏨 Logements' : '🍜 Food'}</h3>
                <button 
                  onClick={() => setModalConfig({ open: true, cityId: city.id, type })}
                  className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg active:scale-90 transition"
                >+</button>
              </div>
              {renderDynamicList(city.id, type)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 pb-20">
      {/* HEADER TÉLÉPHONE */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h1 className="text-2xl font-black italic tracking-tighter uppercase">🇯🇵 Japan Express</h1>
          <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1 lg:pb-0">
            {sections.map(s => (
              <a key={s.id} href={`#${s.id}`} className="whitespace-nowrap bg-zinc-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition">{s.title.split(' ')[1] || s.title}</a>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {/* BANNIÈRE NOIRE */}
        <section className="bg-gradient-to-br from-zinc-900 to-black text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
                <p className="uppercase tracking-[0.4em] text-[10px] font-black text-red-500 mb-2">Roadtrip + Shinkansen Adventure</p>
                <h2 className="text-6xl font-black italic leading-none mb-6 uppercase tracking-tighter">Japon <br/>Automne 2026</h2>
                <div className="flex flex-wrap gap-4 mt-8">
                    <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10 italic font-bold">20 Jours</div>
                    <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10 italic font-bold">7 Étapes</div>
                </div>
            </div>
        </section>

        {/* SECTION TRANSPORT */}
        <section id="transport" className="bg-white rounded-[2.5rem] p-8 border border-zinc-200 shadow-lg scroll-mt-24">
           <h2 className="text-3xl font-black italic uppercase mb-8 tracking-tighter">✈️ Vols Internationaux</h2>
           <div className="grid md:grid-cols-2 gap-8">
              {['Aller', 'Retour'].map(v => (
                <div key={v} className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-100">
                  <h3 className="font-black uppercase text-xs tracking-[0.2em] mb-4 text-zinc-400">Vol {v}</h3>
                  <textarea className="w-full h-32 bg-transparent border-none focus:ring-0 font-bold text-zinc-800 placeholder-zinc-300" placeholder="Numéro, Heures, Terminaux..." />
                </div>
              ))}
           </div>
        </section>

        {/* LES CARTES DE VILLES */}
        {sections.slice(2, 9).map(city => cityCard(city))}

        {/* LEXIQUE */}
        <section id="lexicon" className="bg-white rounded-[2.5rem] p-8 border border-zinc-200 shadow-lg scroll-mt-24 overflow-hidden">
            <h2 className="text-3xl font-black italic uppercase mb-8 tracking-tighter">🗣️ Lexique Couple</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-zinc-900">
                            <th className="py-4 font-black uppercase text-xs">Français</th>
                            <th className="py-4 font-black uppercase text-xs">Japonais</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[ ['Une table pour deux', 'Futari bun no seki o onegaishimasu'], ['L’addition', 'Okaikei onegaishimasu'], ['C’était délicieux', 'Oishikatta desu'] ].map((r, i) => (
                            <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50 transition">
                                <td className="py-4 font-bold italic">{r[0]}</td>
                                <td className="py-4 font-bold text-red-600">{r[1]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
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

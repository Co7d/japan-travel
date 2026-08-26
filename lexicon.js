/* Japan 2026 — lexique data module. No runtime patch files. */
const JAPAN_LEXICON = [
  ['Salutations','Bonjour / bonsoir','こんにちは / こんばんは'],
  ['Salutations','Bonjour (matin)','おはようございます'],
  ['Salutations','Au revoir','さようなら'],
  ['Politesse','Merci','ありがとうございます'],
  ['Politesse','Merci beaucoup','どうもありがとうございます'],
  ['Politesse','S’il vous plaît / je vous en prie','お願いします'],
  ['Politesse','Excusez-moi / pardon','すみません'],
  ['Politesse','Désolé','ごめんなさい'],
  ['Politesse','Oui','はい'],
  ['Politesse','Non','いいえ'],
  ['Politesse','D’accord / compris','わかりました'],
  ['Politesse','Je ne comprends pas','わかりません'],
  ['Communication','Parlez-vous anglais ?','英語を話せますか？'],
  ['Communication','Je ne parle pas japonais','日本語が話せません'],
  ['Communication','Pouvez-vous répéter ?','もう一度お願いします'],
  ['Communication','Pouvez-vous parler plus lentement ?','ゆっくり話してください'],
  ['Communication','C’est combien ?','いくらですか？'],
  ['Communication','Où est… ?','…はどこですか？'],
  ['Communication','Je voudrais ceci','これをください'],
  ['Communication','Pouvez-vous m’aider ?','手伝ってもらえますか？'],
  ['Restaurant','Menu','メニュー'],
  ['Restaurant','Eau','お水'],
  ['Restaurant','Eau chaude','お湯'],
  ['Restaurant','Bière','ビール'],
  ['Restaurant','Thé vert','お茶'],
  ['Restaurant','Sans viande','肉なし'],
  ['Restaurant','Sans poisson','魚なし'],
  ['Restaurant','Je suis allergique à…','…にアレルギーがあります'],
  ['Restaurant','L’addition, s’il vous plaît','お会計お願いします'],
  ['Restaurant','Délicieux','おいしいです'],
  ['Restaurant','À emporter','持ち帰り'],
  ['Restaurant','Sur place','店内'],
  ['Shopping','Combien ça coûte ?','いくらですか？'],
  ['Shopping','Je regarde seulement','見ているだけです'],
  ['Shopping','Avez-vous une autre taille ?','別のサイズはありますか？'],
  ['Shopping','Sac, s’il vous plaît','袋をお願いします'],
  ['Shopping','Pas de sac, merci','袋はいりません'],
  ['Transport','Gare','駅'],
  ['Transport','Train','電車'],
  ['Transport','Métro','地下鉄'],
  ['Transport','Bus','バス'],
  ['Transport','Taxi','タクシー'],
  ['Transport','Billet','切符'],
  ['Transport','Quai','ホーム'],
  ['Transport','Correspondance','乗り換え'],
  ['Transport','Entrée','入口'],
  ['Transport','Sortie','出口'],
  ['Transport','Nord','北'],
  ['Transport','Sud','南'],
  ['Transport','Est','東'],
  ['Transport','Ouest','西'],
  ['Hébergement','Hôtel','ホテル'],
  ['Hébergement','Réservation','予約'],
  ['Hébergement','Check-in','チェックイン'],
  ['Hébergement','Check-out','チェックアウト'],
  ['Hébergement','Bagages','荷物'],
  ['Hébergement','Consigne à bagages','荷物預かり'],
  ['Pratique','Toilettes','トイレ'],
  ['Pratique','Entrée','入口'],
  ['Pratique','Sortie','出口'],
  ['Pratique','Ouvert','営業中'],
  ['Pratique','Fermé','閉店'],
  ['Pratique','Aujourd’hui','今日'],
  ['Pratique','Demain','明日'],
  ['Pratique','Maintenant','今'],
  ['Japon','Gare JR','JR駅'],
  ['Japon','Carte Suica','Suica'],
  ['Japon','Konbini (supérette)','コンビニ'],
  ['Japon','Distributeur automatique','自動販売機'],
  ['Japon','Onsen','温泉'],
  ['Japon','Ryokan','旅館'],
  ['Japon','Temple bouddhiste','お寺'],
  ['Japon','Sanctuaire shinto','神社'],
  ['Japon','Torii','鳥居'],
  ['Japon','Omikuji (prédiction)','おみくじ'],
  ['Japon','Omamori (amulette)','お守り'],
  ['Japon','Tatouage','タトゥー'],
  ['Japon','Attention / danger','危険'],
  ['Japon','Interdit','禁止'],
  ['Japon','Merci pour le repas','ごちそうさまでした'],
  ['Japon','Bon appétit','いただきます']
];

/* The runtime already reads data.lexicon. We keep the vocabulary in this dedicated
   data module and inject it into the JSON response before app.js consumes it. */
const japanOriginalFetch = window.fetch.bind(window);
window.fetch = async (...args) => {
  const response = await japanOriginalFetch(...args);
  const url = String(args[0] ?? '');
  if (!url.endsWith('data.json')) return response;
  const payload = await response.json();
  payload.lexicon = JAPAN_LEXICON;
  return new Response(JSON.stringify(payload), {
    status: response.status,
    statusText: response.statusText,
    headers: {'Content-Type': 'application/json'}
  });
};

/* Planning place buttons use the same compact visual treatment as the other
   clickable places. Replace the old "Ouvrir dans Maps" label with the place name. */
window.addEventListener('DOMContentLoaded', () => {
  const updatePlanningPlaceLabels = () => {
    document.querySelectorAll('.schedule-map[data-place-id]').forEach(button => {
      const place = window.places?.[button.dataset.placeId];
      if (place) button.textContent = place.name;
    });
  };
  const observer = new MutationObserver(updatePlanningPlaceLabels);
  const target = document.getElementById('planning-container');
  if (target) observer.observe(target, {childList:true, subtree:true});
  updatePlanningPlaceLabels();
});

const PLACE_ROWS=[PLACEHOLDER];
const places=Object.fromEntries(PLACE_ROWS.map(([name,city,category,lat,lng])=>[slug(name),{name,city,category,description:'',lat,lng}]));

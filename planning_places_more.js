const PLANNING_PLACE_ROWS_MORE = [
  ["Takeshita Street","tokyo","activity",35.67017,139.70517],
  ["Téléphérique du mont Misen","hiroshima","transport",34.27853,132.32705],
  ["Naramachi Street","kyoto","activity",34.67914,135.83192]
];
const PLANNING_PLACES_MORE = Object.fromEntries(PLANNING_PLACE_ROWS_MORE.map(([name,city,category,lat,lng]) => [slug(name), {id:slug(name),name,city,category,lat,lng,source:"planning"}]));

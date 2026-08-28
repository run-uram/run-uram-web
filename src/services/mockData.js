// Kazan Map Constants and Landmarks
import * as h3 from 'h3-js';

export const KAZAN_CENTER = {
  lat: 55.79639,
  lng: 49.10889,
  zoom: 13.5
};

// Kazan Geographic Bounding Box [SouthWest [lng, lat], NorthEast [lng, lat]]
export const KAZAN_BOUNDS = [
  [48.65, 55.60], // SW: Innopolis / Volga West
  [49.40, 55.98]  // NE: Derbyshki / M7 North-East
];

export const MAP_STYLES = {
  voyager: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  positron: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
};

export const KAZAN_LANDMARKS = [
  {
    id: 'uram',
    name: 'Экстрим-парк УРАМ',
    lat: 55.7932,
    lng: 49.1481,
    zoom: 15.5,
    description: 'Мост Миллениум'
  },
  {
    id: 'kremlin',
    name: 'Казанский Кремль',
    lat: 55.7983,
    lng: 49.1052,
    zoom: 15,
    description: 'Кремлевская набережная'
  },
  {
    id: 'kaban',
    name: 'Озеро Кабан',
    lat: 55.7795,
    lng: 49.1205,
    zoom: 15,
    description: 'Центральная набережная'
  },
  {
    id: 'gorky',
    name: 'Парк Горького',
    lat: 55.7958,
    lng: 49.1462,
    zoom: 15,
    description: 'Зеленый маршрут'
  },
  {
    id: 'arena',
    name: 'Ак Барс Арена',
    lat: 55.8180,
    lng: 49.1585,
    zoom: 14.8,
    description: 'Спортивный кластер'
  },
  {
    id: 'innopolis',
    name: 'Иннополис',
    lat: 55.7521,
    lng: 48.7446,
    zoom: 14.5,
    description: 'IT-город'
  }
];

// Kazan Administrative Districts with Faction Domination Telemetry
export const KAZAN_DISTRICTS = [
  {
    id: 'vakhitovsky',
    name: 'Вахитовский район',
    nameEn: 'Vakhitovsky',
    center: 'Центр / Кремль / Кабан',
    totalHexes: 142,
    leadingFaction: 'zilant',
    factionShare: 64,
    status: 'LOCKED',
    activityLevel: 'HIGH'
  },
  {
    id: 'novo-savinovsky',
    name: 'Ново-Савиновский район',
    nameEn: 'Novo-Savinovsky',
    center: 'Арена / Ривьера',
    totalHexes: 128,
    leadingFaction: 'volga',
    factionShare: 48,
    status: 'DISPUTED',
    activityLevel: 'VERY_HIGH'
  },
  {
    id: 'sovetsky',
    name: 'Советский район',
    nameEn: 'Sovetsky',
    center: 'Горки / Парк Горького',
    totalHexes: 196,
    leadingFaction: 'zilant',
    factionShare: 52,
    status: 'LOCKED',
    activityLevel: 'MEDIUM'
  },
  {
    id: 'privolzhsky',
    name: 'Приволжский район',
    nameEn: 'Privolzhsky',
    center: 'Дубравная / Пр. Победы',
    totalHexes: 184,
    leadingFaction: 'kremlin',
    factionShare: 42,
    status: 'CONTESTED',
    activityLevel: 'HIGH'
  },
  {
    id: 'kirovsky',
    name: 'Кировский район',
    nameEn: 'Kirovsky',
    center: 'Адмиралтейка / Озеро Лебяжье',
    totalHexes: 156,
    leadingFaction: 'nomads',
    factionShare: 40,
    status: 'CONTESTED',
    activityLevel: 'MEDIUM'
  },
  {
    id: 'moskovsky',
    name: 'Московский район',
    nameEn: 'Moskovsky',
    center: 'Парк Урицкого / Декабристов',
    totalHexes: 138,
    leadingFaction: 'zilant',
    factionShare: 51,
    status: 'LOCKED',
    activityLevel: 'MEDIUM'
  },
  {
    id: 'aviastroitelny',
    name: 'Авиастроительный район',
    nameEn: 'Aviastroitelny',
    center: 'Соцгород / Крылья Советов',
    totalHexes: 122,
    leadingFaction: 'volga',
    factionShare: 45,
    status: 'DISPUTED',
    activityLevel: 'LOW'
  }
];

// Factions of Kazan Territory Control
export const FACTIONS = [
  {
    id: 'zilant',
    name: 'Zilant Cyber-Runners',
    shortName: 'ZLT',
    color: '#fe4a09',
    colorGlow: 'rgba(254, 74, 9, 0.35)',
    icon: '🐉',
    description: 'Огненный дракон Казани. Доминируют на Кремлевской набережной и в экстрим-парке УРАМ.',
    controlledHexes: 482,
    percent: 44.2,
    activeRunners: 318,
    avgPace: '04:12',
    isUserFaction: true
  },
  {
    id: 'volga',
    name: 'Volga Rapids',
    shortName: 'VLG',
    color: '#0284c7',
    colorGlow: 'rgba(2, 132, 199, 0.35)',
    icon: '🌊',
    description: 'Водные спринтеры. Контролируют мосты через Казанку и набережные Ривьеры.',
    controlledHexes: 312,
    percent: 28.6,
    activeRunners: 245,
    avgPace: '04:25',
    isUserFaction: false
  },
  {
    id: 'kremlin',
    name: 'Kremlin Shields',
    shortName: 'KRM',
    color: '#10b981',
    colorGlow: 'rgba(16, 185, 129, 0.35)',
    icon: '🛡️',
    description: 'Оборонительный альянс исторического центра и южных парков Казани.',
    controlledHexes: 194,
    percent: 17.8,
    activeRunners: 180,
    avgPace: '04:38',
    isUserFaction: false
  },
  {
    id: 'nomads',
    name: 'Nomad Raiders',
    shortName: 'NMD',
    color: '#7c3aed',
    colorGlow: 'rgba(124, 58, 237, 0.35)',
    icon: '🐺',
    description: 'Лесные рейдеры Лебяжьего и внешних границ города.',
    controlledHexes: 102,
    percent: 9.4,
    activeRunners: 94,
    avgPace: '04:45',
    isUserFaction: false
  }
];

// Individual Top Runners Leaderboard (Kazan City)
export const TOP_RUNNERS = [
  {
    rank: 1,
    name: 'Тимур "Zilant" Гарипов',
    handle: '@timur_kzn',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    faction: 'zilant',
    hexesCount: 74,
    totalDistanceKm: 412.5,
    avgPace: '03:45',
    tier: 'Kazan Sovereign',
    badge: '👑'
  },
  {
    rank: 2,
    name: 'Алексей "Volga" Кузнецов',
    handle: '@kuznetsov_run',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    faction: 'volga',
    hexesCount: 61,
    totalDistanceKm: 368.2,
    avgPace: '03:52',
    tier: 'City Champion',
    badge: '🥈'
  },
  {
    rank: 3,
    name: 'Диана Рапид',
    handle: '@diana_speed',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    faction: 'zilant',
    hexesCount: 58,
    totalDistanceKm: 345.0,
    avgPace: '03:58',
    tier: 'City Champion',
    badge: '🥉'
  },
  {
    rank: 4,
    name: 'Булат Сабиров',
    handle: '@bulat_kzn',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    faction: 'kremlin',
    hexesCount: 49,
    totalDistanceKm: 310.8,
    avgPace: '04:05',
    tier: 'District Master',
    badge: '⚡'
  },
  {
    rank: 5,
    name: 'Алсу Нуриева',
    handle: '@alsu_run',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    faction: 'volga',
    hexesCount: 42,
    totalDistanceKm: 284.4,
    avgPace: '04:12',
    tier: 'District Master',
    badge: '⚡'
  },
  {
    rank: 6,
    name: 'smayflks',
    handle: '@smayflks',
    avatar: '/app_icon_stylized_run_svg.svg',
    faction: 'zilant',
    hexesCount: 42,
    totalDistanceKm: 184.6,
    avgPace: '04:22',
    tier: 'Kazan Legend',
    badge: '🎯',
    isCurrentUser: true
  },
  {
    rank: 7,
    name: 'Фарид Вафин',
    handle: '@vafin_run',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    faction: 'nomads',
    hexesCount: 36,
    totalDistanceKm: 242.1,
    avgPace: '04:30',
    tier: 'Veteran Runner',
    badge: '🛡️'
  }
];

// Generate GPS points along a path for mock runs
function generateRoutePoints(coordsList) {
  return coordsList.map(([lat, lng, alt = 55, speed = 3.8], idx) => ({
    latitude: lat,
    longitude: lng,
    altitude: alt,
    speed: speed,
    heading: idx > 0 ? 45 : 0,
    accuracy: 3.5,
    timestamp: Date.now() - (coordsList.length - idx) * 15000,
    accelerometer_z: 9.81,
    is_mock: false
  }));
}

// Route 1: Kremlin to URAM Park along Promenade & Millennium Bridge
const ROUTE_1_COORDS = [
  [55.7983, 49.1052, 52, 3.6],
  [55.8005, 49.1098, 53, 3.8],
  [55.8018, 49.1165, 54, 4.1],
  [55.8022, 49.1240, 54, 4.0],
  [55.8015, 49.1320, 53, 3.9],
  [55.7990, 49.1395, 56, 3.7],
  [55.7962, 49.1448, 62, 3.9],
  [55.7932, 49.1481, 58, 4.2],
  [55.7905, 49.1495, 57, 4.0],
  [55.7880, 49.1460, 55, 3.8]
];

// Route 2: Lake Kaban Loop
const ROUTE_2_COORDS = [
  [55.7820, 49.1180, 50, 3.5],
  [55.7795, 49.1205, 51, 3.7],
  [55.7750, 49.1245, 52, 3.9],
  [55.7710, 49.1275, 52, 4.1],
  [55.7680, 49.1300, 53, 4.0],
  [55.7695, 49.1340, 53, 3.8],
  [55.7740, 49.1310, 52, 3.9],
  [55.7785, 49.1265, 51, 4.2],
  [55.7820, 49.1220, 50, 3.9],
  [55.7835, 49.1190, 50, 3.6]
];

// Route 3: Millennium Bridge to Ak Bars Arena
const ROUTE_3_COORDS = [
  [55.7932, 49.1481, 58, 4.1],
  [55.8010, 49.1495, 68, 4.3],
  [55.8090, 49.1510, 65, 4.0],
  [55.8140, 49.1540, 58, 3.9],
  [55.8180, 49.1585, 56, 4.4],
  [55.8210, 49.1620, 55, 4.2],
  [55.8190, 49.1660, 55, 3.9],
  [55.8150, 49.1610, 56, 4.0],
  [55.8110, 49.1550, 60, 3.8]
];

// Route 4: Gorky Park Sprint & Hills
const ROUTE_4_COORDS = [
  [55.7958, 49.1462, 65, 3.9],
  [55.7975, 49.1490, 72, 3.6],
  [55.7990, 49.1530, 80, 3.4],
  [55.7970, 49.1580, 75, 4.2],
  [55.7940, 49.1550, 68, 4.5],
  [55.7915, 49.1500, 62, 4.1],
  [55.7930, 49.1450, 60, 3.8],
  [55.7958, 49.1462, 65, 4.0]
];

function getH3CellsFromCoords(coords) {
  const set = new Set();
  coords.forEach(([lat, lng]) => {
    try {
      const idx = h3.latLngToCell(lat, lng, 9);
      if (idx) set.add(idx);
    } catch (e) {
      // ignore
    }
  });
  return Array.from(set);
}

export const MOCK_RUNS_HISTORY = [
  {
    run_id: '101',
    title: 'Утренний рейд: Кремлевская набережная & УРАМ',
    status: 'finished',
    district: 'Вахитовский район',
    routeTag: 'Кремлевская набережная',
    total_distance_meters: 12450,
    total_duration_seconds: 3252, // 54m 12s
    uram_points_earned: 640,
    started_at: Date.now() - 1000 * 60 * 60 * 3,
    finished_at: Date.now() - 1000 * 60 * 60 * 2,
    avgPace: '04:22',
    calories: 890,
    elevationGainM: 74,
    route_points: generateRoutePoints(ROUTE_1_COORDS),
    captured_h3_indices: getH3CellsFromCoords(ROUTE_1_COORDS)
  },
  {
    run_id: '102',
    title: 'Захват Ак Барс Арены: Мост Миллениум',
    status: 'finished',
    district: 'Ново-Савиновский район',
    routeTag: 'Мост Миллениум',
    total_distance_meters: 16820,
    total_duration_seconds: 4290, // 1h 11m 30s
    uram_points_earned: 920,
    started_at: Date.now() - 1000 * 60 * 60 * 24 * 1.5,
    finished_at: Date.now() - 1000 * 60 * 60 * 24 * 1.5 + 4290000,
    avgPace: '04:15',
    calories: 1210,
    elevationGainM: 92,
    route_points: generateRoutePoints(ROUTE_3_COORDS),
    captured_h3_indices: getH3CellsFromCoords(ROUTE_3_COORDS)
  },
  {
    run_id: '103',
    title: 'Озеро Кабан: Ночной патруль набережной',
    status: 'finished',
    district: 'Вахитовский район',
    routeTag: 'Набережная Кабан',
    total_distance_meters: 8200,
    total_duration_seconds: 2320, // 38m 40s
    uram_points_earned: 450,
    started_at: Date.now() - 1000 * 60 * 60 * 24 * 3,
    finished_at: Date.now() - 1000 * 60 * 60 * 24 * 3 + 2320000,
    avgPace: '04:43',
    calories: 620,
    elevationGainM: 45,
    route_points: generateRoutePoints(ROUTE_2_COORDS),
    captured_h3_indices: getH3CellsFromCoords(ROUTE_2_COORDS)
  },
  {
    run_id: '104',
    title: 'Парк Горького: Скоростной интервальный спринт',
    status: 'finished',
    district: 'Советский район',
    routeTag: 'Холмы Горького',
    total_distance_meters: 21100,
    total_duration_seconds: 5895, // 1h 38m 15s
    uram_points_earned: 1350,
    started_at: Date.now() - 1000 * 60 * 60 * 24 * 5,
    finished_at: Date.now() - 1000 * 60 * 60 * 24 * 5 + 5895000,
    avgPace: '04:39',
    calories: 1540,
    elevationGainM: 140,
    route_points: generateRoutePoints(ROUTE_4_COORDS),
    captured_h3_indices: getH3CellsFromCoords(ROUTE_4_COORDS)
  }
];

// Personal Telemetry & Activity History for the Analytics Dashboard
export const RUNNER_ANALYTICS = {
  totalDistanceKm: 184.6,
  distanceTrend: '+14.2%',
  ownedHexesCount: 42,
  ownedHexesToday: '+8',
  avgPace: '04:22',
  bestPace: '03:42',
  caloriesBurned: 14280,
  caloriesAvg: 840,
  dominanceTier: 'Top 3.8% Kazan',
  factionRank: '#4 in Zilant Team',
  
  // Weekly Activity Trend: Volume (km) & Captured Hexes
  weeklyVolume: [
    { day: 'Пн', date: '21.08', distance: 12.4, hexes: 2, pace: '04:35' },
    { day: 'Вт', date: '22.08', distance: 8.2, hexes: 1, pace: '04:42' },
    { day: 'Ср', date: '23.08', distance: 21.1, hexes: 9, pace: '04:20' },
    { day: 'Чт', date: '24.08', distance: 14.6, hexes: 4, pace: '04:18' },
    { day: 'Пт', date: '25.08', distance: 16.8, hexes: 5, pace: '04:15' },
    { day: 'Сб', date: '26.08', distance: 28.5, hexes: 13, pace: '04:08' },
    { day: 'Вс', date: '27.08', distance: 10.2, hexes: 8, pace: '04:22' }
  ],

  // District Domination Radar Distribution (%)
  districtRadar: [
    { district: 'Вахитовский', value: 88 },
    { district: 'Ново-Савиновский', value: 65 },
    { district: 'Советский', value: 45 },
    { district: 'Приволжский', value: 30 },
    { district: 'Кировский', value: 20 },
    { district: 'Московский', value: 40 },
    { district: 'Авиастроительный', value: 15 }
  ],

  runHistory: MOCK_RUNS_HISTORY
};

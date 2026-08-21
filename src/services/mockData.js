// Kazan Running Clubs and Athletes Data Engine — Generic Anonymized Preset

export const KAZAN_CENTER = {
  lat: 55.79639,
  lng: 49.10889,
  zoom: 12.8
};

// Kazan Geographic Bounding Box [SouthWest [lng, lat], NorthEast [lng, lat]]
export const KAZAN_BOUNDS = [
  [48.65, 55.60], // SW: Innopolis / Volga West
  [49.40, 55.98]  // NE: Derbyshki / M7 North-East
];

// SVG Data URL for Generic Athlete Avatar
const GENERIC_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="%2327272a"><rect width="100" height="100" fill="%2318181b"/><circle cx="50" cy="38" r="18" fill="%2371717a"/><path d="M20 85 C20 62 34 52 50 52 C66 52 80 62 80 85 Z" fill="%2371717a"/></svg>`;

export const KAZAN_CLUBS = {
  uram_crew: {
    id: 'uram_crew',
    name: 'Incomsystem',
    color: '#f97316', // Warm Athletic Orange
    badge: '⚡',
    description: 'Команда Incomsystem',
    membersCount: 142
  },
  kremlin_guard: {
    id: 'kremlin_guard',
    name: 'Кремлёвская Стража',
    color: '#38bdf8', // Sky Blue
    badge: '🏰',
    description: 'Доминируют на Кремлевской набережной и в центре',
    membersCount: 118
  },
  volga_runners: {
    id: 'volga_runners',
    name: 'Волга Пейс',
    color: '#10b981', // Emerald
    badge: '🌊',
    description: 'Марафонцы вдоль русла Волги и Казанки',
    membersCount: 96
  },
  kaban_tigers: {
    id: 'kaban_tigers',
    name: 'Тигры Кабана',
    color: '#a855f7', // Violet
    badge: '🐅',
    description: 'Быстрые спринтеры вокруг Нижнего и Среднего Кабана',
    membersCount: 84
  },
  innopolis_cyber: {
    id: 'innopolis_cyber',
    name: 'Innopolis CyberRunners',
    color: '#f43f5e', // Crimson Rose
    badge: '🤖',
    description: 'IT-бегуны из Иннополиса',
    membersCount: 75
  }
};

export const MOCK_RUNNERS = [
  {
    id: 101,
    name: 'Атлет #101',
    handle: '@athlete_101',
    avatar: GENERIC_AVATAR,
    club: KAZAN_CLUBS.uram_crew,
    hexCount: 184,
    totalDistanceKm: 412.5,
    avgPace: '4:15 мин/км',
    streakDays: 14,
    rank: 1
  },
  {
    id: 102,
    name: 'Атлет #102',
    handle: '@athlete_102',
    avatar: GENERIC_AVATAR,
    club: KAZAN_CLUBS.kremlin_guard,
    hexCount: 162,
    totalDistanceKm: 388.2,
    avgPace: '4:22 мин/км',
    streakDays: 19,
    rank: 2
  },
  {
    id: 103,
    name: 'Атлет #103',
    handle: '@athlete_103',
    avatar: GENERIC_AVATAR,
    club: KAZAN_CLUBS.volga_runners,
    hexCount: 145,
    totalDistanceKm: 350.0,
    avgPace: '4:08 мин/км',
    streakDays: 8,
    rank: 3
  },
  {
    id: 104,
    name: 'Атлет #104',
    handle: '@athlete_104',
    avatar: GENERIC_AVATAR,
    club: KAZAN_CLUBS.kaban_tigers,
    hexCount: 129,
    totalDistanceKm: 295.4,
    avgPace: '4:35 мин/км',
    streakDays: 11,
    rank: 4
  },
  {
    id: 105,
    name: 'Атлет #105',
    handle: '@athlete_105',
    avatar: GENERIC_AVATAR,
    club: KAZAN_CLUBS.innopolis_cyber,
    hexCount: 115,
    totalDistanceKm: 278.1,
    avgPace: '3:58 мин/км',
    streakDays: 6,
    rank: 5
  },
  {
    id: 106,
    name: 'Атлет #106',
    handle: '@athlete_106',
    avatar: GENERIC_AVATAR,
    club: KAZAN_CLUBS.uram_crew,
    hexCount: 98,
    totalDistanceKm: 240.6,
    avgPace: '4:40 мин/км',
    streakDays: 5,
    rank: 6
  },
  {
    id: 107,
    name: 'Атлет #107',
    handle: '@athlete_107',
    avatar: GENERIC_AVATAR,
    club: KAZAN_CLUBS.kremlin_guard,
    hexCount: 91,
    totalDistanceKm: 231.0,
    avgPace: '4:18 мин/км',
    streakDays: 12,
    rank: 7
  },
  {
    id: 108,
    name: 'Атлет #108',
    handle: '@athlete_108',
    avatar: GENERIC_AVATAR,
    club: KAZAN_CLUBS.volga_runners,
    hexCount: 84,
    totalDistanceKm: 210.3,
    avgPace: '4:45 мин/км',
    streakDays: 4,
    rank: 8
  },
  {
    id: 109,
    name: 'Атлет #109',
    handle: '@athlete_109',
    avatar: GENERIC_AVATAR,
    club: KAZAN_CLUBS.innopolis_cyber,
    hexCount: 76,
    totalDistanceKm: 195.0,
    avgPace: '4:05 мин/км',
    streakDays: 9,
    rank: 9
  },
  {
    id: 110,
    name: 'Атлет #110',
    handle: '@athlete_110',
    avatar: GENERIC_AVATAR,
    club: KAZAN_CLUBS.kaban_tigers,
    hexCount: 68,
    totalDistanceKm: 172.5,
    avgPace: '4:50 мин/км',
    streakDays: 3,
    rank: 10
  }
];

export const KAZAN_LANDMARKS = [
  {
    id: 'uram',
    name: 'УРАМ Park',
    lat: 55.7932,
    lng: 49.1481,
    zoom: 15,
    description: 'Мост Миллениум'
  },
  {
    id: 'kremlin',
    name: 'Кремль',
    lat: 55.7983,
    lng: 49.1052,
    zoom: 14.5,
    description: 'Набережная Казанки'
  },
  {
    id: 'kaban',
    name: 'Озеро Кабан',
    lat: 55.7795,
    lng: 49.1205,
    zoom: 14.5,
    description: 'Центральная набережная'
  },
  {
    id: 'gorky',
    name: 'Парк Горького',
    lat: 55.7958,
    lng: 49.1462,
    zoom: 15,
    description: 'Зеленый холмистый маршрут'
  },
  {
    id: 'arena',
    name: 'Ак Барс Арена',
    lat: 55.8180,
    lng: 49.1585,
    zoom: 14.5,
    description: 'Спортивный стадион'
  },
  {
    id: 'innopolis',
    name: 'Иннополис',
    lat: 55.7521,
    lng: 48.7446,
    zoom: 14,
    description: 'Хайтек-город'
  }
];

export const INITIAL_TICKER_EVENTS = [
  {
    id: 't-1',
    user: 'Атлет #101',
    clubColor: '#f97316',
    text: 'Захвачен сектор #881108221bff у Моста Миллениум',
    time: '2m ago',
    score: '+450 pts'
  },
  {
    id: 't-2',
    user: 'Атлет #102',
    clubColor: '#38bdf8',
    text: 'Обновлен темп на Кремлевской набережной (5.4 км)',
    time: '8m ago',
    score: '+320 pts'
  },
  {
    id: 't-3',
    user: 'Атлет #103',
    clubColor: '#10b981',
    text: 'Перехвачен сектор у Центра Семья (Чаша)',
    time: '14m ago',
    score: '+610 pts'
  }
];

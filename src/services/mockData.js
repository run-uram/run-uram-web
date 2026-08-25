// Kazan Map Constants and Landmarks

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
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  positron: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
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

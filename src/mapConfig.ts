import type { LatLngExpression, LatLngBoundsExpression } from 'leaflet';

/** Pixel size of public/assets/ranch-map.jpg (north-up, orange boundary). */
export const MAP_WIDTH = 1476;
export const MAP_HEIGHT = 787;
export const MAP_IMAGE_URL = '/assets/ranch-map.jpg';

/** Bump when the base map or suggested pin layout changes so saved devices remap. */
export const MAP_REVISION = 2;

/** Leaflet CRS.Simple bounds: [south-west, north-east] = [[0,0], [height, width]] */
export const MAP_BOUNDS: LatLngBoundsExpression = [
  [0, 0],
  [MAP_HEIGHT, MAP_WIDTH],
];

/** Image pixel (x from left, y from top) → Leaflet latlng (y-up). */
export function toLatLng(x: number, y: number): LatLngExpression {
  return [MAP_HEIGHT - y, x];
}

export function fromLatLng(lat: number, lng: number): { x: number; y: number } {
  return { x: lng, y: MAP_HEIGHT - lat };
}

export const SPECIES = [
  'White-tailed deer',
  'Feral hog',
  'Rio Grande turkey',
  'Mourning dove',
  'Quail',
  'Javelina',
  'Coyote',
  'Bobcat',
  'Other',
] as const;

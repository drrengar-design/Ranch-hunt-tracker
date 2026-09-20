import type { LatLngExpression, LatLngBoundsExpression } from 'leaflet';

/** Pixel size of public/assets/ranch-map-yellow-logo-enhanced.png */
export const MAP_WIDTH = 1476;
export const MAP_HEIGHT = 787;
export const MAP_IMAGE_URL = '/assets/ranch-map-yellow-logo-enhanced.png';

/**
 * Bump when the base photo or default pin set changes so devices that already
 * stored the previous orientation get the new suggested layout on load.
 */
export const MAP_LAYOUT_VERSION = 2;

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

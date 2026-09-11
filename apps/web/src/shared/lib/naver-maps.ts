let naverMapsPromise: Promise<void> | null = null;
let markerClusteringPromise: Promise<void> | null = null;

interface NaverPixelOffset {
  x: number;
  y: number;
}

interface NaverLatLng {
  lat: () => number;
  lng: () => number;
}

interface NaverMap {
  setCenter: (center: NaverLatLng) => void;
  getCenter: () => NaverLatLng;
  getBounds: () => {
    getNorthEast: () => NaverLatLng;
    getSouthWest: () => NaverLatLng;
  };
  getProjection: () => {
    fromCoordToOffset: (coord: NaverLatLng) => NaverPixelOffset;
  };
}

interface NaverMarker {
  setMap: (map: NaverMap | null) => void;
  setZIndex: (zIndex: number) => void;
  getPosition: () => NaverLatLng;
  getElement: () => HTMLElement | null;
  _propertyId?: string;
}

interface MarkerClusteringOptions {
  map: NaverMap;
  markers: NaverMarker[];
  disableClickZoom?: boolean;
  minClusterSize?: number;
  maxZoom?: number;
  gridSize?: number;
  icons?: Array<{
    content: string;
    size: unknown;
    anchor: unknown;
  }>;
  stylingFunction?: (clusterMarker: NaverMarker, count: number) => void;
}

interface MarkerClusteringInstance {
  setMap: (map: NaverMap | null) => void;
}

declare global {
  interface Window {
    naver?: {
      maps: {
        Map: new (
          element: HTMLElement,
          options: {
            center: unknown;
            zoom: number;
            minZoom?: number;
            maxZoom?: number;
            zoomControl?: boolean;
          },
        ) => NaverMap;
        LatLng: new (lat: number, lng: number) => NaverLatLng;
        Size: new (width: number, height: number) => unknown;
        Point: new (x: number, y: number) => unknown;
        Marker: new (options: {
          map?: NaverMap | null;
          position: NaverLatLng;
          title?: string;
          icon?: {
            content?: string;
            anchor?: unknown;
            size?: unknown;
          };
        }) => NaverMarker;
        Event: {
          addListener: (target: unknown, event: string, listener: () => void) => unknown;
          removeListener: (listener: unknown) => void;
        };
        Util?: unknown;
        Service?: {
          geocode: (
            options: { query: string },
            callback: (
              status: number,
              response: { v2?: { addresses?: Array<Record<string, string>> } },
            ) => void,
          ) => void;
          Status: { OK: number };
        };
      };
    };
    MarkerClustering?: new (options: MarkerClusteringOptions) => MarkerClusteringInstance;
  }
}

export function getNaverMapClientId(): string | undefined {
  const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID?.trim();
  return clientId || undefined;
}

export function loadNaverMapsScript(): Promise<void> {
  const clientId = getNaverMapClientId();

  if (!clientId) {
    return Promise.reject(new Error('Naver Maps client ID is not configured'));
  }

  if (window.naver?.maps) {
    return Promise.resolve();
  }

  if (naverMapsPromise) {
    return naverMapsPromise;
  }

  naverMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Naver Maps'));
    document.head.appendChild(script);
  });

  return naverMapsPromise;
}

/**
 * MarkerClustering is NAVER's own sample library, vendored under
 * `public/scripts`. It reads `naver.maps` at parse time, so it can only be
 * appended once the Maps API itself has finished loading.
 */
export function loadMarkerClusteringScript(): Promise<void> {
  if (markerClusteringPromise) {
    return markerClusteringPromise;
  }

  markerClusteringPromise = loadNaverMapsScript().then(() => {
    if (window.MarkerClustering) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/scripts/MarkerClustering.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load marker clustering'));
      document.head.appendChild(script);
    });
  });

  return markerClusteringPromise;
}

export interface GeocodedAddress {
  latitude: number;
  longitude: number;
  district: string;
  roadAddress: string;
}

export async function geocodeAddress(query: string): Promise<GeocodedAddress | null> {
  await loadNaverMapsScript();

  const service = window.naver?.maps?.Service;

  if (!service) {
    throw new Error('Naver geocoder is not available');
  }

  return new Promise((resolve, reject) => {
    service.geocode(
      { query },
      (status: number, response: { v2?: { addresses?: Array<Record<string, string>> } }) => {
        if (status !== service.Status.OK) {
          resolve(null);
          return;
        }

        const address = response.v2?.addresses?.[0];

        if (!address) {
          resolve(null);
          return;
        }

        const latitude = Number(address.y);
        const longitude = Number(address.x);

        if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
          reject(new Error('Geocoder returned invalid coordinates'));
          return;
        }

        resolve({
          latitude,
          longitude,
          district: address.sigugun || address.sido || '',
          roadAddress: address.roadAddress || address.jibunAddress || query,
        });
      },
    );
  });
}

export type { NaverLatLng, NaverMap, NaverMarker, NaverPixelOffset };

import type { SearchPropertyCard } from '@housing-platform/types';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  formatMarkerPrice,
  groupByCoord,
  MARKER_STACK_OFFSET_PX,
  normalizeLatLng,
} from '@/features/search/lib/map-marker-utils';
import { useCurrency } from '@/i18n/CurrencyProvider';
import {
  getNaverMapClientId,
  loadMarkerClusteringScript,
  loadNaverMapsScript,
  type NaverLatLng,
  type NaverMap,
  type NaverMarker,
  type NaverPixelOffset,
} from '@/shared/lib/naver-maps';

import './map-markers.css';

const CLUSTER_MAX_ZOOM = 16;
const CLUSTER_GRID_SIZE = 100;
const CLUSTER_ICON_SIZE = 42;

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export type MapMarkerVariant = 'price' | 'pin';

interface NaverPropertyMapProps {
  properties: SearchPropertyCard[];
  centerLat: number;
  centerLng: number;
  selectedPropertyId?: string | null;
  hoveredPropertyId?: string | null;
  markerVariant?: MapMarkerVariant;
  onSelectProperty?: (propertyId: string) => void;
  onMapClick?: () => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  onSelectedMarkerPosition?: (position: NaverPixelOffset | null) => void;
  fullBleed?: boolean;
}

/**
 * Clustered markers are detached from the map, so the highlight has to be
 * applied to whichever marker elements are currently rendered.
 */
function updateMarkerPresentation(
  markers: NaverMarker[],
  selectedPropertyId: string | null | undefined,
  hoveredPropertyId: string | null | undefined,
) {
  markers.forEach((marker) => {
    const element = marker.getElement()?.querySelector('.map-price-marker');

    if (element) {
      element.classList.toggle('is-selected', marker._propertyId === selectedPropertyId);
      element.classList.toggle('is-hovered', marker._propertyId === hoveredPropertyId);
    }

    marker.setZIndex(
      marker._propertyId === hoveredPropertyId
        ? 300
        : marker._propertyId === selectedPropertyId
          ? 200
          : 100,
    );
  });
}

export function NaverPropertyMap({
  properties,
  centerLat,
  centerLng,
  selectedPropertyId,
  hoveredPropertyId,
  markerVariant = 'price',
  onSelectProperty,
  onMapClick,
  onBoundsChange,
  onSelectedMarkerPosition,
  fullBleed = false,
}: NaverPropertyMapProps) {
  const { currency } = useCurrency();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<NaverMap | null>(null);
  const markersRef = useRef<NaverMarker[]>([]);
  const clusterRef = useRef<{ setMap: (map: NaverMap | null) => void } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(
    getNaverMapClientId() ? null : 'Add VITE_NAVER_MAP_CLIENT_ID to enable the interactive map.',
  );

  const onSelectPropertyRef = useRef(onSelectProperty);
  const onMapClickRef = useRef(onMapClick);
  const onBoundsChangeRef = useRef(onBoundsChange);
  const onSelectedMarkerPositionRef = useRef(onSelectedMarkerPosition);
  const selectedPropertyIdRef = useRef(selectedPropertyId);
  const initialCenterRef = useRef({ lat: centerLat, lng: centerLng });

  useEffect(() => {
    onSelectPropertyRef.current = onSelectProperty;
    onMapClickRef.current = onMapClick;
    onBoundsChangeRef.current = onBoundsChange;
    onSelectedMarkerPositionRef.current = onSelectedMarkerPosition;
    selectedPropertyIdRef.current = selectedPropertyId;
  });

  const reportSelectedMarkerPosition = useCallback(() => {
    const map = mapRef.current;
    const report = onSelectedMarkerPositionRef.current;

    if (!report) {
      return;
    }

    const activePropertyId = selectedPropertyIdRef.current;
    const marker = activePropertyId
      ? markersRef.current.find((entry) => entry._propertyId === activePropertyId)
      : undefined;

    if (!map || !marker) {
      report(null);
      return;
    }

    const { x, y } = map.getProjection().fromCoordToOffset(marker.getPosition());
    report({ x, y });
  }, []);

  useEffect(() => {
    if (!getNaverMapClientId() || !containerRef.current) {
      return;
    }

    let cancelled = false;
    const listeners: unknown[] = [];
    const loadScripts =
      markerVariant === 'price' ? loadMarkerClusteringScript() : loadNaverMapsScript();

    loadScripts
      .then(() => {
        const naverMaps = window.naver?.maps;

        if (cancelled || !containerRef.current || !naverMaps) {
          return;
        }

        const { lat, lng } = initialCenterRef.current;
        const map = new naverMaps.Map(containerRef.current, {
          center: new naverMaps.LatLng(lat, lng),
          zoom: 12,
          minZoom: 7,
          maxZoom: 19,
          zoomControl: true,
        });

        mapRef.current = map;
        setMapReady(true);
        setMapError(null);

        listeners.push(
          naverMaps.Event.addListener(map, 'click', () => {
            onMapClickRef.current?.();
          }),
          // Fires throughout pan and zoom, which keeps the preview card glued
          // to its marker instead of jumping once the map settles.
          naverMaps.Event.addListener(map, 'bounds_changed', reportSelectedMarkerPosition),
          naverMaps.Event.addListener(map, 'idle', () => {
            const bounds = map.getBounds();
            const northEast = bounds.getNorthEast();
            const southWest = bounds.getSouthWest();

            onBoundsChangeRef.current?.({
              north: northEast.lat(),
              east: northEast.lng(),
              south: southWest.lat(),
              west: southWest.lng(),
            });
          }),
        );
      })
      .catch((error: Error) => {
        setMapError(error.message);
      });

    return () => {
      cancelled = true;
      listeners.forEach((listener) => window.naver?.maps?.Event.removeListener(listener));
      clusterRef.current?.setMap(null);
      clusterRef.current = null;
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      mapRef.current = null;
      setMapReady(false);
    };
  }, [markerVariant, reportSelectedMarkerPosition]);

  useEffect(() => {
    const map = mapRef.current;
    const naverMaps = window.naver?.maps;

    if (!mapReady || !map || !naverMaps) {
      return;
    }

    map.setCenter(new naverMaps.LatLng(centerLat, centerLng) as NaverLatLng);
  }, [centerLat, centerLng, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    const naverMaps = window.naver?.maps;

    if (!mapReady || !map || !naverMaps) {
      return;
    }

    clusterRef.current?.setMap(null);
    clusterRef.current = null;
    markersRef.current.forEach((marker) => marker.setMap(null));

    const markers: NaverMarker[] = [];

    if (markerVariant === 'pin') {
      properties.forEach((property) => {
        const [lat, lng] = normalizeLatLng(property.latitude, property.longitude);

        markers.push(
          new naverMaps.Marker({
            map,
            position: new naverMaps.LatLng(lat, lng),
            title: property.title,
          }),
        );
      });

      markersRef.current = markers;
      return;
    }

    for (const group of groupByCoord(properties).values()) {
      group.forEach((property, index) => {
        const [lat, lng] = normalizeLatLng(property.latitude, property.longitude);
        const marker = new naverMaps.Marker({
          position: new naverMaps.LatLng(lat, lng),
          icon: {
            content: `<div class="map-price-marker">${formatMarkerPrice(property.monthlyPriceMin, currency)}+</div>`,
            anchor: new naverMaps.Point(20, 10 - index * MARKER_STACK_OFFSET_PX),
          },
        });

        marker._propertyId = property.id;

        naverMaps.Event.addListener(marker, 'click', () => {
          onSelectPropertyRef.current?.(property.id);
        });

        markers.push(marker);
      });
    }

    markersRef.current = markers;

    if (window.MarkerClustering && naverMaps.Util && markers.length > 0) {
      clusterRef.current = new window.MarkerClustering({
        map,
        markers,
        disableClickZoom: false,
        minClusterSize: 2,
        maxZoom: CLUSTER_MAX_ZOOM,
        gridSize: CLUSTER_GRID_SIZE,
        icons: [
          {
            content: '<div class="map-cluster-marker"></div>',
            size: new naverMaps.Size(CLUSTER_ICON_SIZE, CLUSTER_ICON_SIZE),
            anchor: new naverMaps.Point(CLUSTER_ICON_SIZE / 2, CLUSTER_ICON_SIZE / 2),
          },
        ],
        stylingFunction: (clusterMarker, count) => {
          const element = clusterMarker.getElement()?.querySelector('.map-cluster-marker');

          if (element) {
            element.textContent = String(count);
          }
        },
      });
    } else {
      markers.forEach((marker) => marker.setMap(map));
    }
  }, [properties, mapReady, markerVariant, currency]);

  useEffect(() => {
    updateMarkerPresentation(markersRef.current, selectedPropertyId, hoveredPropertyId);
    reportSelectedMarkerPosition();
  }, [selectedPropertyId, hoveredPropertyId, properties, reportSelectedMarkerPosition]);

  if (mapError) {
    return (
      <div
        className={
          fullBleed
            ? 'bg-surface-muted text-ink-muted flex h-full min-h-[240px] items-center justify-center px-6 text-center text-sm'
            : 'border-surface-subtle bg-surface-muted text-ink-muted flex h-full min-h-[320px] items-center justify-center rounded-xl border px-6 text-center text-sm'
        }
      >
        {mapError}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={fullBleed ? 'h-full min-h-0 w-full' : 'h-full min-h-[320px] w-full rounded-xl'}
    />
  );
}

'use client';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

type MapItem = {
  id: string;
  title: string;
  kind: string;
  place: {
    latitude: number;
    longitude: number;
    label: string;
    city: string;
  };
};

type LeafletMap = {
  remove: () => void;
  setView: (coords: [number, number], zoom: number) => LeafletMap;
  fitBounds: (bounds: unknown, options?: unknown) => void;
};

declare global {
  interface Window {
    L?: {
      map: (element: HTMLElement) => LeafletMap;
      tileLayer: (url: string, options: Record<string, unknown>) => { addTo: (map: LeafletMap) => unknown };
      layerGroup: () => { addTo: (map: LeafletMap) => MarkerLayer };
      latLngBounds: (coords: unknown[]) => { extend: (coords: [number, number]) => void };
      marker: (coords: [number, number], options: Record<string, unknown>) => Marker;
    };
  }
}

type MarkerLayer = {
  addTo: (map: LeafletMap) => void;
  clearLayers: () => void;
};

type Marker = {
  bindPopup: (content: string | HTMLElement) => Marker;
  on: (event: string, callback: () => void) => Marker;
  addTo: (layer: MarkerLayer) => void;
};

function loadLeafletAssets() {
  const cssId = 'leaflet-css';
  const scriptId = 'leaflet-script';

  if (!document.getElementById(cssId)) {
    const link = document.createElement('link');
    link.id = cssId;
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);
  }

  return new Promise<void>((resolve, reject) => {
    if (window.L) {
      resolve();
      return;
    }

    const existing = document.getElementById(scriptId);
    if (existing) {
      if (window.L) {
        resolve();
      } else {
        const fallbackId = setTimeout(() => {
          if (window.L) resolve();
          else reject(new Error('Leaflet script load timeout'));
        }, 10000);
        existing.addEventListener('load', () => { clearTimeout(fallbackId); resolve(); });
        existing.addEventListener('error', () => { clearTimeout(fallbackId); reject(new Error('Failed to load Leaflet script')); });
      }
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';

    const timeoutId = setTimeout(() => {
      reject(new Error('Leaflet script load timeout'));
    }, 10000);

    script.onload = () => {
      clearTimeout(timeoutId);
      resolve();
    };
    script.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('Failed to load Leaflet script'));
    };

    document.body.appendChild(script);
  });
}

export function SocialMapCanvas({
  items,
  selectedItemId,
  onSelect
}: {
  items: MapItem[];
  selectedItemId: string | null;
  onSelect: (itemId: string) => void;
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<MarkerLayer | null>(null);
  const onSelectRef = useRef(onSelect);
  useLayoutEffect(() => {
    onSelectRef.current = onSelect;
  });

  const selected = useMemo(() => items.find((item) => item.id === selectedItemId) || null, [items, selectedItemId]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      await loadLeafletAssets();
      if (!mounted || !mapRef.current || leafletMapRef.current) return;

      const leaflet = window.L;
      if (!leaflet) return;

      const map = leaflet.map(mapRef.current).setView([41.3874, 2.1686], 12);
      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      markerLayerRef.current = leaflet.layerGroup().addTo(map);
      leafletMapRef.current = map;
    })();

    return () => {
      mounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const leaflet = window.L;
    if (!leaflet || !leafletMapRef.current || !markerLayerRef.current) return;
    markerLayerRef.current.clearLayers();

    const bounds = leaflet.latLngBounds([]);
    for (const item of items) {
      const marker = leaflet.marker([item.place.latitude, item.place.longitude], {
        title: item.title
      });
      const popup = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = item.title;
      const br = document.createElement('br');
      const span = document.createElement('span');
      span.textContent = `${item.kind} · ${item.place.label}`;
      popup.appendChild(strong);
      popup.appendChild(br);
      popup.appendChild(span);
      marker.bindPopup(popup);
      marker.on('click', () => onSelectRef.current(item.id));
      marker.addTo(markerLayerRef.current);
      bounds.extend([item.place.latitude, item.place.longitude]);
    }

    if (items.length) leafletMapRef.current.fitBounds(bounds, { padding: [25, 25] });
  }, [items]);

  useEffect(() => {
    if (!leafletMapRef.current || !selected) return;
    leafletMapRef.current.setView([selected.place.latitude, selected.place.longitude], 14);
  }, [selected]);

  return <div ref={mapRef} className="h-[420px] w-full rounded-md border" />;
}

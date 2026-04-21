'use client';

import { useEffect, useMemo, useRef } from 'react';

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
  bindPopup: (content: string) => Marker;
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

  if (!document.getElementById(scriptId)) {
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    document.body.appendChild(script);
  }

  return new Promise<void>((resolve) => {
    const wait = () => {
      if (window.L) resolve();
      else setTimeout(wait, 50);
    };
    wait();
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
      marker.bindPopup(`<strong>${item.title}</strong><br/>${item.kind} · ${item.place.label}`);
      marker.on('click', () => onSelect(item.id));
      marker.addTo(markerLayerRef.current);
      bounds.extend([item.place.latitude, item.place.longitude]);
    }

    if (items.length) leafletMapRef.current.fitBounds(bounds, { padding: [25, 25] });
  }, [items, onSelect]);

  useEffect(() => {
    if (!leafletMapRef.current || !selected) return;
    leafletMapRef.current.setView([selected.place.latitude, selected.place.longitude], 14);
  }, [selected]);

  return <div ref={mapRef} className="h-[420px] w-full rounded-md border" />;
}

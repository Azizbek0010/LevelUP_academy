import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

const YANDEX_KEY = import.meta.env.VITE_YANDEX_KEY;

let scriptLoaded = false;
let scriptLoading = false;
const listeners = [];

function loadYMapsScript(key) {
  return new Promise((resolve, reject) => {
    if (window.ymaps3 && window.ymaps3.ready) {
      resolve();
      return;
    }
    if (scriptLoaded) {
      resolve();
      return;
    }
    listeners.push({ resolve, reject });
    if (scriptLoading) return;
    scriptLoading = true;

    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/3.0/?lang=ru_RU&apikey=${key}&theme=light`;
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      listeners.forEach((l) => l.resolve());
      listeners.length = 0;
    };
    script.onerror = (e) => {
      scriptLoading = false;
      listeners.forEach((l) => l.reject(e));
      listeners.length = 0;
    };
    document.head.appendChild(script);
  });
}

export default function YMapPicker({ value, onChange, height = 260 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  if (!YANDEX_KEY) {
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center gap-3 bg-base-200 rounded-xl border border-base-300"
      >
        <MapPin size={32} className="text-base-content/30" />
        <p className="text-sm text-base-content/50">
          Добавьте <code className="bg-base-300 px-1 rounded">VITE_YANDEX_KEY</code> в .env
        </p>
      </div>
    );
  }

  useEffect(() => {
    let cancelled = false;

    loadYMapsScript(YANDEX_KEY)
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((e) => {
        if (!cancelled) setError('Не удалось загрузить Yandex Maps');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current) return;

    const ymaps3 = window.ymaps3;

    let destroyed = false;

    ymaps3.ready.then(() => {
      if (destroyed || !containerRef.current) return;

      const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapListener, YMapMarker } = ymaps3;

      const center = value ? [value.lng, value.lat] : [69.2401, 41.2995];
      const zoom = value ? 15 : 11;

      const map = new YMap(containerRef.current, {
        location: { center, zoom },
      });

      map.addChild(new YMapDefaultSchemeLayer({}));
      map.addChild(new YMapDefaultFeaturesLayer({}));

      // Marker element
      const markerEl = document.createElement('div');
      markerEl.innerHTML = '<div style="font-size:28px;margin-top:-28px;margin-left:-14px">📍</div>';

      let marker = null;

      if (value) {
        marker = new YMapMarker({ coordinates: [value.lng, value.lat] }, markerEl);
        map.addChild(marker);
        markerRef.current = marker;
      }

      const listener = new YMapListener({
        layer: 'any',
        onClick(_, event) {
          const [lng, lat] = event.coordinates;

          if (marker) {
            map.removeChild(marker);
          }

          const newEl = document.createElement('div');
          newEl.innerHTML = '<div style="font-size:28px;margin-top:-28px;margin-left:-14px">📍</div>';
          marker = new YMapMarker({ coordinates: [lng, lat] }, newEl);
          map.addChild(marker);
          markerRef.current = marker;

          if (onChange) onChange({ lat, lng });
        },
      });

      map.addChild(listener);
      mapRef.current = map;
    });

    return () => {
      destroyed = true;
      if (mapRef.current) {
        try {
          mapRef.current.destroy();
        } catch (_) {}
        mapRef.current = null;
      }
    };
  }, [ready]);

  if (error) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center bg-base-200 rounded-xl border border-error/30"
      >
        <p className="text-sm text-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-base-300" style={{ height }}>
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-base-200 z-10">
          <span className="loading loading-spinner loading-md text-primary" />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />

      {/* Hint */}
      {ready && !value && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-base-100/90 backdrop-blur-sm text-xs px-3 py-1.5 rounded-full shadow text-base-content/70">
            Нажмите на карту чтобы отметить место
          </div>
        </div>
      )}

      {/* Coordinates badge */}
      {value && (
        <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
          <div className="bg-base-100/90 backdrop-blur-sm text-xs px-2.5 py-1 rounded-full shadow font-mono text-base-content/70">
            {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
          </div>
        </div>
      )}
    </div>
  );
}

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
    /* Без `theme`: JS API 3.0 такого параметра не знает и отвечает
       400 Bad Request — `Error validating query: "theme" is not allowed`.
       То есть скрипт карт не загружался вообще, независимо от ключа.
       Проверено запросом к api-maps.yandex.ru: с `theme` — 400, без него
       ключ доходит до проверки прав. */
    script.src = `https://api-maps.yandex.ru/3.0/?lang=ru_RU&apikey=${key}`;
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

/**
 * `onUnavailable` — сообщить наверх, что карта не поднялась.
 *
 * Нужно, чтобы форма филиала не превращалась в тупик: точку на карте мы
 * требуем при создании, но если сам сервис недоступен (нет ключа, не
 * применились ограничения, Яндекс отвечает 503), поставить её физически
 * нечем — и тогда требование надо снимать, иначе филиал не создать вообще.
 */
export default function YMapPicker({ value, onChange, height = 260, onUnavailable }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  if (!YANDEX_KEY) {
    onUnavailable?.(true);
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
        if (!cancelled) { setReady(true); onUnavailable?.(false); }
      })
      .catch(() => {
        /* Самая частая причина — не сам код, а ключ: у JS API 3.0 обязательны
           ограничения по HTTP referer, и пока они не заданы, Яндекс отвечает
           429 «limited», а с чужого домена — 403 «Invalid api key».
           Пишем это прямо, иначе поиск причины начинается с кода. */
        if (!cancelled) {
          onUnavailable?.(true);
          setError(
            'Карта не загрузилась. Проверьте ключ Яндекса: в кабинете разработчика ' +
            'у него должны быть заданы ограничения по HTTP referer для этого домена.',
          );
        }
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
          <span className="loading loading-spinner loading-md text-base-content/40" />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

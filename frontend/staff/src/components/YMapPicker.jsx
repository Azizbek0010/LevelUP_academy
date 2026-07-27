import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

const YANDEX_KEY = import.meta.env.VITE_YANDEX_KEY;
const TASHKENT = [69.2401, 41.2995];

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

function markerElement() {
  const el = document.createElement('div');
  el.innerHTML = '<div style="font-size:28px;margin-top:-28px;margin-left:-14px">📍</div>';
  return el;
}

/**
 * Карта Яндекса с одной точкой: выбор точки или её показ.
 *
 * `readOnly` — только показать. Тогда карта не слушает клики (случайно
 * сдвинуть филиал на странице просмотра нельзя) и не перехватывает колесо
 * мыши, иначе прокрутка страницы застревала бы на карте.
 *
 * `onUnavailable` — сообщить наверх, что карта не поднялась. Нужно, чтобы
 * форма филиала не превращалась в тупик: точку мы требуем при создании, но
 * если сам сервис недоступен (нет ключа, не применились ограничения, Яндекс
 * отвечает 503), поставить её физически нечем — и требование надо снимать,
 * иначе филиал не создать вообще.
 */
export default function YMapPicker({ value, onChange, height = 260, onUnavailable, readOnly = false }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [mapLive, setMapLive] = useState(false);
  const [error, setError] = useState(null);

  /* Обработчик и текущее значение — через ref: карта создаётся один раз и
     замыкает в себе то, что было на момент создания. Без этого клик по карте
     звал бы первый onChange, а метка не двигалась бы вслед за координатами,
     набранными руками в полях. */
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const fromMapRef = useRef(false);
  const prevRef = useRef(null);

  useEffect(() => { onChangeRef.current = onChange; });
  valueRef.current = value;

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

  // создание карты
  useEffect(() => {
    if (!ready || !containerRef.current) return undefined;

    const ymaps3 = window.ymaps3;
    let destroyed = false;

    ymaps3.ready.then(() => {
      if (destroyed || !containerRef.current) return;

      const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapListener } = ymaps3;
      const v = valueRef.current;

      const map = new YMap(containerRef.current, {
        location: {
          center: v?.lat != null && v?.lng != null ? [v.lng, v.lat] : TASHKENT,
          zoom: v?.lat != null && v?.lng != null ? 16 : 11,
        },
        // на странице просмотра карта не должна воровать прокрутку страницы
        ...(readOnly ? { behaviors: ['drag', 'pinchZoom', 'dblClick'] } : {}),
      });

      map.addChild(new YMapDefaultSchemeLayer({}));
      map.addChild(new YMapDefaultFeaturesLayer({}));

      if (!readOnly) {
        map.addChild(new YMapListener({
          layer: 'any',
          onClick(_, event) {
            const [lng, lat] = event.coordinates;
            // метку ставит эффект синхронизации — по значению сверху, а не тут,
            // иначе на карте была бы одна точка, а в полях другая
            fromMapRef.current = true;
            onChangeRef.current?.({ lat, lng });
          },
        }));
      }

      mapRef.current = map;
      setMapLive(true);
    });

    return () => {
      destroyed = true;
      markerRef.current = null;
      setMapLive(false);
      if (mapRef.current) {
        try {
          mapRef.current.destroy();
        } catch (_) {}
        mapRef.current = null;
      }
    };
  }, [ready, readOnly]);

  // метка следует за значением: и за кликом, и за координатами из полей
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLive) return;

    const lat = value?.lat;
    const lng = value?.lng;
    const has = lat != null && lng != null;

    if (markerRef.current) {
      try { map.removeChild(markerRef.current); } catch (_) {}
      markerRef.current = null;
    }

    if (has) {
      const marker = new window.ymaps3.YMapMarker({ coordinates: [lng, lat] }, markerElement());
      map.addChild(marker);
      markerRef.current = marker;

      /* Подвинуть карту к точке — только если точка приехала не с самой карты
         и прыжок заметный: иначе карта дёргалась бы под курсором на каждый
         клик и на каждую цифру, набранную в поле координат. */
      const prev = prevRef.current;
      const jumped = !prev || Math.abs(prev.lat - lat) > 0.02 || Math.abs(prev.lng - lng) > 0.02;
      if (!fromMapRef.current && jumped) {
        try { map.setLocation({ center: [lng, lat], zoom: 16, duration: 300 }); } catch (_) {}
      }
    }

    prevRef.current = has ? { lat, lng } : null;
    fromMapRef.current = false;
  }, [value?.lat, value?.lng, mapLive]);

  if (error) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center bg-base-200 rounded-xl border border-error/30 p-4"
      >
        <p className="text-sm text-error text-center">{error}</p>
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

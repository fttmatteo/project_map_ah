import { useEffect, useState } from "react";
import {APIProvider, Map,useMap, useMapsLibrary, AdvancedMarker} from "@vis.gl/react-google-maps";

// Constantes globales con las coordenadas y etiquetas por defecto si el usuario no ingresa nada.
export const TARGET_DEFAULTS = {
  pointA: {
    lat: 6.2319,
    lng: -75.5681,
    label: "Medellín, CO",
    photoUrl:
      "https://images.unsplash.com/photo-1596708453982-12a8ab45187e?q=80&w=200&auto=format&fit=crop",
  },
  pointB: {
    lat: 4.711,
    lng: -74.0721,
    label: "Bogotá, CO",
    photoUrl:
      "https://images.unsplash.com/photo-1593563914876-c222ff433b00?q=80&w=200&auto=format&fit=crop",
  },
};

// Componente que se encarga de calcular y trazar la línea de color (ruta) entre dos puntos.
// También maneja y captura los diferentes tipos de errores (Zero Results, Quota, Denied).
const DirectionsProvider = ({
  origin,
  destination,
  setDuration,
  setRouteError,
}) => {
  const map = useMap(); // Obtenemos la instancia nativa del mapa
  const routesLibrary = useMapsLibrary("routes"); // Cargamos la librería de rutas
  const [directionsService, setDirectionsService] = useState();
  const [directionsRenderer, setDirectionsRenderer] = useState();

  // Inicializa el servicio que calcula la ruta matemática y el que la pinta en el mapa (Renderer)
  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    setDirectionsRenderer(
      new routesLibrary.DirectionsRenderer({ map, suppressMarkers: true }), // suppressMarkers quita los pines A y B por defecto
    );
  }, [routesLibrary, map]);

  // Se ejecuta cada vez que cambia el Origen o el Destino para solicitar a Google la nueva ruta
  useEffect(() => {
    if (!directionsService || !directionsRenderer) return;

    if (!navigator.onLine) {
      setRouteError("Sin conexión a Internet. Verifica tu red.");
      alert("Atención: No hay conexión a internet activa.");
      return;
    }

    setRouteError(null);
    setDuration(null);

    // Pide la ruta en modo "Manejo/Conducción"
    directionsService
      .route({
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      })
      .then((response) => {
        directionsRenderer.setDirections(response); // Dibuja la línea azul
        const route = response.routes[0];
        if (route && route.legs && route.legs.length > 0) {
          setDuration(route.legs[0].duration.text); // Guarda "2 horas 15 min" en el estado
        }
      })
      .catch((e) => {
        console.error("Error devuelto por la API de Google Maps: ", e);
        directionsRenderer.setDirections({ routes: [] }); // Borra cualquier línea vieja

        // Validación exhaustiva de los errores devueltos por Google Cloud
        const status = e.code;
        switch (status) {
          case "OVER_QUERY_LIMIT":
            setRouteError("Límite de peticiones excedido. Intenta más tarde.");
            alert(
              "Atención: Has superado el límite gratuito de Google Maps API.",
            );
            break;
          case "REQUEST_DENIED":
            setRouteError(
              "Acceso denegado. Revisa la cuenta de facturación y los permisos en Google Cloud.",
            );
            alert(
              "Atención: La API ha denegado la solicitud (REQUEST_DENIED).",
            );
            break;
          case "ZERO_RESULTS":
            setRouteError(
              "Ruta no disponible. No hay carreteras que unan estos puntos.",
            );
            break;
          default:
            setRouteError("Error desconocido al calcular la ruta.");
        }
      });
  }, [
    directionsService,
    directionsRenderer,
    origin,
    destination,
    setDuration,
    setRouteError,
  ]);

  return null; // Este componente no renderiza HTML directo, opera en 2do plano sobre el mapa
};

// Componente de UI que renderiza exclusivamente el círculo de la fotografía.
// Usa una estrategia en cascada de respaldos visuales (Street View -> Wikipedia -> Foto Quema)
const MarkerPhoto = ({ position, label, fallbackUrl, onClick }) => {
  const [currentUrl, setCurrentUrl] = useState(fallbackUrl);
  const streetViewLibrary = useMapsLibrary("streetView");

  // Efecto que busca la mejor imagen para este marcador geográfico
  useEffect(() => {
    setCurrentUrl(fallbackUrl);

    if (!streetViewLibrary) return;

    // Función auxiliar que busca en internet la foto principal de la ciudad/barrio en Wikipedia
    const fetchCityPhoto = async () => {
      try {
        const city = label.split(",")[0].trim();
        const res = await fetch(
          `https://es.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(city)}&origin=*`,
        );
        const data = await res.json();
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];

        if (
          pageId !== "-1" &&
          pages[pageId].original &&
          pages[pageId].original.source
        ) {
          return pages[pageId].original.source;
        }
        return fallbackUrl;
      } catch (err) {
        return fallbackUrl; // Ante error de red o de Wikipedia, devuelve un Unsplash
      }
    };

    const svService = new streetViewLibrary.StreetViewService();
    // Busca foto callejera en 50 metros a la redonda del marcador
    svService
      .getPanorama({ location: position, radius: 50 })
      .then(({ data }) => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        const panoId = data.location.pano;
        const staticUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x600&pano=${panoId}&key=${apiKey}`;

        // Validación extra por si la Cloud Platform frena (ej. 403 Forbidden) la imagen generada
        const img = new Image();
        img.onload = () => setCurrentUrl(staticUrl); // Éxito!
        img.onerror = async () => {
          const cityImg = await fetchCityPhoto(); // Falló por permisos, cae a Wikipedia
          setCurrentUrl(cityImg);
        };
        img.src = staticUrl;
      })
      .catch(async () => {
        const cityImg = await fetchCityPhoto(); // Falló por falta de carreteras/zonas (selva), cae a Wikipedia
        setCurrentUrl(cityImg);
      });
  }, [streetViewLibrary, position, label, fallbackUrl]);

  return (
    <div
      className="marker-photo"
      style={{ backgroundImage: `url('${currentUrl}')`, cursor: "pointer" }}
      title={`Foto de ${label}`}
      onClick={() => onClick(currentUrl)}
    ></div>
  );
};

// Componente CustomMarker envuelve el MarkerPhoto y añade la etiqueta de texto debajo.
// Es un <AdvancedMarker> que ancla los elementos de React como verdaderos marcadores nativos en el Canvas.
const CustomMarker = ({
  position,
  label,
  fallbackUrl,
  letter,
  onPhotoClick,
}) => {
  return (
    <AdvancedMarker position={position} zIndex={letter === "A" ? 101 : 100}>
      <div className="custom-marker">
        <div className="marker-badge">{letter}</div>
        <MarkerPhoto
          position={position}
          label={label}
          fallbackUrl={fallbackUrl}
          onClick={onPhotoClick}
        />
        <div className="marker-label">{label}</div>
      </div>
    </AdvancedMarker>
  );
};

// Ventana flotante estilo Modal oscura que aparece al dar click a la foto miniatura
const ImageModal = ({ url, onClose }) => {
  if (!url) return null; // Si no hay foto en el state, se desaparece

  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="image-modal-close" onClick={onClose}>
          &times;
        </button>
        <img src={url} alt="Vista ampliada del lugar" />
      </div>
    </div>
  );
};

// Componente Maestro de UI
// Contiene la tarjeta de Glassmorphism (inputs/textos) y el componente Map (lienzo geográfico)
const MapUI = ({ apiKey, mapId }) => {
  const geocodingLibrary = useMapsLibrary("geocoding"); // Librería para convertir Texto a Coordenada
  const [geocoder, setGeocoder] = useState(null);
  const [expandedPhotoUrl, setExpandedPhotoUrl] = useState(null);

  const [activeRoute, setActiveRoute] = useState(TARGET_DEFAULTS); // Estado de ruta central
  const [duration, setDuration] = useState(null);
  const [routeError, setRouteError] = useState(null);

  const [originInput, setOriginInput] = useState(TARGET_DEFAULTS.pointA.label);
  const [destInput, setDestInput] = useState(TARGET_DEFAULTS.pointB.label);
  const [isSearching, setIsSearching] = useState(false);

  // Instancia el geocoder una vez la librería ha cargado desde el CDN de Google.
  useEffect(() => {
    if (geocodingLibrary) {
      setGeocoder(new geocodingLibrary.Geocoder());
    }
  }, [geocodingLibrary]);

  // Se ejecuta cuando el usuario presiona el botón "Calcular Ruta"
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!geocoder || !originInput || !destInput) return;

    setIsSearching(true);
    setRouteError(null);
    setDuration(null);

    try {
      // Promise wrapper para geocodificar Origen
      const geocodeOrigin = new Promise((resolve, reject) => {
        geocoder.geocode({ address: originInput }, (results, status) => {
          if (status === "OK" && results[0]) resolve(results[0]);
          else reject(`"${originInput}" no encontrado`);
        });
      });

      // Promise wrapper para geocodificar Destino
      const geocodeDest = new Promise((resolve, reject) => {
        geocoder.geocode({ address: destInput }, (results, status) => {
          if (status === "OK" && results[0]) resolve(results[0]);
          else reject(`"${destInput}" no encontrado`);
        });
      });

      // Lanza ambas peticiones de red simultáneamente (Paralelo)
      const [originResult, destResult] = await Promise.all([
        geocodeOrigin,
        geocodeDest,
      ]);

      // Si todo sale bien, guarda el resultado final en el estado activeRoute
      setActiveRoute({
        pointA: {
          lat: originResult.geometry.location.lat(),
          lng: originResult.geometry.location.lng(),
          label: originResult.formatted_address.split(",")[0],  // Se queda con la primera parte de "Bogota, Bogota, Colombia"
          photoUrl: TARGET_DEFAULTS.pointA.photoUrl,
        },
        pointB: {
          lat: destResult.geometry.location.lat(),
          lng: destResult.geometry.location.lng(),
          label: destResult.formatted_address.split(",")[0],
          photoUrl: TARGET_DEFAULTS.pointB.photoUrl,
        },
      });
    } catch (err) {
      setRouteError(`Error de ubicación: ${err}`);
      alert(err);
    } finally {
      setIsSearching(false);
    }
  };

  // Posición de la cámara automática: Centro matemático entre los puntos
  const center = {
    lat: (activeRoute.pointA.lat + activeRoute.pointB.lat) / 2,
    lng: (activeRoute.pointA.lng + activeRoute.pointB.lng) / 2,
  };

  return (
    <>
      <div className="info-panel glass">
        <h1>Buscador de Rutas</h1>
        
        {/* Panel Formulario con Inputs y Labels interactivos */}
        <form className="search-form" onSubmit={handleSearch}>
          <div className="input-row">
            <span className="input-badge badge-a">A</span>
            <input
              type="text"
              className="search-input"
              placeholder="Desde... ej: Medellín"
              value={originInput}
              onChange={(e) => setOriginInput(e.target.value)}
            />
          </div>
          <div className="input-row">
            <span className="input-badge badge-b">B</span>
            <input
              type="text"
              className="search-input"
              placeholder="Hasta... ej: Bogotá"
              value={destInput}
              onChange={(e) => setDestInput(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="search-button"
            disabled={isSearching}
          >
            {isSearching ? "Buscando..." : "Calcular Ruta"}
          </button>
        </form>

        {/* Tarjetas inferiores: Muestra Error de conducción, de lo contrario muestra la Duración */}
        {routeError ? (
          <div className="error-box">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{routeError}</span>
          </div>
        ) : (
          <div className="duration-box">
            <span className="duration-title">Tiempo Estimado de Viaje</span>
            <span className="duration-value">
              {duration || (isSearching ? "Buscando..." : "Calculando...")}
            </span>
          </div>
        )}
      </div>

      {/* Vis.gl Map - El corazón visual del mapa */}
      <Map
        defaultCenter={center}
        defaultZoom={4}
        mapId={mapId}
        disableDefaultUI={true}
        styles={[
          {
            featureType: "poi",
            stylers: [{ visibility: "off" }],
          },
          {
            featureType: "transit",
            stylers: [{ visibility: "off" }],
          },
        ]}
      >
        <DirectionsProvider
          origin={activeRoute.pointA}
          destination={activeRoute.pointB}
          setDuration={setDuration}
          setRouteError={setRouteError}
        />
        <CustomMarker
          position={activeRoute.pointA}
          label={activeRoute.pointA.label}
          fallbackUrl={activeRoute.pointA.photoUrl}
          letter="A"
          onPhotoClick={setExpandedPhotoUrl}
        />
        <CustomMarker
          position={activeRoute.pointB}
          label={activeRoute.pointB.label}
          fallbackUrl={activeRoute.pointB.photoUrl}
          letter="B"
          onPhotoClick={setExpandedPhotoUrl}
        />
      </Map>

      <ImageModal
        url={expandedPhotoUrl}
        onClose={() => setExpandedPhotoUrl(null)}
      />
    </>
  );
};

// COMPONENTE PRINCIPAL (Entry Point de toda la página)
// Protege el resto de las validaciones de UI confirmando que haya API Keys. 
// Provee el Context general (<APIProvider>) al resto de funciones.
export default function MapRoute() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

  if (!apiKey || !mapId) {
    return (
      <div className="fatal-error-container">
        <h1>Error Crítico del Sistema</h1>
        <p>
          No se encontraron las credenciales de Google Maps. Verifica tu{" "}
          <code>.env</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="map-container">
      <APIProvider apiKey={apiKey}>
        <MapUI apiKey={apiKey} mapId={mapId} />
      </APIProvider>
    </div>
  );
}

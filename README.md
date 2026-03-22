# Interactive React Route Searcher (Google Maps Platform) 🌍

*[Leer versión en Español abajo ⬇️]*

## English Version

A modern, highly interactive web application built with **React** and **Vite** that allows users to seamlessly calculate travel routes between two locations using the Google Maps Platform. Designed with a sleek, dark-mode *Glassmorphism* user interface.

### ✨ Features
- **Dynamic Text Geocoding:** Type any city, neighborhood, or landmark into the custom floating inputs to instantly calculate travel possibilities.
- **Smart Photo Markers (3-Layer Fallback):** Custom map markers automatically fetch an immersive **Google Street View** 360° thumbnail of the destination. If blocked by access limits or unavailable, it crawls **Wikipedia's Public API** for an official city photo, finally defaulting to an Unsplash placeholder to ensure the UI is never empty.
- **Interactive Fullscreen Modal:** Click on any marker's round photo to expand it to the full screen.
- **Robust Error Handling:** Five layers of error architecture intercept routing failures (e.g. no roads connecting continents), quota limits, network outages, and missing API keys gracefully—keeping the application alive via beautiful UI alerts instead of breaking the page.
- **A/B Waypoints UI:** Origin and Destination are easily identifiable on the search bubble and visually bound to custom Google `AdvancedMarker` tags on the map.

### 🛠️ Tech Stack
- **Frontend Framework:** React (Vite environment)
- **Map Renderer:** `@vis.gl/react-google-maps` (Official Google library)
- **Styling:** Vanilla CSS (Advanced Glassmorphism & Animations)
- **APIs Used:** 
  - Geocoding API (Text to Coordinates)
  - Directions API (Route Math & Travel Time calculation)
  - Street View Static API (Marker thumbnails)
  - Wikipedia Open API (Fallback photography)

### 🚀 How to Run Locally

1. **Clone & Install:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file in the root of the project with your valid Google Maps Platform keys:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   VITE_GOOGLE_MAPS_MAP_ID=your_advanced_map_id_here
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```

---

## Versión en Español

Una aplicación web moderna y altamente interactiva construida con **React** y **Vite** que permite a los usuarios calcular sin esfuerzo rutas de viaje entre dos ubicaciones utilizando la plataforma de Google Maps. Diseñada con una elegante interfaz de usuario *Glassmorphism* (Efecto Cristal) en modo oscuro.

### ✨ Características Principales
- **Buscador de Texto Dinámico (Geocoding):** Escribe cualquier ciudad, barrio o punto de interés en los inputs flotantes para calcular instantáneamente las posibilidades de viaje.
- **Marcadores Fotográficos Inteligentes (Respaldo de 3 Capas):** Los marcadores personalizados obtienen automáticamente una miniatura inmersiva de **Google Street View 360°** del lugar. Si esta se bloquea por permisos o no está disponible (ej. una selva remota), el sistema acude a **la API Pública de Wikipedia** en busca de una foto oficial de la ciudad, usando finalmente un marcador genérico decorativo para garantizar que el mapa jamás quede vacío.
- **Modal Interactivo a Pantalla Completa:** Haz clic en la fotografía redonda de cualquier marcador para expandirla en alta resolución.
- **Manejo Robusto de Errores:** Una arquitectura de cinco fases intercepta de forma amigable los fallos de enrutamiento (ej. intentar conducir entre dos continentes a través del océano), topes de límite de facturación (cuotas), caídas de red local, o falta de API Keys nativas; manteniendo la aplicación estable mediante bonitas alertas visuales en vez de romper la interfaz.
- **Identificadores Visuales A/B:** Tanto el origen como el destino son fácilmente identificables en la burbuja de búsqueda y atados a etiquetas de tipo `AdvancedMarker` posicionadas matemáticamente precisas sobre el mapa.

### 🛠️ Tecnologías Usadas
- **Entorno Frontend:** React (Vite)
- **Renderizador del Mapa:** `@vis.gl/react-google-maps` (Librería oficial de Google)
- **Diseño:** Vanilla CSS (Glassmorphism avanzado & Animaciones CSS3)
- **APIs Implementadas:** 
  - Geocoding API (Conversión Texto a Coordenada Numérica)
  - Directions API (Trazado y Matemática de Tiempo de Viaje)
  - Street View Static API (Fotografías miniatura de ciudades)
  - Wikipedia Open API (Fotografía inteligente de respaldo)

### 🚀 Cómo Ejecutar Localmente

1. **Instalar Dependencias:**
   ```bash
   npm install
   ```

2. **Variables de Entorno:**
   Crea un archivo `.env` en la raíz del proyecto para alojar de forma segura tus credenciales de Google Platform:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=tu_clave_de_api_de_google_aqui
   VITE_GOOGLE_MAPS_MAP_ID=tu_map_id_avanzado_aqui
   ```

3. **Ejecutar el Servidor Demos:**
   ```bash
   npm run dev
   ```

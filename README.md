# UNEFA Manager — Asistente Académico Virtual (PWA)

Progressive Web App del Asistente Virtual Académico dirigido a la comunidad universitaria de la **UNEFA Núcleo Apure** (estudiantes, docentes y personal administrativo).

---

## Arquitectura del Sistema

> **Este repositorio contiene únicamente el Frontend (PWA).**

El procesamiento de IA, el RAG de reglamentos, el web scraping del calendario académico y la síntesis de voz (ElevenLabs) residen en un **backend remoto (VPS)** desarrollado de forma independiente. La comunicación entre ambos sistemas se realiza mediante peticiones HTTP con payloads JSON:

```
┌─────────────────┐         HTTP / JSON          ┌─────────────────┐
│   PWA Frontend  │  ◄──────────────────────────► │  Backend (VPS)  │
│   (este repo)   │                               │  IA · RAG · TTS │
└─────────────────┘                               └─────────────────┘
```

**Payload de envío:**
```json
{
  "mensaje": "¿Cuándo inician las inscripciones?",
  "rol": "E",
  "timestamp": "2026-06-06T04:30:00.000Z"
}
```

**Payload de respuesta (esperado):**
```json
{
  "respuesta": "Las inscripciones inician el ...",
  "audio_url": "https://vps.example.com/audio/abc123.mp3"
}
```

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| Bundler | [Vite](https://vitejs.dev/) | ^5.2 |
| UI | [React](https://react.dev/) | ^18.2 |
| Estilos | [Tailwind CSS](https://tailwindcss.com/) | ^3.4 |
| PWA | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | ^0.20 |
| PostCSS | autoprefixer + postcss | ^10.4 / ^8.4 |
| 3D (futuro) | Three.js | — |

---

## Estructura de Archivos

```
PWA-Virtual-Assistant/
├── index.html                  # Entry point HTML (PWA metas, iOS safe-area)
├── package.json                # Dependencias y scripts
├── vite.config.js              # Plugins: React + PWA
├── tailwind.config.js          # Paleta custom, fuentes, animaciones
├── postcss.config.js           # Pipeline de PostCSS
├── .gitignore
│
├── src/
│   ├── main.jsx                # Punto de entrada de React
│   ├── App.jsx                 # Layout principal (h-screen, sin scroll)
│   ├── index.css               # Directivas Tailwind + resets globales
│   │
│   ├── assets/
│   │   └── unefa_logo.png      # Logo institucional de la UNEFA
│   │
│   └── components/
│       ├── Header.jsx          # Branding + selector de rol (E / O)
│       ├── AvatarCanvas.jsx    # Placeholder para avatar 3D (Three.js)
│       ├── ChatHistory.jsx     # Historial de mensajes con scroll interno
│       └── ChatInput.jsx       # Input de texto + botón de enviar
│
└── skills/                     # Directorio reservado
```

---

## Componentes Principales

### `Header.jsx`
Barra superior con el logo de la UNEFA, el nombre de la app y un **selector de rol** desplegable:
- **E** — Estudiante
- **O** — Otro Personal

El rol seleccionado se incluye en el payload JSON que se enviará al backend.

### `AvatarCanvas.jsx`
Contenedor visual reservado para la futura integración de un **avatar 3D femenino** renderizado con Three.js. Actualmente muestra un placeholder con un anillo animado.

### `ChatHistory.jsx`
Área con scroll interno que muestra el historial de conversación. Diferencia visualmente los mensajes del usuario y del asistente con burbujas estilizadas.

### `ChatInput.jsx`
Formulario anclado al fondo de la pantalla con un campo de texto y un botón de envío. Imprime por consola el JSON del payload al enviar.

---

## Instalación y Desarrollo

### Requisitos previos
- [Node.js](https://nodejs.org/) >= 18.x
- npm >= 9.x

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/<tu-usuario>/PWA-Virtual-Assistant.git
cd PWA-Virtual-Assistant

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

La app estará disponible en `http://localhost:5173`.

### Build de producción

```bash
npm run build
npm run preview   # Previsualizar el build localmente
```

Los archivos generados se encuentran en la carpeta `dist/`.

---

## Diseño y Estética

La interfaz sigue una dirección de diseño **dark cinematic / command-center**:

- **Paleta:** Fondos de obsidiana profundo (`#0a0e1a` → `#1e253c`) con acento eléctrico teal (`#00e5c8`).
- **Tipografía:** [Syne](https://fonts.google.com/specimen/Syne) (display) + [Outfit](https://fonts.google.com/specimen/Outfit) (body).
- **Efectos:** Glassmorphism con `backdrop-blur`, textura de ruido sutil, anillo cónico pulsante en el avatar, micro-animaciones de entrada.
- **Layout:** Mobile-first, `h-screen` sin scroll de página, compatible con iOS safe-area (`viewport-fit=cover`).

---

## Roadmap

- [x] Scaffolding del proyecto (Vite + React + Tailwind + PWA)
- [x] Layout principal mobile-first sin scroll
- [x] Selector de rol (Estudiante / Otro Personal)
- [x] Área de chat con historial y input
- [x] Placeholder para avatar 3D
- [ ] Integración con backend (peticiones HTTP)
- [ ] Renderizado del avatar 3D con Three.js
- [ ] Reproducción de audio (respuesta TTS de ElevenLabs)
- [ ] Service Worker y caché offline
- [ ] Deploy de la PWA

---

## Equipo

Desarrollado como proyecto académico para la materia de **Lenguaje de Programación III** — UNEFA Núcleo Apure.
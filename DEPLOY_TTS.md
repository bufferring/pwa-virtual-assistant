# Despliegue de TTS en el Servidor Backend

## Resumen

Agregar endpoint `/tts` al backend existente para servir audio generado por **Edge TTS** (Microsoft Azure, gratis, sin API key).

---

## 1. Instalar dependencias en el servidor

SSH al servidor y ejecuta:

```bash
pip install edge-tts
```

---

## 2. Agregar el endpoint `/tts` al `main.py`

Añade estas importaciones al inicio de tu `main.py`:

```python
import edge_tts
import io
from fastapi.responses import StreamingResponse
```

Agrega este endpoint (antes del `if __name__` o similar):

```python
@app.get("/tts")
async def tts(text: str):
    communicate = edge_tts.Communicate(text, "es-MX-DaliaNeural")
    audio = b""
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio += chunk["data"]
    return StreamingResponse(io.BytesIO(audio), media_type="audio/mp3")
```

> **Nota:** No necesitas agregar CORS extra si ya está configurado en tu `main.py`.

---

## 3. Reiniciar el backend

En el servidor:

```bash
# reinicia tu servicio de FastAPI (systemd, docker, screen, etc.)
```

Verifica que el endpoint responde:

```bash
curl -s "https://unefa-asistente.duckdns.org/tts?text=hola" --max-time 20 > /dev/null && echo "OK"
```

---

## Voces disponibles (Edge TTS)

Para cambiar la voz, reemplaza `"es-MX-DaliaNeural"` en el endpoint:

| Idioma / Acento | Voz | Género |
|---|---|---|
| Español (México) | `es-MX-DaliaNeural` | Femenino |
| Español (México) | `es-MX-JorgeNeural` | Masculino |
| Español (España) | `es-ES-ElviraNeural` | Femenino |
| Español (España) | `es-ES-AlvaroNeural` | Masculino |
| Español (Argentina) | `es-AR-ElenaNeural` | Femenino |
| Español (Colombia) | `es-CO-SalomeNeural` | Femenino |

Listar todas las voces disponibles:

```bash
edge-tts --list-voices | grep es-
```

---

## Solución de problemas

- **Timeout en el frontend:** Aumenta el timeout de carga de audio en `tts.js` (actualmente 8s). Edge TTS puede tardar ~3-5s por oración.
- **CORS errors:** Asegúrate de que `allow_origins` en tu `main.py` incluya el dominio del frontend.
- **Edge TTS no instalado:** `pip install edge-tts`

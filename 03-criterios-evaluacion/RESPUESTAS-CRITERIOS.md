# Respuestas a los criterios de evaluación - RA3

## Proyecto: MediaLab ITC

Aplicación web local que reúne una biblioteca de archivos elegidos por el usuario, un reproductor de audio y vídeo, un visualizador de frecuencias, procesamiento con filtros, captura de una nota de voz y conversión de audio a WAV.

| Criterio | Evidencia en el proyecto |
| --- | --- |
| a) Entornos de desarrollo multimedia | Se compara el navegador como entorno multimedia: HTML5 ofrece `audio` y `video`; JavaScript permite crear controles y Canvas dibuja la información visual. Se elige el navegador porque no necesita instalar un framework ni servidor. |
| b) Captura, procesamiento y almacenamiento | `navigator.mediaDevices.getUserMedia` captura el micrófono; `MediaRecorder` graba; `Blob`, `File` y `URL.createObjectURL` guardan la grabación temporalmente en la biblioteca. |
| c) Conversión de formatos | `decodeAudioData` abre datos de audio compatibles y `crearWav` genera manualmente la cabecera WAV y las muestras PCM para descargar un archivo `.wav`. |
| d) Procesamiento multimedia | `AudioContext`, `AnalyserNode` y `BiquadFilter` procesan la señal. El usuario puede aplicar filtros pasa bajos o pasa altos y ver el espectro. |
| e) Eventos, tipos y excepciones | Se usan eventos `change`, `click`, `play`, `pause`, `timeupdate`, `loadedmetadata`, `error` y `dataavailable`. Se comprueba `audio/*` y `video/*`; los procesos de cámara, conversión y reproducción tienen `try/catch` o gestión de errores. |
| f) Animaciones | El espectro se dibuja en `canvas` con `requestAnimationFrame`. La práctica 03 muestra una animación Canvas mínima y separada. |
| g) Reproducción multimedia | El elemento `video` reproduce vídeo y también audio. Los controles propios llaman a `play`, `pause`, cambian `currentTime`, `volume` y `playbackRate`. |
| h) Depuración y documentación | El README explica ejecución y prueba. Se comprueba la sintaxis de JavaScript con Node, el árbol de Git y la interfaz en navegador. Los mensajes de estado informan de errores de tipo, reproducción, conversión o micrófono. |

## Mejora investigada

La conversión a WAV y la grabación de una nota de voz amplían el reproductor básico de los apuntes. Se han añadido de forma aislada y visible para que se puedan explicar: el usuario ve cuándo empieza a grabar, cuándo se añade la pista a la biblioteca y cuándo se descarga la conversión.

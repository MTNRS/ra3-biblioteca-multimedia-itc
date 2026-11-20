# Reporte de proyecto

## Información de generación

- **Fecha:** 2026-10-12 09:37:37 +0200
- **Usuario:** freak
- **Equipo:** JARVIS
- **Sistema operativo:** Windows
- **Arquitectura:** x86_64
- **Directorio de ejecución:** `C:/Users/freak/Downloads/jocarsa-generador-windows-x64 (1)`
- **Proyecto documentado:** `C:/Users/freak/Documents/DAM2-entregas/ra3-biblioteca-multimedia-itc`
- **HMAC-SHA-256 de autenticidad:** `4497b4bf251e44b036897a4227a8439a143f6f16c98b44e1059c6c7b818f880d`

> El HMAC-SHA-256 se calcula sobre el documento completo usando un secreto incluido en el programa y 64 ceros en el propio campo del HMAC. El secreto no se escribe en el informe. Este mecanismo permite comprobar integridad y que el documento fue generado con el mismo secreto.

## Estructura del proyecto

```
C:/Users/freak/Documents/DAM2-entregas/ra3-biblioteca-multimedia-itc
├── .gitignore
├── 01-ejercicios
│   ├── 01-controles-video
│   │   └── index.html
│   ├── 02-web-audio-canvas
│   │   └── index.html
│   └── 03-animacion-canvas
│       └── index.html
├── 02-proyecto-unidad
│   └── media-lab-itc
│       ├── aplicacion.js
│       ├── estilos.css
│       └── index.html
├── 03-criterios-evaluacion
│   └── RESPUESTAS-CRITERIOS.md
└── README.md
```

## Bases de datos SQLite

Esta sección documenta únicamente el esquema de las bases SQLite detectadas. No se vuelcan registros ni datos de usuario.

No se han encontrado bases SQLite con extensiones .db, .sqlite o .sqlite3.

## Código (intercalado)

# ra3-biblioteca-multimedia-itc
**README.md**
```markdown
# RA3 - MediaLab ITC

Entrega de Programación Multimedia y Dispositivos Móviles. Es una biblioteca multimedia local: reproduce audio y vídeo elegidos por el usuario, dibuja una visualización en tiempo real, aplica filtros de audio, permite grabar una nota de voz y exportar archivos de audio compatibles como WAV.

## Estructura

- `01-ejercicios`: prácticas separadas de controles de vídeo, Web Audio con canvas y animación.
- `02-proyecto-unidad`: proyecto final `media-lab-itc`.
- `03-criterios-evaluacion`: respuestas a cada criterio del RA3.

## Ejecución

No necesita instalación ni dependencias. Abrir `02-proyecto-unidad/media-lab-itc/index.html` en Chrome o Edge. Para grabar una nota de voz, el navegador solicitará permiso de micrófono.

Los archivos seleccionados se procesan localmente en el navegador: no se suben a ningún servidor.

## Prueba rápida

1. Pulsar **Añadir archivo** y seleccionar un MP3, WAV, MP4 o WebM.
2. Pulsar reproducir y modificar volumen, velocidad o filtro.
3. Comprobar la animación del espectro en el canvas.
4. Pulsar **Grabar nota**, hablar y detener la grabación; la nueva pista aparece en la biblioteca.
5. Para un audio compatible, pulsar **Exportar WAV** y comprobar la descarga.

El caso de uso representa un pequeño laboratorio multimedia con materiales de demostración ficticios de Integra Tech Consulting.
```
## 01-ejercicios
### 01-controles-video
**index.html**
```html
<!doctype html><html lang="es"><meta charset="utf-8"><title>Práctica de vídeo</title><body><h1>Controles personalizados de vídeo</h1><input id="archivo" type="file" accept="video/*"><video id="video" controls width="640"></video><p><button id="play">Reproducir / pausar</button><button id="mas">+5 segundos</button></p><script>const video=document.querySelector('#video');document.querySelector('#archivo').onchange=e=>video.src=URL.createObjectURL(e.target.files[0]);document.querySelector('#play').onclick=()=>video.paused?video.play():video.pause();document.querySelector('#mas').onclick=()=>video.currentTime+=5;</script></body></html>
```
### 02-web-audio-canvas
**index.html**
```html
<!doctype html><html lang="es"><meta charset="utf-8"><title>Práctica Web Audio</title><body><h1>Audio y canvas</h1><input id="archivo" type="file" accept="audio/*"><audio id="audio" controls></audio><canvas id="canvas" width="640" height="120"></canvas><script>const audio=document.querySelector('#audio'),canvas=document.querySelector('#canvas'),ctx=canvas.getContext('2d');let analizador;document.querySelector('#archivo').onchange=e=>{audio.src=URL.createObjectURL(e.target.files[0]);const contexto=new AudioContext(),fuente=contexto.createMediaElementSource(audio);analizador=contexto.createAnalyser();fuente.connect(analizador);analizador.connect(contexto.destination);dibujar()};function dibujar(){requestAnimationFrame(dibujar);ctx.clearRect(0,0,640,120);if(!analizador)return;const datos=new Uint8Array(analizador.frequencyBinCount);analizador.getByteFrequencyData(datos);datos.forEach((v,i)=>{ctx.fillStyle='#159';ctx.fillRect(i*5,120-v/2,4,v/2)})}</script></body></html>
```
### 03-animacion-canvas
**index.html**
```html
<!doctype html><html lang="es"><meta charset="utf-8"><title>Práctica de animación</title><body><canvas id="canvas" width="640" height="180"></canvas><script>const c=document.querySelector('#canvas'),x=c.getContext('2d');let pos=0;function animar(){x.clearRect(0,0,640,180);x.fillStyle='#16a5a5';x.fillRect(pos,70,45,45);pos=pos>640?0:pos+3;requestAnimationFrame(animar)}animar()</script></body></html>
```
## 02-proyecto-unidad
### media-lab-itc
**aplicacion.js**
```js
const medio = document.querySelector("#medio");
const lista = document.querySelector("#listaMedios");
const selectorArchivo = document.querySelector("#selectorArchivo");
const reproducir = document.querySelector("#reproducir");
const progreso = document.querySelector("#progreso");
const tiempo = document.querySelector("#tiempo");
const visualizador = document.querySelector("#visualizador");
const contextoCanvas = visualizador.getContext("2d");
const estado = document.querySelector("#estado");
const botonGrabar = document.querySelector("#grabar");
const botonDetener = document.querySelector("#detener");
const botonExportar = document.querySelector("#exportar");

let biblioteca = [];
let indiceActual = -1;
let archivoActual = null;
let contextoAudio;
let fuenteAudio;
let analizador;
let filtroAudio;
let grabador;
let trozosGrabacion = [];

function informar(texto) {
  estado.textContent = texto;
}

function formatoTiempo(segundos) {
  if (!Number.isFinite(segundos)) return "00:00";
  const minutos = Math.floor(segundos / 60).toString().padStart(2, "0");
  const resto = Math.floor(segundos % 60).toString().padStart(2, "0");
  return minutos + ":" + resto;
}

function tipoLegible(tipo) {
  return tipo.startsWith("video/") ? "Vídeo" : "Audio";
}

function pintarBiblioteca() {
  lista.innerHTML = "";
  biblioteca.forEach(function(item, indice) {
    const elemento = document.createElement("li");
    const boton = document.createElement("button");
    boton.textContent = item.nombre;
    if (indice === indiceActual) boton.classList.add("activo");
    const detalle = document.createElement("small");
    detalle.textContent = tipoLegible(item.tipo) + " · " + Math.ceil(item.tamano / 1024) + " KB";
    boton.appendChild(detalle);
    boton.addEventListener("click", function() { cargarMedio(indice); });
    elemento.appendChild(boton);
    lista.appendChild(elemento);
  });
}

function prepararAudio() {
  if (contextoAudio) return;
  const Contexto = window.AudioContext || window.webkitAudioContext;
  contextoAudio = new Contexto();
  fuenteAudio = contextoAudio.createMediaElementSource(medio);
  analizador = contextoAudio.createAnalyser();
  analizador.fftSize = 128;
  filtroAudio = contextoAudio.createBiquadFilter();
  filtroAudio.type = "allpass";
  fuenteAudio.connect(filtroAudio);
  filtroAudio.connect(analizador);
  analizador.connect(contextoAudio.destination);
  animarEspectro();
}

function cargarMedio(indice) {
  const item = biblioteca[indice];
  if (!item) return;
  indiceActual = indice;
  archivoActual = item.archivo;
  medio.src = item.url;
  medio.load();
  medio.style.minHeight = item.tipo.startsWith("video/") ? "220px" : "110px";
  botonExportar.disabled = !item.tipo.startsWith("audio/");
  informar("Preparado: " + item.nombre + ".");
  pintarBiblioteca();
}

function anadirArchivo(archivo) {
  if (!archivo || (!archivo.type.startsWith("audio/") && !archivo.type.startsWith("video/"))) {
    informar("Selecciona un archivo de audio o vídeo válido.");
    return;
  }
  biblioteca.push({
    nombre: archivo.name,
    tipo: archivo.type,
    tamano: archivo.size,
    archivo: archivo,
    url: URL.createObjectURL(archivo)
  });
  cargarMedio(biblioteca.length - 1);
}

function cambiarReproduccion() {
  prepararAudio();
  if (contextoAudio.state === "suspended") contextoAudio.resume();
  if (medio.paused) {
    medio.play().catch(function(error) { informar("No se pudo reproducir: " + error.message); });
  } else {
    medio.pause();
  }
}

function animarEspectro() {
  requestAnimationFrame(animarEspectro);
  const ancho = visualizador.width;
  const alto = visualizador.height;
  contextoCanvas.fillStyle = "#0e1720";
  contextoCanvas.fillRect(0, 0, ancho, alto);
  if (!analizador) {
    contextoCanvas.fillStyle = "#8aa3b2";
    contextoCanvas.font = "16px Arial";
    contextoCanvas.fillText("El espectro aparecerá al reproducir un audio o vídeo.", 25, alto / 2);
    return;
  }
  const datos = new Uint8Array(analizador.frequencyBinCount);
  analizador.getByteFrequencyData(datos);
  const barra = ancho / datos.length;
  datos.forEach(function(valor, indice) {
    const altura = valor / 255 * (alto - 18);
    const tono = 175 + indice * 1.4;
    contextoCanvas.fillStyle = "hsl(" + tono + ", 72%, 55%)";
    contextoCanvas.fillRect(indice * barra, alto - altura, barra - 2, altura);
  });
}

function aplicarFiltro() {
  prepararAudio();
  const elegido = document.querySelector("#filtro").value;
  filtroAudio.type = elegido === "none" ? "allpass" : elegido;
  filtroAudio.frequency.value = 1200;
  informar(elegido === "none" ? "Filtro desactivado." : "Filtro " + elegido + " aplicado.");
}

function escribirEntero(vista, posicion, valor, bytes) {
  for (let indice = 0; indice < bytes; indice++) vista.setUint8(posicion + indice, valor >> (indice * 8) & 255);
}

function crearWav(buffer) {
  const canales = buffer.numberOfChannels;
  const muestras = buffer.length;
  const cabecera = 44;
  const datos = new ArrayBuffer(cabecera + muestras * canales * 2);
  const vista = new DataView(datos);
  [82, 73, 70, 70].forEach((valor, indice) => vista.setUint8(indice, valor));
  escribirEntero(vista, 4, 36 + muestras * canales * 2, 4);
  [87, 65, 86, 69, 102, 109, 116, 32].forEach((valor, indice) => vista.setUint8(8 + indice, valor));
  escribirEntero(vista, 16, 16, 4); escribirEntero(vista, 20, 1, 2);
  escribirEntero(vista, 22, canales, 2); escribirEntero(vista, 24, buffer.sampleRate, 4);
  escribirEntero(vista, 28, buffer.sampleRate * canales * 2, 4); escribirEntero(vista, 32, canales * 2, 2); escribirEntero(vista, 34, 16, 2);
  [100, 97, 116, 97].forEach((valor, indice) => vista.setUint8(36 + indice, valor));
  escribirEntero(vista, 40, muestras * canales * 2, 4);
  let posicion = 44;
  for (let muestra = 0; muestra < muestras; muestra++) {
    for (let canal = 0; canal < canales; canal++) {
      const valor = Math.max(-1, Math.min(1, buffer.getChannelData(canal)[muestra]));
      vista.setInt16(posicion, valor < 0 ? valor * 32768 : valor * 32767, true);
      posicion += 2;
    }
  }
  return new Blob([datos], { type: "audio/wav" });
}

async function exportarWav() {
  if (!archivoActual || !archivoActual.type.startsWith("audio/")) return;
  try {
    prepararAudio();
    informar("Convirtiendo el audio a WAV...");
    const datos = await archivoActual.arrayBuffer();
    const buffer = await contextoAudio.decodeAudioData(datos.slice(0));
    const salida = crearWav(buffer);
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(salida);
    enlace.download = archivoActual.name.replace(/\.[^.]+$/, "") + ".wav";
    enlace.click();
    informar("Conversión terminada: se ha descargado un WAV.");
  } catch (error) {
    informar("No se pudo convertir este formato: " + error.message);
  }
}

async function iniciarGrabacion() {
  try {
    const flujo = await navigator.mediaDevices.getUserMedia({ audio: true });
    grabador = new MediaRecorder(flujo);
    trozosGrabacion = [];
    grabador.ondataavailable = evento => trozosGrabacion.push(evento.data);
    grabador.onstop = function() {
      const blob = new Blob(trozosGrabacion, { type: grabador.mimeType || "audio/webm" });
      const archivo = new File([blob], "nota-voz-" + Date.now() + ".webm", { type: blob.type });
      anadirArchivo(archivo);
      flujo.getTracks().forEach(pista => pista.stop());
      informar("Nota de voz añadida a la biblioteca.");
    };
    grabador.start();
    botonGrabar.disabled = true;
    botonDetener.disabled = false;
    informar("Grabando nota de voz...");
  } catch (error) {
    informar("No se pudo usar el micrófono: " + error.message);
  }
}

selectorArchivo.addEventListener("change", function() { anadirArchivo(selectorArchivo.files[0]); selectorArchivo.value = ""; });
reproducir.addEventListener("click", cambiarReproduccion);
document.querySelector("#anterior").addEventListener("click", () => medio.currentTime = Math.max(0, medio.currentTime - 5));
document.querySelector("#siguiente").addEventListener("click", () => medio.currentTime = Math.min(medio.duration || 0, medio.currentTime + 5));
document.querySelector("#volumen").addEventListener("input", evento => medio.volume = evento.target.value);
document.querySelector("#velocidad").addEventListener("change", evento => medio.playbackRate = evento.target.value);
document.querySelector("#filtro").addEventListener("change", aplicarFiltro);
progreso.addEventListener("input", () => medio.currentTime = medio.duration * progreso.value / 100);
botonGrabar.addEventListener("click", iniciarGrabacion);
botonDetener.addEventListener("click", function() { if (grabador && grabador.state !== "inactive") grabador.stop(); botonGrabar.disabled = false; botonDetener.disabled = true; });
botonExportar.addEventListener("click", exportarWav);
medio.addEventListener("play", () => reproducir.textContent = "❚❚ Pausar");
medio.addEventListener("pause", () => reproducir.textContent = "▶ Reproducir");
medio.addEventListener("timeupdate", function() { progreso.value = medio.duration ? medio.currentTime / medio.duration * 100 : 0; tiempo.textContent = formatoTiempo(medio.currentTime) + " / " + formatoTiempo(medio.duration); });
medio.addEventListener("loadedmetadata", () => tiempo.textContent = "00:00 / " + formatoTiempo(medio.duration));
medio.addEventListener("error", () => informar("El navegador no puede reproducir este tipo de archivo."));
animarEspectro();
```
**estilos.css**
```css
:root{--azul:#11355b;--acento:#16a5a5;--fondo:#edf3f6;--texto:#16232d;--linea:#c5d6df}*{box-sizing:border-box}body{margin:0;background:var(--fondo);color:var(--texto);font-family:Arial,sans-serif}header{background:var(--azul);color:#fff;padding:32px max(24px,calc((100% - 1120px)/2))}header h1{margin:4px 0;font-size:2.6rem}.marca{margin:0;color:#9fe5e5;font-size:.82rem;letter-spacing:.08em;text-transform:uppercase}header p:not(.marca){margin:0;color:#d8e5ee}main{max-width:1120px;margin:28px auto;padding:0 24px;display:grid;grid-template-columns:.8fr 1.2fr;gap:22px}.biblioteca,.reproductor,.herramientas{background:#fff;border-radius:12px;padding:20px;box-shadow:0 4px 18px #183c5617}.reproductor{grid-row:span 2}h2{margin-top:0}.cabecera-seccion{display:flex;justify-content:space-between;gap:12px;align-items:center}.boton,button{border:0;border-radius:7px;padding:10px 14px;background:var(--acento);color:#052d31;font-weight:bold;cursor:pointer}button:disabled{background:#b5c5cb;color:#5d737d;cursor:not-allowed}.ayuda{font-size:.9rem;color:#4d636e}.lista{padding:0;margin:0;list-style:none;display:grid;gap:8px}.lista button{width:100%;background:#f4f8fa;color:var(--texto);text-align:left;border-left:4px solid var(--linea)}.lista button.activo{border-left-color:var(--acento);background:#e4f7f7}.lista small{display:block;color:#58707c;margin-top:4px}#medio{width:100%;min-height:220px;max-height:370px;background:#0e1720;border-radius:9px;display:block;object-fit:contain}.controles-principales{display:flex;gap:9px;align-items:center;margin:13px 0}.controles-principales button{background:var(--azul);color:#fff}.controles-principales button:nth-child(2){background:var(--acento);color:#06272a}.controles-principales span{margin-left:auto;font-variant-numeric:tabular-nums;font-size:.9rem}input[type=range]{accent-color:var(--acento)}#progreso{width:100%}#visualizador{width:100%;height:210px;margin-top:16px;background:#0e1720;border-radius:9px}.ajustes{display:flex;gap:16px;flex-wrap:wrap;margin-top:16px}.ajustes label{display:flex;align-items:center;gap:8px;font-size:.92rem}.herramientas{line-height:1.5}.grupo-botones{display:flex;gap:10px;flex-wrap:wrap;margin:15px 0}.grupo-botones #grabar{background:#b43c49;color:#fff}.grupo-botones #detener{background:#1f3547;color:#fff}details{border-top:1px solid var(--linea);padding-top:12px;margin-top:14px}summary{font-weight:bold;cursor:pointer}@media(max-width:800px){main{grid-template-columns:1fr}.reproductor{grid-row:auto}header h1{font-size:2rem}}
```
**index.html**
```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MediaLab ITC</title>
  <link rel="stylesheet" href="estilos.css">
</head>
<body>
  <header>
    <p class="marca">integra tech consulting · laboratorio local</p>
    <h1>MediaLab</h1>
    <p>Biblioteca, reproducción y procesamiento multimedia en el navegador.</p>
  </header>

  <main>
    <section class="biblioteca" aria-labelledby="tituloBiblioteca">
      <div class="cabecera-seccion">
        <h2 id="tituloBiblioteca">Biblioteca local</h2>
        <label class="boton" for="selectorArchivo">Añadir archivo</label>
        <input id="selectorArchivo" type="file" accept="audio/*,video/*" hidden>
      </div>
      <p class="ayuda">Audio: MP3, WAV o WebM. Vídeo: MP4 o WebM. Los archivos no salen de tu equipo.</p>
      <ol id="listaMedios" class="lista"></ol>
    </section>

    <section class="reproductor" aria-labelledby="tituloReproductor">
      <h2 id="tituloReproductor">Reproductor personalizado</h2>
      <video id="medio" preload="metadata" playsinline></video>
      <div class="controles-principales">
        <button id="anterior" aria-label="Retroceder cinco segundos">−5 s</button>
        <button id="reproducir">▶ Reproducir</button>
        <button id="siguiente" aria-label="Avanzar cinco segundos">+5 s</button>
        <span id="tiempo">00:00 / 00:00</span>
      </div>
      <input id="progreso" type="range" min="0" max="100" value="0" aria-label="Posición de reproducción">

      <canvas id="visualizador" width="900" height="210" aria-label="Visualización animada del audio"></canvas>

      <div class="ajustes">
        <label>Volumen <input id="volumen" type="range" min="0" max="1" value="0.8" step="0.05"></label>
        <label>Velocidad
          <select id="velocidad"><option value="0.75">0,75×</option><option value="1" selected>1×</option><option value="1.25">1,25×</option><option value="1.5">1,5×</option></select>
        </label>
        <label>Filtro
          <select id="filtro"><option value="none">Sin filtro</option><option value="lowpass">Pasa bajos</option><option value="highpass">Pasa altos</option></select>
        </label>
      </div>
    </section>

    <section class="herramientas" aria-labelledby="tituloHerramientas">
      <h2 id="tituloHerramientas">Herramientas multimedia</h2>
      <p id="estado">Selecciona un archivo de tu biblioteca para empezar.</p>
      <div class="grupo-botones">
        <button id="grabar">● Grabar nota</button>
        <button id="detener" disabled>■ Detener grabación</button>
        <button id="exportar" disabled>Exportar WAV</button>
      </div>
      <details>
        <summary>¿Qué usa esta aplicación?</summary>
        <p>HTMLMediaElement para reproducción y eventos, Web Audio API para procesamiento, MediaRecorder para captura, Blob para almacenar temporalmente, FileReader/ArrayBuffer para conversión, y Canvas con requestAnimationFrame para la animación.</p>
      </details>
    </section>
  </main>
  <script src="aplicacion.js"></script>
</body>
</html>
```
## 03-criterios-evaluacion
**RESPUESTAS-CRITERIOS.md**
```markdown
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
```

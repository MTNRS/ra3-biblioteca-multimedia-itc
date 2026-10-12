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

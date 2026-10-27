# ComunicaLibre Web

Prototipo funcional de apoyo a la comunicación, desarrollado con HTML, CSS y JavaScript sin frameworks ni dependencias obligatorias.

## Cómo usarlo

1. Descomprimí la carpeta si descargaste el ZIP.
2. Abrí `index.html` con una versión actualizada de Chrome, Edge o Safari.
3. Tocá una tarjeta para que el dispositivo lea la frase en voz alta. También podés escribir un mensaje y pulsar **Decir mensaje**.
4. Usá **Nueva frase** para agregar frases propias. Las frases personales se pueden editar o eliminar.
5. Desde **Ajustes de accesibilidad** podés elegir una voz en español, modificar la velocidad y activar o desactivar el historial.

## Funciones incluidas

- Diseño adaptable a celular, tablet y computadora.
- Frases agrupadas por categoría, búsqueda y acceso rápido a emergencias.
- Voz mediante la API de síntesis de voz del navegador (`SpeechSynthesis`).
- Mensajes escritos de hasta 500 caracteres.
- Frases personalizadas, edición, eliminación y favoritos.
- Historial local con opción de repetir mensajes y borrar el historial.
- Preferencias de voz y nombre del perfil.
- Modo barrido visual: resalta una opción a la vez, cambia cada 2,5 segundos y ofrece un botón para seleccionar la opción actual. Si el foco está en el documento, Enter/Espacio también selecciona.
- Atajo `/` para ir al buscador; `Ctrl+Enter` (o `⌘+Enter` en Mac) para leer el mensaje escrito; `Escape` desactiva el modo barrido cuando no hay una ventana de diálogo abierta.
- Preferencia de movimiento reducido y estilos de foco para navegación por teclado.

## Guardado y límites

La información se guarda con `localStorage` en el navegador y dispositivo actuales. No hay servidor, sincronización entre dispositivos ni base de datos remota. Si se borran los datos del navegador, se pueden perder las frases personales, preferencias y el historial. La voz depende de las voces instaladas y de las funciones compatibles con el navegador.

El modo barrido incluido es una ayuda inicial, no una solución clínica validada. Este prototipo no implementa seguimiento ocular real, control por cámara, interruptores Bluetooth ni accesibilidad médica certificada. Antes de utilizarlo como sistema principal de comunicación, hay que probarlo con las personas usuarias, sus acompañantes y profesionales de accesibilidad/salud, incluyendo el tamaño de botones, tiempos, selección accidental y la fiabilidad de las frases urgentes.

## Archivos

- `index.html`: estructura y ventanas de la aplicación.
- `styles.css`: estilos visuales y adaptación a pantallas.
- `app.js`: lógica, voz, personalización y persistencia local.

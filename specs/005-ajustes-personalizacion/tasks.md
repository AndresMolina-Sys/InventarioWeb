# Tareas — Ajustes base y preferencias locales (spec 005)

Las tareas son secuenciales y se implementan una por turno. Para cada tarea que cambie código, ejecutar `npm run build`, actualizar `MEMORY.md` local y crear el commit local en inglés con el formato de `AGENTS.md`. No instalar dependencias ni usar `node --test`; los cambios visuales se revisan con Chrome DevTools.

- [x] **T01. Tipos de preferencias (`src/types.ts`) — 20–25 min.** RF-2, RF-3, RF-7 (Principios P1, P3, P5)
  - Definir tipos para tema (`system | light | dark`), densidad (`comfortable | compact`) y `AppPreferences` con exactamente `theme`, `showRecentActivityChart`, `showCategoryChart` y `tableDensity`. No agregar idioma.
  - Hecho cuando: TypeScript expone los cuatro campos con sus uniones y booleanos correctos, no hay campo `language`, y `npm run build` termina correctamente.

- [x] **T02. Repositorio de preferencias (`src/lib/preferencesRepository.ts`) — 25–30 min.** RF-2, RF-3, RF-7, RF-8 (Principios P1, P3, P5)
  - Crear el repositorio local autorizado en el plan. Guardar y leer el objeto completo en `localStorage` con clave propia versionada; normalizar cada propiedad independientemente y reportar fallos de acceso, parseo o escritura sin lanzar excepciones al llamador. No leer ni escribir IndexedDB.
  - Hecho cuando: La comprobación manual confirma los cuatro defaults, la preservación de campos válidos ante campos ausentes/inválidos y resultados explícitos para errores de almacenamiento; `npm run build` pasa.

- [x] **T03. Ciclo de preferencias y tema del sistema (`src/App.tsx`) — 25–30 min.** RF-2, RF-3, RF-4, RF-7 (Principios P1, P3, P4, P5, P6)
  - Inicializar el estado desde el repositorio, aplicar cada selección inmediatamente, posponer/coalescer la escritura del conjunto vigente, mostrar y retirar avisos accesibles según el resultado, y seguir `prefers-color-scheme` solo cuando el tema elegido sea Sistema. Exponer tema efectivo y densidad al contenedor de aplicación.
  - Hecho cuando: La sesión inicia con valores normalizados, un fallo de lectura deja usar la app con aviso, cada escritura fallida conserva la selección en sesión y una siguiente escritura exitosa elimina el aviso; Sistema responde al cambio de tema del navegador y `npm run build` pasa.

- [x] **T04. Navegación, controles y confirmación de Ajustes (`src/App.tsx`) — 25–30 min.** RF-1, RF-2, RF-3, RF-7, RF-8 (Principios P1, P4, P5, P6)
  - Añadir Ajustes a la navegación de escritorio y móvil y construir una pantalla con controles independientes de tema, visibilidad de cada gráfico y densidad. Incorporar «Restablecer preferencias» con confirmación accesible; Escape, Cancelar y cierre equivalente deben conservar valores y restaurar el foco.
  - Hecho cuando: Ajustes abre desde ambas navegaciones; cada control cambia una preferencia y muestra su efecto sin recargar; cancelar el reset no cambia ningún valor, confirmar aplica los cuatro defaults y ningún flujo altera los registros de inventario; `npm run build` pasa.

- [x] **T05. Visibilidad y reflujo de gráficos (`src/App.tsx`, `src/styles.css`) — 20–25 min.** RF-5, RF-8 (Principios P2, P4, P5, P6)
  - Condicionar el render de Actividad reciente y Artículos por categoría a sus preferencias. Ajustar el grid para redistribuir paneles presentes sin reservar columnas o espacios vacíos; mantener intacta la creación de movimientos.
  - Hecho cuando: Se verifican las cuatro combinaciones de gráficos y, al ocultarlos, no quedan huecos reservados; los artículos, categorías y movimientos conservan sus valores y la actividad sigue registrándose; `npm run build` pasa.

- [x] **T06. Tokens de tema para shell, navegación y paneles (`src/styles.css`) — 25–30 min.** RF-4 (Principios P1, P2, P4, P6)
  - Convertir colores codificados de la estructura principal, navegación, fondos, tarjetas, métricas, gráficos, tablas y estados a tokens semánticos; definir paletas clara y oscura sin alterar la presentación clara existente.
  - Hecho cuando: Con tema Claro se conserva la apariencia actual y con Oscuro shell, navegación, resumen, categorías y tablas usan superficies/textos/bordes oscuros y legibles; no se cambia la impresión y `npm run build` pasa.

- [x] **T07. Temas de formularios, diálogos y estados accesibles (`src/styles.css`) — 25–30 min.** RF-4, RF-7 (Principios P1, P2, P4, P6)
  - Aplicar tokens de ambos temas a formularios, campos, validaciones, menús, diálogos, badges y controles; asegurar foco visible y contrastes WCAG AA fijados por la spec. Mantener las reglas de etiqueta y ficha técnica explícitamente monocromáticas en impresión.
  - Hecho cuando: En Claro y Oscuro los formularios y diálogos son legibles y operables; textos normales alcanzan 4.5:1, textos grandes y elementos UI/foco 3:1, el foco no depende del color de selección, los estilos de impresión siguen monocromáticos y `npm run build` pasa.

- [x] **T08. Densidad de tablas y ajuste adaptable (`src/styles.css`) — 20–25 min.** RF-6 (Principios P2, P4, P6)
  - Aplicar altura base de 68 px para Cómoda y 56 px para Compacta a Artículos, Categorías, Movimientos y detalle de categoría. Permitir crecimiento de filas por contenido; preservar fuente mínima de 12 px, botones y áreas operables.
  - Hecho cuando: Las cuatro tablas cambian de densidad, una fila corta mide la altura base seleccionada y una fila con texto largo aumenta sin recorte; a 360 y 375 px no se genera overflow horizontal y `npm run build` pasa.

- [x] **T09. Verificación funcional de persistencia y datos (Chrome DevTools) — 25–30 min.** RF-2, RF-3, RF-5, RF-7, RF-8 (Principios P4, P5)
  - Usar un contexto de navegador aislado para verificar defaults, cambios independientes, recarga, valores parciales/inválidos, errores controlados de lectura/escritura, reintento posterior, pestañas sin sincronización viva, reset y datos de IndexedDB.
  - Hecho cuando: Todas las preferencias sobreviven recarga cuando el guardado funciona; los fallos muestran aviso y no bloquean el uso; reset cancelar/confirmar cumple RF-7; se demuestra que IndexedDB mantiene exactamente los artículos, categorías y movimientos de inicio; consola sin errores/advertencias.

- [ ] **T10. Verificación visual y documentación (`docs/figma-brief.md`, `AGENTS.md`, `MEMORY.md`) — 25–30 min.** RF-1–RF-8 (Principios P2, P4, P5, P6)
  - Documentar en el brief y en las notas locales el tema, cuatro preferencias, persistencia local, reglas de densidad, navegación, errores y límites; completar revisión final con Chrome en escritorio y móvil.
  - Hecho cuando: En Chrome DevTools se validan Claro/Oscuro/Sistema, impresión monocromática, los gráficos, densidad, teclado/foco y contraste a 1440, 375 y 360 px; cada cambio visible se refleja en menos de 100 ms, no hay desbordamiento ni mensajes de consola; `docs/figma-brief.md`, `AGENTS.md` y `MEMORY.md` reflejan solo el alcance 005, y `npm run build` pasa.

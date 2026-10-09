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

- [x] **T10. Verificación visual y documentación (`docs/figma-brief.md`, `AGENTS.md`, `MEMORY.md`) — 25–30 min.** RF-1–RF-8 (Principios P2, P4, P5, P6)
  - Documentar en el brief y en las notas locales el tema, cuatro preferencias, persistencia local, reglas de densidad, navegación, errores y límites; completar revisión final con Chrome en escritorio y móvil.
  - Hecho cuando: En Chrome DevTools se validan Claro/Oscuro/Sistema, impresión monocromática, los gráficos, densidad, teclado/foco y contraste a 1440, 375 y 360 px; cada cambio visible se refleja en menos de 100 ms, no hay desbordamiento ni mensajes de consola; `docs/figma-brief.md`, `AGENTS.md` y `MEMORY.md` reflejan solo el alcance 005, y `npm run build` pasa.


## Extensión aprobada; plan y tareas pendientes de aprobación

T01–T10 arriba son historial de la base implementada. Las diez tareas siguientes cubren solo el alcance ampliado y quedan pendientes de aprobación; después de aprobar este plan y este desglose, se ejecutan en orden, una por tarea. Las fases respetan la secuencia de tipos, lógica y persistencia, interfaz, estilos adaptables y verificación/documentación.

### Fase 1: contratos y tipos

- [x] **T11. Contrato ampliado de preferencias (src/types.ts) — 20–25 min.** RF-2, RF-3, RF-7, RF-9, RF-10, RF-13, RF-14 (Principios 1, 3, 5, 6)
  - Añadir showRegisteredValue, displayCurrency, crcPerUsd, eurPerUsd, tablePageSize, dateFormat y timeFormat a AppPreferences, conservando tema, idioma, visibilidad de gráficos y densidad. Definir uniones cerradas para moneda, tamaño y formatos.
  - Hecho cuando: TypeScript acepta solo los valores previstos en la spec, el contrato conserva todas las preferencias existentes y npm run build termina correctamente.

### Fase 2: lógica pura y persistencia

- [x] **T12. Normalización y formateadores locales (src/lib/preferencesRepository.ts, src/i18n.ts) — 25–30 min.** RF-2, RF-3, RF-7, RF-9, RF-13, RF-14 (Principios 1, 3, 5, 6)
  - Ampliar defaults, lectura y normalización independiente del repositorio local. Incorporar funciones puras para convertir importes, sumar el total USD antes de convertir y formatear moneda, fecha y hora según preferencias e idioma.
  - Hecho cuando: preferencias antiguas conservan sus valores válidos y cada campo nuevo inválido adopta su default; las tasas no finitas, no numéricas o no positivas se rechazan; la suma agregada se convierte una sola vez y las funciones conservan los instantes de fecha; npm run build pasa.

- [x] **T13. Vaciado transaccional y rechazo de operaciones obsoletas (src/lib/inventoryRepository.ts, src/data/demo.ts) — 25–30 min.** RF-8, RF-11, RF-15 (Principios 3, 4, 5)
  - Implementar el vaciado del snapshot completo en IndexedDB, preservar un estado vacío que impida volver a sembrar datos y limpiar las copias legacy. Incorporar la revisión/invalidez necesaria para que ninguna mutación o escritura anterior al vaciado reponga datos; emitir la invalidación a las demás pestañas tras guardar el vacío.
  - Hecho cuando: el commit vacío incluye artículos, categorías y movimientos; una mutación iniciada con una revisión previa se rechaza o queda sobrescrita antes del éxito; el inventario sigue vacío tras recargar y los errores de commit o de limpieza legacy permiten reintento sin declarar éxito.

### Fase 3: interfaz y flujo de usuario

- [x] **T14. Pantalla y controles agrupados de Ajustes (src/App.tsx, src/i18n.ts) — 25–30 min.** RF-1, RF-2, RF-3, RF-7, RF-9, RF-10, RF-12–RF-14 (Principios 2, 4, 5, 6)
  - Organizar la pantalla en los cuatro grupos especificados y conectar idioma, tema, densidad, tamaño de página, las tres visibilidades, moneda, tasas, fecha y hora. Mostrar fuentes/fechas de las tasas y su estado editado; actualizar la confirmación de restablecimiento para incluir todos los defaults; preparar los cuatro grupos de Ajustes sin incluir aún el disparador de vaciado, que se incorpora con el diálogo en T18.
  - Hecho cuando: cada grupo y opción aparece en el orden de RF-12, los cambios se aplican sin recargar, tasas inválidas conservan la última válida con aviso accesible y restablecer/cancelar conserva el inventario íntegro; npm run build pasa.

- [ ] **T15. Visibilidad y conversión del Resumen (src/App.tsx) — 20–25 min.** RF-2, RF-5, RF-9, RF-14 (Principios 2, 4, 5, 6)
  - Conectar los tres controles independientes del Resumen. Convertir costos individuales desde USD y mostrar Valor registrado sumando primero los costos USD no nulos, convirtiendo el total una vez y redondeando solo al presentarlo.
  - Hecho cuando: se verifican las ocho combinaciones de visibilidad sin huecos; costos ausentes se excluyen, cero se presenta con el símbolo elegido y cambiar visibilidad/moneda no modifica IndexedDB ni detiene el registro de actividad.

- [ ] **T16. Paginación común de tablas (src/App.tsx) — 25–30 min.** RF-2, RF-10 (Principios 2, 4, 6)
  - Aplicar tamaños 10, 15, 25, 50 y Ver todos a Artículos, Categorías, Movimientos y detalle de categoría. Reiniciar a la primera página al cambiar filtro o tamaño, ajustar la página al borrar filas y mantener Ingresos recientes en cinco elementos.
  - Hecho cuando: cada tamaño limita los resultados filtrados correctamente en las cuatro tablas, los límites y borrados no dejan una página vacía mientras haya filas, Ver todos presenta una sola página y los cinco ingresos recientes no cambian.

- [ ] **T17. Formatos en pantallas, CSV e impresos (src/App.tsx, src/i18n.ts) — 25–30 min.** RF-9, RF-13, RF-14 (Principios 2, 4, 5, 6)
  - Aplicar moneda y formatos de fecha/hora seleccionados a importes y fechas completos de las vistas, el CSV existente de Artículos, la etiqueta y la ficha técnica. Mantener las etiquetas visuales compactas del eje X y completar su fecha accesible.
  - Hecho cuando: las cuatro combinaciones fecha/hora presentan el mismo instante en pantalla, CSV e impresos; los importes impresos usan la moneda elegida; el CSV conserva sus columnas y otros datos, y etiqueta/barcode/hoja Carta mantienen sus dimensiones y restricciones.

- [ ] **T18. Confirmación accesible de vaciado e invalidación visible (src/App.tsx) — 25–30 min.** RF-8, RF-11, RF-15 (Principios 2, 4, 5, 6)
  - Añadir el disparador «Vaciar base de datos» a Zona de peligro e implementar su diálogo accesible con VACIAR/CLEAR según idioma, foco inicial, trampa de Tab/Mayús+Tab, Escape, restauración de foco, alertas y reintento. Conectar el aviso de invalidación para que otras pestañas descarten datos cargados y borradores antiguos.
  - Hecho cuando: cancelar no cambia datos; solo el término recortado válido sin distinguir mayúsculas habilita confirmar; fallos conservan el diálogo y permiten reintentar; tras el commit todas las pestañas muestran vacío en menos de 100 ms y ningún borrador antiguo vuelve a persistir.

### Fase 4: estilos, responsive y accesibilidad

- [ ] **T19. Estilos de los nuevos controles y vistas (src/styles.css) — 25–30 min.** RF-2, RF-4, RF-5, RF-6, RF-10, RF-11, RF-12, RF-15 (Principios 2, 4, 6)
  - Estilizar grupos, tasas, formatos, selector de página, toggle, tablas paginadas y diálogo destructivo después de integrar sus estructuras. Aplicar estados de foco/error, temas claros/oscuros, reflujo y espaciado para escritorio y móvil.
  - Hecho cuando: a 1440, 375 y 360 px los grupos y controles no se solapan ni desbordan, todos los textos visibles miden al menos 12 px, el foco permanece visible y el diálogo contiene el scroll sin ocultar sus acciones.

### Fase 5: verificación y documentación

- [ ] **T20. Cierre integrado y documentación (npm run build, Chrome DevTools, docs/figma-brief.md, AGENTS.md, MEMORY.md) — 25–30 min.** RF-1–RF-15 (Principios 1, 2, 4, 5, 6)
  - Reunir la evidencia de aceptación generada en T01–T19 para todas las matrices de la spec; no repetir sus verificaciones funcionales completas. Ejecutar el build final y un smoke test integrado representativo en Chrome DevTools, revisar la consola y actualizar el brief, AGENTS.md y MEMORY.md local.
  - Hecho cuando: npm run build termina con código 0; el smoke test en 1440, 375 y 360 px confirma apertura de Ajustes, un cambio de preferencia, aplicación de un formato y el flujo visible de vaciado sin overflow ni errores/advertencias de consola; la evidencia de T01–T19 cubre cada RF y matriz completa; docs/figma-brief.md y AGENTS.md reflejan las reglas finales, y MEMORY.md local queda actualizado con 50 líneas o menos.

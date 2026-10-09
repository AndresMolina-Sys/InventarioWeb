# Tareas de implementación — Localización bilingüe

Las tareas se ejecutan en orden. Cada una debe completarse y verificarse antes de iniciar la siguiente.

## Fase 1: contratos y preferencias locales

- [x] **T01. `src/types.ts` — contrato de idioma y preferencias (20–30 min).** RF-1, RF-2, RF-8 (Principios 1, 5, 6)
  - Añadir `AppLanguage = "es" | "en"` y `language` a `AppPreferences`, conservando sin cambios las preferencias de tema, gráficos y densidad.
  - Hecho cuando: TypeScript acepta únicamente `es` y `en` para `AppPreferences.language`, y los cuatro campos previos conservan sus tipos actuales.

- [x] **T02. `src/lib/preferencesRepository.ts` — fallback y persistencia de idioma (20–30 min).** RF-1, RF-2, RF-8 (Principios 3, 5, 6)
  - Extender la normalización por campo y los valores iniciales: idioma ausente o inválido produce español y conserva cada preferencia previa válida; la lectura no escribe; cambio, restablecimiento y error de almacenamiento siguen el comportamiento de la spec 005.
  - Hecho cuando: leer preferencias antiguas de cuatro campos conserva esos cuatro valores, devuelve `language: "es"` y no cambia el contenido almacenado; guardar, restablecer o fallar el almacenamiento cumple los casos RF-2 y RF-8 sin acceder a IndexedDB.

## Fase 2: lógica pura de idioma y formato

- [x] **T03. `src/i18n.ts` — catálogos tipados y funciones puras (20–30 min).** RF-3, RF-4, RF-7 (Principios 1, 3, 5, 6)
  - Crear el módulo aprobado con catálogos paralelos completos en español e inglés, selección tipada sin fallback silencioso entre idiomas, formato de fechas `es-CR`/`en-US` en zona local, formato de números y USD fijo `$1,234.56`, textos para datos opcionales vacíos y etiquetas de estados canónicos/desconocidos. Mantener los estados no canónicos como valor raw.
  - Hecho cuando: el build rechaza claves de catálogo faltantes; funciones puras con igual entrada producen los textos y formatos del idioma solicitado, preservan el instante de fecha y no modifican ningún valor recibido.

## Fase 3: interfaz y flujo de usuario

- [x] **T04. `src/App.tsx` — selector, navegación y Resumen (20–30 min).** RF-1, RF-2, RF-3, RF-8 (Principios 2, 5, 6)
  - Integrar el selector Español/English en Ajustes con etiquetas accesibles; aplicar inmediatamente la preferencia al árbol visible y al atributo semántico de idioma; localizar navegación, Ajustes y Resumen, incluidos KPI, gráficos, leyendas, ejes y vacíos.
  - Hecho cuando: seleccionar cualquiera de los idiomas actualiza en menos de 100 ms el selector, la navegación y todo texto generado del Resumen sin recarga; reiniciar preferencias confirmando/cancelando produce los resultados de RF-8.

- [x] **T05. `src/App.tsx` — Artículos, Categorías, Movimientos y diálogos (20–30 min).** RF-3, RF-4, RF-7 (Principios 2, 3, 5, 6)
  - Localizar textos generados de listas, tablas, filtros, formularios, validaciones, acciones, estados vacíos y diálogos de estas vistas. Presentar estados canónicos traducidos y «Desconocido» localizado junto al raw desconocido, sin traducir ni modificar datos del usuario.
  - Hecho cuando: en ambos idiomas todas las cadenas generadas de estas vistas cambian sin recargar, los cuatro estados canónicos tienen su etiqueta correspondiente y códigos, nombres, notas, categorías, valores raw de estados y registros permanecen idénticos.

## Fase 4: exportación, impresión y presentación accesible

- [x] **T06. `src/App.tsx` — localizar el CSV existente de Artículos (20–30 min).** RF-4, RF-5, RF-7 (Principios 2, 5, 6)
  - Localizar los tres encabezados del CSV existente de Artículos y el formato de su fecha de ingreso. No agregar exportaciones ni opciones para Categorías o Movimientos.
  - Hecho cuando: exportar Artículos en ambos idiomas conserva las tres columnas, su orden, las filas y cada valor distinto de la fecha; solo cambian los encabezados y la representación regional de la fecha de ingreso.

- [x] **T07. `src/App.tsx` — etiquetas y ficha técnica bilingües (20–30 min).** RF-3, RF-4, RF-6, RF-7 (Principios 1, 2, 5, 6)
  - Traducir textos generados de previsualización e impresión, incluidas ayudas, vacíos y avisos, sin alterar valores de usuario ni barcode; aplicar fechas localizadas y conservar USD fijo, dimensiones, límites de contenido y salida monocromática vigentes.
  - Hecho cuando: la etiqueta sigue midiendo 70 × 35 mm y la ficha ocupa una página Carta; en ambos idiomas los rótulos cambian, los datos y barcode no, las fechas mantienen el mismo instante y una etiqueta incompatible muestra el aviso y bloquea imprimir.

- [x] **T08. `src/styles.css` y `src/App.tsx` — legibilidad, responsive y asistencia (20–30 min).** RF-1, RF-3, RF-6 (Principios 2, 4, 6)
  - Ajustar cadenas inglesas largas, focos y nombres accesibles sin bajar de 12 px; mantener formularios, diálogos y documentos utilizables a 360 y 375 px. Conservar dimensiones impresas, una página Carta y escala de grises.
  - Hecho cuando: ninguna regla activa en vistas escritorio/móvil reduce texto visible bajo 12 px, las cadenas inglesas no provocan overflow horizontal a 360/375 px, el idioma semántico acompaña el idioma elegido y foco/teclado permanecen operables.

## Fase 5: validación y documentación

- [x] **T09. Verificación integral con build y Chrome DevTools (20–30 min).** RF-1–RF-8 (Principios 1, 2, 4, 5, 6)
  - Ejecutar `npm run build` y verificar la funcionalidad en un perfil local de QA: preferencias antiguas/inválidas, persistencia y reset, todas las vistas, formatos, CSV, impresión, datos IndexedDB, teclado, consola y overflow.
  - Hecho cuando: el build termina con código 0; Chrome DevTools confirma ambos idiomas a 1440, 375 y 360 px, actualización menor de 100 ms, consola sin errores ni advertencias, sin overflow, impresión y CSV conforme a RF-4–RF-6, y artículos/categorías/movimientos son idénticos antes y después.

- [x] **T10. `docs/figma-brief.md`, `docs/constitution.md`, `AGENTS.md` y `MEMORY.md` — cierre documental (20–30 min).** RF-1–RF-8 (Principios 2, 5, 6)
  - Documentar selector, formatos, accesibilidad, responsive e impresión; cambiar el principio 6 al texto aprobado exactamente; actualizar reglas y memoria local con idioma, persistencia y límites, manteniendo MEMORY.md en 50 líneas o menos.
  - Hecho cuando: el brief describe la interfaz bilingüe implementada, el principio 6 coincide carácter por carácter con el texto aprobado, AGENTS.md refleja las reglas actuales y MEMORY.md tiene como máximo 50 líneas.


## Extensión aprobada; plan y tareas pendientes de aprobación

T01–T10 quedan como historial completado. Las tareas nuevas quedan pendientes de aprobación y dependen de completar primero T11–T20 de la extensión de spec 005; después se ejecutan en este orden.

- [ ] **T11. Catálogos bilingües para controles nuevos (src/i18n.ts) — 20–25 min.** RF-1, RF-2, RF-3, RF-7, RF-8, RF-9, RF-10 (Principios 2, 4, 6)
  - Completar traducciones paralelas de las cuatro secciones, visibilidad de Valor registrado, monedas/tasas, formatos, tamaños de página y estados de confirmación, error, reintento e invalidación del vaciado.
  - Hecho cuando: el chequeo de tipos no encuentra claves ausentes; cada etiqueta, ayuda y aviso nuevo tiene texto español e inglés de sentido equivalente y los valores de inventario no se traducen.

- [ ] **T12. Integración localizada de preferencias y salidas (src/App.tsx, src/i18n.ts) — 25–30 min.** RF-3, RF-4, RF-5, RF-6, RF-7, RF-9, RF-10 (Principios 2, 4, 5, 6)
  - Conectar los catálogos a los nuevos controles y a mensajes de vaciado; presentar monedas, fechas/horas y nombres accesibles del eje X según locale/preferencias en pantallas, CSV e impresos; conservar contenido raw, columnas y límites físicos.
  - Hecho cuando: idioma se cambia sin recarga; ambos idiomas muestran las opciones monetarias exactas, formatos elegidos, eje compacto con fecha accesible completa, CSV sin columnas nuevas e impresos conformes a una página Carta/70 × 35 mm.

- [ ] **T13. Cierre bilingüe y documentación (Chrome DevTools, docs/figma-brief.md, AGENTS.md, MEMORY.md) — 25–30 min.** RF-1–RF-10 (Principios 2, 4, 5, 6)
  - Reunir la evidencia de T01–T12 para la cobertura completa de cada RF y matriz bilingüe, sin repetir las verificaciones funcionales exhaustivas. Ejecutar npm run build, realizar un smoke test integrado en ambos idiomas y actualizar el brief, AGENTS.md y MEMORY.md local.
  - Hecho cuando: npm run build termina con código 0; el smoke test en ambos idiomas y a 1440, 375 y 360 px confirma textos clave localizados, navegación operable, un control nuevo de Ajustes, consola sin errores/advertencias y sin overflow; la evidencia de T01–T12 cubre todos los RF y casos; docs/figma-brief.md y AGENTS.md describen el comportamiento bilingüe final y MEMORY.md local queda actualizado con 50 líneas o menos.

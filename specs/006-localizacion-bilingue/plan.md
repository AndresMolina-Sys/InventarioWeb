# Plan técnico — Ajustes bilingües de preferencias (spec 006)

**Estado: pendiente de aprobación**

La localización base (T01–T10) está implementada. Este alcance añade su integración con los nuevos controles aprobados para Ajustes y con los formatos seleccionados de moneda, fecha y hora. Las tareas de esta extensión dependen de que la extensión 005 esté implementada y validada; no reabren su modelo ni duplican su persistencia.

## 1. Archivos y responsabilidades

- **src/i18n.ts:** completar los catálogos paralelos con etiquetas, descripciones, ayudas, estados vacíos, validaciones y avisos de los nuevos controles: tamaños de página, tres opciones de moneda, tasas, formatos de fecha/hora y vaciado. Mantener la forma tipada y los formateadores compartidos.
- **src/App.tsx:** conectar textos localizados a los cuatro grupos de Ajustes y al diálogo de vaciado; mostrar en español e inglés nombres de opciones, mensajes de error/reintento, alertas entre pestañas, información de tasa y estados de controles. Aplicar el locale activo al formato de los valores visibles y a nombres accesibles del gráfico.
- **src/styles.css:** adaptar etiquetas y mensajes ingleses nuevos a sus contenedores actuales, preservando 12 px mínimos, foco y reflujo a 360–375 px.
- **docs/figma-brief.md:** reflejar los cuatro grupos, los tres controles del Resumen, moneda/formatos, diálogo destructivo bilingüe e invalidación de borradores.
- **AGENTS.md y MEMORY.md:** documentar la regla de que el idioma no se sincroniza entre pestañas, aunque un vaciado confirmado sí actualiza el inventario vacío en todas ellas; el coordinador hará el cierre local.

No se modificará IndexedDB, el repositorio de preferencias ni el contrato de tipos durante esta etapa; pertenecen a la extensión 005. No se añaden dependencias, servicios ni archivos.

## 2. Contrato y dependencia

- AppLanguage conserva los valores es/en.
- AppPreferences final queda definido por la spec 005 e incluye idioma junto con los valores de tema, densidad, tres visibilidades, moneda y tasas, tamaño de página y formatos fecha/hora.
- Este plan no altera el almacenamiento, defaults ni normalización de esa forma. Los textos nuevos usan la preferencia local existente y la tabla de traducciones existente.
- Todos los valores de artículo y auditoría permanecen intactos. El idioma afecta presentación, no registros.

## 3. Formato localizado y lógica de traducción

- Mantener las mismas claves en ambos catálogos y completar las traducciones sin fallback silencioso entre idiomas.
- USD usa siempre $1,234.56. CRC y EUR usan ₡/€ y separadores, posición y espacio del símbolo según locale es-CR/en-US, con dos decimales. El costo cero se presenta como $0.00 en USD y cero con símbolo elegido en CRC/EUR.
- Los costos individuales se presentan con la tasa local válida; Valor registrado conserva el orden acordado en spec 005: sumar en USD sin redondeos intermedios, convertir una sola vez el total, y redondear al presentar.
- Las fechas y horas usan el formato seleccionado por separado del idioma. El reloj de 12 horas localiza el meridiano. La presentación conserva el instante local y el CSV mantiene encabezados/valores localizados sin añadir columnas ni convertir costos.
- El eje X conserva el texto compacto como «S 26», con nombre accesible de fecha completa en el formato seleccionado y hora conforme a la preferencia cuando corresponda.
- Textos de botones, motivos, datos de artículos y valores raw de estados desconocidos no se traducen.

## 4. Interfaz y accesibilidad

- Traducir el selector exacto de moneda, los formatos de fecha/hora, opciones de tamaño y todos los mensajes/controles nuevos de Ajustes.
- En español mostrar VACIAR; en English mostrar CLEAR. El texto de confirmación cambia con el idioma, el comportamiento y el alcance no. Los mensajes de éxito/error y reintento también se localizan.
- Las preferencias no se sincronizan entre pestañas. El estado del inventario tras un vaciado confirmado se actualiza en otras pestañas y el aviso de borrador descartado se presenta en el idioma activo.
- Conservar nombres accesibles, foco visible, teclado, textos mínimos de 12 px y contraste. Los contenidos ingleses no desbordan en anchos de 360–375 px.
- Los documentos impresos usan etiquetas y avisos localizados con la moneda y formatos seleccionados; la salida monocromática y las dimensiones físicas siguen intactas.

## 5. Decisiones y alternativas

- Se reutilizan catálogos y preferencias de 005, en lugar de crear otro sistema de traducción o almacenamiento.
- Se conserva el locale es-CR/en-US para separadores, posición del símbolo CRC/EUR, idioma de interfaz y meridiano; USD mantiene forma fija.
- El nombre accesible del eje X se amplía, pero la etiqueta visual compacta no cambia, evitando colisiones de columnas.
- La notificación del vaciado se localiza sin hacer sincronización general de preferencias o inventario.
- Las preferencias de formato prevalecen en impresos sin sustituir las reglas físicas. No se reduce tipografía ni se cambia la geometría para acomodar cadenas.

## 6. Verificación y control de calidad

- Ejecutar npm run build y no instalar dependencias ni usar node --test.
- Comprobar español e inglés para cada grupo, nombre de control, tasa, formato, tamaño, vaciado, error, reintento y aviso de datos obsoletos.
- Verificar los símbolos/selectores exactos y el formato USD fijo en ambos idiomas; probar CRC/EUR en es-CR/en-US, los casos de costo cero/ausente y el importe registrado.
- Comprobar fechas/horas y el eje X compacto/accesible en pantalla, CSV de Artículos y documentos impresos; los instantes, valores persistidos y barcode deben permanecer iguales.
- Chrome DevTools a 1440, 375 y 360 px: teclado/foco, idioma semántico, diálogos de confirmación, consola limpia, piso 12 px, sin overflow; en perfiles con dos pestañas, confirmar estado vacío inmediato y mensajes localizados.
- La verificación bilingüe se incorpora incrementalmente a las tareas; la tarea final registra los resultados de la integración con la extensión 005.

## 7. Trazabilidad

| Parte del plan | Requisitos funcionales | Principios |
|---|---|---|
| Catálogos para controles y errores nuevos | RF-1–RF-3, RF-7–RF-8 | 2, 4, 6 |
| Formato de moneda y fecha/hora | RF-4, RF-6, RF-9–RF-10 | 1, 2, 5, 6 |
| CSV, eje X y salida impresa | RF-3–RF-6, RF-9–RF-10 | 2, 4, 5, 6 |
| Confirmación de vaciado y pestañas | RF-3, RF-7, RF-10 | 2, 4, 5, 6 |
| Responsive y legibilidad | Requisitos no funcionales de la spec | 2, 4, 6 |
| Validación integrada | RF-1–RF-10 | 1, 2, 4, 5, 6 |

## Dependencias

- Las tareas T01–T10 de localización base están completadas y quedan como historial.
- Las tareas de esta extensión comienzan después de completar y validar las ampliaciones de preferencias de la spec 005.
- La spec 005 es la fuente de verdad para defaults, storage, tasa, paginación y vaciado; esta spec aporta su representación localizada.

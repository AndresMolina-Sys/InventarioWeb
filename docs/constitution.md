# Constitución — InventarioWeb Portfolio
1. **Stack simple:** Mantén React, TypeScript y Vite en sus versiones fijadas; no añadas dependencias sin aprobación.
2. **Spec y código:** Mantén `docs/figma-brief.md` sincronizado con cada cambio visible de la interfaz.
3. **Lógica e interfaz:** Limita IndexedDB y las validaciones a `src/lib/inventoryRepository.ts`; conserva muestras y migraciones en `src/data/demo.ts`.
4. **Verificación:** No instales dependencias de pruebas; ejecuta `npm run build` y comprueba flujo, consola y móvil con Chrome DevTools.
5. **Datos:** Mantén los registros en IndexedDB local; no los envíes a servicios externos ni los pierdas durante migraciones.
6. **Idioma:** Mantén los identificadores internos en inglés (`camelCase`/`PascalCase`); ofrece la interfaz y los mensajes al usuario en español o inglés según la preferencia local, con español como valor inicial. Escribe los comentarios breves del código en español.

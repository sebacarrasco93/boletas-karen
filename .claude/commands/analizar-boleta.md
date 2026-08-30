---
description: Analiza el formato de una boleta PDF del SII y agrega/actualiza su patrón de extracción en boleta-formatos/index.js
argument-hint: <ruta-al-pdf>
---

Te pasaron la ruta de un PDF de boleta de honorarios electrónica (BHE) real: $ARGUMENTS

Si no viene una ruta, pregunta cuál PDF de `DEJAR_BOLETAS` (o de cualquier otra ruta) hay que analizar antes de seguir.

Tu tarea es enseñarle al sistema de `boletas-karen` a reconocer este formato de boleta, para que `subir-boletas.cy.js` pueda extraer automáticamente el RUT del profesional y el folio desde el PDF (ya no se puede confiar en el nombre del archivo, el SII lo entrega con prefijos aleatorios).

Pasos:

1. **Mira el PDF** con la herramienta Read para entender su diseño visual (¿tiene logo?, ¿dónde aparecen el RUT emisor y el folio/N° de boleta?).

2. **Extrae el texto tal como lo ve el pipeline real**, ejecutando algo como:
   ```
   node -e "
   const { extraerTexto } = require('./boleta-formatos');
   extraerTexto('<ruta-al-pdf>').then(t => console.log(JSON.stringify(t)));
   "
   ```
   El texto que extrae `pdf-parse` puede no coincidir 1:1 con el layout visual (columnas, tablas, saltos de línea raros), así que trabaja siempre sobre este texto, no sobre lo que "se ve" en el PDF.

3. **Identifica en ese texto**: el RUT del profesional que EMITE la boleta (no el RUT de Karen ni el de la Isapre) y el número de folio/BHE.

4. **Revisa `boleta-formatos/index.js`**: si este PDF ya calza con un formato existente en el array `formatos`, no dupliques — ajusta ese `detectar`/`extraer` si hace falta para cubrir este caso también. Pruébalo contra el texto extraído antes de darlo por bueno.

5. **Si es un formato nuevo**, agrega una entrada al array `formatos` con:
   - `id`: identificador corto en kebab-case (se usa para trackear qué formato matcheó cada boleta subida, tanto en logs como en la columna "Formato" de Google Sheets, y también como nombre de su fixture).
   - `descripcion`: para que un humano entienda de qué boleta se trata.
   - `detectar(texto)`: debe ser lo bastante específico para no producir falsos positivos con otros formatos ya registrados (piensa en qué texto es único de este layout: nombre de un software emisor, una frase fija, etc. — no uses solo "contiene un RUT" porque eso lo cumple cualquier boleta).
   - `extraer(texto)`: regex sobre el texto que devuelva `{ rut, folio }`.

6. **Decide la posición en el array** (el orden = prioridad, se prueba de arriba hacia abajo): si no te dicen lo contrario, agrégalo al final. Si es evidente que es el formato más común (o el usuario te lo dice), ponlo primero, o pregunta.

7. **Crea un fixture de prueba con datos ficticios** (NUNCA con el RUT/folio real del PDF que te pasaron — son datos sensibles y no deben quedar commiteados):
   - Agrega en `boleta-formatos/generar-fixture.js` una función que genere, con `pdf-lib`, un PDF que imite el layout de este formato (mismas frases/etiquetas que gatillan el `detectar`) pero con un RUT y folio inventados.
   - Corre `node boleta-formatos/generar-fixture.js` para generar `boleta-formatos/fixtures/<id>.pdf` y `<id>.json` (con el `{ rut, folio }` ficticio esperado).
   - Corre `pnpm test:pdf` y confirma que todos los formatos (el nuevo y los que ya existían) siguen pasando. Si algo se rompe, es que el patrón nuevo está pisando a uno viejo (o viceversa) — ajusta el `detectar` para que sean mutuamente excluyentes.

8. Cierra con un resumen breve en español: qué patrón agregaste (o ajustaste), por qué, en qué posición de prioridad quedó, y confirma que `pnpm test:pdf` pasó.

No corras Cypress ni subas nada a NuevaMasVida en este comando — es solo para analizar el PDF, dejar `boleta-formatos/index.js` actualizado y su fixture de prueba con datos ficticios.

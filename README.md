
# Boletas NuevaMasVida

Para Karen Poblete (mi mami) ❤️

Busca y sube boletas emitidas por el SII a NuevaMasVida para reembolso

🤖 Esta versión (tracking en Sheets, reconocimiento de boletas por PDF, revisión de aprobadas, envío de correo, mock local, tests automáticos) se construyó con el apoyo de [Claude Code](https://claude.com/claude-code).

📋 Para el manual de uso (comandos, configuración, orden de trabajo), ver **[INSTRUCCIONES.md](./INSTRUCCIONES.md)**. Este README explica cómo está armado el proyecto por dentro.

## Funcionamiento

Para que reconozca las boletas, el RUT debe estar registrado en el archivo de configuración, en la llave `DATOS_PROFESIONALES` (el ejemplo de cómo hacero está al final).

El sistema es inteligente con las boletas:

1) Sabe exactamente qué boletas se subieron, así que no sube duplicadas.
2) A las que ya se subieron, les agrega `__SUBIDA__` al principio de su nombre, así tienes un control más simple de lo que ya se subió.
3) Si insistes con una boleta ya subida, va a eliminar la duplicada y no lo va a subir.

Puedes trabajar de dos formas:
1) Eliminando las boletas ya subidas
2) (Recomendada) Deja todo tal como está, ya que las subidas tendrán el nombre `__SUBIDA__ ` serán ignoradas automáticamente.

Además:

4) Si no hay boletas pendientes por subir, el sistema no abre el navegador ni intenta iniciar sesión: solo revisa la carpeta y termina de inmediato.
5) Cada boleta subida exitosamente queda registrada en una planilla de Google Sheets (ver sección "Tracking de boletas subidas" más abajo), además de renombrarse localmente con `__SUBIDA__`.
6) El nombre del archivo **ya no importa**: el SII a veces entrega las boletas con prefijos aleatorios (ej. `AAGvIvCZGUcar0UQKhMTTcLgem4:2_bhe_17521819-318.pdf`), así que el RUT del profesional y el folio se extraen directamente del **contenido** del PDF (ver sección "Reconocimiento de formato de boleta" más abajo). Puedes dejar el archivo con cualquier nombre.

## Instalación

Este proyecto usa [pnpm](https://pnpm.io) como gestor de paquetes (no `npm` ni `yarn`).

```
pnpm install
```

La primera vez, pnpm puede preguntar si permite correr el script de instalación de Cypress (descarga su binario). Puedes aprobarlo con:

```
pnpm approve-builds
```

## Cómo ejecutarlo

```
pnpm start
```

Esto corre el flujo real (`cypress/e2e/subir-boletas.cy.js`) con el navegador visible. También puedes usar `pnpm exec cypress open` para verlo paso a paso mientras se ajustan selectores si la Isapre cambia su sitio.

## Reconocimiento de formato de boleta (PDF)

El SII ya no entrega los archivos con nombres predecibles (a veces traen prefijos aleatorios según de dónde se descargaron), así que **el nombre del archivo ya no se usa para nada**. En vez de eso, `boleta-formatos/index.js` extrae el texto del PDF (con la librería `pdf-parse`) y lo pasa por una lista de "formatos" conocidos, probados en orden hasta que uno calce:

- Cada formato define cómo **detectar** si un PDF corresponde a ese layout, y cómo **extraer** de su texto el RUT del profesional y el folio.
- El **orden del array `formatos`** en `boleta-formatos/index.js` es la prioridad: se prueba el primero, y si no calza, el siguiente, y así sucesivamente. Conviene tener primero el formato más común para que la mayoría de las boletas se resuelvan rápido.
- Si ninguna boleta calza con ningún formato registrado, el sistema **no la sube ni la marca como subida** — la deja intacta y avisa por log que hay que enseñarle ese formato.
- El proyecto trae un formato `ejemplo-plantilla` con datos ficticios, que sirve solo de referencia/plantilla para el motor de extracción — **no está verificado contra una boleta real del SII**. Está a propósito al final de la prioridad; cuando registres formatos reales, van antes que este.

### Enseñarle un formato nuevo con `/analizar-boleta`

Cuando aparezca una boleta con un formato que el sistema no reconoce, dentro de Claude Code corre:

```
/analizar-boleta DEJAR_BOLETAS/nombre-del-archivo.pdf
```

Con un PDF real de ejemplo, Claude revisa dónde están el RUT y el folio en ese formato, agrega (o ajusta) la entrada correspondiente en `boleta-formatos/index.js`, crea un fixture de prueba con datos **ficticios** (nunca los reales del PDF que le pasaste) en `boleta-formatos/fixtures/`, y corre los tests (ver sección siguiente) antes de darlo por bueno. Con el tiempo, y a medida que se registran más formatos, se pueden reordenar a mano según cuáles resultan ser más comunes (el campo "Formato" que queda registrado en Google Sheets por cada boleta subida sirve para ver qué tan seguido aparece cada uno).

## Pruebas automáticas de los patrones de PDF

Cada formato registrado en `boleta-formatos/index.js` tiene un PDF de ejemplo con datos ficticios en `boleta-formatos/fixtures/<id>.pdf` (generados con `boleta-formatos/generar-fixture.js`, usando `pdf-lib`) y su resultado esperado en `boleta-formatos/fixtures/<id>.json`.

```
pnpm test:pdf
```

Esto corre, con [Vitest](https://vitest.dev), un test por cada fixture: confirma que `extraerDatosBoleta` reconoce el formato correcto y extrae exactamente el `{ rut, folio }` esperado. Sirve como red de seguridad al agregar formatos nuevos: si uno nuevo "tapa" (shadowea) a uno viejo por el orden de prioridad, o si una regex deja de funcionar, el test correspondiente falla.

Para regenerar los PDF de ejemplo (por ejemplo si agregas uno nuevo a `generar-fixture.js`):

```
node boleta-formatos/generar-fixture.js
```

`pnpm test:pdf` corre solo los tests de patrones de PDF. `pnpm test` corre **todos** los tests del proyecto (patrones de PDF + el manejo de archivos en `gestor-archivos.js` + el tracking en `google-sheets.js`).

## Estructura del código

- `cypress.config.js`: registra las *tasks* de Cypress (funciones Node que el spec puede invocar) y la config general. Es solo un punto de entrada delgado; la lógica real vive en los módulos de abajo.
- `gestor-archivos.js`: todo el manejo de `DEJAR_BOLETAS` (listar pendientes, marcar como subida, limpiar duplicados y boletas de prueba). Testeado en `gestor-archivos.test.js`.
- `boleta-formatos/`: reconocimiento de boletas por contenido del PDF (ver secciones de arriba).
- `google-sheets.js`: tracking en Google Sheets, "best effort".
- `constantes.js`: los prefijos `__SUBIDA__` y `PRUEBA_`, compartidos entre las tasks (Node) y el spec (navegador) para que no se desincronicen.
- `cypress/e2e/subir-boletas.cy.js`: el flujo real — login, recorre boletas pendientes, llena el formulario de reembolso, sube, y llama a las tasks de arriba.
- `revisar-aprobadas/`: revisión del estado de las solicitudes y movimiento de boletas aprobadas (`parsear-estado.js` interpreta el HTML de la Sucursal Virtual, `mover-aprobadas.js` cruza eso con los archivos locales y mueve). `cypress/e2e/revisar-aprobadas.cy.js` es el spec que los usa.
- `correo/`: envío por SMTP del correo con las boletas aprobadas (`armar-correo.js` es la parte pura/testeada, `crear-zip.js` comprime, `enviar-correo.js` es el CLI que orquesta todo).
- `cypress/support/sitio.js`: resuelve la URL base y la carpeta de boletas según el modo (real o `--env MOCK=true`), usado por ambos specs.
- `mock-nuevamasvida/`: clon mínimo del sitio para desarrollo/pruebas sin depender del sitio real (ver sección siguiente).

## Mock de NuevaMasVida (desarrollo y pruebas sin tocar el sitio real)

Para desarrollar o depurar el flujo sin depender de que el sitio real esté arriba (es intermitente) ni arriesgar solicitudes reales, hay un clon mínimo del sitio corriendo en local (`mock-nuevamasvida/`). No replica el diseño real, solo el mismo contrato de ids/forms que usan los specs, con datos 100% ficticios (`cypress.mock.env.json`).

```
pnpm start:mock              # corre subir-boletas.cy.js contra el mock
pnpm revisar-aprobadas:mock  # corre revisar-aprobadas.cy.js contra el mock
```

Cada uno levanta el servidor mock (`mock-nuevamasvida/servidor.js`, puerto 4567), espera a que responda, corre el spec correspondiente con `--env MOCK=true`, y apaga el servidor al terminar.

- Usa carpetas separadas — `DEJAR_BOLETAS_MOCK` y `PARA_ENVIAR_MOCK` (ambas en `.gitignore`) — para no tocar nunca boletas reales pendientes en `DEJAR_BOLETAS`.
- El "estado de reembolsos" del mock es el fixture `mock-nuevamasvida/solicitudes-mock.json` (editable) — por defecto trae folios de ejemplo AUTORIZADA y DEVUELTA para poder probar `revisar-aprobadas` sin nada real.
- También puedes levantar el servidor solo (`pnpm mock:server`) y abrirlo en el navegador para explorarlo a mano.
- Este mock ya encontró un bug real: al migrar la extracción de RUT desde el nombre de archivo al contenido del PDF, la comparación contra `DATOS_PROFESIONALES` dejó de calzar porque un lado comparaba con dígito verificador y el otro no. Nunca se detectó contra el sitio real porque, por seguridad, las pruebas en vivo siempre usaban RUTs que a propósito no calzaban con ningún profesional real.

## Probar el flujo sin arriesgar boletas reales

⚠️ Importante: la boleta de prueba se sube **de verdad** a la Isapre (queda una solicitud de reembolso real en su sistema, no una simulación). Úsala solo cuando quieras validar el flujo completo end-to-end, y con datos que tengan sentido (idealmente un folio real de una boleta ya reembolsada antes, no uno inventado) — así, si la Isapre la revisa, no es un dato basura.

Para probar que todo el flujo funciona (login, formulario, adjuntar archivos, envío), deja en `DEJAR_BOLETAS` un PDF con contenido que calce con algún formato ya registrado en `boleta-formatos/index.js`, con el prefijo reservado `PRUEBA_` en el nombre, por ejemplo:

```
DEJAR_BOLETAS/PRUEBA_cualquier-nombre.pdf
```

El sistema la procesa igual que una boleta real (queda como buena prueba de humo del flujo completo, incluyendo el envío a la Isapre), pero:

- Al terminar, se marca como `__SUBIDA__PRUEBA_...` igual que cualquier otra.
- En la **siguiente** corrida, el sistema detecta y elimina automáticamente cualquier archivo `__SUBIDA__PRUEBA_...`, así nunca se acumula ni queda mezclado con el registro de boletas reales. Puedes volver a dejar un archivo `PRUEBA_...` cuando quieras repetir la prueba.
- Queda igual registrada en Google Sheets, pero marcada con `Es Prueba = SI` para distinguirla fácilmente de las boletas reales.

### Estructura de carpetas y archivos

Las boletas se dejan tal como vienen, con el mismo nombre del SII, y se ponen en la carpeta:

```
DEJAR_BOLETAS
```

⚠️ Esta carpeta contiene boletas médicas reales (datos sensibles), por lo que está en `.gitignore` y nunca debe subirse al repositorio.

Los informes (cuando el tipo de consulta lo necesita) van en su propia subcarpeta, para no mezclarlos con las boletas:

```
DEJAR_BOLETAS/informes/kinesiologia.pdf
DEJAR_BOLETAS/informes/fonoaudiologia.pdf
```

Todo lo que esté dentro de `informes/` se ignora al buscar boletas pendientes (no hace falta ningún nombre especial). Qué informe le corresponde a cada profesional se define con el campo `INFORME` en `DATOS_PROFESIONALES` (ver sección siguiente) — y no todos los tipos de consulta necesitan uno.

### Datos de paciente y profesionales

En la raíz, debe haber un archivo `cypress.env.json` (si no está, cópialo desde `example.cypress.env.json` y ponle el nombre `cypress.env.json`.

Primero llenas la parte de paciente, imaginemos que se llama Karen Teresa Poblete Henríquez

```json
"RUT": "12123456-8",
"CLAVE": "miclavepersonal",
"NOMBRE": "KAREN TERESA POBLETE HENRIQUEZ",
```

Supongamos que hay dos profesionales:

Profesionales

|Tipo|RUT empresa|RUT persona|Nombre completo|
|--|--|--|--|
|Kinesiólogo|98.765.432-1|98.765.432-1|Máximo León Carrasco Garrido|
|Médico|76.123.456-1|12.345.678-9|Zoe Samantha Carrasco Garrido|

Si te fijas, la primera persona tiene mismo RUT de persona y empresa, y la segunda trabaja en otra empresa, pero deben ponerse en ambos, ya que la Isapre los pide así.

En este caso, la parte de DATOS_PROFESIONALES debería quedar así:

```json
{
  "DATOS_PROFESIONALES": [
    {
      "TIPO_CONSULTA": "Consulta médica",
      "RUT_EMPRESA": "98765432-1",
      "NOMBRE_PROFESIONAL": "CARRASCO GARRIDO MAXIMO LEON",
      "RUT_PROFESIONAL": "98765432-1",
      "INFORME": null
    }, {
      "TIPO_CONSULTA": "Kinesiología",
      "RUT_EMPRESA": "76123456-1",
      "NOMBRE_PROFESIONAL": "CARRASCO GARRIDO ZOE SAMANTHA",
      "RUT_PROFESIONAL": "12345678-9",
      "INFORME": "informes/kinesiologia.pdf"
    }
  ]
}
```

⚠️ `INFORME` es **nullable**: la ruta (relativa a `DEJAR_BOLETAS`) del informe que corresponde adjuntar para ESE profesional/tipo de consulta. Si ese tipo de consulta no necesita informe, déjalo en `null` (o quítalo directamente) y no se intenta adjuntar nada.

A continuación hay cosas a tener en cuenta, ya que así los trabaja NuevaMasVida.

⚠️ Todos los nombres deben ir en mayúsculas y deben ser completos (dos nombres y dos apellidos)

⚠️ Todos los nombres deben ir con los apellido primero y luego los nombres

⚠️ Las tildes en los nombres deben omitirse

⚠️ Los RUT deben estar sin guiones ni puntos

⚠️ En "tipo", va el tipo de atención, respeta también mayúsculas y minúsculas

Si no funciona, debes acceder desde tu navegador y copiar tal como aparece.

El archivo final de configuración quedaría así:
```json
{
  "RUT": "12123456-8",
  "CLAVE": "miclavepersonal",
  "NOMBRE": "KAREN TERESA POBLETE HENRIQUEZ",
  "DATOS_PROFESIONALES": [
    {
      "TIPO_CONSULTA": "Consulta médica",
      "RUT_EMPRESA": "98765432-1",
      "NOMBRE_PROFESIONAL": "CARRASCO GARRIDO MAXIMO LEON",
      "RUT_PROFESIONAL": "98765432-1",
      "INFORME": null
    }, {
      "TIPO_CONSULTA": "Kinesiología",
      "RUT_EMPRESA": "76123456-1",
      "NOMBRE_PROFESIONAL": "CARRASCO GARRIDO ZOE SAMANTHA",
      "RUT_PROFESIONAL": "12345678-9",
      "INFORME": "informes/kinesiologia.pdf"
    }
  ],
  "GOOGLE_SHEETS": {
    "SPREADSHEET_ID": "1a2B3c4D5e6F...",
    "SERVICE_ACCOUNT_KEY_PATH": "google-credentials.json"
  }
}
```

## Tracking de boletas subidas (Google Sheets)

Cada vez que se sube una boleta con éxito, además de renombrarse localmente, se agrega una fila a una planilla de Google Sheets con: fecha, archivo, RUT y nombre del profesional, tipo de consulta, folio, si fue una boleta de prueba, y el estado.

El registro es "best effort": si Google Sheets no está configurado o falla, la subida real a la Isapre **no se ve afectada**, solo se muestra una advertencia en consola.

### Configuración (una sola vez)

1. Crea (o reusa) un proyecto en [Google Cloud Console](https://console.cloud.google.com/) y habilita la API de Google Sheets.
2. Crea una cuenta de servicio (Service Account) y descarga su llave en formato JSON.
3. Guarda ese archivo como `google-credentials.json` en la raíz del proyecto (ya está en `.gitignore`, nunca se sube al repo).
4. Crea una planilla de Google Sheets con una hoja llamada `Boletas` y esta fila de encabezado en `A1:I1`:

   ```
   Fecha | Archivo | RUT Profesional | Nombre Profesional | Tipo Consulta | Folio | Es Prueba | Estado | Formato
   ```

5. Comparte la planilla (permiso de Editor) con el correo de la cuenta de servicio, que tiene un formato como `nombre@proyecto.iam.gserviceaccount.com` (lo encuentras en el JSON descargado, en el campo `client_email`).
6. Copia el ID de la planilla (la parte de la URL entre `/d/` y `/edit`) y ponlo en `cypress.env.json`, en `GOOGLE_SHEETS.SPREADSHEET_ID`.

Si no configuras esto, el sistema sigue funcionando igual (solo omite el registro en la planilla).

## Revisar aprobadas

```
pnpm revisar-aprobadas
```

Es un comando aparte de `pnpm start` — no sube nada nuevo, solo revisa. Entra a la Sucursal Virtual, abre "Estado de reembolsos" (las solicitudes de los últimos 12 meses) y por cada boleta que ya subiste (`DEJAR_BOLETAS/__SUBIDA__...`):

- Si el folio quedó **AUTORIZADA** en el portal, mueve el archivo a `PARA_ENVIAR/zip` (le quita el prefijo `__SUBIDA__` de paso), listo para el siguiente `pnpm enviar-correo`.
- Si quedó **DEVUELTA**, no la mueve — te avisa por consola con el motivo de rechazo que dio la Isapre, para que decidas si corresponde resubir con más antecedentes.
- Si el folio todavía no aparece en el portal (sigue en revisión), no toca nada.
- Una misma boleta puede tener varios intentos en el historial (ej. devuelta una vez y autorizada después, al reenviarla) — si CUALQUIER intento quedó autorizado, se considera aprobada.
- Las boletas de prueba (`PRUEBA_...`) nunca se mueven, aunque su folio aparezca autorizado.
- Si dos boletas locales comparten el mismo folio (caso raro), no mueve ninguna y avisa para que lo resuelvas a mano.

## Envío de correo con las boletas aprobadas

En vez de controlar el navegador de Yahoo Mail (lo que habría implicado sumar Playwright y lidiar con sesiones/CAPTCHA), el envío se hace por SMTP directo con [nodemailer](https://nodemailer.com) — sin navegador, sin sesión que mantener viva. Yahoo soporta esto vía "contraseña de aplicación".

### Configuración (una sola vez)

1. En tu cuenta Yahoo: Cuenta → Seguridad → **Generar contraseña de aplicación**.
2. Copia `example.email.config.json` a `email.config.json` (ya está en `.gitignore`) y completa remitente (tu correo + esa contraseña de aplicación), destinatario, asunto y mensaje.

### Uso

Deja los archivos a enviar en la carpeta `PARA_ENVIAR` (en `.gitignore`: son documentos reales, nunca van al repo):

- `PARA_ENVIAR/zip/`: las boletas ya aprobadas por la Isapre. Se comprimen automáticamente en un solo `.zip` y se adjuntan. (La detección de "aprobado" todavía es manual: tú decides qué boletas van acá — ver "Próximas etapas".)
- `PARA_ENVIAR/adjuntos/`: cualquier adjunto suelto adicional (no se comprime, va tal cual).

Luego:

```
pnpm enviar-correo
```

Arma el `.zip`, te muestra una **vista previa completa** (remitente, destinatario, asunto, mensaje y lista de adjuntos) y pide confirmación antes de enviar nada. Si cancelas, no se envía nada y se borra el `.zip` temporal. Para saltarte la confirmación (por ejemplo si más adelante se automatiza), corre `pnpm enviar-correo --si`.

## Próximas etapas

Este proyecto se está mejorando por etapas:

- ✅ **Etapa 1**: limpieza de intentos antiguos, no abrir el navegador si no hay boletas pendientes, boleta de prueba autolimpiable, tracking de boletas subidas en Google Sheets, reconocimiento de boletas por contenido del PDF (con `/analizar-boleta` y tests automáticos de patrones), migración del proyecto a pnpm, migración de credenciales a `cy.env()` (en vez del `Cypress.env()` deprecado, que exponía todo al navegador), e informe adjunto por tipo de consulta.
- ✅ **Etapa 2**: envío por correo (SMTP + nodemailer) del `.zip` de boletas aprobadas + adjuntos, con vista previa y confirmación antes de enviar.
- ✅ **Etapa 3**: `pnpm revisar-aprobadas` entra a la Sucursal Virtual, revisa el estado de cada solicitud, y mueve automáticamente a `PARA_ENVIAR/zip` las boletas ya subidas cuyo folio quedó AUTORIZADA (ver sección "Revisar aprobadas" más abajo).
- ✅ **Etapa 4**: mock local del sitio (`pnpm start:mock`, `pnpm revisar-aprobadas:mock`) para desarrollar y testear los flujos sin depender del sitio real ni arriesgar solicitudes.

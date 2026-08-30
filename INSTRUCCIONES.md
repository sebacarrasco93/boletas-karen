# Instrucciones

Manual operativo: todos los comandos, cómo configurar cada cosa, y el orden en que se usan. Para entender cómo está armado el código por dentro, ver [README.md](./README.md).

## 1. Instalación (una sola vez)

```
pnpm install
```

Si pnpm pregunta por permisos de instalación (necesarios para el binario de Cypress):

```
pnpm approve-builds
```

## 2. Configuración inicial (una sola vez)

### 2.1. Credenciales y profesionales — `cypress.env.json`

Copia `example.cypress.env.json` a `cypress.env.json` (este último está en `.gitignore`, nunca se sube al repo) y complétalo:

```json
{
  "RUT": "12123456-8",
  "CLAVE": "tu-clave-de-nuevamasvida",
  "NOMBRE": "NOMBRE APELLIDO DEL PACIENTE",
  "DATOS_PROFESIONALES": [
    {
      "TIPO_CONSULTA": "Consulta médica",
      "RUT_EMPRESA": "98765432-1",
      "NOMBRE_PROFESIONAL": "APELLIDO APELLIDO NOMBRE NOMBRE",
      "RUT_PROFESIONAL": "98765432-1",
      "INFORME": null
    },
    {
      "TIPO_CONSULTA": "Kinesiología",
      "RUT_EMPRESA": "76123456-1",
      "NOMBRE_PROFESIONAL": "APELLIDO APELLIDO NOMBRE NOMBRE",
      "RUT_PROFESIONAL": "12345678-9",
      "INFORME": "informes/kinesiologia.pdf"
    }
  ]
}
```

Reglas para `DATOS_PROFESIONALES` (así los pide NuevaMasVida):
- Nombres en MAYÚSCULAS, completos (dos nombres y dos apellidos), apellidos primero, sin tildes.
- RUT sin puntos (con o sin guion, da lo mismo — se compara solo la parte numérica).
- `TIPO_CONSULTA` debe respetar mayúsculas/minúsculas tal como aparece en el selector del sitio.
- **`INFORME` es opcional (nullable)**: la ruta del informe a adjuntar para ese tipo de consulta, relativa a `DEJAR_BOLETAS`. Si ese tipo de consulta no necesita informe, déjalo en `null`. Ver punto 2.2.

### 2.2. Carpeta de boletas — `DEJAR_BOLETAS/`

Se crea sola la primera vez que corres cualquier comando. Ahí van:

- Las boletas del SII, con cualquier nombre (el sistema lee el RUT y folio desde el contenido del PDF, no del nombre del archivo).
- Una subcarpeta `informes/` con los informes que declaraste en `DATOS_PROFESIONALES[].INFORME`, ej:
  ```
  DEJAR_BOLETAS/informes/kinesiologia.pdf
  DEJAR_BOLETAS/informes/fonoaudiologia.pdf
  ```
  Todo lo que esté dentro de `informes/` se ignora al buscar boletas pendientes — no hace falta ningún nombre especial, y los tipos de consulta que no necesiten informe (`INFORME: null`) simplemente no adjuntan nada.

Toda esta carpeta está en `.gitignore` (son documentos médicos/financieros reales).

### 2.3. Tracking en Google Sheets (opcional)

Sin esto, el sistema funciona igual — solo no queda registro en una planilla. Para activarlo:

1. Crea/reusa un proyecto en [Google Cloud Console](https://console.cloud.google.com/), habilita la API de Sheets, y crea una cuenta de servicio con llave JSON.
2. Guarda esa llave como `google-credentials.json` en la raíz (gitignoreado).
3. Crea una planilla con una hoja `Boletas`, encabezado en `A1:I1`:
   ```
   Fecha | Archivo | RUT Profesional | Nombre Profesional | Tipo Consulta | Folio | Es Prueba | Estado | Formato
   ```
4. Compártela (Editor) con el `client_email` de la cuenta de servicio.
5. En `cypress.env.json`, agrega `GOOGLE_SHEETS.SPREADSHEET_ID` con el ID de la planilla (la parte de la URL entre `/d/` y `/edit`).

### 2.4. Envío de correo (opcional, para la Etapa 2/3)

1. En tu cuenta Yahoo: Cuenta → Seguridad → **Generar contraseña de aplicación**.
2. Copia `example.email.config.json` a `email.config.json` (gitignoreado) y completa remitente (correo + esa contraseña de aplicación), destinatario, asunto y mensaje.

## 3. Flujo de trabajo típico

En este orden:

```
pnpm start                # 1. Sube las boletas pendientes en DEJAR_BOLETAS
pnpm revisar-aprobadas     # 2. Revisa el estado en la Isapre y mueve las AUTORIZADA a PARA_ENVIAR/zip
pnpm enviar-correo         # 3. Arma el .zip + adjuntos, muestra vista previa, y (con tu confirmación) lo envía
```

- El paso 2 puede correrse varias veces mientras esperas que la Isapre revise (no hace nada si no hay novedades).
- `PARA_ENVIAR/adjuntos/` es para adjuntos sueltos que quieras mandar junto con el `.zip` (no se comprimen).

## 4. Todos los comandos

| Comando | Qué hace |
|---|---|
| `pnpm start` | Sube las boletas pendientes de `DEJAR_BOLETAS` a NuevaMasVida (navegador visible). No abre nada si no hay boletas pendientes. |
| `pnpm revisar-aprobadas` | Entra a la Sucursal Virtual, revisa el estado de las solicitudes, y mueve a `PARA_ENVIAR/zip` las boletas ya subidas que quedaron AUTORIZADA. Avisa por consola las DEVUELTA (con el motivo). |
| `pnpm enviar-correo` | Comprime `PARA_ENVIAR/zip`, junta `PARA_ENVIAR/adjuntos`, muestra vista previa y pide confirmación antes de enviar por correo (SMTP/Yahoo). `--si` para saltarse la confirmación. |
| `pnpm test` | Corre todos los tests automáticos (patrones de PDF, manejo de archivos, tracking, armado de correo). |
| `pnpm test:pdf` | Corre solo los tests de patrones de boleta (PDF). |
| `pnpm start:mock` | Como `pnpm start`, pero contra un clon local del sitio (sin tocar boletas reales ni depender de que el sitio real esté arriba). Ver punto 6. |
| `pnpm revisar-aprobadas:mock` | Como `pnpm revisar-aprobadas`, contra el mock. |
| `pnpm mock:server` | Levanta el mock solo, para explorarlo a mano en el navegador (`http://localhost:4567`). |
| `pnpm mock:sembrar-boleta` | Genera una boleta de ejemplo (datos ficticios) en `DEJAR_BOLETAS_MOCK`, lista para `pnpm start:mock`. |

## 5. Boleta de prueba (probar el flujo completo, con cuidado)

⚠️ Se sube **de verdad** a la Isapre — no es una simulación. Úsala solo para validar que el flujo funciona end-to-end, con datos que tengan sentido (idealmente un folio ya reembolsado antes).

Deja en `DEJAR_BOLETAS` un PDF con contenido que calce con algún formato ya registrado (ver punto 7), con el prefijo `PRUEBA_` en el nombre:

```
DEJAR_BOLETAS/PRUEBA_cualquier-nombre.pdf
```

Se procesa igual que una boleta real, pero en la corrida **siguiente** se detecta y se borra sola (nunca se acumula, nunca se mezcla con boletas reales). Queda marcada `Es Prueba = SI` en Google Sheets si lo tienes configurado.

## 6. Modo mock (desarrollar y probar sin tocar el sitio real)

El sitio real es intermitente y las boletas de prueba generan solicitudes reales. Para desarrollar/depurar sin ese riesgo, hay un clon mínimo del sitio corriendo en local (`mock-nuevamasvida/`), con datos 100% ficticios.

```
pnpm mock:sembrar-boleta   # opcional: deja una boleta de ejemplo para procesar
pnpm start:mock
pnpm revisar-aprobadas:mock
```

- Usa carpetas separadas (`DEJAR_BOLETAS_MOCK`, `PARA_ENVIAR_MOCK`) — nunca toca `DEJAR_BOLETAS` real.
- El "estado de reembolsos" del mock sale de `mock-nuevamasvida/solicitudes-mock.json` (editable), con folios de ejemplo AUTORIZADA y DEVUELTA.
- Corren en modo headless (sin ventana) por defecto, ya que terminan en segundos. Si quieres verlo paso a paso, usa `pnpm exec cypress open --env MOCK=true` con el mock levantado (`pnpm mock:server` en otra terminal).
- Sirve para probar cambios de código en segundos en vez de minutos, y ya encontró bugs reales que las pruebas contra el sitio real no alcanzaban a detectar.
- Estos mismos comandos corren automáticamente en CI (GitHub Actions) en cada push — ver punto 9.

## 7. Enseñarle un formato de boleta nuevo

El SII entrega las boletas con nombres de archivo impredecibles, así que el sistema lee el RUT del profesional y el folio directamente del **contenido** del PDF, probando una lista de "formatos" conocidos. Cuando aparezca una boleta con un formato que no reconoce (avisa por log), dentro de Claude Code corre:

```
/analizar-boleta DEJAR_BOLETAS/nombre-del-archivo.pdf
```

Con un PDF real de ejemplo, arma (o ajusta) el patrón correspondiente, genera un fixture de prueba con datos **ficticios**, y corre los tests antes de darlo por bueno.

## 8. CI (GitHub Actions)

En cada push/PR a `main` o `dev` corre `.github/workflows/tests.yml`, con dos jobs:

- **unit-tests**: `pnpm test` (todo Vitest, sin red).
- **e2e-mock**: siembra una boleta de ejemplo, corre `pnpm start:mock` y `pnpm revisar-aprobadas:mock`, y verifica que la boleta haya terminado en `PARA_ENVIAR_MOCK/zip`. También corre `enviar-correo.js` con un `email.config.json` de ejemplo, cancelando el envío (nunca manda un correo real).

Nunca corre contra el sitio real ni con credenciales reales — no las necesita, ni podría (no hay secrets configurados). Todo lo que usa son datos ficticios generados en el momento o ya versionados como fixtures (nunca boletas ni configuraciones reales).

## 9. Problemas comunes

- **"Falta cypress.env.json"**: cópialo desde `example.cypress.env.json` (ver 2.1).
- **522 / timeout al correr `pnpm start` o `pnpm revisar-aprobadas`**: el sitio de la Isapre es intermitente. El sistema reintenta solo (hasta 3 veces); si sigue fallando, espera un rato y corre de nuevo.
- **Una boleta no se sube y avisa "no se reconoció el formato"**: es un formato de PDF nuevo — usa `/analizar-boleta` (punto 7).
- **Una boleta no se sube y avisa "el RUT no está en DATOS_PROFESIONALES"**: falta agregar (o corregir) ese profesional en `cypress.env.json`.
- **`pnpm enviar-correo` dice que falta `email.config.json`**: cópialo desde `example.email.config.json` (ver 2.4).
- **Quiero probar algo sin arriesgar nada real**: usa el modo mock (punto 6) en vez de la boleta de prueba (punto 5) siempre que puedas.


# Boletas NuevaMasVida

Para Karen Poblete (mi mami) ❤️

Busca y sube boletas emitidas por el SII a NuevaMasVida para reembolso

## Funcionamiento

Para que reconozca las boletas, el RUT debe estar registrado en el archivo de configuración, en la llave `DATOS_PROFESIONALES` (el ejemplo de cómo hacero está al final).

El sistema es inteligente con las boletas:

1) Sabe exactamente qué boletas se subieron, así que no sube duplicadas.
2) A las que ya se subieron, les agrega `__SUBIDA__` al principio de su nombre, así tienes un control más simple de lo que ya se subió.
3) Si insistes con una boleta ya subida, va a eliminar la duplicada y no lo va a subir.

Puedes trabajar de dos formas:
1) Eliminando las boletas ya subidas
2) (Recomendada) Deja todo tal como está, ya que las subidas tendrán el nombre `__SUBIDA__ ` serán ignoradas automáticamente.

### Estructura de carpetas y archivos

Las boletas se dejan tal como vienen, con el mismo nombre del SII, y se ponen en la carpeta:

```
DEJAR_BOLETAS
```

Informe a adjuntar

```
DEJAR_BOLETAS/Informe.pdf
```

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
      "RUT_PROFESIONAL": "98765432-1"
    }, {
      "TIPO_CONSULTA": "Kinesiología",
      "RUT_EMPRESA": "76123456-1",
      "NOMBRE_PROFESIONAL": "CARRASCO GARRIDO ZOE SAMANTHA",
      "RUT_PROFESIONAL": "12345678-9"
    }
  ]
}
```

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
      "RUT_PROFESIONAL": "98765432-1"
    }, {
      "TIPO_CONSULTA": "Kinesiología",
      "RUT_EMPRESA": "76123456-1",
      "NOMBRE_PROFESIONAL": "CARRASCO GARRIDO ZOE SAMANTHA",
      "RUT_PROFESIONAL": "12345678-9"
    }
  ]
}
```

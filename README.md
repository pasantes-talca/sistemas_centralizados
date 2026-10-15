# Portal de Sistemas Talca

Portal web interno desarrollado para centralizar el acceso a los distintos sistemas utilizados en Talca.

La aplicación permite visualizar las plataformas disponibles, acceder directamente a cada una y consultar su estado de disponibilidad desde una única interfaz.

El portal es independiente de los sistemas existentes: no modifica sus configuraciones, bases de datos, puertos ni mecanismos de autenticación.

## 1. Tecnologías utilizadas

- **Backend:** Python 3.10 o superior.
- **Frontend:** HTML5, CSS3 y JavaScript.
- **Servidor HTTP:** `ThreadingHTTPServer`, incluido en la biblioteca estándar de Python.
- **Configuración:** archivos JSON.
- **Control de versiones:** Git y GitHub.
- **Sistema operativo:** compatible con Windows y Linux.

No requiere instalar dependencias externas mediante `pip`, utilizar una base de datos ni descargar recursos desde Internet.

## 2. Identidad visual

El diseño del portal toma como referencia la identidad institucional de [Talca](https://talca.com.ar/), consultada el 1 de octubre de 2026.

Colores utilizados:

| Color | Código | Aplicación |
|---|---|---|
| Azul institucional | `#0439AC` | Encabezados, iconos y acciones |
| Rojo institucional | `#E1251B` | Elementos destacados |
| Verde | `#80CD00` | Indicadores de disponibilidad |
| Gris | `#6E7E7E` | Elementos secundarios |

La interfaz utiliza la tipografía del sistema operativo, priorizando Segoe UI y Arial.

### Logo institucional

Para incorporar el logo oficial de Talca, colocar el archivo en alguna de las siguientes rutas:

- `static/assets/talca-logo.svg`
- `static/assets/talca-logo.png`

El sistema prioriza el formato SVG.

Si no encuentra ninguno de estos archivos, muestra el nombre TALCA como texto.

### Diseño adaptable

La distribución de las tarjetas se adapta automáticamente al tamaño de pantalla:

- Desde 1200 px: 4 columnas.
- Desde 950 px: 3 columnas.
- Desde 600 px: 2 columnas.
- En dispositivos pequeños: 1 columna.

El portal incluye búsqueda, filtros por categorías, indicadores de disponibilidad y navegación mediante teclado.

## 3. Estructura del proyecto

```text
sistemas_centralizados/
│
├── .gitignore
├── README.md
├── server.py
├── sistemas.json
├── test_server.py
├── preview.mjs
│
└── static/
    ├── index.html
    ├── styles.css
    ├── app.js
    ├── favicon.svg
    │
    └── assets/
        ├── talca-logo.svg
        └── talca-logo.png
```

Los archivos del logo son opcionales.

### Descripción de los archivos

| Archivo | Función |
|---|---|
| `server.py` | Inicia el servidor HTTP y administra las solicitudes |
| `sistemas.json` | Define los sistemas disponibles en el portal |
| `static/index.html` | Estructura principal de la interfaz |
| `static/styles.css` | Estilos y diseño visual |
| `static/app.js` | Funcionalidades interactivas |
| `static/favicon.svg` | Icono del navegador |
| `test_server.py` | Pruebas automatizadas del backend |
| `preview.mjs` | Validación visual opcional de la interfaz |

## 4. Configuración del servidor

### Servidor de Talca

La aplicación está preparada para ejecutarse en el servidor interno:

- **Dirección IP:** `10.242.4.13`
- **Puerto configurado:** `8081`
- **Protocolo:** HTTP
- **URL:** `http://10.242.4.13:8081/`

### Configuración del puerto

El archivo `server.py` contiene la configuración:

```python
host, port = os.environ.get("HOST", "0.0.0.0"), int(os.environ.get("PORT", "8081"))
```

Donde:

- `HOST`: dirección en la que escucha el servidor.
- `0.0.0.0`: permite recibir conexiones desde las interfaces de red disponibles.
- `PORT`: variable de entorno que permite configurar el puerto.
- `8081`: puerto predeterminado cuando no se establece otro.

El puerto anterior, `8080`, fue reemplazado por `8081` para evitar un conflicto detectado durante la ejecución en el servidor.

**Importante:** el nuevo puerto debe estar disponible antes de iniciar el portal. La configuración no finaliza otros procesos ni modifica los servicios existentes.

## 5. Ejecutar el proyecto en Windows

### Paso 1. Abrir la carpeta

Ubicarse en el directorio del proyecto:

```powershell
cd C:\Users\Usuario\Desktop\sistemas_centralizados
```

La ruta debe adaptarse si el proyecto está instalado en otra ubicación.

### Paso 2. Comprobar Python

Ejecutar:

```powershell
python --version
```

Se requiere Python 3.10 o superior.

### Paso 3. Verificar que el puerto esté disponible

Ejecutar:

```powershell
Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
```

Si no aparecen resultados, no se detectó ningún proceso escuchando en ese puerto.

Si aparece un proceso, identificarlo antes de decidir qué hacer. No finalizar servicios sin comprobar su función.

### Paso 4. Iniciar el servidor

Ejecutar:

```powershell
Remove-Item Env:PORT -ErrorAction SilentlyContinue
python server.py
```

El primer comando elimina cualquier variable `PORT` definida en la sesión actual, para utilizar el valor predeterminado establecido en `server.py`.

Si la aplicación inicia correctamente, aparecerá:

```text
Portal Talca escuchando en 0.0.0.0:8081. Ctrl+C para detener.
```

La consola debe permanecer abierta mientras se utilice este método de ejecución.

### Paso 5. Acceder al portal

Desde el propio servidor:

http://localhost:8081/

Desde otra computadora conectada a la red interna de Talca:

http://10.242.4.13:8081/

El acceso remoto requiere que el puerto TCP 8081 esté permitido en el firewall del servidor.

### Detener el servidor

En la consola donde se está ejecutando:

```text
Ctrl+C
```

Esto detiene solamente la instancia del portal iniciada en esa consola.

## 6. Ejecutar el proyecto en Linux

Desde la carpeta del proyecto:

```bash
python3 server.py
```

Para establecer explícitamente el puerto:

```bash
PORT=8081 python3 server.py
```

Acceder mediante:

```text
http://localhost:8081/
```

Para acceder desde otra computadora, utilizar la dirección IP correspondiente al servidor Linux.

## 7. Actualización desde GitHub

Repositorio oficial del proyecto:

https://github.com/pasantes-talca/sistemas_centralizados.git

### Desarrollo desde Visual Studio Code

Los cambios se realizan inicialmente en la computadora de desarrollo.

Después de modificar y comprobar los archivos:

```bash
git status
git add .
git commit -m "Actualizar portal de sistemas Talca"
git push origin main
```

Esto publica los cambios en la rama `main` del repositorio remoto.

### Actualización del proyecto en el servidor

Abrir PowerShell dentro de la carpeta del proyecto:

```powershell
cd C:\Users\Usuario\Desktop\sistemas_centralizados
```

Comprobar el estado del repositorio:

```powershell
git status
```

Si existen modificaciones locales, revisarlas antes de actualizar para evitar sobrescribir trabajo.

Descargar los cambios:

```powershell
git pull origin main
```

Si el portal está ejecutándose, detener su instancia de forma controlada antes de reiniciarla para aplicar las modificaciones del backend.

Iniciar nuevamente:

```powershell
Remove-Item Env:PORT -ErrorAction SilentlyContinue
python server.py
```

Comprobar el funcionamiento ingresando a:

http://10.242.4.13:8081/

Este procedimiento permite mantener sincronizados el código de desarrollo, GitHub y la instalación del servidor.

## 8. Configuración de los sistemas centralizados

Los sistemas disponibles se administran mediante el archivo:

```text
sistemas.json
```

Cada sistema contiene información como:

- Identificador único.
- Nombre.
- Descripción.
- Dirección URL.
- Icono.
- Categoría.

### Ejemplo de configuración

```json
{
  "id": "produccion",
  "nombre": "Sistema de Producción",
  "descripcion": "Gestión y consulta de producción.",
  "url": "http://10.242.4.13:9000/",
  "icono": "cajas",
  "categoria": "Operaciones"
}
```

La dirección utilizada en este ejemplo es ilustrativa y debe reemplazarse por la dirección real del sistema.

Para incorporar una nueva aplicación:

1. Abrir `sistemas.json`.
2. Agregar un objeto dentro de la lista.
3. Completar los campos correspondientes.
4. Verificar que el identificador sea único.
5. Guardar el archivo.
6. Reiniciar el portal.

### Iconos disponibles

- `cajas`
- `aplicacion`
- `grafico`
- `escudo`

Los valores desconocidos utilizan un icono genérico.

Las categorías se generan automáticamente a partir de la configuración.

## 9. Variables de entorno

El portal permite personalizar su funcionamiento mediante variables de entorno.

| Variable | Predeterminado | Descripción |
|---|---|---|
| `HOST` | `0.0.0.0` | Dirección de escucha |
| `PORT` | `8081` | Puerto HTTP |
| `SYSTEMS_CONFIG` | `sistemas.json` | Archivo de configuración |
| `HEALTH_CHECK_ENABLED` | `true` | Habilitar monitoreo |
| `HEALTH_INTERVAL` | `60` | Intervalo de verificación en segundos |
| `HEALTH_TIMEOUT` | `3` | Tiempo máximo de espera por sistema |

El intervalo mínimo de monitoreo es de 15 segundos.

El tiempo máximo de espera se limita a un rango de 0,5 a 10 segundos.

Las variables se leen desde el entorno del proceso. El servidor no carga automáticamente archivos `.env`.

### Cambiar temporalmente el puerto

Por ejemplo, para utilizar el puerto `8082` en PowerShell:

```powershell
$env:PORT = "8082"
python server.py
```

Esta configuración tiene prioridad sobre el puerto predeterminado definido en el código.

El cambio se aplica a la sesión correspondiente y no modifica automáticamente el repositorio.

## 10. Monitoreo de disponibilidad

El portal incorpora un sistema de monitoreo que verifica periódicamente si las aplicaciones configuradas responden a solicitudes HTTP.

Las verificaciones se realizan desde el backend, utilizando las direcciones configuradas por el administrador.

No se envían solicitudes de monitoreo directamente desde los navegadores de los usuarios.

### Estados disponibles

| Estado | Descripción |
|---|---|
| Disponible | El servicio responde correctamente o solicita autenticación |
| No disponible | La conexión falla, excede el tiempo de espera o devuelve un error no admitido |
| Verificando | Se está ejecutando la primera comprobación |
| Sin verificar | El monitoreo está desactivado o no se pudo obtener su estado |

Se consideran respuestas de disponibilidad:

- Códigos HTTP `200–399`.
- Código HTTP `401`.
- Código HTTP `403`.

Otros códigos o errores de conexión se consideran no disponibles.

Estos indicadores verifican la respuesta HTTP, pero no garantizan que todas las funcionalidades internas de cada sistema estén operativas.

### Funcionamiento del monitoreo

El backend:

1. Lee las aplicaciones configuradas.
2. Inicia las verificaciones en segundo plano.
3. Consulta las direcciones HTTP correspondientes.
4. Actualiza los estados compartidos.
5. Permite que el frontend consulte esos resultados.

Se utilizan hasta ocho verificaciones concurrentes.

El navegador consulta los estados almacenados por el backend cada 15 segundos.

## 11. API del portal

El servidor incluye endpoints HTTP para consultar la información del portal.

### Obtener sistemas

```http
GET /api/sistemas
```

Devuelve la lista de sistemas configurados en formato JSON.

Ejemplo:

```text
http://localhost:8081/api/sistemas
```

### Obtener estados

```http
GET /api/estado
```

Devuelve los estados de disponibilidad y la fecha de la última verificación.

Ejemplo:

```text
http://localhost:8081/api/estado
```

Estos endpoints permiten que la interfaz obtenga información sin acceder directamente a los archivos de configuración del servidor.

## 12. Seguridad

El portal está diseñado para utilizarse dentro de la red privada de Talca.

Consideraciones:

- No publicar el servidor directamente en Internet.
- Permitir el acceso únicamente desde redes autorizadas.
- Mantener configurado el firewall del servidor.
- Administrar los archivos de configuración mediante usuarios autorizados.
- Evitar almacenar credenciales en el repositorio.
- Mantener las credenciales y permisos propios de cada sistema.
- No detener procesos existentes para liberar puertos sin verificar previamente su función.

El portal no incorpora un sistema de autenticación propio.

La disponibilidad de un enlace no significa que el usuario tenga permisos para ingresar al sistema correspondiente.

### Firewall de Windows

Si el puerto 8081 está disponible y el portal funciona localmente, pero no puede abrirse desde otras computadoras, se debe revisar el firewall.

Un administrador puede crear una regla de entrada que permita TCP 8081 exclusivamente desde las redes internas autorizadas.

Esta configuración debe realizarse respetando las políticas de seguridad del servidor.

## 13. Pruebas del proyecto

El proyecto incluye pruebas automatizadas del backend.

Ejecutar desde la carpeta raíz:

```powershell
python -m unittest -v
```

Las pruebas permiten validar:

- Respuestas HTTP.
- Archivos estáticos.
- Endpoints de la API.
- Configuraciones incorrectas.
- Detección de puertos ocupados.
- Clasificación de estados de disponibilidad.

Las pruebas utilizan servicios locales simulados y no modifican los sistemas reales.

### Validación visual opcional

Si se dispone de Node.js 22 o superior y Google Chrome en su ubicación habitual de Windows:

```powershell
node preview.mjs
```

La herramienta permite verificar:

- Diseño adaptable.
- Búsqueda de sistemas.
- Categorías.
- Enlaces.
- Posibles desbordes visuales.

Genera capturas de prueba y finaliza los procesos temporales al terminar.

## 14. Solución de problemas

### Error WinError 10048

Mensaje:

```text
Solo se permite un uso de cada dirección de socket.
```

Significa que el puerto solicitado ya se encuentra ocupado o no puede reservarse debido a un conflicto de dirección.

Para comprobar qué proceso lo utiliza:

```powershell
Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
```

Para identificar un proceso mediante su PID:

```powershell
Get-Process -Id NUMERO_PID
```

No finalizar procesos sin verificar a qué aplicación pertenecen.

Si es necesario, utilizar otro puerto disponible mediante la variable `PORT`.

### La ventana de Python se abre y se cierra

No iniciar el archivo mediante doble clic para diagnosticar errores.

Abrir una terminal en la carpeta y ejecutar:

```powershell
python server.py
```

De esta manera, los mensajes de error permanecen visibles.

### El servidor funciona, pero no abre desde otra computadora

Verificar:

1. Que `server.py` esté ejecutándose.
2. Que la IP del servidor sea correcta.
3. Que el puerto utilizado coincida con el configurado.
4. Que el firewall permita conexiones entrantes.
5. Que ambas computadoras tengan conectividad de red.
6. Que el servicio esté escuchando en una interfaz accesible y no únicamente en `localhost`.

### El sistema aparece como no disponible

Revisar:

- Que la aplicación de destino esté iniciada.
- Que su URL sea correcta.
- Que el puerto correspondiente esté accesible.
- Que no exista un problema de red.
- Que el servicio responda dentro del tiempo configurado.

### Error al cargar sistemas.json

Comprobar:

- Que el archivo exista.
- Que el contenido sea JSON válido.
- Que la raíz sea una lista.
- Que los identificadores sean únicos.
- Que los campos obligatorios contengan texto.
- Que las URLs utilicen HTTP o HTTPS.

## 15. Ejecución permanente en el servidor

Para entornos de uso continuo, se recomienda que el portal se inicie automáticamente al arrancar Windows Server.

Una alternativa es utilizar el Programador de tareas de Windows.

La tarea debe configurarse con:

- Un intérprete de Python 3.10 o superior.
- La ruta absoluta de `server.py`.
- Un directorio de trabajo apropiado.
- Una cuenta de ejecución autorizada.
- La configuración de inicio automático correspondiente.

La tarea debe probarse antes de considerarse operativa.

De este modo, el portal no dependerá de que una persona abra manualmente una terminal o mantenga una sesión iniciada.

Para Linux puede utilizarse un servicio `systemd`.

## 16. Mantenimiento

Para mantener el portal actualizado:

1. Realizar las modificaciones desde el entorno de desarrollo.
2. Ejecutar las pruebas correspondientes.
3. Publicar los cambios en GitHub.
4. Actualizar el repositorio en el servidor.
5. Reiniciar el servicio si corresponde.
6. Verificar la interfaz y los endpoints.
7. Comprobar que los sistemas centralizados continúen siendo accesibles.

El portal debe mantenerse independiente de las aplicaciones que centraliza.

## 17. Información del proyecto

**Proyecto:** Portal de Sistemas Talca

**Organización:** Talca

**Repositorio:** https://github.com/pasantes-talca/sistemas_centralizados

**Servidor interno previsto:** `10.242.4.13`

**Puerto configurado:** `8081`

**URL interna prevista:** http://10.242.4.13:8081/

**Entorno:** Red interna de Talca.

**Equipo de desarrollo:** Pasantes Talca.

---

*Portal interno de centralización de sistemas. La disponibilidad efectiva del servicio depende de su correcta instalación, ejecución y configuración de red.*
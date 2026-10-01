# Portal de Sistemas Talca

## Identidad visual

El rediseño toma como referencia https://talca.com.ar/ (consultada el 1 de octubre de 2026).
Colores extraídos de su CSS: azul `#0439AC`, rojo `#E1251B`, verde `#80CD00` y gris `#6E7E7E`.
El azul organiza el encabezado, iconos y acciones; el rojo aparece como un pequeño acento;
el verde se usa en disponibilidad, con texto oscurecido para legibilidad. Fondo y bordes
neutros derivados del azul, círculos decorativos suaves y tipografía de sistema (Segoe UI/Arial),
sin descargas externas. Variables `--talca-*` al inicio de `static/styles.css`.

**Logo:** colocar el archivo oficial en `static/assets/talca-logo.svg` o `static/assets/talca-logo.png`
y recargar. Se prioriza SVG. Mientras no exista, el encabezado muestra TALCA como texto;
no se dibujó un logo alternativo. El favicon representa aplicaciones, no la marca.

Grid de 4 columnas desde 1200 px, 3 desde 950, 2 desde 600 y 1 en celular.
Incluye foco de teclado visible, estados con texto, microinteracciones y respeto por
la preferencia de movimiento reducido. El catálogo y las URLs no cambian con el rediseño.

Revisión visual opcional en Windows: `node preview.mjs` (Node 22+ y Google Chrome en
su ruta habitual). Inicia procesos temporales, comprueba búsqueda, categorías, enlaces
y desbordes en cinco anchos entre 320 y 1440 px; guarda capturas `preview-*.png` y cierra
los procesos al finalizar. No necesita paquetes ni afecta al portal en ejecución.

Portal independiente con HTML, CSS y JavaScript, servido por Python 3.10 o superior. No requiere paquetes, base de datos, CDN ni conexión a Internet. Los sistemas existentes mantienen sus puertos y autenticación.

## Iniciar

Desde esta carpeta, en PowerShell:

```powershell
$env:PORT = "8080"
python server.py
```

En Linux:

```sh
PORT=8080 python3 server.py
```

Abrir `http://localhost:8080`. Para acceso desde otra PC, copiar esta carpeta al servidor **10.242.4.13** e iniciar allí: **http://10.242.4.13:8080/**. Si se ejecuta en otra máquina, usar la IP de esa máquina. El servidor escucha en `0.0.0.0` por defecto. Permitir TCP entrante al puerto elegido sólo desde la red interna en el firewall del servidor. No exponer este portal sin autenticación a Internet.

Detener con Ctrl+C. Para funcionamiento permanente, registrar este comando como servicio con el administrador del servidor (por ejemplo systemd o el Programador de tareas de Windows), indicando la ruta del intérprete y de `server.py`.

### Puerto

8080 es el valor por defecto; no se utilizan 8000, 8001, 8801 ni 8090. La inspección inicial no encontró un servicio local en 8080; la comprobación remota no permitió confirmar su disponibilidad. Verificar **en el servidor de destino** antes de desplegar:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 8080 -ErrorAction SilentlyContinue
```

En Linux: `ss -ltn 'sport = :8080'`. Si está ocupado, elegir otro mediante `PORT`. El arranque falla con un mensaje si no puede reservar el puerto; nunca detiene servicios existentes.

## Configuración de sistemas

Editar únicamente **sistemas.json**. Para agregar un sistema, incorporar otro objeto en la lista y reiniciar el portal:

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

La URL del ejemplo debe reemplazarse por la real. `id` debe ser único. Nombre, descripción, URL, icono y categoría se modifican aquí. Iconos disponibles: `cajas`, `aplicacion`, `grafico`, `escudo`; los desconocidos usan el icono genérico. Las categorías y sus filtros se generan automáticamente. La búsqueda ignora mayúsculas y acentos. Las tarjetas se adaptan a pantallas pequeñas y a catálogos de más de 20 aplicaciones.

Los títulos HTTP permitieron identificar Stock Talca, Tablero de Comando y Laboratorio de Calidad. El servicio 8001 devuelve el título genérico `frontend`: su nombre y descripción permanecen temporales.

## Variables de entorno

| Variable | Valor por defecto | Función |
| --- | --- | --- |
| `PORT` | `8080` | Puerto del portal |
| `HOST` | `0.0.0.0` | Interfaz de escucha |
| `SYSTEMS_CONFIG` | `sistemas.json` junto a server.py | Ruta a configuración alternativa |
| `HEALTH_CHECK_ENABLED` | `true` | Usar `false` para desactivar las comprobaciones |
| `HEALTH_INTERVAL` | `60` | Segundos entre rondas; mínimo 15 |
| `HEALTH_TIMEOUT` | `3` | Timeout HTTP en segundos; entre 0,5 y 10 |

Se leen variables del proceso; no se carga un archivo `.env` automáticamente.

## Disponibilidad

Un hilo del backend consulta sólo las URLs configuradas con GET, sin descargar el cuerpo ni seguir redirecciones, con hasta 8 comprobaciones paralelas y resultados compartidos. No hay CORS ni un endpoint que acepte destinos del navegador. Los clientes consultan la caché cada 15 segundos; no generan nuevos chequeos hacia los sistemas.

- **Disponible**: respuesta 2xx, 3xx, 401 o 403 (el servicio responde, aunque requiera acceso).
- **No disponible**: timeout, error de conexión o cualquier otro estado HTTP.
- **Verificando…**: primera ronda pendiente.
- **Sin verificar**: chequeo desactivado o comunicación con el portal fallida.

Estos estados indican respuesta HTTP, no garantizan todas las funciones del sistema. Los enlaces siempre permanecen habilitados. Las nuevas pestañas usan `noopener noreferrer`. Configuración editable sólo por administradores del servidor; este portal no añade inicio de sesión ni modifica los permisos de los destinos.

## Archivos

- `server.py`: servidor, validación de configuración y monitor de disponibilidad.
- `sistemas.json`: catálogo centralizado.
- `static/index.html`: estructura de la página.
- `static/styles.css`: diseño responsive.
- `static/app.js`: tarjetas, búsqueda, categorías y estados.
- `static/favicon.svg`: icono de la pestaña.
- `test_server.py`: pruebas del backend con servicios locales simulados.

Ejecutar pruebas: `python -m unittest -v`. No consultan ni modifican los sistemas reales.

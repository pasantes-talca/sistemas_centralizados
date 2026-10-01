"""Portal interno Talca. Python 3.10+, sin dependencias externas."""
import json
import os
import socket
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent


class PortalServer(ThreadingHTTPServer):
    allow_reuse_address = False

    def server_bind(self):
        if hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


def load_systems(path):
    systems = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(systems, list):
        raise ValueError("La configuración debe ser una lista de sistemas")
    ids = set()
    for system in systems:
        for field in ("id", "nombre", "descripcion", "url"):
            if not isinstance(system.get(field), str) or not system[field].strip():
                raise ValueError(f"Campo obligatorio inválido: {field}")
        url = urllib.parse.urlsplit(system["url"])
        if url.scheme not in ("http", "https") or not url.hostname or url.username or url.password:
            raise ValueError("Las URLs deben ser HTTP/HTTPS sin credenciales")
        if system["id"] in ids:
            raise ValueError("Los identificadores deben ser únicos")
        ids.add(system["id"])
    return systems


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def probe(system, timeout):
    # Sólo destinos definidos por el administrador; sin URLs aportadas por clientes.
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
    request = urllib.request.Request(system["url"], headers={"User-Agent": "TalcaPortal/1.0"})
    try:
        with opener.open(request, timeout=timeout) as response:
            code = response.status
    except urllib.error.HTTPError as exc:
        code = exc.code
        exc.close()
    except (OSError, urllib.error.URLError, ValueError):
        return system["id"], "unavailable"
    # Un login o una redirección prueban que el servicio responde.
    return system["id"], "available" if 200 <= code < 400 or code in (401, 403) else "unavailable"


class Monitor:
    def __init__(self, systems, enabled=True, interval=60, timeout=3):
        self.systems, self.interval, self.timeout = systems, interval, timeout
        self.lock = threading.Lock()
        self.status = {s["id"]: "checking" if enabled else "unknown" for s in systems}
        self.checked_at = None
        if enabled:
            threading.Thread(target=self.run, daemon=True).start()

    def run(self):
        with ThreadPoolExecutor(max_workers=8) as pool:
            while True:
                results = dict(pool.map(lambda s: probe(s, self.timeout), self.systems))
                with self.lock:
                    self.status, self.checked_at = results, int(time.time())
                time.sleep(self.interval)

    def snapshot(self):
        with self.lock:
            return {"statuses": self.status.copy(), "checkedAt": self.checked_at}


def make_handler(systems, monitor):
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            path = urllib.parse.urlsplit(self.path).path
            if path == "/api/sistemas":
                self.respond(json.dumps(systems, ensure_ascii=False).encode(), "application/json")
            elif path == "/api/estado":
                self.respond(json.dumps(monitor.snapshot()).encode(), "application/json")
            elif path in ("/assets/talca-logo.svg", "/assets/talca-logo.png"):
                asset = ROOT / "static" / path.lstrip("/")
                if asset.is_file():
                    self.respond(asset.read_bytes(), "image/svg+xml" if asset.suffix == ".svg" else "image/png")
                else:
                    self.send_error(404)
            elif path in ("/", "/styles.css", "/app.js", "/favicon.svg"):
                name = "index.html" if path == "/" else path[1:]
                mime = {"html": "text/html", "css": "text/css", "js": "text/javascript", "svg": "image/svg+xml"}
                self.respond((ROOT / "static" / name).read_bytes(), mime[name.split(".")[-1]])
            else:
                self.send_error(404)

        def respond(self, body, content_type):
            self.send_response(200)
            self.send_header("Content-Type", content_type + "; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Referrer-Policy", "no-referrer")
            self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'")
            self.end_headers()
            self.wfile.write(body)
    return Handler


def main():
    try:
        systems = load_systems(os.environ.get("SYSTEMS_CONFIG", ROOT / "sistemas.json"))
        host, port = os.environ.get("HOST", "0.0.0.0"), int(os.environ.get("PORT", "8080"))
        if not 1 <= port <= 65535:
            raise ValueError("PORT debe estar entre 1 y 65535")
        interval = max(15, float(os.environ.get("HEALTH_INTERVAL", "60")))
        timeout = max(0.5, min(10, float(os.environ.get("HEALTH_TIMEOUT", "3"))))
        monitor = Monitor(systems, enabled=False)
        server = PortalServer((host, port), make_handler(systems, monitor))
        if os.environ.get("HEALTH_CHECK_ENABLED", "true").lower() in ("true", "1", "yes"):
            monitor.status = {s["id"]: "checking" for s in systems}
            monitor.interval, monitor.timeout = interval, timeout
            threading.Thread(target=monitor.run, daemon=True).start()
    except (OSError, ValueError, TypeError, KeyError) as exc:
        raise SystemExit(f"No se pudo iniciar el portal: {exc}. Revise configuración y puerto; no se detuvo ningún servicio.")
    print(f"Portal Talca escuchando en {host}:{port}. Ctrl+C para detener.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()

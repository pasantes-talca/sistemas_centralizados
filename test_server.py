import json
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from server import Monitor, PortalServer, load_systems, make_handler, probe


class BackendTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        class Destination(BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(int(self.path[1:]))
                if self.path == '/302':
                    self.send_header('Location', '/500')
                self.end_headers()

            def log_message(self, *args):
                pass
        cls.destination = ThreadingHTTPServer(('127.0.0.1', 0), Destination)
        cls.systems = load_systems(Path(__file__).parent / 'sistemas.json')
        cls.portal = PortalServer(('127.0.0.1', 0), make_handler(cls.systems, Monitor(cls.systems, enabled=False)))
        for server in (cls.destination, cls.portal):
            threading.Thread(target=server.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        for server in (cls.destination, cls.portal):
            server.shutdown()
            server.server_close()

    def test_http_status_and_no_redirect(self):
        for code, expected in [(200,'available'), (302,'available'), (401,'available'), (403,'available'), (404,'unavailable'), (500,'unavailable')]:
            with self.subTest(code=code):
                system = {'id':'test', 'url':f'http://127.0.0.1:{self.destination.server_port}/{code}'}
                self.assertEqual(probe(system, 1), ('test', expected))

    def test_api_and_static_files(self):
        base = f'http://127.0.0.1:{self.portal.server_port}'
        for path in ('/', '/styles.css', '/app.js', '/favicon.svg', '/api/sistemas', '/api/estado'):
            with self.subTest(path=path), urllib.request.urlopen(base + path) as response:
                self.assertEqual(response.status, 200)
                self.assertIn("frame-ancestors 'none'", response.headers['Content-Security-Policy'])
                body = response.read()
                self.assertTrue(body)
                if path == '/api/sistemas':
                    self.assertEqual(json.loads(body), self.systems)
                if path == '/api/estado':
                    self.assertEqual(set(json.loads(body)['statuses'].values()), {'unknown'})
        for path in ('/sistemas.json', '/server.py', '/../server.py'):
            with self.assertRaises(urllib.error.HTTPError) as raised:
                urllib.request.urlopen(base + path)
            self.assertEqual(raised.exception.code, 404)

    def test_invalid_config(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'systems.json'
            for systems in ([self.systems[0], self.systems[0]], [{**self.systems[0], 'url':'javascript:alert(1)'}], [{**self.systems[0], 'nombre':''}]):
                path.write_text(json.dumps(systems), encoding='utf-8')
                with self.assertRaises(ValueError):
                    load_systems(path)

    def test_occupied_port_is_not_reused(self):
        with self.assertRaises(OSError):
            PortalServer(('127.0.0.1', self.portal.server_port), make_handler([], Monitor([], enabled=False)))


if __name__ == '__main__':
    unittest.main()

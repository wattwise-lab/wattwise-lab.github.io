"""Local/CI preview with the extensionless HTML paths used by Pages hosting."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit


class Handler(SimpleHTTPRequestHandler):
    def route_html(self):
        parts = urlsplit(self.path)
        path = Path(self.translate_path(parts.path))
        if not path.exists() and path.with_suffix(path.suffix + ".html").is_file():
            self.path = urlunsplit(("", "", parts.path + ".html", parts.query, ""))

    def do_GET(self):
        self.route_html()
        super().do_GET()

    def do_HEAD(self):
        self.route_html()
        super().do_HEAD()


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", 4173), Handler).serve_forever()

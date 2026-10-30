#!/usr/bin/env python3
"""Run the ToolNest compiled web site on a private localhost address.
Requires Python 3 only; place this beside index.html, assets/ and ffmpeg/.
"""
from __future__ import annotations
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import mimetypes
from pathlib import Path
import threading
import webbrowser

ROOT=Path(__file__).resolve().parent
mimetypes.add_type('application/wasm','.wasm')
mimetypes.add_type('text/javascript','.mjs')
mimetypes.add_type('application/manifest+json','.webmanifest')

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cross-Origin-Opener-Policy','same-origin')
        self.send_header('Cross-Origin-Embedder-Policy','require-corp')
        self.send_header('Cross-Origin-Resource-Policy','same-origin')
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Referrer-Policy','no-referrer')
        super().end_headers()

    def list_directory(self,path):
        self.send_error(403,'Directory listing disabled')
        return None

def main():
    parser=argparse.ArgumentParser(description='Run ToolNest compiled web locally.')
    parser.add_argument('--port',type=int,default=8765,help='Stable port for local browser data, default 8765')
    parser.add_argument('--no-browser',action='store_true')
    args=parser.parse_args()
    if not (1<=args.port<=65535):parser.error('Port must be 1-65535')
    if not (ROOT/'index.html').is_file() or not (ROOT/'assets').is_dir():
        parser.error('Compiled site files are missing. Extract the complete ZIP first.')
    try:
        httpd=ThreadingHTTPServer(('127.0.0.1',args.port),partial(Handler,directory=str(ROOT)))
    except OSError as exc:
        parser.error(f'Cannot start on port {args.port}: {exc}. Close the other server or choose --port 8766.')
    httpd.daemon_threads=True
    url=f'http://127.0.0.1:{args.port}/'
    print(f'\nToolNest offline local web: {url}\nKeep this console open. Ctrl+C to stop.\n',flush=True)
    if not args.no_browser:
        threading.Timer(.7,lambda:webbrowser.open(url)).start()
    try:
        httpd.serve_forever(poll_interval=.3)
    except KeyboardInterrupt:print('\nStopping ToolNest.')
    finally:httpd.server_close()

if __name__=='__main__':main()

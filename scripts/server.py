#!/usr/bin/env python3
"""
Regroup Happy Hour - Local Static Server & Cross-Device Sync Hub
Runs with Python standard library only (zero external pip packages).
"""

import sys
import os
import json
import socket
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src'))

# Global in-memory sync state
sync_state = {
    "lastSignal": None,
    "timestamp": 0
}

class SyncHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        if self.path == '/api/sync':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(sync_state).encode('utf-8'))
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/sync':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                sync_state["lastSignal"] = data
                sync_state["timestamp"] = data.get("timestamp", 0)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(b'{"status":"ok"}')
            except Exception as e:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(str(e).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

if __name__ == '__main__':
    local_ip = get_local_ip()
    print("=" * 65)
    print("⚡ REGROUP HAPPY HOUR - PRESENTATION & ADMIN SERVER")
    print("=" * 65)
    print(f"📍 Serving directory : {BASE_DIR}")
    print(f"🖥️ MC Presentation Deck : http://localhost:{PORT}")
    print(f"🎮 Admin Control Panel  : http://localhost:{PORT}/admin.html")
    print("-" * 65)
    print("📱 UNTUK HP / LAPTOP ELDINA (WI-FI DA VINCI):")
    print(f"👉 Buka di Browser HP   : http://{local_ip}:{PORT}/admin.html")
    print("=" * 65)
    
    server = HTTPServer(('0.0.0.0', PORT), SyncHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped gracefully.")

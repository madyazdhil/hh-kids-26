"""Real PeerJS + WebRTC data/media in isolated contexts, controlled signaling.
ntfy is deliberately unavailable. No camera hardware or public signaling used.
"""
import json
import mimetypes
import uuid
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://happy-hour.test'

def run():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, args=['--disable-features=WebRtcHideLocalIpsWithMdns'])
        sockets, errors = {}, []
        def signaling(ws):
            peer_id = parse_qs(urlparse(ws.url).query)['id'][0]
            sockets[peer_id] = ws
            def message(raw):
                packet = json.loads(raw)
                target = sockets.get(packet.get('dst'))
                if target:
                    packet['src'] = peer_id
                    target.send(json.dumps(packet))
            ws.on_message(message)
            ws.send(json.dumps({'type':'OPEN'}))
        def route(req):
            url = urlparse(req.request.url)
            if url.hostname == 'happy-hour.test':
                path = ROOT/url.path.lstrip('/')
                if path.is_file():
                    # Avoid loading four full editors: state test inspects the wrapper URL.
                    if 'turbowarp' in path.parts:
                        req.fulfill(body='<html>Editor asset boundary</html>', content_type='text/html')
                    else:
                        req.fulfill(path=str(path), content_type=mimetypes.guess_type(str(path))[0] or 'application/octet-stream')
                else: req.fulfill(status=404, body='not found')
            elif 'peerjs.com' in (url.hostname or '') and url.path.endswith('/id'):
                req.fulfill(body='test-'+uuid.uuid4().hex, content_type='text/plain')
            elif url.hostname == 'ntfy.sh':
                req.fulfill(status=429, body='relay unavailable for test')
            else: req.abort()
        def page(path):
            ctx = browser.new_context(viewport={'width':1280,'height':900})
            ctx.route('**/*', route)
            ctx.route_web_socket('**/*', signaling)
            ctx.add_init_script('''
              window.EventSource = class { close() {} };
              // Controlled same-machine signaling needs host candidates only.
              const NativeRTC = window.RTCPeerConnection;
              window.RTCPeerConnection = class extends NativeRTC {
                constructor(config) { super({...config, iceServers: []}); }
              };
            ''')
            pg = ctx.new_page()
            pg.on('pageerror', lambda err: errors.append(str(err)))
            pg.goto(ORIGIN+path, wait_until='domcontentloaded')
            pg.add_style_tag(content='* { animation:none !important; backdrop-filter:none !important; box-shadow:none !important; filter:none !important; }')
            return pg
        mc = page('/index.html')
        pos = [page(f'/pos.html?pos={n}') for n in range(1,5)]
        mc.evaluate('goToSlide(7); toggleTimer(1)')
        for pg in pos:
            try: pg.wait_for_selector('#state-scouting.active', timeout=20000)
            except Exception:
                print('DIAGNOSTIC', pg.locator('#pos-sync-status').inner_text(), errors, flush=True)
                raise
        print('PASS: real PeerJS data channels deliver scouting with cloud relay returning HTTP 429', flush=True)
        mc.evaluate('resetTimer(1); goToSlide(13)')
        for pg in pos: pg.wait_for_selector('#battle-locked-overlay:not(.hidden)')
        mc.locator('.btn-trigger-countdown[data-round="1"]').click(force=True)
        for pg in pos: pg.wait_for_selector('#battle-active-content:not(.hidden)', timeout=15000)
        pos[0].reload(wait_until='domcontentloaded')
        pos[0].wait_for_selector('#battle-active-content:not(.hidden)', timeout=20000)
        print('PASS: real data unlocks four Pos and recovers late join without ntfy or cross-tab storage', flush=True)
        # Real WebRTC camera frames, captured from a deterministic canvas.
        cam = pos[0]
        cam.evaluate('''() => {
          const c=document.createElement('canvas'); c.width=320;c.height=240;
          const ctx=c.getContext('2d'); let n=0;
          setInterval(() => { ctx.fillStyle=++n%2?'cyan':'navy';ctx.fillRect(0,0,320,240); }, 100);
          window.testCam=c.captureStream(10);
          navigator.mediaDevices.getUserMedia=()=>Promise.resolve(window.testCam);
          navigator.mediaDevices.getDisplayMedia=()=>Promise.reject(new Error('screen cancelled'));
        }''')
        mc.evaluate('toggleSpectatorOverlay()')
        cam.locator('#btn-broadcast-stream').click()
        mc.wait_for_function("document.getElementById('stream-cam-pos1').videoWidth > 0", timeout=20000)
        cam.wait_for_function("document.getElementById('btn-broadcast-stream').textContent.includes('Diterima Proyektor')")
        assert mc.locator('#cam-pip-pos1').is_visible()
        print('PASS: real WebRTC camera-only video decoded by projector and acknowledged to Pos', flush=True)
        (ROOT/'output').mkdir(exist_ok=True)
        mc.screenshot(path=str(ROOT/'output/direct-peer-camera.png'))
        assert not errors, errors
        browser.close()
if __name__ == '__main__': run()

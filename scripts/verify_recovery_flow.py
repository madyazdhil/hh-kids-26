"""Isolated-browser regression; deterministic SSE relay, no shared localStorage/BC.
No live public relay traffic. Peer signaling is stubbed for media lifecycle checks.
"""
import json
import mimetypes
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://happy-hour.test'
BOOT = r"""
window.__calls = [];
window.__peers = [];
class Events {
  constructor() { this.handlers = {}; }
  on(name, fn) { (this.handlers[name] ||= []).push(fn); return this; }
  once(name, fn) { return this.on(name, fn); }
  emit(name, value) { (this.handlers[name] || []).forEach(fn => fn(value)); }
}
window.__FakePeer = class extends Events {
  constructor(id) { super(); this.id = typeof id === 'string' ? id : 'test-pos'; this.open = true; window.__peers.push(this); }
  connect(id) { const c = new Events(); c.peer = id; c.open = false; c.close = () => {}; c.send = () => {}; return c; }
  call(id, stream, options) {
    const c = new Events(); c.peer = id; c.open = true;
    c.close = () => { c.open = false; c.emit('close'); };
    window.__calls.push({id, options, call: c}); return c;
  }
  destroy() { this.destroyed = true; }
};
window.EventSource = class {
  constructor() { window.__sse = this; setTimeout(() => this.onopen?.(), 0); }
  close() {}
};
"""

def run():
    with sync_playwright() as pw:
        print('Launching isolated browser regression', flush=True)
        browser = pw.chromium.launch(headless=True)
        pages, queue, errors = [], [], []
        def route(req):
            u = urlparse(req.request.url)
            if u.hostname == 'ntfy.sh':
                if req.request.method == 'POST':
                    queue.append(json.loads(req.request.post_data))
                    req.fulfill(status=200, body='{}', content_type='application/json')
                else:
                    req.fulfill(status=200, body='', content_type='application/x-ndjson')
            elif u.hostname == 'happy-hour.test':
                path = ROOT / u.path.lstrip('/')
                if path.is_file():
                    if 'turbowarp' in path.parts:
                        req.fulfill(body='<html>Editor boundary</html>', content_type='text/html')
                    elif path.name == 'peerjs.min.js':
                        req.fulfill(body='window.Peer = window.__FakePeer;', content_type='application/javascript')
                    else:
                        req.fulfill(path=str(path), content_type=mimetypes.guess_type(str(path))[0] or 'application/octet-stream')
                else:
                    req.fulfill(status=404, body='not found')
            else:
                req.abort()
        def new_page(path):
            context = browser.new_context(viewport={'width':1280,'height':900})
            context.add_init_script(BOOT)
            context.route('**/*', route)
            page = context.new_page()
            page.on('pageerror', lambda err: errors.append(str(err)))
            pages.append(page)
            page.goto(ORIGIN + path, wait_until='domcontentloaded')
            page.add_style_tag(content='* { animation: none !important; backdrop-filter: none !important; }')
            return page
        def flush(reverse=False):
            pages[0].wait_for_timeout(120)
            delivered = []
            for _ in range(8):
                batch = queue[:]; queue.clear()
                if reverse: batch.reverse()
                if not batch: break
                for message in batch:
                    delivered.append(message)
                    raw = json.dumps({'event':'message','message':json.dumps(message)})
                    for page in pages:
                        page.evaluate('(raw) => window.__sse.onmessage({data: raw})', raw)
                pages[0].wait_for_timeout(80)
            return delivered
        def active(page, selector):
            assert page.locator(selector).is_visible(), selector
        def locked():
            for page in pos:
                active(page, '#battle-locked-overlay')
                assert not page.locator('#battle-active-content').is_visible()
        mc = new_page('/index.html')
        pos = [new_page(f'/pos.html?pos={n}') for n in range(1,5)]
        flush()
        assert len({id(page.context) for page in pos + [mc]}) == 5
        mc.evaluate('goToSlide(7)'); flush()
        for page in pos: active(page, '#state-olympic-idle')
        mc.evaluate('toggleTimer(1)'); flush()
        for n, page in enumerate(pos, 1):
            active(page, '#state-scouting')
            assert f'POS {n}:' in page.locator('#scouting-content-area').inner_text()
            assert page.locator('#scouting-content-area iframe').count() == 0
            assert page.locator('#battle-workspace iframe').count() == 0
        pos[0].reload(wait_until='domcontentloaded'); flush()
        active(pos[0], '#state-scouting')
        mc.evaluate('resetTimer(1)'); flush()
        for page in pos: active(page, '#state-olympic-idle')
        # Actual expiry with an accelerated browser clock, not an injected unlock.
        mc.locator('.preset-btn[data-timer="1"]').first.evaluate('(el) => el.dataset.sec = "2"')
        mc.locator('.preset-btn[data-timer="1"]').first.click(force=True)
        mc.evaluate('toggleTimer(1)'); flush()
        mc.wait_for_timeout(2200); flush()
        for page in pos: active(page, '#state-olympic-idle')
        print('PASS: four distinct instruction screens, no games; late join; reset and expiry lock')
        for round_no, index in enumerate([13,15,17,19], 1):
            mc.evaluate('(idx) => goToSlide(idx)', index-1); flush(); locked()
            mc.evaluate('(idx) => goToSlide(idx)', index); flush(); locked()
            mc.locator(f'.btn-trigger-countdown[data-round="{round_no}"]').click(force=True)
            flush(); locked()
            mc.wait_for_timeout(3200)
            events = flush(reverse=True) # transport disorder must not regress state
            if round_no == 3:
                locked()
                for page in pos: assert 'HAFALKAN' in page.locator('#battle-countdown-display').inner_text()
                mc.locator('#btn-skip-obs-projector').click(force=True)
                events += flush()
            for page in pos:
                active(page, '#battle-active-content')
                expected = ['scratch-slide','sempoa-slide','memory-slide','sheets-slide'][round_no-1]
                assert expected in page.locator('#battle-workspace iframe').get_attribute('src')
            # Reconnect long after the transient unlock: fresh page only requests status.
            pos[round_no-1].reload(wait_until='domcontentloaded'); flush()
            active(pos[round_no-1], '#battle-active-content')
            print(f'PASS: round {round_no} all four Pos unlock and restore after reload')
        # Starting a new countdown must lock again; leaving it cancels delayed unlock.
        mc.locator('.btn-trigger-countdown[data-round="4"]').click(force=True); flush(); locked()
        mc.evaluate('goToSlide(18)'); flush(); mc.wait_for_timeout(4000); flush(); locked()
        # Camera-only send: denied display capture cannot strand an active webcam.
        cam = pos[0]
        cam.evaluate('''() => {
          const canvas = document.createElement('canvas'); canvas.width=320; canvas.height=240;
          canvas.getContext('2d').fillRect(0,0,320,240);
          window.__testStream = canvas.captureStream(5);
          navigator.mediaDevices.getDisplayMedia = () => Promise.reject(new Error('cancelled'));
          navigator.mediaDevices.getUserMedia = () => Promise.resolve(window.__testStream);
        }''')
        cam.locator('#btn-broadcast-stream').click(); cam.wait_for_timeout(150)
        assert cam.evaluate("window.__calls.some(c => c.options.metadata.type === 'cam')")
        assert 'Menghubungkan' in cam.locator('#btn-broadcast-stream').inner_text()
        cam.evaluate("HHSync.receive({type:'STREAM_RECEIVED',payload:{pos:1,type:'cam'}})")
        assert 'Diterima Proyektor' in cam.locator('#btn-broadcast-stream').inner_text()
        cam.locator('#btn-broadcast-stream').click()
        assert cam.evaluate("window.__testStream.getTracks().every(t => t.readyState === 'ended')")
        # Spectator must announce the receiver's actual fallback ID.
        mc.evaluate("window.__peers[0].id = 'fallback-receiver'; toggleSpectatorOverlay()")
        sent = flush()
        assert any(m['type']=='PROYEKTOR_READY' and m['payload']['peerId']=='fallback-receiver' for m in sent)
        assert not errors, errors
        (ROOT/'output').mkdir(exist_ok=True)
        mc.screenshot(path=str(ROOT/'output/recovery-spectator.png'))
        print('PASS: countdown cancellation; camera-only capture/receipt/cleanup; actual receiver ID; no page errors')
        browser.close()

if __name__ == '__main__': run()

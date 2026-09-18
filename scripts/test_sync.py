import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    page_mc = context.new_page()
    page_pos = context.new_page()

    page_mc.on("console", lambda msg: print(f"[MC] {msg.text}"))
    page_pos.on("console", lambda msg: print(f"[POS] {msg.text}"))

    page_mc.goto("http://localhost:8765/index.html")
    page_pos.goto("http://localhost:8765/pos.html?pos=1")
    time.sleep(1)

    print("--- SENDING SLIDE_CHANGED 16 ---")
    page_mc.evaluate("window.goToSlide(16)")
    time.sleep(1.5)

    print("After Send Pos Status:", page_pos.locator("#pos-sync-status").text_content())
    print("Pos active panel:", page_pos.evaluate("document.querySelector('.pos-state-panel.active')?.id"))
    browser.close()

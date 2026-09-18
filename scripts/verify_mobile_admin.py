import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        # iPhone 14 Pro viewport
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 393, 'height': 852},
            device_scale_factor=3,
            is_mobile=True,
            has_touch=True
        )
        page = await context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        print("1. Opening Mobile Admin on localhost:8765/admin.html...")
        await page.goto("http://localhost:8765/admin.html", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        os.makedirs("output", exist_ok=True)
        await page.screenshot(path="output/mobile_admin_tab1_remote.png", full_page=False)
        print("   Tab 1 Remote screenshot saved.")

        # Test Switching to Tab 2 (Scoring)
        print("2. Switching to Tab 2 (Olympic Scoring)...")
        await page.click('button[data-tab="scoring"]')
        await page.wait_for_timeout(500)

        # Tap +5 for Kelompok 1 Pos 1
        print("   Tapping +5 for Kelompok 1...")
        btns = await page.query_selector_all(".btn-attempt-5")
        if btns:
            await btns[0].click()
            await page.wait_for_timeout(500)

        # Tap Salah for Kelompok 2 Pos 1
        fail_btns = await page.query_selector_all(".btn-attempt-fail")
        if len(fail_btns) > 1:
            await fail_btns[1].click()
            await page.wait_for_timeout(500)

        await page.screenshot(path="output/mobile_admin_tab2_scoring.png", full_page=False)
        print("   Tab 2 Scoring screenshot saved.")

        # Test Pos Filter (e.g. click Pos 1: Scratch)
        print("   Testing Pos Filter 'Pos 1: Scratch'...")
        await page.click('button[data-pos="0"]')
        await page.wait_for_timeout(500)
        await page.screenshot(path="output/mobile_admin_tab2_pos1_filter.png", full_page=False)
        print("   Tab 2 Pos 1 Filter screenshot saved.")

        # Test Switching to Tab 3 (Awarding)
        print("3. Switching to Tab 3 (Awarding)...")
        await page.click('button[data-tab="awarding"]')
        await page.wait_for_timeout(500)
        await page.screenshot(path="output/mobile_admin_tab3_awarding.png", full_page=False)
        print("   Tab 3 Awarding screenshot saved.")

        await browser.close()

        if console_errors:
            print(f"FAILED with console errors: {console_errors}")
            exit(1)
        else:
            print("ALL MOBILE TESTS PASSED SUCCESSFULLY! ZERO ERRORS.")

if __name__ == "__main__":
    asyncio.run(main())

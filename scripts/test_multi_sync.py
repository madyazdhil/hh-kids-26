import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # Context 1: MC Proyektor
        ctx_mc = await browser.new_context(viewport={'width': 1280, 'height': 720})
        page_mc = await ctx_mc.new_page()

        # Context 2: Mobile Admin (Separate context = simulates separate device!)
        ctx_admin = await browser.new_context(
            viewport={'width': 393, 'height': 852},
            is_mobile=True,
            has_touch=True
        )
        page_admin = await ctx_admin.new_page()

        # Context 3: Follower Laptop / Tab (Another separate device!)
        ctx_follower = await browser.new_context(viewport={'width': 1280, 'height': 720})
        page_follower = await ctx_follower.new_page()

        print("1. Loading MC Deck, Mobile Admin, and Follower Deck...")
        await page_mc.goto("http://localhost:8765/", wait_until="domcontentloaded")
        await page_admin.goto("http://localhost:8765/admin.html", wait_until="domcontentloaded")
        await page_follower.goto("http://localhost:8765/", wait_until="domcontentloaded")
        await asyncio.sleep(2.0)

        # Check initial slides
        counter_mc = await page_mc.text_content("#slide-counter")
        counter_f = await page_follower.text_content("#slide-counter")
        print(f"   Initial MC: {counter_mc.strip()}, Follower: {counter_f.strip()}")

        # Test 1: Admin taps NEXT STEP / SLIDE
        print("2. Admin on Phone taps 'NEXT STEP / SLIDE'...")
        await page_admin.click("#remote-btn-next")
        await asyncio.sleep(1.5)

        counter_mc_after = await page_mc.text_content("#slide-counter")
        counter_f_after = await page_follower.text_content("#slide-counter")
        print(f"   After Admin Next -> MC: {counter_mc_after.strip()}, Follower: {counter_f_after.strip()}")

        # Test 2: Admin jumps to Slide 6 (Office Olympics)
        print("3. Admin jumps to Slide 6 (Office Olympics)...")
        await page_admin.select_option("#remote-slide-select", value="5")
        await asyncio.sleep(1.5)

        counter_mc_s6 = await page_mc.text_content("#slide-counter")
        counter_f_s6 = await page_follower.text_content("#slide-counter")
        admin_label = await page_admin.text_content("#active-slide-label")
        print(f"   After Jump -> MC: {counter_mc_s6.strip()}, Follower: {counter_f_s6.strip()}")
        print(f"   Admin Label: {admin_label.strip()}")

        # Test 3: MC keyboard navigation on Laptop advances to Slide 7
        print("4. MC presses Next on proyektor laptop...")
        await page_mc.click("#btn-next")
        await asyncio.sleep(1.5)

        counter_mc_s7 = await page_mc.text_content("#slide-counter")
        counter_f_s7 = await page_follower.text_content("#slide-counter")
        admin_label_s7 = await page_admin.text_content("#active-slide-label")
        print(f"   After MC advances -> MC: {counter_mc_s7.strip()}, Follower: {counter_f_s7.strip()}")
        print(f"   Admin Label: {admin_label_s7.strip()}")

        await browser.close()

        # Assertions
        assert "Slide 2" in counter_mc_after or "Slide 1" in counter_mc_after  # (step reveal or next slide)
        assert counter_mc_s6.strip() == counter_f_s6.strip(), "MC and Follower MUST be in exact sync!"
        assert "Slide 6" in counter_mc_s6, f"Expected Slide 6, got {counter_mc_s6}"
        assert "Slide 7" in counter_mc_s7, f"Expected Slide 7, got {counter_mc_s7}"
        assert counter_mc_s7.strip() == counter_f_s7.strip(), "Follower must follow MC to Slide 7!"
        print("\n🎉 ALL MULTI-SCREEN & CROSS-DEVICE SYNC TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    asyncio.run(main())

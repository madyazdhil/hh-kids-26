import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # Context 1: MC Proyektor
        ctx_mc = await browser.new_context(viewport={'width': 1280, 'height': 720})
        page_mc = await ctx_mc.new_page()

        # Context 2: Pos 1 Laptop (Scratch)
        ctx_pos1 = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page_pos1 = await ctx_pos1.new_page()

        # Context 3: Pos 2 Laptop (Mathchamps)
        ctx_pos2 = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page_pos2 = await ctx_pos2.new_page()

        # Context 4: Mobile Admin (Aldeina's Phone)
        ctx_admin = await browser.new_context(viewport={'width': 393, 'height': 852}, is_mobile=True)
        page_admin = await ctx_admin.new_page()

        print("1. Loading MC Deck, Pos 1, Pos 2, and Mobile Admin...")
        await page_mc.goto("http://localhost:8765/", wait_until="domcontentloaded")
        await page_pos1.goto("http://localhost:8765/pos.html?pos=1", wait_until="domcontentloaded")
        await page_pos2.goto("http://localhost:8765/pos.html?pos=2", wait_until="domcontentloaded")
        await page_admin.goto("http://localhost:8765/admin.html", wait_until="domcontentloaded")
        await asyncio.sleep(2.0)

        os.makedirs("output", exist_ok=True)

        # Verify Slide 1 -> State Template
        print("2. Verifying Slide 1 Clean Template on Pos 1...")
        is_tpl_active = await page_pos1.is_visible("#state-template.active")
        print(f"   Pos 1 State Template Active: {is_tpl_active}")
        assert is_tpl_active, "Pos 1 must show state-template on Slide 1"
        await page_pos1.screenshot(path="output/pos1_slide1_template.png")

        # Test Step 2: Admin jumps to Slide 6 (Office Olympics)
        print("3. Admin jumps to Slide 6 (Office Olympics)...")
        await page_admin.select_option("#remote-slide-select", value="5")
        await asyncio.sleep(1.5)

        is_idle_pos1 = await page_pos1.is_visible("#state-olympic-idle.active")
        is_idle_pos2 = await page_pos2.is_visible("#state-olympic-idle.active")
        print(f"   Pos 1 Olympic Idle Active: {is_idle_pos1}, Pos 2: {is_idle_pos2}")
        assert is_idle_pos1 and is_idle_pos2, "All pos screens must show Olympic Idle on Slide 6"
        await page_pos1.screenshot(path="output/pos1_slide6_olympic_idle.png")

        # Test Step 3: Jump to Slide 8 (Timer Scouting 1 Min)
        print("4. Admin jumps to Slide 8 (Timer Scouting)...")
        await page_admin.select_option("#remote-slide-select", value="7")
        await asyncio.sleep(1.5)

        # Before timer starts -> MUST BE LOCKED (ZERO LEAK!)
        is_still_idle = await page_pos1.is_visible("#state-olympic-idle.active")
        print(f"   Before Timer Start, Pos 1 Still Locked in Idle (Zero Leak): {is_still_idle}")
        assert is_still_idle, "Pos must remain locked in idle before timer starts!"

        # Start Timer via MC
        print("   MC clicks START TIMER...")
        await page_mc.click('.btn-start-timer[data-timer="1"]')
        await asyncio.sleep(1.5)

        # Now Scouting MUST BE VISIBLE!
        is_scouting_pos1 = await page_pos1.is_visible("#state-scouting.active")
        is_scouting_pos2 = await page_pos2.is_visible("#state-scouting.active")
        print(f"   While Timer Running: Pos 1 Scouting Active: {is_scouting_pos1}, Pos 2: {is_scouting_pos2}")
        assert is_scouting_pos1 and is_scouting_pos2, "Scouting must appear while timer runs!"
        await page_pos1.screenshot(path="output/pos1_slide8_scouting_scratch.png")
        await page_pos2.screenshot(path="output/pos2_slide8_scouting_math.png")

        # Test Step 4: Admin jumps to Slide 13 (Challenge 1: Scratch)
        print("5. Admin jumps to Slide 13 (Challenge 1 Scratch Battle)...")
        await page_admin.select_option("#remote-slide-select", value="12")
        await asyncio.sleep(2.0)

        is_battle_pos1 = await page_pos1.is_visible("#state-battle.active")
        is_battle_pos2 = await page_pos2.is_visible("#state-battle.active")
        print(f"   All Pos in Battle Mode: Pos 1={is_battle_pos1}, Pos 2={is_battle_pos2}")
        assert is_battle_pos1 and is_battle_pos2, "All pos must enter battle mode on Slide 13!"
        await page_pos1.screenshot(path="output/pos1_slide13_battle_scratch.png")

        # Test Sprint Bell Click
        print("   Clicking Giant Sprint Bell on Pos 1...")
        await page_pos1.click("#btn-sprint-bell", force=True)
        await asyncio.sleep(0.5)
        bell_text = await page_pos1.text_content("#btn-sprint-bell .bell-main-text")
        print(f"   Bell button text after click: '{bell_text.strip()}'")
        assert "BEL DIBUNYIKAN" in bell_text

        # Test Step 5: Admin jumps to Slide 14 (Challenge 2: Mathchamps)
        print("6. Admin jumps to Slide 14 (Challenge 2 Math)...")
        await page_admin.select_option("#remote-slide-select", value="13")
        await asyncio.sleep(1.5)
        game_title_pos1 = await page_pos1.text_content("#battle-game-title")
        print(f"   Pos 1 Battle Title on Slide 14: '{game_title_pos1.strip()}'")
        assert "Mathchamps" in game_title_pos1

        # Test Step 6: Admin jumps to Slide 16 (Challenge 4: Spreadsheet)
        print("7. Admin jumps to Slide 16 (Challenge 4 Sheets)...")
        await page_admin.select_option("#remote-slide-select", value="15")
        await asyncio.sleep(1.5)
        game_title_s16 = await page_pos1.text_content("#battle-game-title")
        print(f"   Pos 1 Battle Title on Slide 16: '{game_title_s16.strip()}'")
        assert "Spreadsheet" in game_title_s16
        await page_pos1.screenshot(path="output/pos1_slide16_battle_sheets.png")

        await browser.close()
        print("\n🎉 ALL 4 POS LAPTOP FLOW & MULTI-DEVICE SYNC TESTS PASSED WITH 100% SUCCESS!")

if __name__ == "__main__":
    asyncio.run(main())

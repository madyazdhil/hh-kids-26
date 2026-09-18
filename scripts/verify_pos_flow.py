import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # Shared Context for instant BroadcastChannel sync
        ctx = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page_mc = await ctx.new_page()
        page_pos1 = await ctx.new_page()
        page_pos2 = await ctx.new_page()
        page_admin = await ctx.new_page()

        print("1. Loading MC Deck, Pos 1, Pos 2, and Mobile Admin...")
        await page_mc.goto("http://localhost:8765/", wait_until="domcontentloaded")
        await page_pos1.goto("http://localhost:8765/pos.html?pos=1", wait_until="domcontentloaded")
        await page_pos2.goto("http://localhost:8765/pos.html?pos=2", wait_until="domcontentloaded")
        await page_admin.goto("http://localhost:8765/admin.html", wait_until="domcontentloaded")
        await asyncio.sleep(2.0)

        os.makedirs("output", exist_ok=True)

        # Verify Slide 1 -> State Template
        print("2. Verifying Slide 1 Clean Template on Pos 1...")
        await page_pos1.wait_for_selector("#state-template.active", timeout=5000)
        print("   Pos 1 State Template Active: True")
        await page_pos1.screenshot(path="output/pos1_slide1_template.png")

        # Test Step 2: Admin jumps to Slide 6 (Office Olympics)
        print("3. Admin jumps to Slide 6 (Office Olympics)...")
        await page_admin.select_option("#remote-slide-select", value="5")
        await page_admin.click("#remote-btn-jump")
        await page_pos1.wait_for_selector("#state-olympic-idle.active", timeout=5000)
        await page_pos2.wait_for_selector("#state-olympic-idle.active", timeout=5000)
        print("   Pos 1 & 2 Olympic Idle Active: True")
        await page_pos1.screenshot(path="output/pos1_slide6_olympic_idle.png")

        # Test Step 3: Jump to Slide 8 (Timer Scouting 1 Min)
        print("4. Admin jumps to Slide 8 (Timer Scouting)...")
        await page_admin.select_option("#remote-slide-select", value="7")
        await page_admin.click("#remote-btn-jump")
        await asyncio.sleep(1.0)

        # Before timer starts -> MUST BE LOCKED (ZERO LEAK!)
        is_still_idle = await page_pos1.is_visible("#state-olympic-idle.active")
        print(f"   Before Timer Start, Pos 1 Still Locked in Idle (Zero Leak): {is_still_idle}")
        assert is_still_idle, "Pos must remain locked in idle before timer starts!"

        # Start Timer via MC
        print("   MC clicks START TIMER...")
        await page_mc.click('.btn-start-timer[data-timer="1"]')
        await page_pos1.wait_for_selector("#state-scouting.active", timeout=5000)
        await page_pos2.wait_for_selector("#state-scouting.active", timeout=5000)
        print("   While Timer Running: Pos 1 & 2 Scouting Active: True")
        await page_pos1.screenshot(path="output/pos1_slide8_scouting_scratch.png")
        await page_pos2.screenshot(path="output/pos2_slide8_scouting_math.png")

        # Test Step 4: Admin jumps to Slide 13 (Briefing 1: Scratch)
        print("5. Admin jumps to Slide 13 (Briefing 1 Scratch)...")
        await page_admin.select_option("#remote-slide-select", value="12")
        await page_admin.click("#remote-btn-jump")

        # Wait for MC slide 13 to be active
        await page_mc.wait_for_selector("#slide-13.active", timeout=5000)
        mc_counter = await page_mc.text_content("#slide-counter")
        print(f"   MC Slide Counter: '{mc_counter.strip()}'")

        # Wait for Pos 1 to enter state-battle
        await page_pos1.wait_for_selector("#state-battle.active", timeout=5000)
        
        # Pos must be locked in briefing standby (zero leak)
        is_overlay_locked = await page_pos1.is_visible("#battle-locked-overlay:not(.hidden)")
        is_content_hidden = await page_pos1.is_hidden("#battle-active-content")
        badge_text = await page_pos1.text_content("#locked-round-badge")
        print(f"   Slide 13 Briefing Lock: Overlay Locked={is_overlay_locked}, Content Hidden={is_content_hidden}")
        print(f"   Badge: '{badge_text.strip()}'")
        assert is_overlay_locked and is_content_hidden, "Pos must be locked during briefing!"
        assert "BRIEFING" in badge_text, "Badge must indicate briefing mode"
        await page_pos1.screenshot(path="output/pos1_slide13_briefing_locked.png")

        # Test Step 5: Admin jumps to Slide 14 (Battle 1: Scratch Countdown & Arena)
        print("6. Admin jumps to Slide 14 (Battle 1 Arena & Countdown)...")
        await page_admin.select_option("#remote-slide-select", value="13")
        await page_admin.click("#remote-btn-jump")
        await page_mc.wait_for_selector("#slide-14.active", timeout=5000)

        # Still locked in standby before countdown
        is_standby_locked = await page_pos1.is_visible("#battle-locked-overlay:not(.hidden)")
        countdown_txt = await page_pos1.text_content("#battle-countdown-display")
        print(f"   Before Countdown Start: Overlay Visible={is_standby_locked}, Text='{countdown_txt.strip()}'")
        assert is_standby_locked, "Pos must remain locked before 3-2-1 countdown!"

        # MC triggers Countdown 3-2-1
        print("   MC triggers Countdown 3-2-1...")
        await page_mc.click('.btn-trigger-countdown[data-round="1"]')
        
        # Check countdown digits in progress (e.g. within 1-2s)
        await asyncio.sleep(1.2)
        mid_count_mc = await page_mc.text_content("#battle-countdown-1")
        print(f"   MC Countdown in progress: '{mid_count_mc.strip()}'")

        # Wait for countdown to finish (3s + 1s buffer)
        await asyncio.sleep(3.2)

        # Pos 1 MUST BE UNLOCKED!
        await page_pos1.wait_for_selector("#battle-active-content:not(.hidden)", timeout=5000)
        is_overlay_gone = await page_pos1.is_hidden("#battle-locked-overlay")
        print(f"   After Countdown 3-2-1: Content Active=True, Overlay Hidden={is_overlay_gone}")
        assert is_overlay_gone, "Battle locked overlay must be hidden after countdown!"
        await page_pos1.screenshot(path="output/pos1_slide14_battle_unlocked.png")
        await page_mc.screenshot(path="output/mc_slide14_battle_active.png")

        # Test Sprint Bell Click
        print("   Clicking Giant Sprint Bell on Pos 1...")
        await page_pos1.click("#btn-sprint-bell", force=True)
        await asyncio.sleep(0.5)
        bell_text = await page_pos1.text_content("#btn-sprint-bell .bell-main-text")
        print(f"   Bell button text after click: '{bell_text.strip()}'")
        assert "BEL DIBUNYIKAN" in bell_text

        # Test Step 6: Admin jumps to Slide 15 (Briefing 2: Math) -> Must re-lock!
        print("7. Admin jumps to Slide 15 (Briefing 2 Mathchamps)...")
        await asyncio.sleep(1.0)
        await page_admin.select_option("#remote-slide-select", value="14")
        await page_admin.click("#remote-btn-jump")
        await page_mc.wait_for_selector("#slide-15.active", timeout=6000)
        await page_pos1.wait_for_selector("#battle-locked-overlay:not(.hidden)", timeout=6000)
        title_briefing2 = await page_pos1.text_content("#locked-game-title")
        print(f"   Pos 1 Re-locked on Briefing 2: True, Title: '{title_briefing2.strip()}'")
        assert "Mathchamps" in title_briefing2

        # Test Step 7: Admin jumps to Slide 20 (Battle 4: Spreadsheet)
        print("8. Admin jumps to Slide 20 (Battle 4 Sheets Arena)...")
        await asyncio.sleep(1.0)
        await page_admin.select_option("#remote-slide-select", value="19")
        await page_admin.click("#remote-btn-jump")
        await page_mc.wait_for_selector("#slide-20.active", timeout=6000)
        await page_pos1.wait_for_function("document.getElementById('locked-game-title').textContent.includes('Spreadsheet')", timeout=6000)
        title_b4 = await page_pos1.text_content("#locked-game-title")
        print(f"   Pos 1 Title on Battle 4: '{title_b4.strip()}'")
        assert "Spreadsheet" in title_b4
        await page_pos1.screenshot(path="output/pos1_slide20_battle4_sheets.png")

        # Test Step 8: Admin jumps to Slide 21 (Sesi Santuy) -> Returns to Idle
        print("9. Admin jumps to Slide 21 (Bumper Sesi Santuy)...")
        await asyncio.sleep(1.0)
        await page_admin.select_option("#remote-slide-select", value="20")
        await page_admin.click("#remote-btn-jump")
        await page_mc.wait_for_selector("#slide-21.active", timeout=6000)
        await page_pos1.wait_for_selector("#state-olympic-idle.active", timeout=6000)
        print("   Pos 1 Returns to Olympic Idle on Slide 21: True")

        await browser.close()
        print("\n🎉 ALL 26-SLIDE ATOMIC FLOW, BRIEFING LOCK, 3-2-1 COUNTDOWN & MULTI-DEVICE SYNC TESTS PASSED!")

if __name__ == "__main__":
    asyncio.run(main())

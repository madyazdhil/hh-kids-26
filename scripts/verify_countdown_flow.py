import sys
import time
from playwright.sync_api import sync_playwright

def run():
    print("=== STARTING VERIFICATION: 26 SLIDES & COUNTDOWN FLOW ===")
    errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page_mc = context.new_page()
        page_pos1 = context.new_page()
        page_admin = context.new_page()

        def catch_error(source, msg):
            if "429" in msg.text or "ntfy.sh" in msg.text or "ERR_FAILED" in msg.text or "ERR_CONNECTION_RESET" in msg.text or "ERR_SOCKET_NOT_CONNECTED" in msg.text:
                return
            print(f"[CONSOLE ERROR - {source}] {msg.text}")
            errors.append(f"{source}: {msg.text}")

        page_mc.on("console", lambda msg: catch_error("MC", msg) if msg.type == "error" else None)
        page_pos1.on("console", lambda msg: catch_error("POS1", msg) if msg.type == "error" else None)
        page_admin.on("console", lambda msg: catch_error("ADMIN", msg) if msg.type == "error" else None)
        page_admin.on("dialog", lambda dialog: dialog.accept())

        # 1. Load MC Deck
        print("1. Loading MC Deck...")
        page_mc.goto("http://localhost:8765/index.html")
        page_mc.wait_for_selector(".slide.active")
        total_slides = page_mc.locator(".slide").count()
        print(f"   Total slides detected: {total_slides}")
        assert total_slides == 26, f"Expected 26 slides, got {total_slides}"

        # 2. Load Pos 1
        print("2. Loading Pos 1 Laptop...")
        page_pos1.goto("http://localhost:8765/pos.html?pos=1")
        page_pos1.wait_for_selector("#pos-viewport")

        # 3. Load Admin
        print("3. Loading Mobile Admin...")
        page_admin.goto("http://localhost:8765/admin.html")
        page_admin.wait_for_selector("#remote-slide-select")

        time.sleep(1)

        # 4. TEST SLIDE 13 (BRIEFING 1 - KALANANTI)
        print("4. Navigating to Slide 13 (Briefing 1: Kalananti Scratch)...")
        page_mc.evaluate("goToSlide(12)") # 0-indexed 12 = Slide 13
        time.sleep(1)

        # Check MC title
        mc_title = page_mc.locator(".slide.active").get_attribute("data-title")
        print(f"   MC Slide 13 Title: {mc_title}")
        assert "Briefing 1" in mc_title

        # Check Pos 1 state: MUST BE LOCKED!
        locked_visible = page_pos1.locator("#battle-locked-overlay").is_visible()
        active_hidden = "hidden" in (page_pos1.locator("#battle-active-content").get_attribute("class") or "")
        round_badge = page_pos1.locator("#locked-round-badge").text_content()
        print(f"   Pos 1 Locked Overlay Visible: {locked_visible}")
        print(f"   Pos 1 Active Content Hidden: {active_hidden}")
        print(f"   Pos 1 Round Badge: {round_badge}")
        assert locked_visible and active_hidden, "Pos 1 should be locked during Briefing 1!"

        page_pos1.screenshot(path="output/verify_01_slide13_pos1_locked.png")

        # 5. TEST SLIDE 14 (BATTLE 1 - COUNTDOWN & ARENA)
        print("5. Navigating to Slide 14 (Battle 1: Scratch Countdown & Arena)...")
        page_mc.evaluate("goToSlide(13)") # 0-indexed 13 = Slide 14
        time.sleep(1)

        mc_title_14 = page_mc.locator(".slide.active").get_attribute("data-title")
        print(f"   MC Slide 14 Title: {mc_title_14}")
        assert "Battle 1" in mc_title_14

        # Trigger countdown on MC
        print("   Triggering 3-2-1 Countdown on Slide 14...")
        page_mc.locator(".slide.active .btn-trigger-countdown").click(force=True)

        # Wait for countdown to finish and Pos 1 to unlock
        page_pos1.wait_for_selector("#battle-active-content:not(.hidden)", timeout=10000)
        page_pos1.wait_for_selector("#btn-sprint-bell", state="visible", timeout=10000)

        # Check MC battle status
        battle_status_mc = page_mc.locator("#battle-status-1").text_content()
        print(f"   MC Battle Status after countdown: {battle_status_mc}")
        assert "AKTIF" in battle_status_mc or "MULAI" in battle_status_mc

        # Check Pos 1: MUST BE UNLOCKED!
        locked_hidden = "hidden" in (page_pos1.locator("#battle-locked-overlay").get_attribute("class") or "")
        active_visible = page_pos1.locator("#battle-active-content").is_visible()
        bell_visible = page_pos1.locator("#btn-sprint-bell").is_visible()
        print(f"   Pos 1 Locked Overlay Hidden: {locked_hidden}")
        print(f"   Pos 1 Active Content Visible: {active_visible}")
        print(f"   Pos 1 Sprint Bell Visible: {bell_visible}")
        assert locked_hidden and active_visible, "Pos 1 should be unlocked after countdown!"

        page_mc.screenshot(path="output/verify_02_slide14_mc_battle.png")
        page_pos1.screenshot(path="output/verify_03_slide14_pos1_unlocked.png")

        # Click Sprint Bell on Pos 1
        page_pos1.locator("#btn-sprint-bell").click(force=True)
        time.sleep(0.5)
        bell_text = page_pos1.locator("#btn-sprint-bell").text_content()
        assert "LARI KE KAK BALQIS" in bell_text

        # 6. TEST SLIDE 15 (BRIEFING 2 - MATHCHAMPS)
        print("6. Navigating to Slide 15 (Briefing 2: Mathchamps)...")
        page_mc.evaluate("goToSlide(14)")
        time.sleep(1)

        locked_visible = page_pos1.locator("#battle-locked-overlay").is_visible()
        active_hidden = "hidden" in (page_pos1.locator("#battle-active-content").get_attribute("class") or "")
        round_badge = page_pos1.locator("#locked-round-badge").text_content()
        print(f"   Pos 1 Locked for Mathchamps: {locked_visible} ({round_badge})")
        assert locked_visible and active_hidden, "Pos 1 should re-lock during Briefing 2!"

        # 7. TEST SLIDE 16 (BATTLE 2 - MATHCHAMPS COUNTDOWN)
        print("7. Navigating to Slide 16 (Battle 2: Mathchamps)...")
        page_mc.evaluate("goToSlide(15)")
        time.sleep(1)
        page_mc.locator(".slide.active .btn-trigger-countdown").click(force=True)
        page_pos1.wait_for_selector("#battle-active-content:not(.hidden)", timeout=10000)

        active_visible = page_pos1.locator("#battle-active-content").is_visible()
        workspace_text = page_pos1.locator("#battle-workspace").text_content()
        print(f"   Pos 1 Math Workspace text: {workspace_text[:50]}...")
        assert active_visible and "38 + 47" in workspace_text

        # 8. TEST SLIDE 21 (BUMPER SESI SANTUY - POS RETURNS TO IDLE)
        print("8. Navigating to Slide 21 (Bumper Sesi Santuy)...")
        page_mc.evaluate("goToSlide(20)") # 0-indexed 20 = Slide 21
        time.sleep(1)
        pos1_idle = page_pos1.locator("#state-olympic-idle").is_visible()
        print(f"   Pos 1 returned to Olympic Idle on Slide 21: {pos1_idle}")
        assert pos1_idle, "Pos 1 should return to Olympic Idle on Slide 21!"

        # 9. TEST REMOTE AWARDING & DOORPRIZE FROM ADMIN
        print("9. Testing Mobile Admin Awarding & Doorprize Jump...")
        page_admin.locator('.tab-pill[data-tab="scoring"]').click(force=True)
        time.sleep(0.5)
        page_admin.locator("#btn-sync-olympic-winner").click(force=True)
        time.sleep(1.5)

        mc_active_slide = page_mc.locator(".slide.active").get_attribute("id")
        print(f"   MC Active Slide ID after Awarding Winner Sync: {mc_active_slide}")
        assert mc_active_slide in ["slide-23", "slide-awarding"], f"Expected slide-23/slide-awarding, got {mc_active_slide}"

        # Test Doorprize Remote Spin
        page_admin.locator('.tab-pill[data-tab="remote"]').click(force=True)
        time.sleep(0.5)
        page_admin.locator("#remote-spin-doorprize").click(force=True)
        time.sleep(1.5)
        mc_active_slide_dp = page_mc.locator(".slide.active").get_attribute("id")
        print(f"   MC Active Slide ID after Doorprize Spin: {mc_active_slide_dp}")
        assert mc_active_slide_dp in ["slide-24", "slide-doorprize"], f"Expected slide-24/slide-doorprize, got {mc_active_slide_dp}"

        page_mc.screenshot(path="output/verify_04_slide24_doorprize.png")

        browser.close()

    if errors:
        print(f"WARNING: Encountered {len(errors)} console errors:")
        for err in errors:
            print(" -", err)
        sys.exit(1)
    else:
        print("🎉 ALL TESTS PASSED WITH 0 CONSOLE ERRORS!")

if __name__ == "__main__":
    run()

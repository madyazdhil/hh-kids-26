import sys
import time
from playwright.sync_api import sync_playwright

def run():
    print("=== VERIFYING PROJECTOR OBSERVATION & POS QUIZ FLOW ===")
    errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page_mc = context.new_page()
        page_pos1 = context.new_page()
        page_pos3 = context.new_page()

        def catch_error(source, msg):
            txt = msg.text.lower()
            if any(ign in txt for ign in ["429", "ntfy.sh", "err_failed", "connection", "socket", "compute-pressure", "peerjs", "turbowarp", "fetchfonts", "is taken", "aborting"]):
                return
            print(f"[CONSOLE ERROR - {source}] {msg.text}")
            errors.append(f"{source}: {msg.text}")

        page_mc.on("console", lambda msg: catch_error("MC", msg) if msg.type == "error" else None)
        page_pos1.on("console", lambda msg: catch_error("POS1", msg) if msg.type == "error" else None)
        page_pos3.on("console", lambda msg: catch_error("POS3", msg) if msg.type == "error" else None)

        # 1. Load MC Deck & Pos screens
        print("1. Loading MC Deck (Slide 1) & Pos 1, 3...")
        page_mc.goto("http://localhost:8765/index.html", wait_until="domcontentloaded")
        page_mc.wait_for_selector(".slide.active")

        page_pos1.goto("http://localhost:8765/pos.html?pos=1", wait_until="domcontentloaded")
        page_pos3.goto("http://localhost:8765/pos.html?pos=3", wait_until="domcontentloaded")
        page_pos1.wait_for_selector("#pos-viewport")
        page_pos3.wait_for_selector("#pos-viewport")
        time.sleep(1)

        # 2. Go to Slide 17 (Briefing: Memory Academy)
        print("2. Navigating to Slide 17 (Briefing 3)...")
        print(f"   Pos 1 Sync Before: {page_pos1.locator('#pos-sync-status').text_content()}")
        page_mc.evaluate("window.goToSlide(16)")
        time.sleep(1.5)
        print(f"   Pos 1 Sync After: {page_pos1.locator('#pos-sync-status').text_content()}")
        active_id = page_pos1.evaluate("document.querySelector('.pos-state-panel.active')?.id")
        print(f"   Active Panel: {active_id}")
        time.sleep(2)
        page_pos1.screenshot(path="projects/regroup-happy-hour/output/verify_01_briefing_pos1_locked.png")

        # 3. Go to Slide 18 (Battle 3 Arena: Countdown)
        print("3. Navigating to Slide 18 (Battle 3 Arena: Countdown & Observation)...")
        page_mc.evaluate("window.goToSlide(17)")
        time.sleep(1.5)

        # On Slide 18 before countdown, Pos 1 should have battle-locked-overlay visible
        page_pos1.wait_for_selector("#battle-locked-overlay", timeout=5000)
        locked_pos1 = page_pos1.locator("#battle-locked-overlay").is_visible()
        print(f"   Pos 1 battle locked overlay visible: {locked_pos1}")
        assert locked_pos1, "Pos 1 should show locked overlay on Slide 18 before countdown!"

        # Verify Stage 1 Countdown is visible on MC
        countdown_box_mc = page_mc.locator("#memory-stage-countdown").is_visible()
        assert countdown_box_mc, "MC Slide 18 Stage 1 Countdown box should be visible!"

        # Trigger Countdown
        print("4. Triggering Countdown 3-2-1 on MC Slide 18...")
        page_mc.locator("#slide-18 .btn-trigger-countdown").click(force=True)

        # Wait for 3-2-1 to reach 0 (~4.5s)
        time.sleep(4.5)

        # 4. Check Proyektor Stage 2: Observation Box is now visible!
        print("5. Checking Proyektor Stage 2: Big Screen Flip Card Observation...")
        obs_box_mc = page_mc.locator("#memory-stage-observation").is_visible()
        counter_mc = page_mc.locator("#proj-obs-counter").text_content()
        card_name_mc = page_mc.locator("#proj-card-name").text_content()
        print(f"   MC Observation Box Visible: {obs_box_mc}")
        print(f"   MC Card Counter: {counter_mc}")
        print(f"   MC Card Name: {card_name_mc}")
        assert obs_box_mc, "MC Stage 2 Observation Box should be visible!"
        assert "KARTU" in counter_mc, "Card counter should show current card number!"

        page_mc.screenshot(path="projects/regroup-happy-hour/output/verify_02_projector_observation_active.png")

        # 5. Check Pos 1 & Pos 3 Screen: Attention State (Tatap Proyektor!)
        print("6. Checking Pos 1 Screen during Projector Observation...")
        countdown_display_pos1 = page_pos1.locator("#battle-countdown-display").text_content()
        countdown_hint_pos1 = page_pos1.locator("#battle-countdown-hint").text_content()
        battle_active_pos1 = page_pos1.locator("#battle-active-content").is_visible()

        print(f"   Pos 1 Display: {countdown_display_pos1}")
        print(f"   Pos 1 Hint: {countdown_hint_pos1}")
        print(f"   Pos 1 Quiz Active: {battle_active_pos1}")

        assert "HAFALKAN" in countdown_display_pos1, "Pos 1 should show HAFALKAN!"
        assert "TATAP LAYAR PROYEKTOR" in countdown_hint_pos1, "Pos 1 should instruct team to look at projector!"
        assert not battle_active_pos1, "Pos 1 quiz should NOT be active yet during observation!"

        page_pos1.screenshot(path="projects/regroup-happy-hour/output/verify_03_pos1_attention_projector.png")

        # 6. Skip Observation on MC (or finish 20 cards)
        print("7. Clicking Skip Observation on MC to trigger Quiz...")
        page_mc.locator("#btn-skip-obs-projector").click(force=True)
        time.sleep(1)

        # Check MC Stage 3: Quiz Active
        quiz_active_box_mc = page_mc.locator("#memory-stage-quiz-active").is_visible()
        print(f"   MC Quiz Active Banner Visible: {quiz_active_box_mc}")
        assert quiz_active_box_mc, "MC Stage 3 Quiz Active banner should be visible!"
        page_mc.screenshot(path="projects/regroup-happy-hour/output/verify_04_projector_quiz_active.png")

        # 7. Check Pos 1: Quiz is now immediately unlocked and visible!
        print("8. Checking Pos 1 Screen after MEMORY_START_QUIZ...")
        battle_active_pos1_after = page_pos1.locator("#battle-active-content").is_visible()
        print(f"   Pos 1 Quiz Workspace Visible: {battle_active_pos1_after}")
        assert battle_active_pos1_after, "Pos 1 Quiz workspace should now be unlocked!"

        # Frame inspection
        frame_pos1 = page_pos1.frame_locator("#memory-battle-frame")
        frame_pos1.locator("#quizView").wait_for(state="visible", timeout=10000)
        quiz_view_pos1 = frame_pos1.locator("#quizView").is_visible()
        obs_view_pos1 = frame_pos1.locator("#observationView").is_visible()
        print(f"   Pos 1 Quiz View Visible inside frame: {quiz_view_pos1}")
        print(f"   Pos 1 Obs View Hidden inside frame: {not obs_view_pos1}")
        assert quiz_view_pos1, "Quiz view should be directly visible inside frame!"
        assert not obs_view_pos1, "Observation view inside pos frame should be hidden (already observed on projector)!"

        page_pos1.screenshot(path="projects/regroup-happy-hour/output/verify_05_pos1_quiz_unlocked.png")

        # 8. Test answering 20 questions with Keyboard
        print("9. Simulating answering all 20 questions via Keyboard A/B...")
        mem_frame = [f for f in page_pos1.frames if "memory-slide" in f.url][0]
        for q in range(20):
            key = "a" if q % 2 == 0 else "b"
            mem_frame.evaluate(f"handleKeyAction('{key}')")
            time.sleep(0.4)

        time.sleep(1)
        result_view_pos1 = frame_pos1.locator("#resultView").is_visible()
        score_pos1 = frame_pos1.locator("#finalScoreNum").text_content()
        print(f"   Pos 1 Quiz Completed! Result View Visible: {result_view_pos1}")
        print(f"   Pos 1 Final Score: {score_pos1}")
        assert result_view_pos1, "Result view should be visible after 20 questions!"

        page_pos1.screenshot(path="projects/regroup-happy-hour/output/verify_06_pos1_quiz_finished.png")

        # 9. Test Sprint Bell Click
        print("10. Testing Sprint Bell on Pos 1...")
        bell_btn = page_pos1.locator("#btn-sprint-bell")
        bell_btn.click(force=True)
        time.sleep(0.5)
        bell_text = bell_btn.text_content()
        print(f"   Pos 1 Bell Button State: {bell_text.strip()[:40]}...")
        assert "BEL DIBUNYIKAN" in bell_text, "Bell button should reflect triggered state!"

        page_pos1.screenshot(path="projects/regroup-happy-hour/output/verify_07_pos1_bell_rung.png")

        browser.close()

    print(f"\nTotal Console Errors: {len(errors)}")
    if errors:
        for err in errors:
            print(f" - {err}")
        sys.exit(1)
    else:
        print("✅ ALL CHECKS PASSED: Projector observation & pos quiz flow verified 100%!")

if __name__ == "__main__":
    run()

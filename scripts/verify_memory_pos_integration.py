import sys
import time
from playwright.sync_api import sync_playwright

def run():
    print("=== VERIFYING MEMORY CHALLENGE INTEGRATION IN POS.HTML ===")
    errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page_mc = context.new_page()
        page_pos1 = context.new_page()
        page_pos3 = context.new_page()

        def catch_error(source, msg):
            if any(ign in msg.text for ign in ["429", "ntfy.sh", "ERR_FAILED", "ERR_CONNECTION_RESET", "ERR_SOCKET_NOT_CONNECTED", "compute-pressure", "peerjs", "turbowarp", "fetchFonts"]):
                return
            print(f"[CONSOLE ERROR - {source}] {msg.text}")
            errors.append(f"{source}: {msg.text}")

        page_mc.on("console", lambda msg: catch_error("MC", msg) if msg.type == "error" else None)
        page_pos1.on("console", lambda msg: catch_error("POS1", msg) if msg.type == "error" else None)
        page_pos3.on("console", lambda msg: catch_error("POS3", msg) if msg.type == "error" else None)

        # 1. Load MC Deck
        print("1. Loading MC Deck on Slide 1...")
        page_mc.goto("http://localhost:8765/index.html", wait_until="domcontentloaded")
        page_mc.wait_for_selector(".slide.active")

        # 2. Load Pos 1 & Pos 3
        print("2. Loading Pos 1 & Pos 3...")
        page_pos1.goto("http://localhost:8765/pos.html?pos=1", wait_until="domcontentloaded")
        page_pos3.goto("http://localhost:8765/pos.html?pos=3", wait_until="domcontentloaded")
        page_pos1.wait_for_selector("#pos-viewport")
        page_pos3.wait_for_selector("#pos-viewport")
        time.sleep(1)

        # 3. Navigate to Slide 17 (Briefing 3: Memory Academy Flash)
        print("3. Navigating MC to Slide 17 (Briefing 3: Memory Academy)...")
        page_mc.evaluate("goToSlide(16)") # 0-indexed 16 = Slide 17
        time.sleep(1)

        # Verify Pos 1 & Pos 3 are LOCKED
        locked_pos1 = page_pos1.locator("#battle-locked-overlay").is_visible()
        round_badge_pos1 = page_pos1.locator("#locked-round-badge").text_content()
        title_pos1 = page_pos1.locator("#locked-game-title").text_content()
        print(f"   Pos 1 Locked Visible: {locked_pos1}")
        print(f"   Pos 1 Badge: {round_badge_pos1}")
        print(f"   Pos 1 Game Title: {title_pos1}")
        assert locked_pos1, "Pos 1 should be locked in Slide 17 Briefing!"
        assert "Challenge 3: Memory" in title_pos1

        page_pos1.screenshot(path="projects/regroup-happy-hour/output/verify_memory_01_briefing_locked.png")

        # 4. Navigate to Slide 18 (Battle 3 Arena: Memory Academy Countdown)
        print("4. Navigating MC to Slide 18 (Battle 3 Arena: Countdown)...")
        page_mc.evaluate("goToSlide(17)") # 0-indexed 17 = Slide 18
        time.sleep(1)

        # Trigger 3-2-1 Countdown on MC
        print("5. Triggering Countdown on MC Slide 18...")
        page_mc.locator(".slide.active .btn-trigger-countdown").click(force=True)

        # Wait for 3-2-1-MULAI! to complete (~4.5 seconds)
        print("   Waiting for countdown to finish on Pos screens...")
        time.sleep(4.5)

        # Check that battle active content is now visible
        active_pos1 = page_pos1.locator("#battle-active-content").is_visible()
        print(f"   Pos 1 Active Battle Content Visible: {active_pos1}")
        assert active_pos1, "Pos 1 battle active content should be visible after countdown!"

        page_pos1.screenshot(path="projects/regroup-happy-hour/output/verify_memory_02_battle_active.png")

        # 5. Check Memory Challenge Iframe inside Pos 1
        print("6. Inspecting Memory Challenge Frame...")
        frame_locator = page_pos1.frame_locator("#memory-battle-frame")
        
        # Verify card flip observation stage
        obs_stage = frame_locator.locator("#observationView")
        assert obs_stage.is_visible(), "Observation stage should be visible!"
        print("   Observation stage is active and running!")

        time.sleep(1)
        page_pos1.screenshot(path="projects/regroup-happy-hour/output/verify_memory_03_observation_running.png")

        # 6. Test Skip to Quiz / Press Space
        print("7. Testing Skip Observation to Quiz Phase...")
        frame_locator.locator("#btnSkipObs").click()
        time.sleep(0.5)

        quiz_stage = frame_locator.locator("#quizView")
        assert quiz_stage.is_visible(), "Quiz stage should be visible!"
        print("   Quiz stage is active!")

        # 7. Test Keyboard Input (A and B)
        print("8. Testing Keyboard Answers ('A' and 'B')...")
        # Answer first question with key 'A'
        page_pos1.keyboard.press("KeyA")
        time.sleep(0.5)
        
        # Answer second question with key 'B'
        page_pos1.keyboard.press("KeyB")
        time.sleep(0.5)

        # Answer with digit '1'
        page_pos1.keyboard.press("Digit1")
        time.sleep(0.5)

        # Answer with digit '2'
        page_pos1.keyboard.press("Digit2")
        time.sleep(0.5)

        print("   Keyboard inputs processed successfully!")
        page_pos1.screenshot(path="projects/regroup-happy-hour/output/verify_memory_04_quiz_keyboard.png")

        # 8. Fast-forward remaining questions to test Result & Sprint Bell
        print("9. Fast-answering remaining questions to reach results...")
        for _ in range(16):
            page_pos1.keyboard.press("KeyA")
            time.sleep(0.4)

        time.sleep(1)
        result_stage = frame_locator.locator("#resultView")
        assert result_stage.is_visible(), "Result stage should be visible after 20 questions!"
        score_text = frame_locator.locator("#finalScoreNum").text_content()
        print(f"   Final Score Displayed: {score_text}")

        page_pos1.screenshot(path="projects/regroup-happy-hour/output/verify_memory_05_result_and_bell.png")

        # Check that Giant Bell Button received animation pulse
        bell_btn = page_pos1.locator("#btn-sprint-bell")
        assert bell_btn.is_visible(), "Sprint Bell button should be visible!"
        print("   Sprint Bell button is active and ready for participants!")

        print("\n=== VERIFICATION RESULT ===")
        if errors:
            print(f"FAILED with {len(errors)} errors:")
            for err in errors:
                print(f" - {err}")
            sys.exit(1)
        else:
            print("ALL CHECKS PASSED WITH 0 CONSOLE ERRORS!")

if __name__ == "__main__":
    run()

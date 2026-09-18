import time
import os
from playwright.sync_api import sync_playwright

def run():
    output_dir = os.path.abspath("output")
    artifact_dir = "/Users/yazidhilmi/.gemini/antigravity-ide/brain/5b20cf98-4ce7-4c6b-98fd-195b37f5210d"
    os.makedirs(output_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 900})

        # 1. Open Presentation Deck
        page_deck = context.new_page()
        page_deck.goto('http://localhost:8765/index.html')
        page_deck.wait_for_load_state('networkidle')
        time.sleep(1)

        # 2. Open Admin Panel
        page_admin = context.new_page()
        page_admin.on("dialog", lambda dialog: dialog.accept())
        page_admin.goto('http://localhost:8765/admin.html')
        page_admin.wait_for_load_state('networkidle')
        time.sleep(1)

        print("Testing remote control from admin to deck...")

        # From Admin, click Next to go to Slide 2 (Clean Welcome, no spoiler)
        page_admin.click('#remote-btn-next')
        time.sleep(0.6)
        s2_path = os.path.join(output_dir, "slide_02_clean_welcome.png")
        page_deck.screenshot(path=s2_path)
        print("Captured Slide 2 (Clean Welcome)")

        # Jump to Slide 6 (Office Olympics Title only)
        page_admin.select_option('#remote-slide-select', '5') # index 5 is slide 6
        time.sleep(0.6)
        s6_path = os.path.join(output_dir, "slide_06_olympics_title_only.png")
        page_deck.screenshot(path=s6_path)
        print("Captured Slide 6 (Office Olympics Title Only)")

        # Jump to Slide 7 (Briefing 4 Laptop)
        page_admin.select_option('#remote-slide-select', '6') # index 6 is slide 7
        time.sleep(0.6)
        s7_path = os.path.join(output_dir, "slide_07_briefing_4_laptops.png")
        page_deck.screenshot(path=s7_path)
        print("Captured Slide 7 (Briefing 4 Laptops)")

        # Jump to Slide 8 (Timer 1 min) and toggle timer from admin
        page_admin.select_option('#remote-slide-select', '7') # index 7 is slide 8
        time.sleep(0.5)
        page_admin.click('#remote-timer-toggle')
        time.sleep(1.2)
        s8_path = os.path.join(output_dir, "slide_08_timer_1min.png")
        page_deck.screenshot(path=s8_path)
        print("Captured Slide 8 (Timer 1min running)")

        # Jump to Slide 9 (Bumper Post-Scouting)
        page_admin.select_option('#remote-slide-select', '8') # index 8 is slide 9
        time.sleep(0.5)
        s9_path = os.path.join(output_dir, "slide_09_bumper_post_scouting.png")
        page_deck.screenshot(path=s9_path)
        print("Captured Slide 9 (Bumper Post-Scouting)")

        # Test Scoring in Admin Panel
        # Team 1: gets +5 on game 1
        page_admin.click('tr.team-row:nth-child(1) .btn-attempt-5')
        time.sleep(0.3)
        # Team 2: gets Salah then +4 on game 1
        page_admin.click('tr.team-row:nth-child(2) .btn-attempt-fail')
        time.sleep(0.3)
        page_admin.click('tr.team-row:nth-child(2) .btn-attempt-4')
        time.sleep(0.3)

        # Capture Admin Panel screenshot
        admin_shot_path = os.path.join(output_dir, "admin_panel_dashboard.png")
        page_admin.screenshot(path=admin_shot_path)
        print("Captured Admin Panel Dashboard")

        # Send Olympic Winner to Projector
        page_admin.click('#btn-sync-olympic-winner')
        time.sleep(0.8)

        # Send Lunch Challenge Winner (Aulia & Nurul) to Projector
        page_admin.click('#btn-send-lunch')
        time.sleep(0.8)

        # Check Awarding Slide 19 on Projector
        s19_path = os.path.join(output_dir, "slide_19_awarding_synced.png")
        page_deck.screenshot(path=s19_path)
        print("Captured Slide 19 (Awarding with Synced Winner & Aulia-Nurul)")

        # Copy all screenshots to artifact directory for report
        import shutil
        for fname in ["slide_02_clean_welcome.png", "slide_06_olympics_title_only.png", 
                      "slide_07_briefing_4_laptops.png", "slide_08_timer_1min.png", 
                      "slide_09_bumper_post_scouting.png", "admin_panel_dashboard.png", "slide_19_awarding_synced.png"]:
            src = os.path.join(output_dir, fname)
            dst = os.path.join(artifact_dir, fname)
            shutil.copyfile(src, dst)
            print(f"Copied {fname} to artifacts")

        browser.close()
        print("All tests completed successfully!")

if __name__ == "__main__":
    run()

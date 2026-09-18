import os
import sys
import time
import shutil
from playwright.sync_api import sync_playwright

def run():
    output_dir = os.path.abspath("output")
    artifact_dir = "/Users/yazidhilmi/.gemini/antigravity-ide/brain/f1a9fd39-f7c3-4a76-81af-14ae9dba4dd5"
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(artifact_dir, exist_ok=True)

    port = 8765
    console_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Same context so BroadcastChannel and localStorage are shared across tabs
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page_deck = context.new_page()
        page_admin = context.new_page()

        page_deck.on("console", lambda msg: console_errors.append(f"[Deck] {msg.text}") if msg.type == "error" else None)
        page_deck.on("pageerror", lambda err: console_errors.append(f"[Deck Error] {err}"))
        page_admin.on("console", lambda msg: console_errors.append(f"[Admin] {msg.text}") if msg.type == "error" else None)
        page_admin.on("pageerror", lambda err: console_errors.append(f"[Admin Error] {err}"))
        # Auto-accept any browser alerts from admin panel
        page_admin.on("dialog", lambda dialog: dialog.accept())

        print("1. Loading Presentation Deck...")
        page_deck.goto(f"http://localhost:{port}/index.html")
        page_deck.wait_for_load_state("networkidle")

        print("2. Loading Admin Control Center...")
        page_admin.goto(f"http://localhost:{port}/admin.html")
        page_admin.wait_for_load_state("networkidle")
        time.sleep(1)

        # ----------------------------------------------------------------------
        # TEST 1: REMOTE SLIDE CONTROL (Admin -> Deck)
        # ----------------------------------------------------------------------
        print("\n--- Test 1: Remote Slide Navigation ---")
        page_admin.click("#remote-btn-next")
        time.sleep(0.8)

        # Verify Deck moved to Slide 2
        slide2_active = page_deck.locator("#slide-2").evaluate("el => el.classList.contains('active')")
        print(f"Deck Slide 2 Active: {slide2_active}")
        assert slide2_active, "Deck did not advance to Slide 2 via Admin Next button"

        # Capture Admin Remote Dashboard
        admin_remote_path = os.path.join(output_dir, "admin_tab_remote.png")
        page_admin.screenshot(path=admin_remote_path)
        print("Captured admin_tab_remote.png")

        # ----------------------------------------------------------------------
        # TEST 2: OFFICE OLYMPIC SCORING (Wrong Try -> 4 Pts -> Leaderboard)
        # ----------------------------------------------------------------------
        print("\n--- Test 2: Office Olympic Scorer ---")
        # In Kelompok 1, click Salah (fail_1)
        print("Clicking Salah for Kelompok 1...")
        page_admin.click("#teams-table-body tr:first-child .btn-attempt-fail")
        time.sleep(0.5)

        # Click +4 (2nd) for Kelompok 1
        page_admin.click("#teams-table-body tr:first-child .btn-attempt-4")
        time.sleep(0.5)

        # In Kelompok 2, click +5 (1st)
        page_admin.click("#teams-table-body tr:nth-child(2) .btn-attempt-5")
        time.sleep(0.5)

        # Click Sync Olympic Winner to Deck
        page_admin.click("#btn-sync-olympic-winner")
        time.sleep(0.8)

        # Capture Admin Olympic Scorer
        admin_olympic_path = os.path.join(output_dir, "admin_tab_olympic.png")
        page_admin.screenshot(path=admin_olympic_path)
        print("Captured admin_tab_olympic.png")

        # ----------------------------------------------------------------------
        # TEST 3: GRAND AWARDING & PHOTO SYNC (Aulia & Nurul prefilled)
        # ----------------------------------------------------------------------
        print("\n--- Test 3: Grand Awarding & Winner Dispatch ---")
        lunch_val = page_admin.input_value("#admin-input-lunch")
        print(f"Lunch Challenge Winner Input: {lunch_val}")
        assert "Aulia" in lunch_val and "Nurul" in lunch_val, "Lunch challenge not prefilled with Aulia & Nurul"

        # Click send lunch button
        print("Dispatching Aulia & Nurul to presentation deck...")
        page_admin.click("#btn-send-lunch")
        time.sleep(1.2)

        # Verify Deck is now on Slide 19 (Awarding) and Lunch award shows Aulia & Nurul
        slide19_active = page_deck.locator("#slide-19").evaluate("el => el.classList.contains('active')")
        print(f"Deck Slide 19 Active: {slide19_active}")
        assert slide19_active, "Deck did not jump to Slide 19 upon Award Dispatch"

        placeholder_text = page_deck.inner_text("#award-lunch .winner-placeholder")
        print(f"Deck Revealed Winner Text: {placeholder_text}")
        assert "Aulia" in placeholder_text and "Nurul" in placeholder_text, "Deck did not show Aulia & Nurul"

        # Capture Deck Slide 19 Awarding
        deck_award_path = os.path.join(output_dir, "slide_19_awarding_synced.png")
        page_deck.screenshot(path=deck_award_path)
        print("Captured slide_19_awarding_synced.png")

        # Copy screenshots to artifact directory
        for fname in ["admin_tab_remote.png", "admin_tab_olympic.png", "slide_19_awarding_synced.png"]:
            src = os.path.join(output_dir, fname)
            dst = os.path.join(artifact_dir, fname)
            if os.path.exists(src):
                shutil.copyfile(src, dst)
                print(f"Copied {fname} to artifacts")

        browser.close()

    print("\n--- Console Errors ---")
    if console_errors:
        for err in console_errors:
            print("ERROR:", err)
    else:
        print("No errors detected! Everything is 100% clean.")

if __name__ == "__main__":
    run()

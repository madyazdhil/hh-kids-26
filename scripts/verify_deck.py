import os
import sys
import time
from playwright.sync_api import sync_playwright

def run():
    html_path = os.path.abspath("src/index.html")
    output_dir = os.path.abspath("output")
    artifact_dir = "/Users/yazidhilmi/.gemini/antigravity-ide/brain/5b20cf98-4ce7-4c6b-98fd-195b37f5210d"
    os.makedirs(output_dir, exist_ok=True)

    console_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # 16:9 widescreen presentation display
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()

        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: console_errors.append(str(err)))

        print(f"Loading deck from: file://{html_path}")
        page.goto(f"file://{html_path}")
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        # 1. Capture Slide 1 (Pre-show)
        s1_path = os.path.join(output_dir, "slide_01_preshow.png")
        page.screenshot(path=s1_path)
        print("Captured Slide 1")

        # 2. Advance to Slide 2 (Hero Welcoming)
        page.keyboard.press("ArrowRight")
        time.sleep(0.6)
        s2_path = os.path.join(output_dir, "slide_02_hero.png")
        page.screenshot(path=s2_path)
        print("Captured Slide 2")

        # 3. Jump to Slide 5 (Office Olympic Opening)
        page.select_option("#slide-select", "4") # index 4 is slide 5
        time.sleep(0.6)
        s5_path = os.path.join(output_dir, "slide_05_olympics.png")
        page.screenshot(path=s5_path)
        print("Captured Slide 5")

        # 4. Jump to Slide 6 (Timer: Ketua Kelompok Mencari)
        page.select_option("#slide-select", "5") # index 5 is slide 6
        time.sleep(0.5)
        # Start timer with hotkey 'T'
        page.keyboard.press("t")
        time.sleep(1.2)
        s6_path = os.path.join(output_dir, "slide_06_timer.png")
        page.screenshot(path=s6_path)
        print("Captured Slide 6 (Timer running)")

        # 5. Jump to Slide 8 (Challenge 1: Scratch) & test progressive reveal
        page.select_option("#slide-select", "7") # index 7 is slide 8
        time.sleep(0.5)
        # First step active by default, press Space to reveal Bell kak balqis alert
        page.keyboard.press("Space")
        time.sleep(0.5)
        s8_step2_path = os.path.join(output_dir, "slide_08_scratch_step2.png")
        page.screenshot(path=s8_step2_path)
        print("Captured Slide 8 Step 2")

        # 6. Jump to Slide 13 (Awarding Stage)
        page.select_option("#slide-select", "12") # index 12 is slide 13
        time.sleep(0.5)
        # Type a winner in the first input and click reveal
        award_input = page.locator("#award-olympic .winner-input")
        award_input.fill("TIM SULTAN DA VINCI")
        page.click("#award-olympic .btn-reveal-winner")
        time.sleep(0.6)
        s13_path = os.path.join(output_dir, "slide_13_awarding.png")
        page.screenshot(path=s13_path)
        print("Captured Slide 13 (Awarding revealed)")

        # 7. Jump to Slide 14 (Doorprize Nyeleneh Lottery Machine)
        page.select_option("#slide-select", "13") # index 13 is slide 14
        time.sleep(0.5)
        page.click("#btn-spin-doorprize")
        # Wait 3 seconds for spin to finish
        time.sleep(3.0)
        s14_path = os.path.join(output_dir, "slide_14_doorprize.png")
        page.screenshot(path=s14_path)
        print("Captured Slide 14 (Doorprize won)")

        # Copy screenshots to artifact directory for embedding
        import shutil
        for fname in ["slide_01_preshow.png", "slide_02_hero.png", "slide_05_olympics.png", 
                      "slide_06_timer.png", "slide_08_scratch_step2.png", "slide_13_awarding.png", "slide_14_doorprize.png"]:
            src = os.path.join(output_dir, fname)
            dst = os.path.join(artifact_dir, fname)
            shutil.copyfile(src, dst)
            print(f"Copied {fname} to artifacts")

        browser.close()

    print("\n--- Console Errors ---")
    if console_errors:
        for err in console_errors:
            print("ERROR:", err)
    else:
        print("No errors detected! Everything is clean.")

if __name__ == "__main__":
    run()

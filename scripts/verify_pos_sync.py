#!/usr/bin/env python3
"""
Automated Verification Script for 4 Central Table Pos Laptops & Admin Mobile View
Using Playwright Headless Browser.
"""

import os
import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:8765"
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'output'))
os.makedirs(OUTPUT_DIR, exist_ok=True)

def run_verification():
    print("🚀 Starting 4-Pos Table Sync & Admin Mobile Verification...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # Context 1: Desktop (MC & Pos Laptops)
        desktop_context = browser.new_context(viewport={"width": 1440, "height": 900})
        
        # Context 2: Mobile (Aldeina's Smartphone)
        mobile_context = browser.new_context(
            viewport={"width": 390, "height": 844}, # iPhone 14
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148"
        )

        page_mc = desktop_context.new_page()
        page_pos1 = desktop_context.new_page()
        page_pos2 = desktop_context.new_page()
        page_pos3 = desktop_context.new_page()
        page_pos4 = desktop_context.new_page()
        page_admin_mobile = mobile_context.new_page()

        # Listen to console errors
        errors = []
        for name, pg in [('MC', page_mc), ('POS1', page_pos1), ('POS2', page_pos2), 
                         ('POS3', page_pos3), ('POS4', page_pos4), ('ADMIN_MOB', page_admin_mobile)]:
            pg.on("console", lambda msg, n=name: errors.append(f"[{n} ERROR] {msg.text}") if msg.type == "error" else None)

        print("1️⃣ Navigating to pages...")
        page_mc.goto(f"{BASE_URL}/index.html")
        page_pos1.goto(f"{BASE_URL}/pos.html?pos=1")
        page_pos2.goto(f"{BASE_URL}/pos.html?pos=2")
        page_pos3.goto(f"{BASE_URL}/pos.html?pos=3")
        page_pos4.goto(f"{BASE_URL}/pos.html?pos=4")
        page_admin_mobile.goto(f"{BASE_URL}/admin.html")

        time.sleep(1.5)

        # ---------------------------------------------------------------------
        # TEST 1: Initial State (Slide 1 / Slide 2) -> Grand Title View (No Spoilers)
        # ---------------------------------------------------------------------
        print("2️⃣ Verifying Initial State (Zero Spoilers)...")
        assert page_pos1.locator("#view-title").is_visible(), "Pos 1 should show title view on Slide 1"
        assert not page_pos1.locator("#view-scouting").is_visible(), "Pos 1 should not show scouting on Slide 1"
        
        pos1_label = page_pos1.locator("#assigned-pos-label-title").inner_text()
        print(f"   Pos 1 Label: {pos1_label}")
        assert "POS 1" in pos1_label, "Pos 1 label mismatch"

        pos2_label = page_pos2.locator("#assigned-pos-label-title").inner_text()
        print(f"   Pos 2 Label: {pos2_label}")
        assert "POS 2" in pos2_label, "Pos 2 label mismatch"

        page_pos1.screenshot(path=os.path.join(OUTPUT_DIR, "pos_01_title_view.png"))

        # ---------------------------------------------------------------------
        # TEST 2: Jump to Slide 7 (Briefing 4 Pos Laptop) -> Olympics Logo
        # ---------------------------------------------------------------------
        print("3️⃣ Navigating MC to Slide 7 (Briefing 4 Pos)...")
        page_mc.evaluate("window.goToSlide(6)") # index 6 = Slide 7
        time.sleep(1.2)

        assert page_pos1.locator("#view-olympics-logo").is_visible(), "Pos 1 should show Olympics logo on Slide 7"
        assert page_pos4.locator("#view-olympics-logo").is_visible(), "Pos 4 should show Olympics logo on Slide 7"
        page_pos1.screenshot(path=os.path.join(OUTPUT_DIR, "pos_02_olympics_logo.png"))

        # ---------------------------------------------------------------------
        # TEST 3: Slide 8 (Ketua Kelompok Mencari) -> Timer Started -> Distinct Pos Content
        # ---------------------------------------------------------------------
        print("4️⃣ Navigating MC to Slide 8 & Starting Timer...")
        page_mc.evaluate("window.goToSlide(7)") # index 7 = Slide 8
        time.sleep(0.8)

        # Before timer starts -> Still Olympics Logo
        assert page_pos1.locator("#view-olympics-logo").is_visible(), "Before timer, Pos 1 should show Olympics logo"

        # Start timer on Slide 8
        page_mc.evaluate("window.toggleTimer(1)")
        time.sleep(1.2)

        # Now all 4 pos should be in #view-scouting with their respective contents!
        assert page_pos1.locator("#view-scouting").is_visible(), "Pos 1 should be in scouting view during timer"
        assert page_pos1.locator("#scouting-pos-content-1").is_visible(), "Pos 1 should display Scratch content"
        assert page_pos1.locator("#scouting-pos-content-2").is_hidden(), "Pos 1 should NOT display Math content"

        assert page_pos2.locator("#scouting-pos-content-2").is_visible(), "Pos 2 should display Math content"
        assert page_pos3.locator("#scouting-pos-content-3").is_visible(), "Pos 3 should display Memory content"
        assert page_pos4.locator("#scouting-pos-content-4").is_visible(), "Pos 4 should display Spreadsheet content"

        page_pos1.screenshot(path=os.path.join(OUTPUT_DIR, "pos_03_scouting_pos1.png"))
        page_pos4.screenshot(path=os.path.join(OUTPUT_DIR, "pos_04_scouting_pos4.png"))

        # ---------------------------------------------------------------------
        # TEST 4: Slide 9 (Waktu Inspeksi Selesai) -> INSTANT LOCK BACK TO LOGO
        # ---------------------------------------------------------------------
        print("5️⃣ Navigating MC to Slide 9 -> Verifying Instant Lock...")
        page_mc.evaluate("window.goToSlide(8)") # index 8 = Slide 9
        time.sleep(1.2)

        assert page_pos1.locator("#view-olympics-logo").is_visible(), "Pos 1 should instantly lock back to Olympics logo on Slide 9"
        assert page_pos1.locator("#view-scouting").is_hidden(), "Pos 1 scouting view should be hidden"
        assert page_pos4.locator("#view-olympics-logo").is_visible(), "Pos 4 should instantly lock back to Olympics logo on Slide 9"
        page_pos1.screenshot(path=os.path.join(OUTPUT_DIR, "pos_05_locked_after_scouting.png"))

        # ---------------------------------------------------------------------
        # TEST 5: Slide 13 (Challenge 1: Scratch Match) -> SIMULTANEOUS MATCH ON ALL 4
        # ---------------------------------------------------------------------
        print("6️⃣ Navigating MC to Slide 13 (Challenge 1 Scratch Match)...")
        page_mc.evaluate("window.goToSlide(12)") # index 12 = Slide 13
        time.sleep(1.2)

        # All 4 pos should be in #view-match with Challenge 1!
        assert page_pos1.locator("#view-match").is_visible(), "Pos 1 should display match view on Slide 13"
        assert page_pos2.locator("#view-match").is_visible(), "Pos 2 should display match view on Slide 13"
        assert page_pos3.locator("#view-match").is_visible(), "Pos 3 should display match view on Slide 13"
        assert page_pos4.locator("#view-match").is_visible(), "Pos 4 should display match view on Slide 13"

        # Click manual start to dismiss overlay
        if page_pos1.locator("#btn-manual-start-match").is_visible():
            page_pos1.locator("#btn-manual-start-match").click()
        time.sleep(0.5)

        # Click the giant sprint bell button on Pos 1
        print("   Testing Giant Sprint Bell button...")
        btn_bell = page_pos1.locator("#btn-sprint-bell")
        assert btn_bell.is_visible(), "Giant Sprint Bell button should be visible"
        btn_bell.click(force=True)
        time.sleep(0.5)

        page_pos1.screenshot(path=os.path.join(OUTPUT_DIR, "pos_06_match_scratch_arena.png"))

        # ---------------------------------------------------------------------
        # TEST 6: Mobile Admin Viewport
        # ---------------------------------------------------------------------
        print("7️⃣ Capturing Mobile Admin Viewport...")
        page_admin_mobile.screenshot(path=os.path.join(OUTPUT_DIR, "admin_mobile_view.png"))

        print("🎉 Verification Complete! All 6 tests passed successfully.")
        if errors:
            print(f"⚠️ Notices/Errors logged ({len(errors)}):")
            for e in errors[:5]:
                print("   ", e)
        else:
            print("✅ 0 Console Errors encountered across all 6 pages!")

        browser.close()

if __name__ == "__main__":
    run_verification()

import time
import os
from playwright.sync_api import sync_playwright

def run():
    os.makedirs('output', exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # 1. Proyektor MC Context
        mc_context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        mc_page = mc_context.new_page()
        
        console_errors = []
        mc_page.on('console', lambda msg: console_errors.append(f"[MC Console] {msg.text}") if msg.type == 'error' else None)
        
        print("1. Opening MC Deck...")
        mc_page.goto('http://localhost:8765/')
        mc_page.wait_for_selector('#btn-spectator-launch', timeout=10000)
        
        # Open Spectator Arena via Button
        print("2. Opening Spectator Arena via Launch Button...")
        mc_page.click('#btn-spectator-launch')
        mc_page.wait_for_timeout(500)
        
        assert not mc_page.locator('#spectator-overlay').is_hidden(), "Spectator overlay should be visible!"
        
        # Verify 4 iframe sources
        src1 = mc_page.get_attribute('#iframe-pos1', 'src')
        src2 = mc_page.get_attribute('#iframe-pos2', 'src')
        src3 = mc_page.get_attribute('#iframe-pos3', 'src')
        src4 = mc_page.get_attribute('#iframe-pos4', 'src')
        
        print(f"   Pos 1 feed URL: {src1}")
        assert "hhkids26_pos1" in src1, "Pos 1 feed URL incorrect!"
        assert "hhkids26_pos4" in src4, "Pos 4 feed URL incorrect!"
        
        mc_page.screenshot(path='output/spectator_grid_mc.png')
        print("   Saved output/spectator_grid_mc.png")
        
        # Focus on Pos 1
        print("3. Testing Focus Mode Pos 1...")
        mc_page.click('.spec-mode-btn[data-mode="pos1"]')
        mc_page.wait_for_timeout(400)
        stage_class = mc_page.get_attribute('#spectator-grid-stage', 'class')
        assert "mode-focus-1" in stage_class, f"Expected mode-focus-1, got {stage_class}"
        
        mc_page.screenshot(path='output/spectator_focus_pos1.png')
        print("   Saved output/spectator_focus_pos1.png")
        
        # Switch back to Grid
        mc_page.click('.spec-mode-btn[data-mode="grid"]')
        mc_page.wait_for_timeout(300)
        assert "mode-grid" in mc_page.get_attribute('#spectator-grid-stage', 'class')
        
        # Close via Escape key
        print("4. Testing Close via Escape key...")
        mc_page.keyboard.press('Escape')
        mc_page.wait_for_timeout(300)
        assert mc_page.locator('#spectator-overlay').is_hidden(), "Spectator overlay should be hidden after Escape!"
        
        # Open via 'V' key
        print("5. Testing Open via 'V' key...")
        mc_page.keyboard.press('v')
        mc_page.wait_for_timeout(400)
        assert not mc_page.locator('#spectator-overlay').is_hidden(), "Spectator overlay should be open after 'v' key!"
        
        # Close again
        mc_page.click('#btn-close-spectator')
        mc_page.wait_for_timeout(300)
        assert mc_page.locator('#spectator-overlay').is_hidden()
        
        # 2. Test Pos Screen
        print("6. Testing Pos 1 Screen Broadcast Button...")
        pos_context = browser.new_context(viewport={'width': 1366, 'height': 768})
        pos_page = pos_context.new_page()
        pos_page.goto('http://localhost:8765/pos.html?pos=1')
        pos_page.wait_for_selector('#btn-broadcast-stream', timeout=5000)
        
        with pos_page.expect_popup() as popup_info:
            pos_page.click('#btn-broadcast-stream')
        popup = popup_info.value
        print(f"   Popup URL: {popup.url}")
        assert "vdo.ninja" in popup.url and "hhkids26_pos1" in popup.url
        popup.close()
        
        pos_page.screenshot(path='output/pos1_broadcast_ready.png')
        print("   Saved output/pos1_broadcast_ready.png")
        
        # 3. Test Mobile Admin Remote Control
        print("7. Testing Mobile Admin Remote Spectator Control...")
        admin_context = browser.new_context(viewport={'width': 393, 'height': 852})
        admin_page = admin_context.new_page()
        admin_page.goto('http://localhost:8765/admin.html')
        admin_page.wait_for_selector('#remote-spectator-toggle', timeout=5000)
        
        admin_page.screenshot(path='output/mobile_admin_spectator_btn.png')
        print("   Saved output/mobile_admin_spectator_btn.png")
        
        # Toggle spectator from Mobile Admin
        print("   Triggering spectator toggle from phone...")
        admin_page.click('#remote-spectator-toggle')
        mc_page.wait_for_timeout(1000)
        assert not mc_page.locator('#spectator-overlay').is_hidden(), "MC proyektor should open spectator upon admin click!"
        
        # Focus Pos 3 from Mobile Admin
        print("   Triggering Focus Pos 3 from phone...")
        admin_page.click('.btn-spec-mode[data-mode="pos3"]')
        mc_page.wait_for_timeout(1000)
        assert "mode-focus-3" in mc_page.get_attribute('#spectator-grid-stage', 'class'), "MC should switch to mode-focus-3!"
        
        # Close spectator from Mobile Admin
        admin_page.click('#remote-spectator-toggle')
        mc_page.wait_for_timeout(1000)
        assert mc_page.locator('#spectator-overlay').is_hidden(), "MC proyektor should close spectator upon admin click!"
        
        print("8. Checking console errors...")
        # Ignore external iframe content blocked or network issues if any, check main context
        local_errors = [e for e in console_errors if 'vdo.ninja' not in e]
        if local_errors:
            print("Warning / Errors found:", local_errors)
        else:
            print("✅ 100% SUCCESS: 0 local console errors!")
            
        browser.close()

if __name__ == '__main__':
    run()

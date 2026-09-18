import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})
        os.makedirs("output/sanitized_check", exist_ok=True)

        print("--- 1. Testing scratch-slide.html ---")
        await page.goto("http://localhost:8765/scratch-slide.html", wait_until="domcontentloaded")
        await asyncio.sleep(1.0)

        # Check Slide 1 briefing text
        briefing_text = await page.text_content("#slide1")
        assert "MENANG PENUH" not in briefing_text, "Briefing should not mention MENANG PENUH"
        print("✓ Slide 1 does not mention MENANG PENUH")

        # Go to Slide 2
        await page.click(".start-btn")
        await asyncio.sleep(1.0)

        # Check HUD in Slide 2
        hud_right_buttons = await page.eval_on_selector_all(".hud-right button", "btns => btns.map(b => b.innerText.trim())")
        print(f"✓ Buttons in hud-right: {hud_right_buttons}")
        assert "💡 Kunci Jawaban" not in hud_right_buttons, "💡 Kunci Jawaban must be deleted!"
        assert "🏆 Preview Layar Menang" not in hud_right_buttons, "🏆 Preview Layar Menang must be deleted!"
        assert any("Reset Soal" in b for b in hud_right_buttons), "Reset Soal must be present"

        # Check solution drawer and win overlay elements do not exist
        drawer = await page.query_selector("#solutionDrawer")
        overlay = await page.query_selector("#fullWinOverlay")
        assert drawer is None, "#solutionDrawer should not exist in DOM"
        assert overlay is None, "#fullWinOverlay should not exist in DOM"
        print("✓ #solutionDrawer and #fullWinOverlay are completely removed from DOM")

        await page.screenshot(path="output/sanitized_check/scratch_slide2_clean_hud.png")
        print("✓ Screenshot saved: output/sanitized_check/scratch_slide2_clean_hud.png")

        print("\n--- 2. Testing sempoa-slide.html ---")
        await page.goto("http://localhost:8765/sempoa-slide.html", wait_until="domcontentloaded")
        await asyncio.sleep(1.0)

        # Check gear button is gone
        edit_btn = await page.query_selector("#btnEditQuestions")
        assert edit_btn is None, "Gear icon #btnEditQuestions must be removed from header actions!"
        print("✓ Gear icon #btnEditQuestions is completely removed")

        edit_modal = await page.query_selector("#editModal")
        assert edit_modal is None, "#editModal must be completely removed from DOM!"
        print("✓ #editModal is completely removed from DOM")

        # Test answering incorrectly
        await page.click("#btnStartGame")
        # wait until numbers finish or answer input becomes visible
        await page.wait_for_selector("#answerSection:not([style*='display: none'])", timeout=15000)
        print("✓ Answer input visible")

        # Type a wrong answer
        await page.fill("#keyboardAnswerInput", "99999")
        await page.click("#btnCheckAnswer")
        await asyncio.sleep(0.5)

        # Verify feedback
        fb_title = await page.text_content("#feedbackTitleText")
        fb_detail = await page.text_content("#feedbackDetailText")
        fb_breakdown = await page.text_content("#feedbackCalcBreakdown")

        print(f"Feedback Title: '{fb_title.strip()}'")
        print(f"Feedback Detail: '{fb_detail.strip()}'")
        print(f"Feedback Breakdown: '{fb_breakdown.strip()}'")

        assert "Kunci" not in fb_detail, "Feedback detail must NOT leak Kunci!"
        assert fb_breakdown.strip() == "", "Feedback breakdown must NOT leak correct answer!"
        print("✓ Feedback does not leak answer key or formula on wrong answers!")

        await page.screenshot(path="output/sanitized_check/sempoa_wrong_answer_no_leak.png")
        print("✓ Screenshot saved: output/sanitized_check/sempoa_wrong_answer_no_leak.png")

        print("\n--- ALL SANITIZATION CHECKS PASSED PERFECTLY! ---")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())

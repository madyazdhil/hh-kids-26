import sys
import time
from playwright.sync_api import sync_playwright

def run():
    print("=== VERIFYING ALL 20 MEMORY CARDS AND DISTRACTORS LOAD VALID IMAGES ===")
    errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()

        # 1. Test memory-slide.html directly
        print("1. Loading memory-slide.html?mode=quiz...")
        page.goto("http://localhost:8765/memory-slide.html?mode=quiz", wait_until="networkidle")
        page.wait_for_selector("#quizView")

        # 2. Check all items in ITEM_PAIRS array inside the page
        print("2. Checking all 20 ITEM_PAIRS inside memory-slide...")
        items = page.evaluate("ITEM_PAIRS")
        print(f"   Found {len(items)} items in ITEM_PAIRS.")
        assert len(items) == 20, f"Expected 20 items, got {len(items)}"

        # 3. Test image loading for every target and distractor
        print("3. Preloading and verifying naturalWidth > 0 for all 40 images (20 targets + 20 distractors)...")
        results = page.evaluate("""
            async () => {
                const results = [];
                for (const item of ITEM_PAIRS) {
                    const checkImg = (url) => new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => resolve({ ok: true, width: img.naturalWidth, height: img.naturalHeight });
                        img.onerror = () => resolve({ ok: false, width: 0, height: 0 });
                        img.src = url;
                    });

                    const targetRes = await checkImg(item.target);
                    const distRes = await checkImg(item.distractor);

                    results.push({
                        id: item.id,
                        name: item.name,
                        targetOk: targetRes.ok,
                        targetSize: `${targetRes.width}x${targetRes.height}`,
                        distName: item.distractorName,
                        distOk: distRes.ok,
                        distSize: `${distRes.width}x${distRes.height}`
                    });
                }
                return results;
            }
        """)

        failed_count = 0
        for r in results:
            t_status = "✅" if r["targetOk"] else "❌"
            d_status = "✅" if r["distOk"] else "❌"
            print(f"   {t_status} Target: {r['name']} ({r['targetSize']}) | {d_status} Distractor: {r['distName']} ({r['distSize']})")
            if not r["targetOk"]:
                errors.append(f"Broken target image for {r['name']}")
                failed_count += 1
            if not r["distOk"]:
                errors.append(f"Broken distractor image for {r['distName']}")
                failed_count += 1

        assert failed_count == 0, f"{failed_count} images failed to load!"

        # 4. Check Projector Deck Slide 18 MEMORY_PROJECTOR_ITEMS
        print("4. Checking Projector Deck Slide 18 MEMORY_PROJECTOR_ITEMS in index.html...")
        page_mc = context.new_page()
        page_mc.goto("http://localhost:8765/index.html", wait_until="domcontentloaded")
        page_mc.wait_for_selector(".slide.active")
        mc_results = page_mc.evaluate("""
            async () => {
                const results = [];
                // Go to slide 18
                window.goToSlide(17);
                // Trigger observation
                startProjectorMemoryObservation();
                
                const items = MEMORY_PROJECTOR_ITEMS;
                for (const item of items) {
                    const checkImg = (url) => new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => resolve({ ok: true, width: img.naturalWidth, height: img.naturalHeight });
                        img.onerror = () => resolve({ ok: false, width: 0, height: 0 });
                        img.src = url;
                    });
                    const res = await checkImg(item.target);
                    results.push({ name: item.name, ok: res.ok, size: `${res.width}x${res.height}` });
                }
                return results;
            }
        """)

        mc_failed = 0
        for r in mc_results:
            status = "✅" if r["ok"] else "❌"
            print(f"   {status} Proyektor: {r['name']} ({r['size']})")
            if not r["ok"]:
                errors.append(f"Broken projector target for {r['name']}")
                mc_failed += 1

        assert mc_failed == 0, f"{mc_failed} projector images failed to load!"

        # Take screenshot of quiz with images rendered
        page.screenshot(path="output/verify_quiz_images_rendered.png")
        page_mc.screenshot(path="output/verify_projector_image_rendered.png")

        browser.close()

    print(f"\nTotal Errors: {len(errors)}")
    if errors:
        for err in errors:
            print(f" - {err}")
        sys.exit(1)
    else:
        print("🎉 ALL 40 IMAGES (100%) LOADED BEAUTIFULLY WITH ZERO BROKEN CARDS!")

if __name__ == "__main__":
    run()

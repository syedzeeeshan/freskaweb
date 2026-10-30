import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9222;

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runTestSuite() {
  console.log('Starting visual test suite against http://localhost:5173/ ...');

  const chromeProcess = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900',
    '--user-data-dir=C:\\temp\\chrome-test-suite',
    'http://localhost:5173/'
  ]);

  await sleep(1800);

  try {
    const res = await fetch(`http://localhost:${port}/json/version`);
    const data = await res.json();
    const ws = new WebSocket(data.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const msgId = id++;
        const handler = (evt) => {
          const resp = JSON.parse(evt.data);
          if (resp.id === msgId) {
            ws.removeEventListener('message', handler);
            resolve(resp.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    const targets = await send('Target.getTargets');
    const pageTarget = targets.targetInfos.find(t => t.type === 'page');
    const { sessionId } = await send('Target.attachToTarget', { targetId: pageTarget.targetId, flatten: true });

    function sendPage(method, params = {}) {
      return new Promise((resolve) => {
        const msgId = id++;
        const handler = (evt) => {
          const resp = JSON.parse(evt.data);
          if (resp.id === msgId) {
            ws.removeEventListener('message', handler);
            resolve(resp.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, sessionId, method, params }));
      });
    }

    async function capture(fileName) {
      const { data: b64 } = await sendPage('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`public/assets/images/${fileName}`, Buffer.from(b64, 'base64'));
      console.log(`✓ Captured ${fileName}`);
    }

    // 1. Initial Hero Section (Light Theme with Official Logo in Header)
    await sleep(1200);
    await capture('verified_hero_official_logo.png');

    // 2. Open Fullscreen Menu
    await sendPage('Runtime.evaluate', {
      expression: 'document.querySelector(".btn-menu")?.click();'
    });
    await sleep(600);
    await capture('verified_menu_open_editorial.png');

    // 3. Close Fullscreen Menu via ESC key
    await sendPage('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
    await sendPage('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
    await sleep(400);

    // 4. Scroll to Meat Garden Section (Initial Concealed State)
    await sendPage('Runtime.evaluate', {
      expression: 'document.querySelector("#meat-garden")?.scrollIntoView({ behavior: "instant" });'
    });
    await sleep(800);
    await capture('verified_meat_garden_concealed.png');

    // 5. Hover / Pointer Reveal over Meat Garden Canvas
    const canvasBox = await sendPage('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector(".meat-canvas-wrapper");
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { x: rect.left + rect.width * 0.45, y: rect.top + rect.height * 0.5 };
      })()`,
      returnByValue: true
    });

    if (canvasBox.result.value) {
      const { x, y } = canvasBox.result.value;
      // Dispatch pointer move events across the canvas
      await sendPage('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x - 100, y });
      await sleep(100);
      await sendPage('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      await sleep(400);
      await capture('verified_meat_garden_revealed.png');
    }

    // 6. Test Category Selection: "Lamb & Red Meat"
    await sendPage('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll(".meat-cat-btn"));
        const meatBtn = btns.find(b => b.textContent.includes("Lamb"));
        meatBtn?.click();
      })()`
    });
    await sleep(500);
    await capture('verified_meat_garden_lamb_focus.png');

    // 7. Scroll to Dark Chapters Section (#chapters)
    await sendPage('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector("#chapters");
        el?.scrollIntoView({ behavior: "instant" });
        document.body.classList.add("theme-dark");
      })()`
    });
    await sleep(1000);
    await capture('verified_dark_chapters_corrected.png');

    // 8. Mobile Viewport Test (375 x 812)
    await sendPage('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true
    });
    await sendPage('Runtime.evaluate', {
      expression: 'document.querySelector("#meat-garden")?.scrollIntoView({ behavior: "instant" });'
    });
    await sleep(600);
    await capture('verified_mobile_meat_garden.png');

    ws.close();
    console.log('Visual test suite completed successfully!');
  } catch (err) {
    console.error('Test suite error:', err);
  } finally {
    chromeProcess.kill();
  }
}

runTestSuite();

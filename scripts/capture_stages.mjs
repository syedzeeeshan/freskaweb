import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9226;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('--- Launching Chrome for verification ---');
  const chromeProcess = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900',
    '--user-data-dir=C:\\temp\\chrome-final-audit',
    'http://localhost:5173/'
  ]);

  await sleep(2500);

  try {
    const res = await fetch(`http://localhost:${port}/json/version`);
    const data = await res.json();
    const ws = new WebSocket(data.webSocketDebuggerUrl);
    await new Promise((r) => (ws.onopen = r));

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
    const pageTarget = targets.targetInfos.find((t) => t.type === 'page');
    const { sessionId } = await send('Target.attachToTarget', {
      targetId: pageTarget.targetId,
      flatten: true
    });

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
      console.log(`✓ Saved: public/assets/images/${fileName}`);
    }

    await sleep(2000);

    // 1. Smoke test: Idle state
    await capture('verified_smoke_idle_opaque.png');

    // 2. Smoke test: Continuous movement with tracking wake
    await sendPage('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: 350,
      y: 400
    });
    await sleep(50);
    for (let x = 350; x <= 850; x += 30) {
      await sendPage('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: x,
        y: 400 + Math.sin((x - 350) * 0.02) * 50
      });
      await sleep(25);
    }
    await sleep(40);
    await capture('verified_smoke_tracking_movement.png');

    // 3. Operational Sequence: Stage 1 - Approaching from Platform
    await sendPage('Runtime.evaluate', {
      expression: 'document.querySelector("#platform")?.scrollIntoView({ behavior: "instant" });'
    });
    await sleep(600);
    await capture('verified_stage1_platform_approach.png');

    // Stage 2 - Section introduction fully visible with clear header safe-area
    await sendPage('Runtime.evaluate', {
      expression: 'document.querySelector("#chapters")?.scrollIntoView({ behavior: "instant" });'
    });
    await sleep(800);
    await capture('verified_stage2_intro_fully_visible.png');

    // Stage 3 - Chapter I active
    await sendPage('Runtime.evaluate', {
      expression: `
        (() => {
          const pills = document.querySelectorAll('.chapter-step-pill');
          pills[0]?.click();
        })()
      `
    });
    await sleep(400);
    await capture('verified_stage3_chapter_I_active.png');

    // Stage 4 - Chapter II active
    await sendPage('Runtime.evaluate', {
      expression: `
        (() => {
          const pills = document.querySelectorAll('.chapter-step-pill');
          pills[1]?.click();
        })()
      `
    });
    await sleep(400);
    await capture('verified_stage4_chapter_II_active.png');

    // Stage 5 - Chapter III active
    await sendPage('Runtime.evaluate', {
      expression: `
        (() => {
          const pills = document.querySelectorAll('.chapter-step-pill');
          pills[2]?.click();
        })()
      `
    });
    await sleep(400);
    await capture('verified_stage5_chapter_III_active.png');

    // Stage 6 - Chapter IV active
    await sendPage('Runtime.evaluate', {
      expression: `
        (() => {
          const pills = document.querySelectorAll('.chapter-step-pill');
          pills[3]?.click();
        })()
      `
    });
    await sleep(400);
    await capture('verified_stage6_chapter_IV_active.png');

    // Stage 7 - Clean Section Exit into Download
    await sendPage('Runtime.evaluate', {
      expression: 'document.querySelector("#download")?.scrollIntoView({ behavior: "instant" });'
    });
    await sleep(600);
    await capture('verified_stage7_section_exit_download.png');

    // 4. Mobile Responsive test (475x800)
    await sendPage('Emulation.setDeviceMetricsOverride', {
      width: 475,
      height: 800,
      deviceScaleFactor: 2,
      mobile: true
    });
    await sleep(500);

    await sendPage('Runtime.evaluate', {
      expression: 'document.querySelector("#chapters")?.scrollIntoView({ behavior: "instant" });'
    });
    await sleep(600);
    await capture('verified_mobile_chapters_stage.png');

    console.log('✓ All verification stages captured successfully!');
    ws.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    chromeProcess.kill();
  }
}

run();

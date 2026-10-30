import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9222;

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runAudit() {
  console.log('=== COMMENCING VISUAL CORRECTION & GHOSTCURSOR AUDIT ===');

  const chromeProcess = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900',
    '--user-data-dir=C:\\temp\\chrome-audit-ghostcursor',
    'http://localhost:5173/'
  ]);

  await sleep(2200);

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
      console.log(`✓ Screenshot captured: public/assets/images/${fileName}`);
    }

    await sleep(1500);

    // 1. Audit Header & Hero initial opaque state
    console.log('\n[Audit 1] Verifying Header navigation and initial 100% opaque smoke veil...');
    await capture('audit_1_header_and_hero_initial.png');

    // 2. Audit GhostCursor fluid disturbance & reveal
    console.log('\n[Audit 2] Swiping cursor to activate React Bits GhostCursor curl disturbance...');
    for (let i = 0; i < 10; i++) {
      await sendPage('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: 200 + i * 25,
        y: 400 + Math.sin(i * 0.5) * 40
      });
      await sleep(35);
    }
    await sleep(400);
    await capture('audit_2_ghostcursor_fluid_reveal.png');

    // 3. Move cursor away & verify smooth reseal
    console.log('\n[Audit 3] Leaving viewport, verifying smooth smoke reseal...');
    await sendPage('Runtime.evaluate', {
      expression: 'window.dispatchEvent(new PointerEvent("pointerleave"));'
    });
    await sleep(1500);
    await capture('audit_3_smoke_resealed_opaque.png');

    // 4. Audit Operational Chapters Section layout alignment
    console.log('\n[Audit 4] Scrolling to Operational Chapters (#chapters)...');
    await sendPage('Runtime.evaluate', {
      expression: 'document.querySelector("#chapters")?.scrollIntoView({ behavior: "instant" });'
    });
    await sleep(1000);
    await capture('audit_4_chapters_aligned_dark.png');

    // 5. Audit Final App Download Section & Phone Mockup composition
    console.log('\n[Audit 5] Scrolling to Final App Download Section (#download)...');
    await sendPage('Runtime.evaluate', {
      expression: 'document.querySelector("#download")?.scrollIntoView({ behavior: "instant" });'
    });
    await sleep(800);
    await capture('audit_5_download_phone_mockup_balanced.png');

    // 6. Audit Mobile Viewport (iPhone 14: 390x844)
    console.log('\n[Audit 6] Emulating Mobile Viewport (390x844)...');
    await sendPage('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await sendPage('Runtime.evaluate', {
      expression: 'window.scrollTo(0, 0);'
    });
    await sleep(600);
    await capture('audit_6_mobile_hero.png');

    // Mobile Chapters
    await sendPage('Runtime.evaluate', {
      expression: 'document.querySelector("#chapters")?.scrollIntoView({ behavior: "instant" });'
    });
    await sleep(700);
    await capture('audit_7_mobile_chapters.png');

    // Mobile Download
    await sendPage('Runtime.evaluate', {
      expression: 'document.querySelector("#download")?.scrollIntoView({ behavior: "instant" });'
    });
    await sleep(700);
    await capture('audit_8_mobile_download.png');

    console.log('\n=== AUDIT SUITE COMPLETED SUCCESSFULLY ===');
    ws.close();
  } catch (err) {
    console.error('Error during audit:', err);
  } finally {
    chromeProcess.kill();
  }
}

runAudit();

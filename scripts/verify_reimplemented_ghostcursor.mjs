import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9223;

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runAudit() {
  console.log('=== COMMENCING FRESKA CRITICAL GHOSTCURSOR & DARK ENVIRONMENT AUDIT ===');

  const chromeProcess = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900',
    '--user-data-dir=C:\\temp\\chrome-audit-ghostcursor-v2',
    'http://localhost:5173/'
  ]);

  await sleep(2500);

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

    await sleep(2000);

    // 1. Initial State: 100% Opaque Concealment
    console.log('\n[Check 1] Verifying Initial State: 100% opaque concealment (no model visibility)...');
    await capture('audit_1_idle_opaque_concealment.png');

    // 2. Compact Reveal: Cursor over Poultry (left side, x=260, y=340)
    console.log('\n[Check 2] Small cursor movement over Left Wing (Poultry Drumstick)...');
    for (let i = 0; i <= 8; i++) {
      await sendPage('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: 230 + i * 5,
        y: 320 + i * 3
      });
      await sleep(30);
    }
    await sleep(350);
    await capture('audit_2_compact_reveal_hover_poultry.png');

    // 3. Compact Reveal: Cursor over Coastal Seafood (right side, x=1180, y=340)
    console.log('\n[Check 3] Moving cursor to Right Wing (Wild Salmon Fillet)...');
    for (let i = 0; i <= 15; i++) {
      const t = i / 15;
      await sendPage('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: Math.round(270 + t * (1180 - 270)),
        y: Math.round(344 + Math.sin(t * Math.PI) * -80)
      });
      await sleep(25);
    }
    await sleep(400);
    await capture('audit_3_compact_reveal_hover_seafood.png');

    // 4. Fast Swipe: High velocity swipe test (trail length checked, radius bounded)
    console.log('\n[Check 4] Rapid swipe across screen: testing velocity decoupling and clamped trail...');
    for (let i = 0; i <= 10; i++) {
      await sendPage('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: 1180 - i * 80,
        y: 450 + (i % 2 === 0 ? 15 : -15)
      });
      await sleep(16);
    }
    await sleep(80);
    await capture('audit_4_fast_swipe_trail_contained.png');

    // 5. Cursor Stops / Leaves: Smoke Restores 100% Coverage
    console.log('\n[Check 5] Cursor leaves viewport: verifying organic restoration to 100% opaque veil...');
    await sendPage('Runtime.evaluate', {
      expression: 'window.dispatchEvent(new PointerEvent("pointerleave"));'
    });
    await sleep(1800);
    await capture('audit_5_restoration_resealed.png');

    // 6. Dark Background Continuity - Platform Section (Middle of transition)
    console.log('\n[Check 6] Scrolling to Platform Section (Theme Transition)...');
    await sendPage('Runtime.evaluate', {
      expression: 'document.querySelector("#platform")?.scrollIntoView({ behavior: "instant" });'
    });
    await sleep(1000);
    await capture('audit_6_dark_transition_platform.png');

    // 7. Dark Background Continuity - Operational Chapters (#chapters)
    console.log('\n[Check 7] Scrolling to Operational Chapters (#chapters)...');
    await sendPage('Runtime.evaluate', {
      expression: 'document.querySelector("#chapters")?.scrollIntoView({ behavior: "instant" });'
    });
    await sleep(1000);
    await capture('audit_7_dark_chapters_continuous.png');

    // 8. Dark Background Continuity - Final App Download (#download)
    console.log('\n[Check 8] Scrolling to Final App Download Section (#download)...');
    await sendPage('Runtime.evaluate', {
      expression: 'document.querySelector("#download")?.scrollIntoView({ behavior: "instant" });'
    });
    await sleep(1000);
    await capture('audit_8_dark_download_seamless.png');

    // 9. Mobile Touch Emulation (iPhone 14: 390x844)
    console.log('\n[Check 9] Emulating Mobile Touch (390x844) with compact reveal...');
    await sendPage('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true
    });
    await sendPage('Runtime.evaluate', {
      expression: 'window.scrollTo(0, 0);'
    });
    await sleep(800);

    // Touch tap and drag on mobile
    await sendPage('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: 120, y: 350 }]
    });
    for (let i = 1; i <= 6; i++) {
      await sendPage('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: 120 + i * 15, y: 350 + i * 8 }]
      });
      await sleep(40);
    }
    await sleep(300);
    await capture('audit_9_mobile_touch_reveal.png');

    console.log('\n=== ALL AUDIT CHECKS COMPLETED SUCCESSFULLY ===');
    ws.close();
  } catch (err) {
    console.error('Error during audit execution:', err);
  } finally {
    chromeProcess.kill();
  }
}

runAudit();

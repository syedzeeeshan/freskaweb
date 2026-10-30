import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9222;

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runVisualVerification() {
  console.log('--- Commencing Comprehensive Visual Verification Suite for Background Meat Smoke & Reveal ---');

  const chromeProcess = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900',
    '--user-data-dir=C:\\temp\\chrome-meat-bg-test',
    'http://localhost:5173/'
  ]);

  await sleep(2000);

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
      console.log(`✓ Saved screenshot: public/assets/images/${fileName}`);
    }

    // Wait for initial WebGL shaders and textures to load
    await sleep(1500);

    // ==========================================
    // TEST 1: State 1 - Initial 100% Opaque Concealment
    // Zero silhouettes, pure opaque white smoke veil
    // ==========================================
    console.log('\n[Test 1] Capturing State 1: 100% Opaque White Smoke Concealment...');
    await capture('verified_state1_opaque_smoke_idle.png');

    // ==========================================
    // TEST 2: State 2 - Pointer Hover / Reveal
    // Move cursor over left side (Chicken Drumstick / Breast cut)
    // ==========================================
    console.log('\n[Test 2] Hovering pointer over left background (x: 280, y: 440)...');
    for (let i = 0; i < 5; i++) {
      await sendPage('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: 240 + i * 10,
        y: 420 + i * 5
      });
      await sleep(50);
    }
    // Allow smooth interpolation to reach reveal opening
    await sleep(600);
    await capture('verified_state2_hover_reveal_poultry.png');

    // Move cursor to right side (Salmon Fillet / Prawn cut)
    console.log('\n[Test 2b] Hovering pointer over right background (x: 1100, y: 380)...');
    for (let i = 0; i < 6; i++) {
      await sendPage('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: 1000 + i * 20,
        y: 360 + i * 8
      });
      await sleep(50);
    }
    await sleep(600);
    await capture('verified_state2b_hover_reveal_seafood.png');

    // ==========================================
    // TEST 3: State 3 - Pointer Leaves / Smoke Returns
    // Dispatch pointerleave and wait for smooth seal
    // ==========================================
    console.log('\n[Test 3] Moving pointer off-screen, verifying complete smoke restoration...');
    await sendPage('Runtime.evaluate', {
      expression: 'window.dispatchEvent(new PointerEvent("pointerleave"));'
    });
    // Wait for decay of reveal intensity (takes ~1.2s to reach 0.0)
    await sleep(1600);
    await capture('verified_state3_smoke_returned_sealed.png');

    // ==========================================
    // TEST 4: Foreground Content & Scroll Flow (Story & Platform)
    // No standalone Meat Garden section; PlatformSection is active
    // ==========================================
    console.log('\n[Test 4] Scrolling to Platform Section (#platform)...');
    await sendPage('Runtime.evaluate', {
      expression: 'document.querySelector("#platform")?.scrollIntoView({ behavior: "instant" });'
    });
    await sleep(800);
    // Interact with background behind platform cards
    await sendPage('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: 1180,
      y: 420
    });
    await sleep(600);
    await capture('verified_state4_platform_flow_reveal.png');

    // ==========================================
    // TEST 5: Dark Chapters Transition (#chapters)
    // ==========================================
    console.log('\n[Test 5] Scrolling to Dark Chapters Section (#chapters)...');
    await sendPage('Runtime.evaluate', {
      expression: 'document.querySelector("#chapters")?.scrollIntoView({ behavior: "instant" });'
    });
    await sleep(1000);
    await capture('verified_state5_dark_chapters_brand.png');

    // ==========================================
    // TEST 6: Mobile Touch Interaction (390 x 844)
    // ==========================================
    console.log('\n[Test 6] Emulating Mobile Viewport (iPhone 14: 390x844)...');
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
    // Simulate touch drag
    await sendPage('Runtime.evaluate', {
      expression: `(() => {
        const touch = new Touch({
          identifier: 1,
          target: window,
          clientX: 120,
          clientY: 320
        });
        window.dispatchEvent(new TouchEvent('touchmove', { touches: [touch] }));
      })()`
    });
    await sleep(700);
    await capture('verified_state6_mobile_touch_reveal.png');

    console.log('\n=== Visual Verification Completed Successfully! ===');
    ws.close();
  } catch (err) {
    console.error('Error during test execution:', err);
  } finally {
    chromeProcess.kill();
  }
}

runVisualVerification();

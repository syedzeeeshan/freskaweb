import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9224;

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function diagnose() {
  console.log('=== DIAGNOSING CHAPTERS SCROLL & ALIGNMENT ===');

  const chromeProcess = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900',
    '--user-data-dir=C:\\temp\\chrome-diagnose-chapters',
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
      console.log(`✓ Screenshot captured: ${fileName}`);
    }

    async function inspectMetrics(label) {
      const { result } = await sendPage('Runtime.evaluate', {
        expression: `
          (() => {
            const header = document.querySelector('.site-header')?.getBoundingClientRect();
            const chaptersSec = document.querySelector('#chapters')?.getBoundingClientRect();
            const headerBox = document.querySelector('.chapter-header-box')?.getBoundingClientRect();
            const title = document.querySelector('.chapter-main-title')?.getBoundingClientRect();
            const subhead = document.querySelector('.chapter-main-subhead')?.getBoundingClientRect();
            const stage = document.querySelector('.chapter-stage')?.getBoundingClientRect();
            const activeCard = document.querySelector('.chapter-card.is-active')?.getBoundingClientRect();
            const footer = document.querySelector('.chapter-footer-bar')?.getBoundingClientRect();
            return {
              scrollY: window.scrollY,
              headerBottom: header?.bottom,
              chaptersSecTop: chaptersSec?.top,
              chaptersSecHeight: chaptersSec?.height,
              headerBoxTop: headerBox?.top,
              headerBoxBottom: headerBox?.bottom,
              titleTop: title?.top,
              subheadBottom: subhead?.bottom,
              stageTop: stage?.top,
              activeCardTop: activeCard?.top,
              activeCardHeight: activeCard?.height,
              footerTop: footer?.top,
              headerOverlap: (headerBox && header) ? (headerBox.top < header.bottom) : false,
              headerBoxStyles: window.getComputedStyle(document.querySelector('.chapter-header-box')).transform
            };
          })()
        `,
        returnByValue: true
      });
      console.log(`\n--- Metric [${label}] ---`);
      console.log(JSON.stringify(result.value, null, 2));
    }

    await sleep(2000);

    // Initial load
    await inspectMetrics('Initial Page Load');

    // Scroll down to Platform
    console.log('Scrolling to Platform...');
    await sendPage('Runtime.evaluate', {
      expression: 'document.querySelector("#platform")?.scrollIntoView({ behavior: "instant" });'
    });
    await sleep(800);
    await inspectMetrics('At Platform Section');

    // Now scroll down by 100px increments towards and through #chapters
    for (let step = 1; step <= 15; step++) {
      await sendPage('Runtime.evaluate', {
        expression: 'window.scrollBy(0, 150);'
      });
      await sleep(300);
      await inspectMetrics(`Scroll Step ${step} (+${step * 150}px)`);
      if (step === 3 || step === 6 || step === 9 || step === 12) {
        await capture(`diag_step_${step}.png`);
      }
    }

    ws.close();
  } catch (err) {
    console.error('Diagnostic error:', err);
  } finally {
    chromeProcess.kill();
  }
}

diagnose();

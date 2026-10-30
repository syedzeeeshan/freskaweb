import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9225;

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function diagnoseFull() {
  const chromeProcess = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900',
    '--user-data-dir=C:\\temp\\chrome-diagnose-full',
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

    await sleep(2000);

    // Scroll to chapters
    await sendPage('Runtime.evaluate', {
      expression: 'document.querySelector("#chapters")?.scrollIntoView({ behavior: "instant" });'
    });
    await sleep(800);

    // Capture at scroll positions through chapters progression and exit
    for (let i = 0; i <= 10; i++) {
      const { result } = await sendPage('Runtime.evaluate', {
        expression: `
          (() => {
            const header = document.querySelector('.site-header')?.getBoundingClientRect();
            const headerBox = document.querySelector('.chapter-header-box')?.getBoundingClientRect();
            const activeCard = document.querySelector('.chapter-card.is-active')?.getBoundingClientRect();
            const activeIdx = document.querySelector('.chapter-card.is-active')?.getAttribute('data-chapter-index');
            const sec = document.querySelector('#chapters')?.getBoundingClientRect();
            return {
              i: ${i},
              scrollY: window.scrollY,
              activeIdx,
              secTop: sec?.top,
              headerBoxTop: headerBox?.top,
              headerBoxBottom: headerBox?.bottom,
              activeCardTop: activeCard?.top,
              overlapWithHeader: (headerBox && header) ? (headerBox.top < header.bottom) : false,
              headerBottom: header?.bottom
            };
          })()
        `,
        returnByValue: true
      });
      console.log(result.value);
      await capture(`scroll_diag_${i}.png`);
      await sendPage('Runtime.evaluate', { expression: 'window.scrollBy(0, 250);' });
      await sleep(350);
    }

    ws.close();
  } catch (err) {
    console.error('Diagnostic error:', err);
  } finally {
    chromeProcess.kill();
  }
}

diagnoseFull();

import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const url = process.argv[2] || 'http://localhost:5173/';
const outputFile = process.argv[3] || 'screenshot.png';
const actionType = process.argv[4] || null; // 'scroll:#target' or 'click:.selector'
const actionTarget = process.argv[5] || null;

async function run() {
  const port = 9222 + Math.floor(Math.random() * 100);
  const chromeProcess = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900',
    `--user-data-dir=C:\\temp\\chrome-test-p-${port}`,
    url
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const res = await fetch(`http://localhost:${port}/json/version`);
    const data = await res.json();
    const wsUrl = data.webSocketDebuggerUrl;

    const ws = new WebSocket(wsUrl);
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

    await new Promise(r => setTimeout(r, 1200));

    if (actionType === 'scroll' && actionTarget) {
      await sendPage('Runtime.evaluate', {
        expression: `
          const el = document.querySelector('${actionTarget}');
          if (el) el.scrollIntoView({ behavior: 'instant' });
        `
      });
      await new Promise(r => setTimeout(r, 800));
    } else if (actionType === 'click' && actionTarget) {
      await sendPage('Runtime.evaluate', {
        expression: `
          const el = document.querySelector('${actionTarget}');
          if (el) el.click();
        `
      });
      await new Promise(r => setTimeout(r, 600));
    }

    const { data: b64 } = await sendPage('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outputFile, Buffer.from(b64, 'base64'));
    console.log(`Saved screenshot to ${outputFile} (${Math.round(b64.length * 3 / 4 / 1024)} KB)`);

    ws.close();
  } catch (err) {
    console.error('Capture error:', err);
  } finally {
    chromeProcess.kill();
  }
}

run();

// Revisión local opcional: node preview.mjs (requiere Chrome y Node con WebSocket).
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import net from 'node:net';
const delay = ms => new Promise(r => setTimeout(r, ms));
const availablePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
const port = await availablePort();
const debugPort = await availablePort();
const server = spawn('python', ['server.py'], { env: {...process.env, HOST:'127.0.0.1', PORT:String(port), HEALTH_CHECK_ENABLED:'false'}, windowsHide:true, stdio:'ignore' });
const browser = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${debugPort}`, `--user-data-dir=${resolve('.preview-browser/cdp')}`, 'about:blank'], {windowsHide:true, stdio:'ignore'});
let socket;
try {
  let pages;
  for (let i=0;i<50;i++) { try { pages=await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json(); break; } catch { await delay(100); } }
  if (!pages) throw new Error('Chrome no inició');
  socket = new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
  await new Promise(r=>socket.addEventListener('open',r,{once:true}));
  let id=0; const pending=new Map();
  socket.addEventListener('message', e=> { const data=JSON.parse(e.data); if(pending.has(data.id)){const {ok,bad}=pending.get(data.id);pending.delete(data.id);data.error?bad(data.error):ok(data.result);} });
  const send=(method,params={})=>new Promise((ok,bad)=>{pending.set(++id,{ok,bad});socket.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression => { const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true}); if(result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));return result.result.value; };
  await send('Page.enable');
  await send('Page.navigate',{url:`http://127.0.0.1:${port}`});
  for(let i=0;i<50;i++){if(await evaluate('document.querySelectorAll(".card").length === 4'))break;await delay(100);}
  const results=[];
  for(const [name,width,height] of [['desktop',1440,1000],['notebook',1024,900],['tablet',768,1024],['mobile',390,844],['small',320,800]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await delay(350);
    const metrics=await evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth,columns:getComputedStyle(document.querySelector(".grid")).gridTemplateColumns.split(" ").length})');
    if(metrics.scroll>width)throw new Error(`Desborde ${name}: ${JSON.stringify(metrics)}`);
    const capture=await send('Page.captureScreenshot',{captureBeyondViewport:true,format:'png'});
    await writeFile(`preview-${name}.png`,Buffer.from(capture.data,'base64'));
    results.push({name,...metrics});
  }
  const links=await evaluate('Array.from(document.querySelectorAll(".enter"),a=>({url:a.href,target:a.target,rel:a.rel}))');
  const systems=JSON.parse(await readFile('sistemas.json','utf8'));
  if(links.some((l,i)=>l.url!==systems[i].url||l.target!=='_blank'||!l.rel.includes('noopener')))throw new Error('Enlaces alterados');
  const searchCount=await evaluate('document.querySelector("#search").value="laboratorio";document.querySelector("#search").dispatchEvent(new Event("input"));document.querySelectorAll(".card").length');
  if(searchCount!==1)throw new Error('Búsqueda fallida');
  const categoryCount=await evaluate('document.querySelector("#search").value="";document.querySelector("#search").dispatchEvent(new Event("input"));Array.from(document.querySelectorAll(".filter")).find(b=>b.textContent==="Reportes").click();document.querySelectorAll(".card").length');
  if(categoryCount!==1)throw new Error('Filtro fallido');
  console.log(JSON.stringify({viewports:results,linksVerified:links.length,search:'OK',categories:'OK'},null,2));
  await send('Browser.close');
} finally { socket?.close(); browser.kill(); server.kill(); }

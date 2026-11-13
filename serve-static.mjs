import{createServer}from'node:http';import{readFile,stat}from'node:fs/promises';import{extname,join,normalize}from'node:path';
const P=+process.env.PORT||4321,R=new URL('./dist/',import.meta.url).pathname;
const T={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.xml':'application/xml','.txt':'text/plain','.woff2':'font/woff2'};
async function f(p){try{const s=await stat(p);if(s.isFile())return p;if(s.isDirectory()){const i=join(p,'index.html');if((await stat(i)).isFile())return i}}catch{}return null}
createServer(async(q,r)=>{let u=decodeURIComponent((q.url||'/').split('?')[0])||'/';
let x=await f(join(R,normalize(u)));if(!x)x=await f(join(R,u.replace(/\/$/,'')+'.html'));let c=200;
if(!x){x=await f(join(R,'404.html'));c=404}if(!x){r.writeHead(404);return r.end('404')}
r.writeHead(c,{'content-type':T[extname(x)]||'application/octet-stream','cache-control':'no-cache'});r.end(await readFile(x))}).listen(P,'0.0.0.0',()=>console.log('Serving '+P));

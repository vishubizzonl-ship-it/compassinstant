#!/data/data/com.termux/files/usr/bin/bash
# compassinstant — ek baar chalao, phir kabhi command nahi.
#
#   bash start.sh              = site chalu + har 1 second GitHub check
#   bash start.sh stop         = band
#   bash start.sh status       = chal rahi hai?
#
# GitHub par naya commit aaya -> 1 second me pull + build + site update.
# Aapko Termux me kuch chalane ki zarurat nahi.
cd "$(dirname "$0")" || exit 1
SELF="$(pwd)/$(basename "$0")"
RUN=.run
LOG=$RUN/logs/site.log
PORT=${PORT:-4321}
POLL=${POLL:-1}          # har kitne second me GitHub check (default 1)
mkdir -p $RUN/logs

ok(){   printf '\033[32m==>\033[0m %s\n' "$*"; }
no(){   printf '\033[31mXX\033[0m %s\n' "$*"; }
warn(){ printf '\033[33m!!\033[0m %s\n' "$*"; }
alive(){ [ -f "$1" ] && kill -0 "$(cat "$1")" 2>/dev/null; }
up(){ curl -fsS -o /dev/null --max-time 3 "http://127.0.0.1:$PORT/" 2>/dev/null; }

# --------------------------------------------------------------- node
NODE=""
for c in "$HOME/node22/bin/node" "$PREFIX/bin/node" "$(command -v node)"; do
  [ -n "$c" ] && [ -f "$c" ] || continue
  [ -x "$c" ] || chmod +x "$c" 2>/dev/null
  [ -x "$c" ] || continue
  case "$("$c" -v 2>/dev/null)" in v2[2-9]*|v[3-9][0-9]*) NODE=$c; break;; esac
done
[ -n "$NODE" ] || { no "Node v22+ nahi mila. Chalaye: pkg install nodejs-lts"; exit 1; }
export PATH="$(cd "$(dirname "$NODE")" && pwd):$PATH"
NPM="$(command -v npm)"

# --------------------------------------------------- boot par auto-start
boot_install(){
  mkdir -p "$HOME/.termux/boot" 2>/dev/null || return 0
  cat > "$HOME/.termux/boot/compass.sh" <<BOOT
#!/data/data/com.termux/files/usr/bin/sh
termux-wake-lock 2>/dev/null
sleep 8
cd "$HOME/compassinstant" 2>/dev/null && bash start.sh
BOOT
  chmod +x "$HOME/.termux/boot/compass.sh" 2>/dev/null
}

# ------------------------------------------------------------ rebuild
rebuild(){
  [ -f .navfix.sh ] && bash .navfix.sh src/components/Nav.astro >/dev/null 2>/dev/null
  [ -x node_modules/.bin/astro ] || "$NPM" install --no-audit --no-fund >>$LOG 2>&1
  if "$NPM" run build >>$LOG 2>&1; then
    alive $RUN/server.pid && kill "$(cat $RUN/server.pid)" 2>/dev/null
    # Purana server port chhod de tab tak wait karo, warna naya EADDRINUSE se mar jata hai
    for i in $(seq 40); do up || break; sleep 0.25; done
    for try in 1 2 3; do
      PORT=$PORT nohup "$NODE" serve-static.mjs >>$LOG 2>&1 &
      echo $! > $RUN/server.pid
      up && break
      sleep 1
    done
    if up; then
      ok "Site update ho gayi  $(date '+%H:%M:%S')  ($(git rev-parse --short HEAD 2>/dev/null))"
    else
      warn "Server start nahi hua — log: $LOG"
    fi
    return 0
  fi
  warn "Build fail — purani site chalu hai  $(date '+%H:%M:%S')"
  return 1
}

case "${1:-}" in
  stop)
    touch $RUN/stop
    alive $RUN/watch.pid  && kill "$(cat $RUN/watch.pid)"  2>/dev/null
    alive $RUN/server.pid && kill "$(cat $RUN/server.pid)" 2>/dev/null
    rm -f $RUN/*.pid $RUN/stop
    ok "Band ho gaya."; exit 0;;
  status)
    up && ok "Chal rahi hai: http://localhost:$PORT/" || no "Band hai."; exit 0;;
  __watch)
    # pehle jo commit chal raha hai
    CUR=$(git rev-parse HEAD 2>/dev/null)
    while [ ! -f $RUN/stop ]; do
      sleep "$POLL"
      [ -d .git ] || continue
      R=$(GIT_TERMINAL_PROMPT=0 git ls-remote origin refs/heads/main 2>/dev/null | cut -f1)
      [ -z "$R" ] && continue                 # net nahi — chup-chaap dobara
      [ "$R" = "$CUR" ] && continue           # kuch naya nahi
      GIT_TERMINAL_PROMPT=0 git fetch -q origin main 2>/dev/null || continue
      git reset --hard -q FETCH_HEAD 2>/dev/null || continue
      CUR=$R
      rebuild
    done; exit 0;;
esac

ok "Node $("$NODE" -v)"
boot_install

if up; then
  if ! alive $RUN/watch.pid; then
    rm -f $RUN/stop
    nohup bash "$SELF" __watch >>$RUN/logs/watch.log 2>&1 & echo $! >$RUN/watch.pid
    ok "Auto-update phir se ON"
  fi
  ok "Pehle se chal rahi hai: http://localhost:$PORT/"
  exit 0
fi

# ---------------------------------------------------------- latest code
if [ -d .git ]; then
  ok "GitHub se latest code la raha hoon…"
  if GIT_TERMINAL_PROMPT=0 git fetch -q origin main && git reset --hard -q FETCH_HEAD; then
    ok "Code $(git rev-parse --short HEAD)"
  else
    warn "GitHub connect nahi hua — jo code hai usse chala raha hoon"
  fi
fi

# -------------------------------------------------------- dependencies
if [ ! -x node_modules/.bin/astro ]; then
  ok "Dependencies install (pehli baar, 1-3 min)…"
  "$NPM" install --no-audit --no-fund >>$LOG 2>&1
  if [ ! -x node_modules/.bin/astro ]; then
    warn "Install adhura — saaf karke dobara…"
    rm -rf node_modules
    "$NPM" install --no-audit --no-fund >>$LOG 2>&1
  fi
  [ -x node_modules/.bin/astro ] || {
    no "Install fail. Jagah:"; df -h . | tail -1; no "Log: $LOG"; exit 1; }
fi

# ------------------------------------------------- server file (agar na ho)
if [ ! -f serve-static.mjs ]; then
  cat > serve-static.mjs <<'SRV'
import{createServer}from'node:http';import{readFile,stat}from'node:fs/promises';import{extname,join,normalize}from'node:path';
const P=+process.env.PORT||4321,R=new URL('./dist/',import.meta.url).pathname;
const T={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.xml':'application/xml','.txt':'text/plain','.woff2':'font/woff2'};
async function f(p){try{const s=await stat(p);if(s.isFile())return p;if(s.isDirectory()){const i=join(p,'index.html');if((await stat(i)).isFile())return i}}catch{}return null}
createServer(async(q,r)=>{let u=decodeURIComponent((q.url||'/').split('?')[0]).replace(/^\/onlinecompass(?=\/|$)/,'')||'/';
let x=await f(join(R,normalize(u)));if(!x)x=await f(join(R,u.replace(/\/$/,'')+'.html'));let c=200;
if(!x){x=await f(join(R,'404.html'));c=404}if(!x){r.writeHead(404);return r.end('404')}
r.writeHead(c,{'content-type':T[extname(x)]||'application/octet-stream','cache-control':'no-cache'});r.end(await readFile(x))}).listen(P,'0.0.0.0',()=>console.log('Serving '+P));
SRV
fi

# --------------------------------------------------------------- build
[ -f .navfix.sh ] && bash .navfix.sh src/components/Nav.astro >/dev/null 2>/dev/null
ok "Build ho raha hai…"
if ! "$NPM" run build >>$LOG 2>&1; then
  warn "Build fail — log: $LOG"
  [ -f dist/index.html ] || { tail -n 20 $LOG; exit 1; }
  warn "Purana build serve kar raha hoon."
fi

# --------------------------------------------------------------- serve
alive $RUN/server.pid && kill "$(cat $RUN/server.pid)" 2>/dev/null
command -v pkill >/dev/null && pkill -f serve-static.mjs 2>/dev/null
for i in $(seq 40); do up || break; sleep 0.25; done
for try in 1 2 3; do
  PORT=$PORT nohup "$NODE" serve-static.mjs >>$LOG 2>&1 & echo $! >$RUN/server.pid
  up && break
  sleep 1
done
up || { tail -n 20 $LOG; no "Server start nahi hua"; exit 1; }

command -v termux-wake-lock >/dev/null && termux-wake-lock 2>/dev/null
rm -f $RUN/stop

if alive $RUN/watch.pid; then
  p=$(cat $RUN/watch.pid); [ "$p" != "$$" ] && kill "$p" 2>/dev/null
fi
nohup bash "$SELF" __watch >>$RUN/logs/watch.log 2>&1 & echo $! >$RUN/watch.pid

echo
ok "TAIYAR  →  http://localhost:$PORT/"
ok "Har $POLL second GitHub check — naya commit aaya to khud update"
echo
echo "Ab Termux band kar sakte hain. Aage koi command nahi."
echo "Band karna ho to: bash start.sh stop"

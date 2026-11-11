#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# autostart.sh — "kuch mat karo" mode.
#
# Har baar Termux khologe, yeh khud chalega (setup-once.sh ne ~/.bashrc me
# hook laga diya hota hai) aur:
#   1. auto-pull loop chalu karega (har 1 second)
#   2. dev server chalu karega agar band hai
#   3. termux-wake-lock laga ke background me zinda rakhega
#
# Aapko kuch nahi karna — bas Termux kholo aur browser me site dekho.
# ---------------------------------------------------------------------------
set -u
cd "$(dirname "$0")" || exit 1

PORT="${PORT:-4321}"
URL="http://localhost:$PORT/onlinecompass"

# ---- 1. auto-pull ---------------------------------------------------------
bash autopull.sh >/dev/null 2>&1 || true

# ---- 2. server zinda hai? -------------------------------------------------
server_up() {
  curl -s -o /dev/null --max-time 2 "$URL" 2>/dev/null && return 0
  (echo >"/dev/tcp/127.0.0.1/$PORT") >/dev/null 2>&1 && return 0
  return 1
}

if server_up; then
  echo "-> server pehle se chal raha hai: $URL"
  exit 0
fi

# ---- 3. node version ------------------------------------------------------
NODE_VER="$(node -v 2>/dev/null | sed 's/^v//')"
if [ -z "$NODE_VER" ]; then
  echo "!! Node.js nahi mila — chalayein: pkg install nodejs -y"
  exit 1
fi
MAJOR="${NODE_VER%%.*}"; REST="${NODE_VER#*.}"; MINOR="${REST%%.*}"
if [ "$MAJOR" -lt 22 ] || { [ "$MAJOR" -eq 22 ] && [ "$MINOR" -lt 23 ]; }; then
  echo "!! Node $NODE_VER purana hai (chahiye >= 22.23.4) — pkg upgrade -y && pkg install nodejs -y"
  exit 1
fi

# ---- 4. deps --------------------------------------------------------------
if [ ! -d node_modules ]; then
  echo "-> npm install (pehli baar, 2-5 min)"
  npm install --no-audit --no-fund || { echo "!! npm install fail"; exit 1; }
fi

# ---- 5. background me chalao ---------------------------------------------
command -v termux-wake-lock >/dev/null 2>&1 && termux-wake-lock 2>/dev/null

nohup npx astro dev --host 0.0.0.0 --port "$PORT" --strictPort \
  >".dev-server.log" 2>&1 &

echo "-> dev server start ho raha hai (log: .dev-server.log)"
sleep 6
if server_up; then
  echo "-> ready: $URL"
else
  echo "!! server start nahi hua — dekhein: tail -20 .dev-server.log"
fi

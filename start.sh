#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# start.sh — Termux ke liye "ek baar chalao, phir bhool jao" script.
#
#   bash start.sh
#
# Yeh kya karta hai:
#   1. zarurat ho to npm install
#   2. background me har 1 second GitHub se auto-pull (git pull --ff-only)
#   3. Astro dev server start (0.0.0.0:4321) — file change pe khud reload hota hai
#
# Band karna:  Ctrl+C   (auto-pull bhi saath band ho jata hai)
#              ya:  bash start.sh stop
# ---------------------------------------------------------------------------
set -u

cd "$(dirname "$0")"
BRANCH="main"
PORT="${PORT:-4321}"
PULL_LOG=".autopull.log"
PULL_PID=".autopull.pid"

# ---------- stop ----------
if [ "${1:-}" = "stop" ]; then
  if [ -f "$PULL_PID" ]; then
    kill "$(cat "$PULL_PID")" 2>/dev/null && echo "-> auto-pull band"
    rm -f "$PULL_PID"
  fi
  pkill -f "astro dev" 2>/dev/null && echo "-> dev server band"
  echo "done."
  exit 0
fi

# ---------- pehle se chal raha? ----------
if [ -f "$PULL_PID" ] && kill -0 "$(cat "$PULL_PID")" 2>/dev/null; then
  echo "-> auto-pull pehle se chal raha hai (pid $(cat "$PULL_PID"))"
else
  echo "-> auto-pull loop start (har 1 second)"
  (
    while true; do
      # local changes hain to pull skip (unhe overwrite nahi karna)
      if [ -z "$(git status --porcelain --untracked-files=no 2>/dev/null)" ]; then
        git pull --ff-only --quiet origin "$BRANCH" >/dev/null 2>>"$PULL_LOG"
      else
        echo "[$(date +%H:%M:%S)] local changes — pull skipped" >>"$PULL_LOG"
      fi
      sleep 1
    done
  ) >>"$PULL_LOG" 2>&1 &
  echo $! >"$PULL_PID"
fi

# ---------- node version ----------
NEED_MAJOR=22
NEED_MINOR=23
NODE_VER="$(node -v 2>/dev/null | sed 's/^v//')"
if [ -z "$NODE_VER" ]; then
  echo "!! Node.js nahi mila. Chalayein: pkg install nodejs -y"
  exit 1
fi
MAJOR="${NODE_VER%%.*}"
REST="${NODE_VER#*.}"
MINOR="${REST%%.*}"
if [ "$MAJOR" -lt "$NEED_MAJOR" ] || { [ "$MAJOR" -eq "$NEED_MAJOR" ] && [ "$MINOR" -lt "$NEED_MINOR" ]; }; then
  echo "!! Node $NODE_VER purana hai — Astro 7 ko >= 22.23.4 chahiye."
  echo "   Chalayein:  pkg upgrade -y && pkg install nodejs -y"
  exit 1
fi
echo "-> node $NODE_VER"

# ---------- deps ----------
if [ ! -d node_modules ]; then
  echo "-> npm install (pehli baar 2-5 min)"
  npm install --no-audit --no-fund || { echo "!! npm install fail"; exit 1; }
fi

# ---------- dev server ----------
echo "---------------------------------------------"
echo "  Compass site : http://localhost:$PORT/onlinecompass"
echo "  Auto-pull    : har 1 second (log: $PULL_LOG)"
echo "  Band karna   : Ctrl+C  ya  bash start.sh stop"
echo "---------------------------------------------"

exec npx astro dev --host 0.0.0.0 --port "$PORT" --strictPort

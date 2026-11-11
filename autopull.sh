#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# autopull.sh — har 1 second GitHub se latest code kheenchta hai.
#
# Khud chalayein (background me):
#     nohup bash autopull.sh >/dev/null 2>&1 &
#
# Band karna:
#     bash autopull.sh stop
#
# Yeh script `git fetch` + `git reset --hard origin/main` karta hai, isliye
# jab bhi main force-push karta hoon (undo/redo) tab bhi aapka code sync rehta
# hai. Local edits hone par pull skip ho jata hai — aapka kaam overwrite nahi
# hota.
# ---------------------------------------------------------------------------
set -u
cd "$(dirname "$0")" || exit 1

BRANCH="${BRANCH:-main}"
LOG=".autopull.log"
PID_FILE=".autopull.pid"

if [ "${1:-}" = "stop" ]; then
  if [ -f "$PID_FILE" ]; then
    kill "$(cat "$PID_FILE")" 2>/dev/null && echo "-> auto-pull band"
    rm -f "$PID_FILE"
  else
    echo "-> auto-pull chal nahi raha tha"
  fi
  exit 0
fi

# pehle se chal raha hai? dobara na chalao
if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "-> auto-pull pehle se chal raha hai (pid $(cat "$PID_FILE"))"
  exit 0
fi

echo $$ >"$PID_FILE"
trap 'rm -f "$PID_FILE"' EXIT

echo "[$(date +%H:%M:%S)] auto-pull start (har 1s)" >>"$LOG"

while true; do
  # sirf tab pull karo jab koi tracked file modify na hui ho
  if [ -z "$(git status --porcelain --untracked-files=no 2>/dev/null)" ]; then
    BEFORE=$(git rev-parse HEAD 2>/dev/null)
    if git fetch --quiet origin "$BRANCH" 2>>"$LOG"; then
      AFTER=$(git rev-parse "origin/$BRANCH" 2>/dev/null)
      # reset only when the remote really points somewhere else; works for
      # normal commits and force-pushes (undo/redo) alike.
      if [ -n "$AFTER" ] && [ "$BEFORE" != "$AFTER" ]; then
        git reset --hard "origin/$BRANCH" --quiet 2>>"$LOG"
        echo "[$(date +%H:%M:%S)] updated ${BEFORE:0:7} -> ${AFTER:0:7}" >>"$LOG"
      fi
    fi
  fi
  sleep 1
done

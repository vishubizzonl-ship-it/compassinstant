#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# setup-once.sh — SIRF EK BAAR chalana hai.
#
#     bash setup-once.sh
#
# Yeh karta hai:
#   1. ~/.bashrc me hook lagata hai — Termux khulte hi autostart.sh chalta hai
#   2. Termux:Boot script lagata hai — phone reboot ke baad bhi server chalta hai
#   3. abhi ke liye turant sab start kar deta hai
#
# Hatana ho to:
#     bash setup-once.sh remove
# ---------------------------------------------------------------------------
set -u
SELF_DIR="$(cd "$(dirname "$0")" && pwd)"
MARK_BEGIN="# >>> onlinecompass autostart >>>"
MARK_END="# <<< onlinecompass autostart <<<"
BASHRC="$HOME/.bashrc"
BOOT_DIR="$HOME/.termux/boot"
BOOT_FILE="$BOOT_DIR/onlinecompass.sh"

remove_hook() {
  if [ -f "$BASHRC" ] && grep -qF "$MARK_BEGIN" "$BASHRC" 2>/dev/null; then
    python3 - "$BASHRC" "$MARK_BEGIN" "$MARK_END" <<'PY'
import sys
path, begin, end = sys.argv[1], sys.argv[2], sys.argv[3]
lines = open(path).read().splitlines(keepends=True)
out, skip = [], False
for line in lines:
    if line.strip() == begin:
        skip = True
        continue
    if line.strip() == end:
        skip = False
        continue
    if not skip:
        out.append(line)
open(path, "w").write("".join(out))
PY
  fi
  rm -f "$BOOT_FILE"
}

if [ "${1:-}" = "remove" ]; then
  remove_hook
  bash "$SELF_DIR/autopull.sh" stop 2>/dev/null || true
  echo "-> autostart hata diya. Server band karna ho to: pkill -9 -f node"
  exit 0
fi

# ---- 1. ~/.bashrc hook ----------------------------------------------------
remove_hook   # purana hook ho to safai

cat >>"$BASHRC" <<EOF
$MARK_BEGIN
# Termux khulte hi: auto-pull (har 1 sec) + dev server agar band ho.
if [ -d "$SELF_DIR" ] && [ -f "$SELF_DIR/autostart.sh" ]; then
  ( cd "$SELF_DIR" && bash autostart.sh ) </dev/null >/dev/null 2>&1
fi
$MARK_END
EOF
echo "-> ~/.bashrc me autostart hook lag gaya"

# ---- 2. Termux:Boot -------------------------------------------------------
mkdir -p "$BOOT_DIR"
cat >"$BOOT_FILE" <<EOF
#!/data/data/com.termux/files/usr/bin/sh
termux-wake-lock 2>/dev/null
sleep 5
cd "$SELF_DIR" || exit 1
bash autostart.sh </dev/null >/dev/null 2>&1
EOF
chmod +x "$BOOT_FILE" 2>/dev/null || true
echo "-> Termux:Boot script ready (app install ho to reboot ke baad bhi chalega)"

# ---- 3. abhi turant start -------------------------------------------------
echo "-> abhi start kar raha hoon..."
bash "$SELF_DIR/autostart.sh"

echo
echo "---------------------------------------------"
echo "  Site        : http://localhost:4321/onlinecompass"
echo "  Auto-pull   : har 1 second (log: .autopull.log)"
echo "  Ab kuch nahi karna — bas Termux kholo."
echo "  Hatana ho   : bash setup-once.sh remove"
echo "---------------------------------------------"

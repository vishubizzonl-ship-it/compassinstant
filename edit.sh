#!/usr/bin/env bash
# ---------------------------------------------------------------
# edit.sh — number se undo / redo
#
#   bash edit.sh list        # saare edits aur unke numbers
#   bash edit.sh undo 01     # EDIT 01 se pehle wali state pe wapas
#   bash edit.sh redo 01     # EDIT 01 ki final state pe wapas
#
# Note: yeh git reset --hard karta hai — local changes mit jayenge.
# ---------------------------------------------------------------
set -u
cd "$(dirname "$0")" || exit 1
BRANCH="main"
REMOTE_URL="$(git remote get-url origin 2>/dev/null)"
[ -z "$REMOTE_URL" ] && REMOTE_URL="https://vishubizzonl-ship-it:${GITHUB_PAT:?GITHUB_PAT set karein}@github.com/vishubizzonl-ship-it/compassinstant.git"

case "${1:-list}" in
  list)
    echo "EDIT   START       END         STATUS"
    for t in $(git tag -l 'edit-*-start' | sort); do
      n="${t#edit-}"; n="${n%-start}"
      s=$(git rev-parse --short "$t")
      e="(pending)"; st="in progress"
      if git rev-parse -q --verify "edit-$n-end" >/dev/null; then
        e=$(git rev-parse --short "edit-$n-end"); st="done"
      fi
      printf "%-6s %-11s %-11s %s\n" "$n" "$s" "$e" "$st"
    done
    ;;
  undo|redo)
    N="${2:?number chahiye, e.g. 01}"
    N=$(printf "%02d" "$N" 2>/dev/null || echo "$N")
    TAG="edit-$N-start"; [ "$1" = "redo" ] && TAG="edit-$N-end"
    TARGET=$(git rev-parse -q --verify "$TAG^{commit}") || { echo "!! tag $TAG nahi mila"; exit 1; }
    echo "-> $1 EDIT $N  =>  $(git log --oneline -1 "$TARGET")"
    git reset --hard "$TARGET" || exit 1
    echo "-> push (force)"
    git push --force origin "HEAD:$BRANCH" 2>&1 | tail -1
    echo "-> ho gaya. Ab chalayein: bash start.sh"
    ;;
  *)
    echo "usage: bash edit.sh list | undo <n> | redo <n>"
    ;;
esac

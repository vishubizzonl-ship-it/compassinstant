# EDIT LOG — compassinstant (onlinecompass)

Har edit ka ek **number** hai. Us number se undo ya redo kar sakte hain.

| Number | Kya | Start | End | Status |
|---|---|---|---|---|
| **01** | Per-tool silos (blog/about/privacy/terms/contact har tool ke liye) | `31b3e44` | `ddd99e2` | ⛔ **UNDONE** (aapke kehne par) |
| **02** | Home page (`/`) par Compass nav item default selected + aria-current | `6e079b2` | `e44e760` | **done** ✅ |
| **03** | Har 1 second auto-pull + zero-touch autostart (setup-once.sh) | `e44e760` | `3ce0250`+ | **done** ✅ |

---

## Commands (Termux)

```bash
cd ~/compassinstant

bash edit.sh list        # saare numbers dekho
bash edit.sh undo 01     # EDIT 01 se PEHLE wali state pe wapas
bash edit.sh redo 01     # EDIT 01 ki FINAL state pe wapas
```

Phir:
```bash
bash start.sh
```

⚠️ `undo`/`redo` `git reset --hard` karta hai — local changes mit jayenge.

---

## EDIT 01 ka scope (undone — abhi live nahi hai)

- `/compass/blog/` `/compass/about/` `/compass/privacy/` `/compass/terms/` `/compass/contact/`
- `/bubble-level/...` `/speedometer/...` `/qibla-finder/...` — har tool ke apne 5 pages
- 8 languages
- Nav/Footer/buttons ka **look same**, sirf link target tool-aware
- Bubble Level + Qibla Finder ke naye English blog articles
- Purane global pages → redirect to `/compass/...`

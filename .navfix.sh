#!/data/data/com.termux/files/usr/bin/bash
f="${1:-src/components/Nav.astro}"
[ -f "$f" ] || exit 0
python3 - "$f" <<'PY'
import re, sys
p = sys.argv[1]
s = open(p).read()
orig = s
new = """const navItems = [
  { href: '/compass/', label: t('nav.compass') },
  { href: '/bubble-level/', label: t('nav.bubble') },
  { href: '/speedometer/', label: t('nav.speed') },
  { href: '/qibla-finder/', label: t('nav.qibla') },
];
"""
s = re.sub(r"const navItems = activeTool[\s\S]*?\n    \];\n", new, s, count=1)
if 'toolWordmark' not in s:
    i = s.index('const navItems = [')
    s = s[:i] + """const toolWordmark: Record<ToolId, string> = {
  compass: 'onlinecompass',
  'bubble-level': 'BubbleLevel',
  speedometer: 'Speedometer',
  'qibla-finder': 'Qibla',
};
const wordmark = activeTool ? toolWordmark[activeTool] : 'onlinecompass';

""" + s[i:]
s = s.replace('>onlinecompass</span>', '>{wordmark}</span>')
s = s.replace('aria-label="onlinecompass — {t(\'nav.home\')}"', 'aria-label={`${wordmark} — ${t(\'nav.home\')}`}')
if s != orig:
    open(p, 'w').write(s)
PY

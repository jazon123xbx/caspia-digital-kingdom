#!/usr/bin/env python3
"""Verify critical project files and relative local assets exist. No third-party deps."""
from pathlib import Path
from html.parser import HTMLParser
import sys
ROOT=Path(__file__).resolve().parents[1]
class Refs(HTMLParser):
    def __init__(self): super().__init__(); self.refs=[]
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        for a in ('src','href'):
            if a in d:self.refs.append((tag,d[a]))
errors=[]
for page in ('index.html','kingdom.html','game.html'):
    path=ROOT/page
    if not path.exists(): errors.append(f'MISSING: {page}');continue
    p=Refs();p.feed(path.read_text(encoding='utf-8'))
    for tag,url in p.refs:
        if not url or url.startswith(('https:','http:','data:','#','mailto:','javascript:','//')):continue
        target=(path.parent/url.split('#')[0].split('?')[0]).resolve()
        if not target.is_relative_to(ROOT.resolve()) or not target.is_file():errors.append(f'BROKEN: {page} {tag} -> {url}')
for f in ['js/game.js','css/game.css','assets/caspia.webp','docs/V12_2_IMPLEMENTATION_SPEC.md']:
    if not (ROOT/f).is_file():errors.append(f'MISSING: {f}')
if errors:
    print('\n'.join(errors));sys.exit(1)
print('PASS: critical pages and local dependencies resolve')

#!/usr/bin/env python3
"""Static checks for Tech Store diagrams; NOT UML syntax rendering or MySQL execution."""
from pathlib import Path
import re, sys, xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1]
diag=root/'docs/diagrams'
seq=sorted((diag/'sequence').glob('*.puml'))
ids={m for p in seq for m in re.findall(r'UC\d\d',p.stem)}
expected={f'UC{i:02d}' for i in range(1,21)}
errors=[]
if ids != expected: errors.append(f'UC mapping mismatch: missing {expected-ids}, extra {ids-expected}')
if len(seq)!=21: errors.append(f'Expected 21 sequence files, got {len(seq)}')
for p in diag.rglob('*.puml'):
    txt=p.read_text(encoding='utf-8-sig')
    if '@startuml' not in txt or '@enduml' not in txt: errors.append(f'PlantUML boundaries missing: {p}')
try: ET.parse(diag/'class/class-diagram-overview.drawio')
except ET.ParseError as ex: errors.append(f'drawio invalid XML: {ex}')
sql=(root/'database/schema/01_schema_21_tables_mysql8.sql').read_text(encoding='utf-8')
asserts=(len(re.findall(r'^CREATE TABLE IF NOT EXISTS\s+\w+',sql,re.M)),len(re.findall(r'FOREIGN KEY\s*\(',sql)))
if asserts!=(21,24): errors.append(f'Expected 21 SQL tables and 24 FK, got {asserts}')
for n in expected:
    if not any(n in p.stem for p in seq):errors.append(f'UC without sequence: {n}')
for x in ['DIAGRAM_INDEX.md','use-case/UC_OVERVIEW.puml','class/CLASS_MODEL_INDEX.md','erd/ERD_ALL_21_TABLES.puml']:
    if not (diag/x).exists():errors.append(f'Missing {x}')
print('DIAGRAM CHECK:', 'PASS' if not errors else 'FAIL')
print(f'Sequences={len(seq)}; use cases={len(ids)}; SQL tables={asserts[0]}; foreign keys={asserts[1]}')
for e in errors: print('ERROR:',e)
print('This script does not render PlantUML, validate SQL runtime or resolve business conflicts.')
sys.exit(1 if errors else 0)

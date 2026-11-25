"""Idempotent, narrowly scoped move; never rebuild student allocations."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
def move(data):
 changed=[]
 for course,exams in data['exams'].items():
  for e in exams:
   if e['date']=='2026-11-29' and e['start']=='16:30' and e['end']=='17:10':
    e['originalDate']=e['date'];e['date']='2026-12-01';e['rescheduled']=True;changed.append(course)
  exams.sort(key=lambda e:(e['date'],e['start']))
 if changed:
  data['updated']='2026-11-25';data['scheduleRevision']='20261125';data['rescheduleNotice']={'from':'2026-11-29','to':'2026-12-01','start':'16:30','end':'17:10','courses':sorted(set(changed))}
 return changed
if __name__=='__main__':
 p=ROOT/'exam-navigator/data.js';d=json.loads(p.read_text().split('=',1)[1].strip().removesuffix(';'));changed=move(d);p.write_text('window.EXAM_DATA='+json.dumps(d,ensure_ascii=False,separators=(',',':'))+';\n');print({'movedCourses':changed})

import copy
from move_nov29_exam import move

def exam(date,start,end):return dict(date=date,start=start,end=end,ar='مقياس',en='Module')
d={'exams':{'A':[exam('2026-11-29','16:30','17:10'),exam('2026-11-29','17:20','18:00'),exam('2026-11-30','16:30','17:10')]},'students':[{'id':'unchanged','room':'109'}]}
before=copy.deepcopy(d)
assert move(d)==['A']
assert d['students']==before['students']
assert [e for e in d['exams']['A'] if not e.get('rescheduled')]==before['exams']['A'][1:]
assert sum(e['date']=='2026-12-01' for e in d['exams']['A'])==1
after=copy.deepcopy(d)
assert move(d)==[] and d==after
print('PASS: 17:20 and November 30 unchanged; only approved slot moved; idempotent.')

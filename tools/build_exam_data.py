"""Read university rosters; generate a minimal public room-finder dataset.
Usage: python3 tools/build_exam_data.py /absolute/path/to/rosters
Requires openpyxl. Grades, attendance and raw registration numbers are excluded.
"""
import collections, hashlib, json, pathlib, re, sys
import openpyxl

root = pathlib.Path(__file__).resolve().parents[1]
source = pathlib.Path(sys.argv[1])
out = root / 'exam-navigator'
out.mkdir(exist_ok=True)
salt = 'UKMO-TD-2026-2027-v1:'
students = {}
groups = collections.defaultdict(list)
sources = []
for p in sorted(source.glob('*.xlsx')):
    sheet = openpyxl.load_workbook(p, data_only=True).active
    title = str(sheet.cell(1, 1).value)
    if 'ingenieur' in title:
        course = 'ING2'
    elif p.name.startswith('M'):
        course = p.name.split('(')[0].upper()
    else:
        course = 'L3' if 'Semestre 5' in title else 'L2'
    sources.append(p.name)
    for row in list(sheet.values)[2:]:
        if not row[0] or not str(row[0]).strip().isdigit() or not row[1]:
            continue
        reg = str(row[0]).strip()
        key = (course, reg)
        if key in students:
            continue
        group = int(re.search(r'\d+', str(row[8])).group())
        surname = [x.strip() for x in str(row[1]).split('/', 1)]
        given = [x.strip() for x in str(row[2]).split('/', 1)]
        s = {'id': hashlib.sha256((salt + reg).encode()).hexdigest(),
             'course': course, 'group': group,
             'last': surname[-1], 'first': given[-1],
             'lastLatin': surname[0], 'firstLatin': given[0]}
        students[key] = s
        groups[(course, group)].append(s)

def assign(course, group, slices):
    rows = groups[(course, group)]
    assert sum(count for room, count in slices) == len(rows), (course, group, len(rows))
    offset = 0
    for room, count in slices:
        for student in rows[offset:offset+count]:
            student['room'] = room
        offset += count

assign('L2',1,[('D',39)])
assign('L2',2,[('D',38)])
assign('L2',3,[('210',38)])
assign('L2',4,[('109',18),('110',18)])
assign('L2',5,[('111',18),('112',18)])
assign('L2',6,[('113',19),('114',18)])
assign('L3',1,[('D',40)])
assign('L3',2,[('D',35)])
assign('L3',3,[('210',34)])
assign('L3',4,[('109',19),('110',19)])
assign('L3',5,[('111',19),('112',19)])
assign('M1-ELT',1,[('D',42)])
assign('M1-RES',1,[('D',43)])
assign('M1-MACH',1,[('109',16),('110',16)])
assign('M2-ELT',1,[('111',19),('112',19)])
assign('M2-MACH',1,[('210',20)])
assign('M2-RES',1,[('210',21)])
assign('ING2',1,[('113',14),('114',14)])

labels={
 'L2':['السنة الثانية ليسانس','Second year Bachelor','الهندسة الكهربائية','Electrotechnics','L2'],
 'L3':['السنة الثالثة ليسانس','Third year Bachelor','الهندسة الكهربائية','Electrotechnics','L3'],
 'ING2':['السنة الثانية مهندس','Second year Engineering','الهندسة الكهربائية','Electrotechnics','ING2'],
 'M1-ELT':['السنة الأولى ماستر','First year Master','كهروتقني صناعي','Industrial Electrotechnics','M1'],
 'M1-MACH':['السنة الأولى ماستر','First year Master','الآلات الكهربائية','Electrical Machines','M1'],
 'M1-RES':['السنة الأولى ماستر','First year Master','الشبكات الكهربائية','Electrical Networks','M1'],
 'M2-ELT':['السنة الثانية ماستر','Second year Master','كهروتقني صناعي','Industrial Electrotechnics','M2'],
 'M2-MACH':['السنة الثانية ماستر','Second year Master','الآلات الكهربائية','Electrical Machines','M2'],
 'M2-RES':['السنة الثانية ماستر','Second year Master','الشبكات الكهربائية','Electrical Networks','M2']}
plans={
 'L2': [('2026-11-15', [('الإلكترونيك الأساسي 1','Fundamental Electronics I'),('الكهروتقني الأساسي 1','Fundamental Electrotechnics I')]),('2026-11-22',[('الأمواج والاهتزازات','Waves and Vibrations'),('التحليل الرياضي 3','Mathematical Analysis III')]),('2026-11-29',[('الاحتمالات والإحصاء','Probability and Statistics')])],
 'L3': [('2026-11-16',[('إلكترونيك القدرة','Power Electronics'),('الشبكات الكهربائية','Electrical Networks')]),('2026-11-23',[('نظرية الحقل الكهرومغناطيسي','Electromagnetic Field Theory'),('الأنظمة المؤازرة','Control Systems')])],
 'ING2':[('2026-11-24',[('التحليل الرياضي 3','Mathematical Analysis III'),('الكهرباء الأساسية','Fundamental Electricity')]),('2026-11-30',[('الأمواج والاهتزازات','Waves and Vibrations'),('الميكانيك العقلانية','Rational Mechanics')])],
 'M1':[('2026-11-24',[('الطرق العددية التطبيقية والتحسين','Applied Numerical Methods and Optimization'),('الآلات الكهربائية المعمقة','Advanced Electrical Machines')]),('2026-11-30',[('إلكترونيك القدرة المعمقة','Advanced Power Electronics'),('شبكات نقل وتوزيع الطاقة الكهربائية','Electrical Energy Transport and Distribution Networks')])],
 'M2-ELT':[('2026-11-24',[('الأنظمة العابرة للأنظمة الكهربائية','Transient Regimes of Electrical Systems'),('تحجيم الأنظمة الصناعية','Sizing of Industrial Systems')]),('2026-11-30',[('جودة الطاقة والتوافق الكهرومغناطيسي','Power Quality and Electromagnetic Compatibility'),('التحكم في الأنظمة الكهربائية','Control of Electrical Systems')])],
 'M2-MACH':[('2026-11-24',[('الآلات الكهربائية الخاصة','Special Electrical Machines'),('الأنظمة العابرة للآلات الكهربائية','Transient Regimes of Electrical Machines')]),('2026-11-30',[('التحكم في الآلات الكهربائية','Control of Electrical Machines')])],
 'M2-RES':[('2026-11-24',[('تقنيات التوتر العالي','High Voltage Techniques'),('تشغيل الشبكات الكهربائية','Operation of Electrical Networks')]),('2026-11-30',[('الشبكات الكهربائية الصناعية','Industrial Electrical Networks'),('استقرار وديناميكية الشبكات الكهربائية','Stability and Dynamics of Electrical Networks')])]}
exams={}
for course in labels:
    exams[course]=[]
    for date, modules in plans['M1' if course.startswith('M1-') else course]:
        for i,(ar,en) in enumerate(modules):
            exams[course].append({'date':date,'start':['16:30','17:20'][i], 'end':['17:10','18:00'][i], 'ar':ar,'en':en})

capacities={'D':90,'210':45,**{str(i):20 for i in range(109,115)}}
occupancy=collections.defaultdict(list)
for s in students.values():
    assert s.get('room') in capacities
    for exam in exams[s['course']]:
        occupancy[(exam['date'],exam['start'],exam['end'],s['room'])].append(s)
for key, rows in occupancy.items():
    assert len(rows)<=capacities[key[-1]], (key,len(rows))
    assert len({labels[s['course']][4] for s in rows})==1, key
assert len(students)==633
anomalies=[{'course':k[0], 'name':v['last']+' '+v['first'], 'digits':len(k[1])} for k,v in students.items() if len(k[1])!=12]
data={'updated':'2026-11-14', 'timezone':'Africa/Algiers','salt':salt,'labels':labels,'capacities':capacities,'exams':exams,'students':list(students.values()),'sourceSchedule':'In_Class_Test_Schedule_2026_2027 (2)(1).pdf'}
(out/'data.js').write_text('window.EXAM_DATA='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
summary=[]
for course,group in sorted(groups):
    byroom=collections.Counter(s['room'] for s in groups[(course,group)])
    summary.append({'course':course,'group':group,'count':sum(byroom.values()),'rooms':dict(byroom)})
audit={'totalStudents':len(students),'capacityPerSession':sum(capacities.values()),'allStudentsAssigned':True,'capacityViolations':0,'mixedLevelRooms':0,'examAssignments':sum(len(exams[s['course']]) for s in students.values()),'sources':sources,'schedule':data['sourceSchedule'],'groups':summary,'registrationLengthWarnings':anomalies,'notes':['Registration identifiers retained exactly for lookup; no assumed corrections.','No grades, absences or raw registration numbers in the public dataset.','Room numbers are destinations, not geographic routing; no floor or building inferred.']}
(out/'validation.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in audit.items() if k not in ['sources','registrationLengthWarnings','notes']},ensure_ascii=False,indent=2))

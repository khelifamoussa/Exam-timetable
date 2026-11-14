const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../exam-navigator/core.js');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../exam-navigator/data.js'),'utf8'),ctx);const D=ctx.window.EXAM_DATA;
assert.equal(D.students.length,633);
assert.equal(C.normalize('أَحْمَد ١٢٣'),'احمد 123');
assert.equal(C.normalize('Abdérrahim'),'abderrahim');
for(const s of D.students){assert(C.scoreStudent(s,s.last+' '+s.first)>0);assert(C.scoreStudent(s,s.firstLatin+' '+s.lastLatin)>0);assert.equal(s.id.length,64);assert(D.capacities[s.room]);}
const occupied=new Map();
for(const s of D.students)for(const e of D.exams[s.course]){const key=[e.date,e.start,s.room].join('|');if(!occupied.has(key))occupied.set(key,[]);occupied.get(key).push(s);}
for(const [key,students]of occupied){assert(students.length<=D.capacities[key.split('|')[2]],key);assert.equal(new Set(students.map(s=>D.labels[s.course][4])).size,1,key);}
const e=D.exams.L2[0];assert.equal(C.examDate(e).toISOString(),'2026-11-15T15:30:00.000Z');
assert.equal(C.dayState(e,new Date('2026-11-15T15:40:00Z')),'ongoing');
assert.equal(C.nextExam(D.exams.L2,new Date('2026-11-15T16:15:00Z')).start,'17:20');
assert.equal(C.nextExam(D.exams['M2-MACH'],new Date('2026-12-01T00:00:00Z')),null);
assert.equal(D.exams['M2-MACH'].filter(x=>x.date==='2026-11-30').length,1);
assert.equal(D.exams.L2.filter(x=>x.date==='2026-11-29').length,1);
const ics=C.calendar(D.exams.L2,'D','L2');assert(ics.includes('DTSTART:20261115T153000Z'));assert.equal((ics.match(/BEGIN:VEVENT/g)||[]).length,5);assert(ics.includes('TRIGGER:-PT10M'));for(const line of ics.split('\r\n'))assert(Buffer.byteLength(line)<=75);
console.log('PASS: 633 student lookups, all session capacities and level separation, date boundaries, single-test days, calendar times and UTF-8 folding.');

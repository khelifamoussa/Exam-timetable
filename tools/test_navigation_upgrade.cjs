const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../exam-navigator/core.js'),R=require('../exam-navigator/route-model.js');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../exam-navigator/data.js'),'utf8'),ctx);const D=ctx.window.EXAM_DATA,index=C.createSearchIndex(D.students);
for(const s of D.students){
 for(const name of [s.first+' '+s.last,s.lastLatin+' '+s.firstLatin])assert(C.indexedSearch(index,name,'',633).students.some(x=>x.id===s.id));
 assert(C.indexedSearch(index,s.first[0]).total>0);
}
const fixture=[{first:'أَحمد',last:'صالح',firstLatin:'Ahmed',lastLatin:'Salah',course:'A'},{first:'محمّد',last:'أحمد',firstLatin:'Mohamed',lastLatin:'Ahmed',course:'B'}];
assert.equal(C.indexedSearch(C.createSearchIndex(fixture),'احمد').total,2);
assert.equal(C.indexedSearch(C.createSearchIndex(fixture),'احمد صالح').students[0],fixture[0]);
assert.equal(C.indexedSearch(C.createSearchIndex(fixture),'صالح أحمد').students[0],fixture[0]);
assert.equal(C.indexedSearch(C.createSearchIndex(fixture),'احمد','B').total,1);
assert(C.highlightRanges('أَحمد','احمد').length);
assert.deepEqual(R.rooms,['114','113','112','111','110','109']);
for(const room of ['D',...R.rooms,'210']){const r=R.route(room);assert.equal(r.points.length,r.steps.length);assert.equal(r.floor,room==='D'?0:room==='210'?2:1);assert.equal(r.points.at(-1)[1],r.floor*3);assert.equal(r.liveLocation,false);assert.equal(r.schematic,true);if(room==='D')assert(r.points.every(p=>p[1]===0));}
assert.equal(R.route('999'),null);
const moved=Object.values(D.exams).flat().filter(x=>x.rescheduled);assert.equal(moved.length,1);assert.equal(moved[0].date,'2026-12-01');assert.equal(moved[0].start,'16:30');assert.equal(moved[0].end,'17:10');assert.equal(moved[0].originalDate,'2026-11-29');
const ics=C.calendar(D.exams.L2,'210','L2','en');assert(ics.includes('DTSTART:20261201T153000Z'));assert(!ics.includes('DTSTART:20261129'));assert(ics.includes('UID:2026-11-29-1630-L2-210@ukmo-exams'));assert(ics.includes('SEQUENCE:1'));
console.log('PASS: indexed first-letter / Arabic / Latin / reordered / ambiguous names; all 8 destinations, floors and ordered rooms; scoped reschedule and stable calendar identity.');

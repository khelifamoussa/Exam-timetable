(function (root) {
 'use strict';
 function normalize(value) {
  return String(value).normalize('NFKD').replace(/[\u0300-\u036f\u064b-\u065f\u0670\u06d6-\u06ed]/g,'').replace(/ـ/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').toLowerCase().replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
 }
 function scoreStudent(s, query) {
  const q=normalize(query), a=normalize(`${s.first} ${s.last}`), b=normalize(`${s.firstLatin} ${s.lastLatin}`);
  if(!q)return 0;
  const compact=q.replace(/ /g,''), names=[a,b,normalize(`${s.last} ${s.first}`),normalize(`${s.lastLatin} ${s.firstLatin}`)];
  if(names.includes(q))return 100;
  if(names.some(n=>n.startsWith(q)))return 80;
  if(names.some(n=>n.replace(/ /g,'').includes(compact)))return 60;
  return q.split(' ').every(t=>(a+' '+b).includes(t))?40:0;
 }
 function createSearchIndex(students){return students.map((student,index)=>({student,index,names:[normalize(student.first+' '+student.last),normalize(student.last+' '+student.first),normalize(student.firstLatin+' '+student.lastLatin),normalize(student.lastLatin+' '+student.firstLatin)]}));}
 function indexedSearch(index,query,filter='',limit=12){const q=normalize(query);if(!q)return{total:0,students:[]};const tokens=q.split(' '),rows=[];for(const entry of index){if(filter&&entry.student.course!==filter)continue;const names=entry.names;let score=names.includes(q)?100:names.some(n=>n.startsWith(q))?90:tokens.every(t=>names.some(n=>n.split(' ').some(w=>w.startsWith(t))))?80:tokens.every(t=>names.some(n=>n.includes(t)))?60:0;if(score)rows.push({entry,score});}rows.sort((a,b)=>b.score-a.score||a.entry.index-b.entry.index);return{total:rows.length,students:rows.slice(0,limit).map(x=>x.entry.student)};}
 function highlightRanges(value,query){const map=[],original=String(value);let normalized='',offset=0;for(const ch of original){const n=normalize(ch);if(n){for(const c of n){map.push([offset,offset+ch.length]);normalized+=c;}}else if(/\s/.test(ch)){map.push([offset,offset+ch.length]);normalized+=' ';}offset+=ch.length;}const ranges=[];for(const token of normalize(query).split(' ').filter(Boolean)){let at=normalized.indexOf(token);while(at>=0){if(map[at]&&map[at+token.length-1])ranges.push([map[at][0],map[at+token.length-1][1]]);at=normalized.indexOf(token,at+token.length);}}ranges.sort((a,b)=>a[0]-b[0]);const merged=[];for(const r of ranges){const prev=merged.at(-1);if(prev&&r[0]<=prev[1])prev[1]=Math.max(prev[1],r[1]);else merged.push([...r]);}return merged;}
 function examDate(exam, field='start') { return new Date(`${exam.date}T${exam[field]}:00+01:00`); }
 function nextExam(exams, now=new Date()) { return [...exams].sort((a,b)=>examDate(a)-examDate(b)).find(e=>examDate(e,'end')>now)||null; }
 function dayState(exam,now=new Date()) { return now<examDate(exam)?'upcoming':now<examDate(exam,'end')?'ongoing':'finished'; }
 function escapeICS(v){return String(v).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');}
 function stamp(date){return date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');}
 function calendar(exams,room,course,lang='ar') {
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//UKMO//Exam Navigator 2026//AR','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:UKMO TD 2026'];
  exams.forEach(e=>lines.push('BEGIN:VEVENT',`UID:${e.originalDate||e.date}-${e.start.replace(':','')}-${course}-${room||'schedule'}@ukmo-exams`, `DTSTAMP:${stamp(new Date())}`,`SEQUENCE:${e.rescheduled?1:0}`,`LAST-MODIFIED:${e.rescheduled?'20261125T120000Z':stamp(new Date())}`,`DTSTART:${stamp(examDate(e))}`,`DTEND:${stamp(examDate(e,'end'))}`,`SUMMARY:${escapeICS(e[lang==='ar'?'ar':'en'])}`,`LOCATION:${escapeICS(room?(room==='D'?'Amphitheatre D':'Room '+room):'Check your room using your name')}`,`DESCRIPTION:${escapeICS(lang==='ar'?'اختبار أعمال موجهة — جامعة قاصدي مرباح ورقلة. البقاء في المقاعد أثناء الاستراحة.':'Tutorial assessment — Kasdi Merbah University Ouargla. Remain seated during the break.')}`,'BEGIN:VALARM','TRIGGER:-PT10M','ACTION:DISPLAY','DESCRIPTION:Exam starts in 10 minutes','END:VALARM','END:VEVENT'));
  lines.push('END:VCALENDAR');
  // Fold at 70 UTF-8 bytes without splitting a code point (RFC 5545).
  return lines.map(line=>{const chunks=[];let part='',bytes=0;for(const ch of line){const n=new TextEncoder().encode(ch).length;if(bytes+n>70){chunks.push(part);part=' ';bytes=1;}part+=ch;bytes+=n;}chunks.push(part);return chunks.join('\r\n');}).join('\r\n')+'\r\n';
 }
 const api={normalize,scoreStudent,createSearchIndex,indexedSearch,highlightRanges,examDate,nextExam,dayState,calendar};
 root.ExamCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

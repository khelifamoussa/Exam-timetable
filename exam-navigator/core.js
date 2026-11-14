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
 function examDate(exam, field='start') { return new Date(`${exam.date}T${exam[field]}:00+01:00`); }
 function nextExam(exams, now=new Date()) { return exams.find(e=>examDate(e,'end')>now)||null; }
 function dayState(exam,now=new Date()) { return now<examDate(exam)?'upcoming':now<examDate(exam,'end')?'ongoing':'finished'; }
 function escapeICS(v){return String(v).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');}
 function stamp(date){return date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');}
 function calendar(exams,room,course,lang='ar') {
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//UKMO//Exam Navigator 2026//AR','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:UKMO TD 2026'];
  exams.forEach(e=>lines.push('BEGIN:VEVENT',`UID:${e.date}-${e.start.replace(':','')}-${course}-${room||'schedule'}@ukmo-exams`, `DTSTAMP:${stamp(new Date())}`,`DTSTART:${stamp(examDate(e))}`,`DTEND:${stamp(examDate(e,'end'))}`,`SUMMARY:${escapeICS(e[lang==='ar'?'ar':'en'])}`,`LOCATION:${escapeICS(room?(room==='D'?'Amphitheatre D':'Room '+room):'Check your room using your name')}`,`DESCRIPTION:${escapeICS(lang==='ar'?'اختبار أعمال موجهة — جامعة قاصدي مرباح ورقلة. البقاء في المقاعد أثناء الاستراحة.':'Tutorial assessment — Kasdi Merbah University Ouargla. Remain seated during the break.')}`,'BEGIN:VALARM','TRIGGER:-PT10M','ACTION:DISPLAY','DESCRIPTION:Exam starts in 10 minutes','END:VALARM','END:VEVENT'));
  lines.push('END:VCALENDAR');
  // Fold at 70 UTF-8 bytes without splitting a code point (RFC 5545).
  return lines.map(line=>{const chunks=[];let part='',bytes=0;for(const ch of line){const n=new TextEncoder().encode(ch).length;if(bytes+n>70){chunks.push(part);part=' ';bytes=1;}part+=ch;bytes+=n;}chunks.push(part);return chunks.join('\r\n');}).join('\r\n')+'\r\n';
 }
 const api={normalize,scoreStudent,examDate,nextExam,dayState,calendar};
 root.ExamCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

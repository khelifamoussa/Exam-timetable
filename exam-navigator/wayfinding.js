(()=>{
'use strict';
const section=document.createElement('section');section.id='wayfinding';section.className='wayfinding';section.hidden=true;
section.innerHTML=`<div class="wayfinding-head"><div><h2 id="wayfinding-title"></h2><p id="wayfinding-steps" role="status"></p></div><button type="button" id="wayfinding-replay" class="secondary"></button></div><div class="wayfinding-scroll"><div class="wayfinding-map"><img src="assets/wayfinding.webp" width="1672" height="941" alt=""><svg viewBox="0 0 1672 941" aria-hidden="true"><path id="wayfinding-outline"/><path id="wayfinding-line"/><circle id="wayfinding-end" r="14"/><circle r="9" fill="white" stroke="#173d50" stroke-width="4"><animateMotion id="wayfinding-motion" dur="8s" repeatCount="indefinite"/></circle></svg></div></div><p id="wayfinding-note"></p>`;
document.querySelector('.lookup-stage').after(section);
const $=id=>document.getElementById(id);
function route(room){
 const start='M 458 781 L 490 714 L 535 665 L 541 610 L 618 631 L 770 631 Q 795 631 810 610';
 if(room==='D')return {d:start+' L 867 615 L 1161 615',x:1161,y:615,floor:0};
 const xs={'114':1074,'113':1142,'112':1210,'111':1278,'110':1347,'109':1417};
 const stairs=start+' L 820 570 L 870 520 L 870 466 Q 875 451 900 455';
 if(xs[room])return {d:stairs+` L ${xs[room]} 459 L ${xs[room]} 438`,x:xs[room],y:438,floor:1};
 if(room==='210')return {d:stairs+' L 925 455 L 925 355 L 870 310 Q 865 294 900 294 L 1255 294 L 1300 280',x:1300,y:280,floor:2};
 return null;
}
window.ExamWayfinding={route,render(room,lang='ar',scroll=false){
 const r=route(String(room)),ar=lang==='ar';section.hidden=!r;if(!r)return;
 const colors=['#008e83','#0079ec','#e79700'],color=colors[r.floor];section.style.setProperty('--wayfinding-color',color);
 $('wayfinding-title').textContent=ar?`مسارك إلى ${room==='D'?'المدرج D':'القاعة '+room}`:`Your route to ${room==='D'?'Amphitheatre D':'Room '+room}`;
 const stepsAr=['من الساحة إلى مدخل الكلية ← يمينًا بعد الدخول ← تابع في الطابق الأرضي إلى المدرج D.','من الساحة إلى مدخل الكلية ← يمينًا بعد الدخول ← اصعد إلى الطابق الأول ← انعطف يسارًا؛ تبدأ القاعات بـ 114 ثم 113، 112، 111، 110، 109. توجّه إلى القاعة '+room+'.','من الساحة إلى مدخل الكلية ← يمينًا بعد الدخول ← اصعد إلى الطابق الثاني ← تابع إلى القاعة 210.'];
 const stepsEn=['From the courtyard, enter the faculty, turn right and continue on the ground floor to Amphitheatre D.','From the courtyard, enter the faculty, turn right, take the stairs to the first floor and turn left. Rooms are ordered 114, 113, 112, 111, 110, 109. Continue to Room '+room+'.','From the courtyard, enter the faculty, turn right and take the stairs to the second floor, then continue to Room 210.'];
 $('wayfinding-steps').textContent=(ar?stepsAr:stepsEn)[r.floor];
 $('wayfinding-note').textContent=ar?'اتبع الخط المتحرك إلى وجهتك المحددة. مخطط إرشادي غير مقياسي؛ نقطة البداية في الساحة وليست موقعًا مباشرًا للهاتف.':'Follow the animated line to your destination. Schematic, not to scale; the starting point is the courtyard, not live phone location.';
 $('wayfinding-replay').textContent=ar?'↻ إعادة المسار':'↻ Replay route';
 section.querySelector('img').alt=ar?'خريطة الوصول إلى قاعات الكلية عبر المدخل والسلالم':'Faculty entrance, stairs and room wayfinding map';
 for(const id of ['wayfinding-line','wayfinding-outline'])$(id).setAttribute('d',r.d);
 $('wayfinding-end').setAttribute('cx',r.x);$('wayfinding-end').setAttribute('cy',r.y);
 $('wayfinding-motion').setAttribute('path',r.d);
 const replay=()=>{const m=$('wayfinding-motion');if(m.beginElement)m.beginElement();};$('wayfinding-replay').onclick=replay;replay();
 if(scroll)section.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
},clear(){section.hidden=true;}};
})();

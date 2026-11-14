/* All room and schedule answers are derived from the validated local dataset. */
(()=>{
 'use strict';
 const D=window.EXAM_DATA,C=window.ExamCore,$=id=>document.getElementById(id);
 let lang='ar',selected=null,course='L2',activeDate='',suggestions=[],activeIndex=-1,searchSeq=0,reminders=false,toastTimer,recognition,voiceMode='search';
 const reminded=new Set(),search=$('search');
 const t=(ar,en)=>lang==='ar'?ar:en;
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const label=c=>D.labels[c],courseLabel=c=>`${label(c)[lang==='ar'?0:1]} · ${label(c)[lang==='ar'?2:3]}`;
 const roomText=r=>r==='D'?t('المدرج D','Amphitheatre D'):t('القاعة '+r,'Room '+r);
 const fullName=s=>lang==='ar'?`${s.last} ${s.first}`:`${s.firstLatin} ${s.lastLatin}`;
 const exams=()=>D.exams[course];
 const formatDate=(date,options={weekday:'long',day:'numeric',month:'long'})=>new Intl.DateTimeFormat(lang==='ar'?'ar-DZ':'en-GB',{...options,timeZone:'Africa/Algiers'}).format(new Date(date+'T12:00:00+01:00'));
 function status(ar,en){$('status').textContent=t(ar,en);}
 function toast(ar,en){$('toast').textContent=t(ar,en);$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,6500);}
 function initializeOptions(){
  $('search-level').innerHTML=`<option value="">${t('جميع المستويات','All levels')}</option>`+Object.keys(D.labels).map(c=>`<option value="${c}">${esc(courseLabel(c))}</option>`).join('');
  $('browse-course').innerHTML=Object.keys(D.labels).map(c=>`<option value="${c}">${esc(courseLabel(c))}</option>`).join('');
  $('browse-course').value=course;
 }
 function hideSuggestions(){ $('suggestion-wrap').hidden=true;search.setAttribute('aria-expanded','false');search.removeAttribute('aria-activedescendant');activeIndex=-1; }
 function renderSuggestions(total){
  $('suggestion-wrap').hidden=false; search.setAttribute('aria-expanded','true');activeIndex=-1;search.removeAttribute('aria-activedescendant');
  $('search-count').textContent=total?t(`${total} نتيجة${total>12?' — اكتب مزيدًا من الاسم لتضييق البحث':''}`,`${total} matches${total>12?' — type more to narrow your search':''}`):t('لم يُعثر على نتيجة. جرّب الاسم أو اللقب أو رقم التسجيل الكامل.','No match. Try your first name, surname or complete registration number.');
  $('suggestions').innerHTML=suggestions.map((s,i)=>`<li id="suggestion-${i}" role="option" aria-selected="false" data-index="${i}"><div><strong>${esc(fullName(s))}</strong><small>${esc(courseLabel(s.course))} · ${t('الفوج','Group')} ${s.group}</small></div><span class="suggestion-room">${esc(roomText(s.room))}</span></li>`).join('');
 }
 async function updateSearch(){
  const seq=++searchSeq,normalized=C.normalize(search.value),q=/^[\d\s]+$/.test(normalized)?normalized.replace(/\s/g,''):normalized,filter=$('search-level').value;
  if(!q){hideSuggestions();suggestions=[];status('','');return;}
  const pool=D.students.filter(s=>!filter||s.course===filter);
  if(/^\d+$/.test(q)){
   if(q.length<8){suggestions=[];hideSuggestions();status('أكمل رقم التسجيل للوصول إلى تطابق دقيق.','Enter your complete registration number for an exact match.');return;}
   if(!globalThis.crypto?.subtle){status('البحث برقم التسجيل يتطلب فتح الرابط الآمن HTTPS. البحث بالاسم متاح.','Registration search requires HTTPS. Name search is available.');return;}
   const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(D.salt+q));
   if(seq!==searchSeq)return;
   const hash=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
   suggestions=pool.filter(s=>s.id===hash);renderSuggestions(suggestions.length);
  }else{
   const rows=pool.map(s=>({s,score:C.scoreStudent(s,q)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||fullName(a.s).localeCompare(fullName(b.s),lang));
   suggestions=rows.slice(0,12).map(x=>x.s);renderSuggestions(rows.length);
  }
  status('اختر سجلك وتحقق من المستوى والتخصص.','Select your record and check your level and specialty.');
 }
 function selectStudent(s,read=false){
  selected=s;course=s.course;reminders=false;reminded.clear();$('reminder').textContent=t('تنبيه قبل 10 دقائق','Remind me 10 minutes before');
  $('student-result').hidden=false;search.value=fullName(s);hideSuggestions();renderStudent();$('browse-course').value=course;
  const upcoming=C.nextExam(exams());activeDate=upcoming?.date||exams()[exams().length-1].date;renderSchedule();
  status('تم عرض قاعتك وجدولك. تحقق من بياناتك قبل اعتماد النتيجة.','Your room and schedule are ready. Please verify your details.');
  if(read)speakAnswer();
 }
 function renderStudent(){
  if(!selected)return;
  $('student-name').textContent=fullName(selected);
  $('student-latin').textContent=lang==='ar'?`${selected.firstLatin} ${selected.lastLatin}`:`${selected.last} ${selected.first}`;
  $('student-latin').dir=lang==='ar'?'ltr':'rtl';
  $('student-facts').innerHTML=[label(selected.course)[lang==='ar'?0:1],label(selected.course)[lang==='ar'?2:3],t('الفوج ','Group ')+selected.group].map(x=>`<span>${esc(x)}</span>`).join('');
  $('room-label').textContent=roomText(selected.room);
  const roommates=D.students.filter(s=>s.room===selected.room&&label(s.course)[4]===label(selected.course)[4]);
  $('room-meta').textContent=t(`${roommates.length} طالبًا موزعين على هذه القاعة · السعة ${D.capacities[selected.room]}`,`${roommates.length} students assigned · Capacity ${D.capacities[selected.room]}`);
  $('art-room').textContent=selected.room;
 }
 function renderSchedule(all=false){
  $('schedule-subtitle').textContent=courseLabel(course)+(selected?t(' · جدولك الشخصي',' · Your personal schedule'):t(' · اختر اسمك لإظهار القاعة',' · Select your name to see your room'));
  const dates=[...new Set(exams().map(e=>e.date))];if(!dates.includes(activeDate))activeDate=C.nextExam(exams())?.date||dates[dates.length-1];
  $('date-tabs').innerHTML=dates.map(date=>`<button type="button" data-date="${date}" class="${date===activeDate?'active':''}" aria-pressed="${date===activeDate}">${esc(formatDate(date,{weekday:'long'}))}<b>${esc(formatDate(date,{day:'numeric',month:'long'}))}</b></button>`).join('');
  const room=selected?.course===course?selected.room:null;
  $('timeline').innerHTML=(all?dates:[activeDate]).map(date=>{
   const rows=exams().filter(e=>e.date===date);
   return (all?`<h3 class="print-date">${esc(formatDate(date))}</h3>`:'')+rows.map((e,i)=>`${i?`<div class="break-row">${t('استراحة 10 دقائق · 17:10 – 17:20 · البقاء في المقاعد','10-minute break · 17:10–17:20 · Remain in your seat')}</div>`:''}<article class="exam-row"><div class="exam-time">${e.start} – ${e.end}<small>${t('40 دقيقة','40 minutes')}</small></div><div class="exam-info"><span class="exam-tag">${i===0?t('الاختبار الأول','FIRST TEST'):t('الاختبار الثاني','SECOND TEST')}</span><h3>${esc(e[lang==='ar'?'ar':'en'])}</h3>${lang==='ar'?`<p lang="en" dir="ltr">${esc(e.en)}</p>`:''}</div><div class="exam-location"><small>${t('مكان الاختبار','LOCATION')}</small>${room?esc(roomText(room)):t('ابحث عن اسمك','Find your name')}</div></article>`).join('');
  }).join('');
  renderNext();
 }
 function renderNext(){
  const now=new Date(),e=C.nextExam(exams(),now),box=$('next-exam');
  if(!e){box.innerHTML=`<div><strong>${t('اكتملت الاختبارات المبرمجة لهذا المستوى','All scheduled tests for this level have ended')}</strong><small>${t('يمكنك مراجعة التواريخ والجدول أدناه.','You can still review the dates and schedule below.')}</small></div><span>✓</span>`;return;}
  const ms=C.examDate(e)-now,ongoing=ms<=0;
  const mins=Math.ceil(Math.max(0,ms)/60000),days=Math.floor(mins/1440),hours=Math.floor((mins%1440)/60),minutes=mins%60;
  const countdown=ongoing?t('جارٍ الآن','In progress'):days?t(`${days} يوم · ${hours} س`,`${days}d · ${hours}h`):hours?t(`${hours} س · ${minutes} د`,`${hours}h · ${minutes}m`):t(`${minutes} دقيقة`,`${minutes} min`);
  box.innerHTML=`<div><strong>${ongoing?t('الاختبار الجاري: ','Current test: '):t('اختبارك القادم: ','Next test: ')}${esc(e[lang==='ar'?'ar':'en'])}</strong><small>${esc(formatDate(e.date))} · <bdi>${e.start} – ${e.end}</bdi>${selected?.course===course?' · '+esc(roomText(selected.room)):''}</small></div><span class="countdown">${esc(countdown)}</span>`;
 }
 function speechText(query=''){
  if(!selected)return t('ابحث عن اسمك أولًا، ثم اختر سجلك من القائمة.','Search for your name and select your record first.');
  const future=D.exams[selected.course].filter(e=>C.examDate(e,'end')>new Date());
  let chosen=future.length?future.filter(e=>e.date===future[0].date):D.exams[selected.course].filter(e=>e.date===D.exams[selected.course][0].date);
  const q=C.normalize(query),all=D.exams[selected.course];
  let requestedDate='';
  if(/(غدا|غد|tomorrow)/.test(q)){const d=new Date(Date.now()+86400000);requestedDate=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Algiers',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);}
  else if(/(اليوم|today)/.test(q)){requestedDate=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Algiers',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
  else {const match=q.match(/(?:^|\s)(15|16|22|23|24|29|30)(?:\s|$)/);if(match)requestedDate='2026-11-'+match[1];}
  if(requestedDate){chosen=all.filter(e=>e.date===requestedDate);if(!chosen.length)return t('لا يوجد اختبار مبرمج لك في '+formatDate(requestedDate)+'. قاعتك في الاختبارات المبرمجة هي '+roomText(selected.room)+'.','You have no scheduled test on '+formatDate(requestedDate)+'. Your assigned room is '+roomText(selected.room)+'.');}
  else if(q){
   const scored=all.map(e=>{const words=C.normalize(e[lang==='ar'?'ar':'en']).split(' ').filter(w=>w.length>3&&!['الكهربائيه','electrical','systems'].includes(w));return {e,score:words.filter(w=>q.includes(w)).length};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
   if(scored.length&& (scored.length===1||scored[0].score>scored[1].score))chosen=[scored[0].e];
  }
  if(/(الثاني|second)/.test(q)&&chosen.length>1)chosen=[chosen[1]];
  else if(/(الاول|first)/.test(q)&&chosen.length>1)chosen=[chosen[0]];
  const introduction=t(`مرحبًا ${selected.first}. مكان اختباراتك هو ${roomText(selected.room)}. `,`Hello ${selected.firstLatin}. Your tests take place in ${roomText(selected.room)}. `);
  return introduction+(!future.length?t('انتهت الاختبارات المبرمجة. هذا ملخص اليوم الأول. ','All scheduled tests have ended. Here is the first day for reference. '):'')+chosen.map((e,i)=>(i?t('بعد استراحة عشر دقائق، ','After a ten minute break, '):formatDate(e.date)+'. ')+t(`اختبار ${e.ar} من الساعة ${e.start} حتى ${e.end}. `,`${e.en}, from ${e.start} until ${e.end}. `)).join('');
 }
 function speakAnswer(query=''){
  const text=speechText(typeof query==='string'?query:'');status(text,text);
  if(!('speechSynthesis' in window)){toast('القراءة الصوتية غير مدعومة هنا. الإجابة مكتوبة فوق الجدول.','Speech playback is unavailable here. The answer is shown above.');return;}
  speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=lang==='ar'?'ar-DZ':'en-GB';u.rate=.92;
  const voices=speechSynthesis.getVoices(),match=voices.find(v=>v.lang.startsWith(lang==='ar'?'ar':'en'));if(match)u.voice=match;
  u.onerror=()=>toast('تعذر تشغيل الصوت على جهازك. الإجابة متاحة كتابةً.','Audio playback failed. The written answer remains available.');speechSynthesis.speak(u);
 }
 function startVoice(mode){
  if(!recognition){toast('البحث الصوتي غير مدعوم في هذا المتصفح. استخدم الكتابة أو جرّب Chrome.','Voice input is unavailable in this browser. Type your name or try Chrome.');return;}
  voiceMode=mode;recognition.lang=lang==='ar'?'ar-DZ':'en-GB';try{recognition.start();}catch{toast('الميكروفون قيد الاستخدام. انتظر لحظة ثم أعد المحاولة.','The microphone is busy. Please try again shortly.');}
 }
 function setupVoice(){
  const API=window.SpeechRecognition||window.webkitSpeechRecognition;if(!API){$('voice').title=t('الميكروفون غير مدعوم في هذا المتصفح','Voice input is unavailable in this browser');return;}
  recognition=new API();recognition.interimResults=false;recognition.maxAlternatives=1;
  recognition.onstart=()=>{$('voice').classList.add('listening');status('أستمع إليك… قل اسمك أو اسأل عن اختبارك بعد اختيار سجلك.','Listening… Say your name, or ask about your test after selecting your record.');};
  recognition.onend=()=>$('voice').classList.remove('listening');
  recognition.onerror=event=>{const denied=event.error==='not-allowed'||event.error==='service-not-allowed';status(denied?'لم يُسمح بالميكروفون. فعّله من إعدادات المتصفح أو استخدم الكتابة.':'لم ألتقط كلامًا واضحًا. جرّب مرة أخرى أو اكتب الاسم.',denied?'Microphone permission was denied. Enable it in browser settings or type your name.':'No clear speech was detected. Try again or type your name.');};
  recognition.onresult=async event=>{
   const transcript=event.results[0][0].transcript;
   if(voiceMode==='ask'&&selected){speakAnswer(transcript);return;}
   let q=C.normalize(transcript).replace(/\b(my name is|i am|find|room|please|search for)\b/g,' ').replace(/(اسمي|انا الطالب|انا الطالبه|انا|ابحث عن|ابحث لي عن|اريد قاعه|من فضلك)/g,' ').trim();
   search.value=q||transcript;await updateSearch();
   if(suggestions.length===1){selectStudent(suggestions[0],true);}else if(suggestions.length){status('سمعت: '+transcript+' — اختر اسمك من القائمة للتأكد.','I heard: '+transcript+' — please select your name from the list.');}else if(selected){speakAnswer(transcript);}
  };
 }
 function downloadCalendar(){
  const room=selected?.course===course?selected.room:null;
  const blob=new Blob([C.calendar(exams(),room,course,lang)],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`UKMO-${course}-November-2026.ics`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
  toast('افتح ملف التقويم على هاتفك واستورد المواعيد. تحقق من تفعيل تنبيه قبل 10 دقائق.','Open and import the calendar file on your phone. Check that the 10-minute reminder is enabled.');
 }
 async function enableReminders(){
  if(!selected){toast('اختر اسمك أولًا لتفعيل تنبيهات جدولك الشخصي.','Select your name first to enable personal reminders.');return;}
  if(!C.nextExam(D.exams[selected.course])){toast('لا توجد اختبارات قادمة في الجدول الحالي.','There are no upcoming tests in this schedule.');return;}
  if(reminders){reminders=false;$('reminder').textContent=t('تنبيه قبل 10 دقائق','Remind me 10 minutes before');toast('تم إيقاف تنبيهات الصفحة.','In-page reminders turned off.');return;}
  reminders=true;
  if('Notification' in window&&Notification.permission==='default'){try{await Notification.requestPermission();}catch{}}
  $('reminder').textContent=t('✓ التنبيه مفعّل — اضغط لإيقافه','✓ Reminders on — click to turn off');
  toast('تم تفعيل التنبيه ما دامت هذه الصفحة مفتوحة. أضف المواعيد للتقويم للتذكير بعد إغلاقها.','Reminders are on while this page stays open. Add dates to your calendar for reminders after closing it.');checkReminders();
 }
 function checkReminders(){
  if(!reminders||!selected)return;
  const now=new Date();D.exams[selected.course].forEach(e=>{
   const key=selected.id+e.date+e.start,delta=C.examDate(e)-now;
   if(delta>0&&delta<=600000&&!reminded.has(key)){
    reminded.add(key);const body=t(`${e.ar} يبدأ خلال ${Math.ceil(delta/60000)} دقائق · ${roomText(selected.room)}`,`${e.en} starts in ${Math.ceil(delta/60000)} minutes · ${roomText(selected.room)}`);
    toast(body,body);if('Notification'in window&&Notification.permission==='granted'){try{new Notification(t('اقترب موعد الاختبار','Your test is approaching'),{body,icon:'icon.svg',tag:key});}catch{}}
   }
  });
 }
 function setLanguage(){
  const oldFilter=$('search-level').value;lang=lang==='ar'?'en':'ar';document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';document.title=t('دليل قاعات الاختبارات | جامعة ورقلة','Exam Room Finder | University of Ouargla');
  document.querySelectorAll('[data-ar]').forEach(el=>el.innerHTML=el.dataset[lang]);
  document.querySelectorAll('[data-placeholder-ar]').forEach(el=>el.placeholder=el.dataset[lang==='ar'?'placeholderAr':'placeholderEn']);
  $('language').innerHTML=lang==='ar'?'EN <span>→</span>':'عربي <span>←</span>';$('language').setAttribute('aria-label',t('Switch to English','التبديل إلى العربية'));
  $('voice').setAttribute('aria-label',t('البحث بالصوت','Search by voice'));$('voice').title=t('البحث بالصوت','Search by voice');
  initializeOptions();$('search-level').value=oldFilter;if(selected){renderStudent();search.value=fullName(selected);}hideSuggestions();renderSchedule();status('','');
  if(reminders)$('reminder').textContent=t('✓ التنبيه مفعّل — اضغط لإيقافه','✓ Reminders on — click to turn off');
 }
 search.addEventListener('input',()=>{updateSearch().catch(()=>status('تعذر إكمال البحث. جرّب البحث بالاسم.','Could not complete this search. Try searching by name.'));});
 $('search-level').addEventListener('change',updateSearch);
 $('search-form').addEventListener('submit',async event=>{event.preventDefault();await updateSearch();if(suggestions.length===1)selectStudent(suggestions[0]);else if(suggestions.length){activeIndex=0;setActiveSuggestion();status('اختر اسمك من النتائج أدناه.','Choose your name from the matches below.');}});
 $('suggestions').addEventListener('click',event=>{const li=event.target.closest('[data-index]');if(li)selectStudent(suggestions[+li.dataset.index]);});
 function setActiveSuggestion(){document.querySelectorAll('#suggestions li').forEach((li,i)=>li.setAttribute('aria-selected',String(i===activeIndex)));const li=$('suggestion-'+activeIndex);if(li){search.setAttribute('aria-activedescendant',li.id);li.scrollIntoView({block:'nearest'});}}
 search.addEventListener('keydown',event=>{if(event.key==='Escape'){hideSuggestions();return;}if($('suggestion-wrap').hidden||!suggestions.length)return;if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();activeIndex=(activeIndex+(event.key==='ArrowDown'?1:-1)+suggestions.length)%suggestions.length;setActiveSuggestion();}else if(event.key==='Enter'&&activeIndex>=0){event.preventDefault();selectStudent(suggestions[activeIndex]);}});
 $('date-tabs').addEventListener('click',event=>{const button=event.target.closest('[data-date]');if(button){activeDate=button.dataset.date;renderSchedule();}});
 $('browse-course').addEventListener('change',()=>{course=$('browse-course').value;if(selected?.course!==course){selected=null;$('student-result').hidden=true;search.value='';$('art-room').textContent='D';reminders=false;$('reminder').textContent=t('تنبيه قبل 10 دقائق','Remind me 10 minutes before');}activeDate='';hideSuggestions();renderSchedule();status('','');});
 $('language').onclick=setLanguage;$('voice').onclick=()=>startVoice('search');$('ask').onclick=()=>startVoice('ask');$('speak').onclick=speakAnswer;$('calendar').onclick=downloadCalendar;$('reminder').onclick=enableReminders;$('print').onclick=()=>window.print();
 window.addEventListener('beforeprint',()=>renderSchedule(true));window.addEventListener('afterprint',()=>renderSchedule());
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){renderNext();checkReminders();}});
 initializeOptions();renderSchedule();setupVoice();setInterval(()=>{renderNext();checkReminders();},15000);
})();

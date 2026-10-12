(() => {
 const $=id=>document.getElementById(id);
 let articles=[],stats={correct:0,total:0,streak:0},phase='edit',busy=false;
 const selected=[null,null];const fields=['a','b'].map((letter,index)=>({letter,index,input:$('input-'+letter),list:$('suggest-'+letter),hint:$('hint-'+letter),generation:0,controller:null,timer:null,options:[],active:-1}));
 function status(message){$('status').textContent=message;}
 function ready(){ $('start').disabled=busy||selected.some(t=>!t)||selected[0]===selected[1]; }
 function close(field){field.list.hidden=true;field.input.setAttribute('aria-expanded','false');field.input.removeAttribute('aria-activedescendant');field.active=-1;}
 function invalidate(field){clearTimeout(field.timer);field.generation++;field.controller?.abort();close(field);}
 function setBusy(value){busy=value;$('random').disabled=value;fields.forEach(f=>f.input.disabled=value);ready();}
 function choose(field,title){invalidate(field);field.options=[];field.input.value=title;selected[field.index]=title;field.hint.textContent='✓ 選択済み';ready();status('');field.input.focus();}
 function highlight(field){Array.from(field.list.children).forEach((li,i)=>li.setAttribute('aria-selected',String(i===field.active)));if(field.active>=0)field.input.setAttribute('aria-activedescendant',field.list.children[field.active].id);else field.input.removeAttribute('aria-activedescendant');}
 fields.forEach(field=>{
  field.input.addEventListener('input',()=>{
   invalidate(field);selected[field.index]=null;ready();field.options=[];field.hint.textContent='英語の記事名を入力して候補を選択';
   const query=field.input.value.trim(),generation=field.generation;if(!query)return;
   field.hint.textContent='候補を探しています…';
   field.timer=setTimeout(async()=>{
    field.controller=new AbortController();
    try{
     const titles=await Wiki.searchTitles(query,field.controller.signal);if(generation!==field.generation)return;
     field.options=titles;field.list.replaceChildren();
     titles.forEach((title,i)=>{const li=document.createElement('li');li.textContent=title;li.id=`option-${field.letter}-${i}`;li.setAttribute('role','option');li.setAttribute('aria-selected','false');li.addEventListener('pointerdown',e=>{e.preventDefault();choose(field,title);});field.list.append(li);});
     field.list.hidden=!titles.length;field.input.setAttribute('aria-expanded',String(!!titles.length));field.hint.textContent=titles.length?'候補を選択してください':'記事が見つかりません。別の名前をお試しください。';
    }catch(error){if(generation!==field.generation)return;field.hint.textContent='取得に失敗しました。入力し直して再試行してください。';}
   },300);
  });
  field.input.addEventListener('keydown',event=>{
   if(event.key==='Escape'){invalidate(field);return;}
   if(field.list.hidden&&field.options.length&&!selected[field.index]&&(event.key==='ArrowDown'||event.key==='ArrowUp')){field.list.hidden=false;field.input.setAttribute('aria-expanded','true');}
   if(field.list.hidden)return;
   if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();field.active=field.active===-1?(event.key==='ArrowDown'?0:field.options.length-1):(field.active+(event.key==='ArrowDown'?1:-1)+field.options.length)%field.options.length;highlight(field);}
   if(event.key==='Enter'){event.preventDefault();if(field.active>=0)choose(field,field.options[field.active]);}
  });
  field.input.addEventListener('blur',()=>close(field));
  field.input.addEventListener('focus',()=>{if(field.options.length&&!selected[field.index]){field.list.hidden=false;field.input.setAttribute('aria-expanded','true');}});
 });
 function showMatch(value){
  articles=value;phase='guess';$('editor').hidden=true;$('match').hidden=false;$('result').hidden=true;
  fields.forEach((f,i)=>{invalidate(f);selected[i]=value[i].title;f.input.value=value[i].title;f.hint.textContent='✓ 選択済み';const card=$('card-'+f.letter);card.disabled=false;card.classList.remove('winner','loser');$('title-'+f.letter).textContent=value[i].title;$('bytes-'+f.letter).textContent='こちらが長いと思う ↗';});
  status('');$('card-a').focus();
 }
 async function load(random){
  if(busy)return;setBusy(true);fields.forEach(invalidate);status(random?'ランダムな記事を取得しています…':'記事の情報を取得しています…');
  try{showMatch(await (random?Wiki.randomArticles():Wiki.resolveArticles(selected)));}
  catch(error){status(error.name==='TimeoutError'?'通信がタイムアウトしました。もう一度お試しください。':error.message||'通信に失敗しました。もう一度お試しください。');}
  finally{setBusy(false);}
 }
 $('random').addEventListener('click',()=>load(true));$('start').addEventListener('click',()=>load(false));
 fields.forEach((field,choice)=>$('card-'+field.letter).addEventListener('click',()=>{
  if(phase!=='guess')return;phase='result';const outcome=Game.judge(articles,choice);stats=Game.updateStats(stats,outcome);
  fields.forEach((f,i)=>{const card=$('card-'+f.letter);card.disabled=true;if(outcome!=='tie')card.classList.add(articles[i].bytes>articles[1-i].bytes?'winner':'loser');$('bytes-'+f.letter).textContent=articles[i].bytes.toLocaleString('en-US')+' bytes';});
  $('verdict').textContent=outcome==='correct'?'正解！ Nice guess.':outcome==='tie'?'引き分け！ 同じByte数です。':'惜しい！ もう一度挑戦しよう。';
  const difference=Math.abs(articles[0].bytes-articles[1].bytes);$('difference').textContent=difference?'差は '+difference.toLocaleString('en-US')+' bytes。意外な結果でしたか？':'この問題は成績に含めません。';
  $('article-links').replaceChildren();articles.forEach(a=>{const link=document.createElement('a');link.href=a.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=a.title+' ↗';$('article-links').append(link);});
  $('correct').replaceChildren(document.createTextNode(String(stats.correct)));const total=document.createElement('span');total.textContent=' / '+stats.total;$('correct').append(total);$('streak').textContent=stats.streak;$('rate').textContent=stats.total?Math.round(stats.correct/stats.total*100)+'%':'—';$('result').hidden=false;$('next').focus();
 }));
 $('next').addEventListener('click',()=>{phase='edit';$('match').hidden=true;$('editor').hidden=false;status('記事を変更するか、ランダム出題で次の問題へ。');ready();fields[0].input.focus();});
})();

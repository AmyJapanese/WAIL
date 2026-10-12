(function(root){
 async function request(params,signal){
  const timeout=AbortSignal.timeout(15000);
  const response=await fetch('https://en.wikipedia.org/w/api.php?'+new URLSearchParams({origin:'*',format:'json',formatversion:'2',...params}),{signal:signal?AbortSignal.any([signal,timeout]):timeout});
  if(!response.ok)throw new Error('Wikipediaから取得できませんでした。もう一度お試しください。');
  const data=await response.json();if(data.error)throw new Error('Wikipediaの取得に失敗しました。');return data;
 }
 async function searchTitles(query,signal){if(!query.trim())return [];const data=await request({action:'opensearch',search:query,limit:'6',namespace:'0',redirects:'resolve'},signal);return data[1]||[];}
 async function resolveArticles(titles,signal){
  const data=await request({action:'query',prop:'info',redirects:'1',titles:titles.join('|')},signal);
  const pages=data.query?.pages||[];
  if(pages.length!==2||pages.some(p=>p.missing||p.invalid||p.ns>0||!Number.isSafeInteger(p.length)||p.length<0)||pages[0].pageid===pages[1].pageid)throw new Error('異なる2つの記事を選んでください。記事が存在するかも確認してください。');
  const map=new Map([...(data.query.normalized||[]),...(data.query.redirects||[])].map(p=>[p.from,p.to]));
  function canonical(title){const seen=new Set();while(map.has(title)&&!seen.has(title)){seen.add(title);title=map.get(title);}return title;}
  const ordered=titles.map(title=>pages.find(p=>p.title===canonical(title)));
  if(ordered.some(p=>!p)||ordered[0].pageid===ordered[1].pageid)throw new Error('異なる2つの記事を選んでください。');
  return ordered.map(p=>({pageid:p.pageid,title:p.title,bytes:p.length,url:'https://en.wikipedia.org/wiki/'+encodeURIComponent(p.title)}));
 }
 async function randomArticles(signal){
  for(let i=0;i<4;i++){
   const data=await request({action:'query',list:'random',rnnamespace:'0',rnfilterredir:'nonredirects',rnlimit:'2'},signal);
   const titles=data.query?.random?.map(p=>p.title)||[];
   if(titles.length===2&&titles[0]!==titles[1])return resolveArticles(titles,signal);
  }
  throw new Error('問題を取得できませんでした。もう一度お試しください。');
 }
 const api={searchTitles,resolveArticles,randomArticles};if(typeof module!=='undefined')module.exports=api;else root.Wiki=api;
})(globalThis);

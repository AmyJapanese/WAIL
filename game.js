(function(root){
 function judge(articles,choice){
  if(articles[0].bytes===articles[1].bytes)return 'tie';
  return articles[choice].bytes>articles[1-choice].bytes?'correct':'incorrect';
 }
 function updateStats(s,outcome){return outcome==='tie'?{...s}:{correct:s.correct+(outcome==='correct'?1:0),total:s.total+1,streak:outcome==='correct'?s.streak+1:0};}
 const api={judge,updateStats};if(typeof module!=='undefined')module.exports=api;else root.Game=api;
})(globalThis);

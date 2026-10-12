const {test}=require('node:test');
const assert=require('node:assert/strict');
const {judge,updateStats}=require('../game.js');
const wiki=require('../wiki.js');
test('larger article wins regardless of side',()=>{
 assert.equal(judge([{bytes:20},{bytes:10}],0),'correct');
 assert.equal(judge([{bytes:20},{bytes:10}],1),'incorrect');
 assert.equal(judge([{bytes:10},{bytes:20}],1),'correct');
});
test('tie does not change stats',()=>{
 assert.equal(judge([{bytes:10},{bytes:10}],1),'tie');
 const s={correct:2,total:3,streak:2};assert.deepEqual(updateStats(s,'tie'),s);
});
test('correct adds streak and incorrect resets it',()=>{
 const s={correct:2,total:3,streak:2};
 assert.deepEqual(updateStats(s,'correct'),{correct:3,total:4,streak:3});
 assert.deepEqual(updateStats(s,'incorrect'),{correct:2,total:4,streak:0});
});
const page=(pageid,title,length)=>({pageid,title,length});
test('resolve returns safe article identity and bytes',async()=>{
 global.fetch=async()=>({ok:true,json:async()=>({query:{pages:[page(1,'A & B',12),page(2,'C',42)]}})});
 const a=await wiki.resolveArticles(['A & B','C']);assert.equal(a[0].bytes,12);assert.equal(a[0].url,'https://en.wikipedia.org/wiki/A%20%26%20B');
});
test('rejects missing, same page and invalid sizes',async()=>{
 for(const pages of [[{missing:true},page(2,'C',42)],[page(1,'A',12)],[page(1,'A',-1),page(2,'C',42)]]){
 global.fetch=async()=>({ok:true,json:async()=>({query:{pages}})});
 await assert.rejects(wiki.resolveArticles(['A','C']));
 }
});
test('HTTP failure rejects instead of inventing bytes',async()=>{
 global.fetch=async()=>({ok:false,status:503});await assert.rejects(wiki.searchTitles('Earth'));
});
test('search preserves special characters as text',async()=>{
 global.fetch=async()=>({ok:true,json:async()=>['x',['A < B & C']]});
 assert.deepEqual(await wiki.searchTitles('A'),['A < B & C']);
});

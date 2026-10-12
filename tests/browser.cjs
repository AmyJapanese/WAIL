const {chromium}=require('C:/Users/hp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage({viewport:{width:1280,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let fail=false,tie=false;
 await page.route('https://en.wikipedia.org/w/api.php?*',async route=>{
  const params=new URL(route.request().url()).searchParams;
  if(fail){await route.fulfill({status:503,body:'error'});return;}
  let data;
  if(params.get('action')==='opensearch'){
   const q=params.get('search');if(q==='Old')await new Promise(r=>setTimeout(r,600));
   data=[q,q==='Multiple'?['First','Second','Last']:[q==='Old'?'Old result':q==='Same'?'Earth':q==='Special'?'A < B & C':q]];
  }else if(params.get('list')==='random')data={query:{random:[{title:'Earth'},{title:'Coffee'}]}};
  else {const titles=params.get('titles').split('|');data={query:{pages:titles.map((title,i)=>({pageid:i+1,ns:0,title,length:tie?100:i===0?100:200}))}};}
  await route.fulfill({json:data});
 });
 await page.goto('file:///'+path.resolve(__dirname,'../index.html').replaceAll('\\','/'));
 async function select(letter,title){await page.locator('#input-'+letter).fill(title);await page.locator('#suggest-'+letter+' li').first().waitFor();await page.locator('#input-'+letter).press('ArrowDown');await page.locator('#input-'+letter).press('Enter');}
 await page.locator('#input-a').fill('Multiple');await page.locator('#suggest-a li').first().waitFor();await page.locator('#input-b').focus();await page.locator('#input-a').focus();assert.equal(await page.locator('#suggest-a').isVisible(),true,'suggestions reopen on focus');await page.locator('#input-a').press('ArrowUp');assert.equal(await page.locator('#suggest-a [aria-selected=true]').innerText(),'Last','initial ArrowUp selects last');
 await select('a','Earth');await select('b','Coffee');await page.locator('#start').click();await page.locator('#match').waitFor();
 assert.equal(await page.locator('#bytes-a').innerText(),'こちらが長いと思う ↗');await page.locator('#card-b').click();assert.match(await page.locator('#verdict').innerText(),/正解/);assert.match(await page.locator('#bytes-b').innerText(),/200 bytes/);assert.equal(await page.locator('#streak').innerText(),'1');assert.equal(await page.locator('#card-a').isDisabled(),true);
 await page.locator('#next').click();await select('b','Same');assert.equal(await page.locator('#start').isDisabled(),true);
 await page.locator('#input-a').fill('Old');await page.waitForTimeout(350);await page.locator('#input-a').fill('New');await page.waitForTimeout(1000);assert.equal(await page.locator('#suggest-a').innerText(),'New');
 await select('a','Special');assert.equal(await page.locator('#input-a').inputValue(),'A < B & C');assert.equal(await page.locator('#input-a').getAttribute('aria-expanded'),'false');
 fail=true;await page.locator('#random').click();await page.waitForFunction(()=>document.getElementById('status').textContent.includes('取得できません'));assert.equal(await page.locator('#random').isDisabled(),false);
 fail=false;tie=true;await page.locator('#random').click();await page.locator('#match').waitFor();await page.locator('#card-a').click();assert.match(await page.locator('#verdict').innerText(),/引き分け/);assert.equal(await page.locator('#streak').innerText(),'1');assert.equal(await page.locator('#correct').innerText(),'1 / 1');
 await page.locator('#next').click();await page.screenshot({path:path.resolve(__dirname,'../preview-desktop.png'),fullPage:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.resolve(__dirname,'../preview-mobile.png'),fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
 console.log('Browser checks passed: free input, keyboard suggestions, hidden bytes, scoring, duplicate prevention, stale search, special characters, failure recovery, random, tie, mobile overflow.');
 await page.unroute('https://en.wikipedia.org/w/api.php?*');
 try{await page.locator('#random').click();await page.waitForFunction(()=>!document.getElementById('match').hidden,{},{timeout:25000});console.log('LIVE WIKIPEDIA: '+await page.locator('#title-a').innerText()+' / '+await page.locator('#title-b').innerText());await page.locator('#card-a').click();await page.locator('#next').click();await select('a','Earth');await select('b','Coffee');await page.locator('#start').click();await page.locator('#match').waitFor();console.log('LIVE SEARCH AND RESOLVE: '+await page.locator('#title-a').innerText()+' / '+await page.locator('#title-b').innerText());}
 catch(e){console.log('LIVE WIKIPEDIA unavailable: '+await page.locator('#status').innerText());}
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});

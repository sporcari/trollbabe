// Lancia tutti i test (t*.js: versione artifact; ts*.js: versione per GitHub) e riassume.
const {spawnSync}=require('child_process');
const fs=require('fs'),path=require('path');
const files=fs.readdirSync(__dirname).filter(f=>/^ts?\d+\.js$/.test(f)).sort((a,b)=>a.length-b.length||a.localeCompare(b));
let bad=0;
for(const f of files){
  const r=spawnSync('node',[path.join(__dirname,f)],{encoding:'utf8',timeout:180000});
  const out=(r.stdout||'')+(r.stderr||'');
  const ok=r.status===0&&!/^FAIL/m.test(out);
  if(!ok)bad++;
  console.log((ok?'OK   ':'FAIL ')+f+(ok?'':'\n'+out.split('\n').filter(l=>/FAIL|Error|assert/i.test(l)).slice(0,4).join('\n')));
}
console.log(bad?`\n${bad} test falliti su ${files.length}`:`\nTutti i ${files.length} test passati`);
process.exit(bad?1:0);

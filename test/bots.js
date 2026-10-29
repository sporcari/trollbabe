const {sleep}=require('./harness');
const rnd=()=>1+Math.floor(Math.random()*10);

async function tbBot(w,b){
  const T=w.__TB,G=T.G;
  if(!G||T.ROLE!=='tb')return false;
  const D=T.D,ACT=T.ACT,doc=w.document;
  const has=a=>!!doc.querySelector('#dock [data-act="'+a+'"]');
  const need=a=>{if(!has(a))throw new Error('Nel dock manca il pulsante '+a+' @ '+G.step+(G.conflict?'/'+G.conflict.stage+(G.conflict.kind?'/'+G.conflict.kind:''):''));};
  const c=G.conflict;
  switch(G.step){
    case 'tb_create':
      need('createPC');
      Object.assign(D,{pc_name:b.name||'Retta',pc_num:String(b.num||6),pc_magic:'troll',pc_fight:'melee',pc_social:'fun',pc_hair:'bruni',pc_horns:'a spirale',pc_hum:'una lettera',pc_troll:'un sasso',pc_cloth:'gilet',pc_kit:'due asce',pc_loc:'4'});
      await ACT.createPC();b.created=(b.created||0)+1;return true;
    case 'scene_play':{
      if(G.pc.status==='incap')return false;
      if(G.turn!=='tb')return false;
      if(!b.conflictDone&&b.declare&&b.sayCount>=1){
        need('cfOpen');await ACT.cfOpen();need('cfGo');
        D.cf_type=b.type||'fighting';D.cf_pace=String(b.pace||2);D.cf_goal='Lo fermo prima che colpisca';
        await ACT.cfGo();b.conflictDone=true;return true;
      }
      need('say');D.sp_text='Cammino e guardo ('+(b.sayCount||0)+').';b.sayCount=(b.sayCount||0)+1;await ACT.say();return true;}
    case 'scene_request':
      need('request');D.sr_text='Vado verso il fiume';if(G.pc.status!=='ok')D.sr_heal='yes';await ACT.request();return true;
    case 'conflict':
      switch(c.stage){
        case 'goal':need('setGoal');D.cg_goal='Lo calmo';D.cg_adj='up';await ACT.setGoal();return true;
        case 'fair':
          if(c.fair.turn!=='tb')return false;
          if(!c.fair.tb){need('fairSay');D.fr_text='Retta si pianta davanti a lui.';await ACT.fairSay();return true;}
          need('fairOk');await ACT.fairOk();return true;
        case 'step':
          if(c.step.gm===null)return false;
          need('stepSay');D.st_text='Retta incalza ('+c.series+').';await ACT.stepSay();return true;
        case 'roll':{
          need('roll');
          const v=b.rolls&&b.rolls.length?b.rolls.shift():rnd();
          if(b.useUiRoll){b.useUiRoll=false;await ACT.roll();}else await T.A.roll(v);
          return true;}
        case 'narr_tb':{
          if(c.kind==='alt_incap'){need('narrTB');D.nt_text='Striscia via tra le felci.';await ACT.narrTB();return true;}
          const items=T.availableItems(G);
          const cont=items.length&&(b.alwaysCont||Math.random()<0.6);
          D.nt_text='Il Goal sfugge ('+c.kind+').';D.nt_how='Ciò che ha sotto mano la rimette in piedi.';
          if(cont){need('narrCont');await ACT.narrCont();}else{need('narrStop');await ACT.narrStop();}
          return true;}
        case 'decide_tb':{
          const items=T.availableItems(G);
          if(c.kind==='incap'){
            if(items.length&&Math.random()<0.7){need('decideItem');D.dc_text='Afferra la sua pietra.';await ACT.decideItem();}
            else{need('decideStop');await ACT.decideStop();}
          }else{
            if(b.die){need('decideDie');D.dc_text='Cade nel fiume e non risale.';await ACT.decideDie();}
            else{need('decideAccept');await ACT.decideAccept();}
          }
          return true;}
        case 'rels':need('confirmRels');await ACT.confirmRels();return true;
      }
      return false;
    case 'rel_offer':
      if(b.relName&&!b.relDone){need('relPropose');D.ro_name=b.relName;D.ro_type='ally';D.ro_text='Gli tende la mano.';await ACT.relPropose();b.relDone=true;return true;}
      need('relSkip');await ACT.relSkip();return true;
    case 'interim':
      need('interim');D.im_delta='1';D.im_loc='8';D.im_scale='yes';await ACT.interim();return true;
  }
  return false;
}

async function gmBot(w,b){
  const T=w.__TB,G=T.G;
  if(!G||T.ROLE!=='gm')return false;
  const D=T.D,ACT=T.ACT,doc=w.document;
  const has=a=>!!doc.querySelector('#dock [data-act="'+a+'"]');
  const need=a=>{if(!has(a))throw new Error('Nel dock del GM manca '+a+' @ '+G.step+(G.conflict?'/'+G.conflict.stage:''));};
  const c=G.conflict;
  b.sceneSays=b.sceneSays||{};
  switch(G.step){
    case 'gm_prep':
      need('savePrep');Object.assign(D,{gp_where:'Un porto',gp_who:'Umani e troll',gp_stakes:'Oskel',gp_a:'Oskel vive',gp_b:'Oskel muore',gp_chars:'Orm — vuole onore\nEnnda — vuole pace',gp_notes:'nota'});
      await ACT.savePrep();return true;
    case 'scene_open':
      need('openScene');D.so_text='Scena '+(G.scene+1)+': nebbia sul molo.';D.so_npcs='Hrenk, Orm';await ACT.openScene();return true;
    case 'scene_play':{
      if(G.turn!=='gm')return false;
      const n=b.sceneSays[G.scene]||0;
      if(!b.gmConflict&&b.gmDeclare&&n>=1&&G.pc.status!=='incap'){
        need('cfOpen');await ACT.cfOpen();need('cfGo');D.cf_type='social';D.cf_pace='1';await ACT.cfGo();b.gmConflict=true;return true;
      }
      if(n<1){need('say');D.sp_text='Hrenk sbuffa sul molo.';D.sp_npcs='Skalgar';b.sceneSays[G.scene]=n+1;await ACT.say();return true;}
      if(G.scene>=(b.endAt||2)){need('beginEnding');await ACT.beginEnding();return true;}
      need('endScene');await ACT.endScene();return true;}
    case 'conflict':
      switch(c.stage){
        case 'pace':need('paceAdj');D.cp_adj='down';await ACT.paceAdj();return true;
        case 'fair':
          if(c.fair.turn!=='gm')return false;
          if(!c.fair.gm){need('fairSay');D.fr_text='Gli avversari si aprono a ventaglio.';await ACT.fairSay();return true;}
          need('fairOk');await ACT.fairOk();return true;
        case 'step':
          if(c.step.gm!==null)return false;
          if(c.series%2){need('stepNone');await ACT.stepNone();return true;}
          need('stepSay');D.st_text='Hrenk ritenta.';await ACT.stepSay();return true;
        case 'narr_gm':need('narrGM');D.ng_text='Un’unica immagine: '+c.kind;await ACT.narrGM();return true;
      }
      return false;
    case 'rel_approve':need('relApprove');await ACT.relApprove();return true;
    case 'ending':need('finishEnding');D.en_out='b';D.en_text='Il porto non sarà più lo stesso.';await ACT.finishEnding();return true;
  }
  return false;
}

async function runUntil(cond,actors,maxMs,label){
  const t0=Date.now();let idle=0;
  while(Date.now()-t0<maxMs){
    let acted=false;
    for(const [w,fn,b] of actors){
      try{ if(await fn(w,b))acted=true; }catch(e){throw new Error((label||'')+' bot error: '+e.message);}
    }
    if(cond())return true;
    await sleep(acted?15:30);
  }
  return false;
}
module.exports={tbBot,gmBot,runUntil,rnd};

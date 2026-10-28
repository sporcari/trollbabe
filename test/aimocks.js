const ai={
  gm_prep:()=>({where:'Un porto fumoso',who:'Umani e troll',stakes:'Oskel',a:'vive',b:'muore',characters:[{name:'Orm',want:'onore'}],notes:'segreto-chiave'}),
  scene_open:()=>({text:'Nebbia sul molo.',npcs:['Orm'],heal:false}),
  gm_respond:(n)=>n===1?{text:'Hrenk ti squadra.',npcs:['Hrenk']}:n===2?{text:'Sputa.',conflict:{type:'social',pace:2}}:n===3?{text:'Fine.',end_scene:true}:n===4?{text:'Altra nebbia.'}:{text:'Il molo brucia.',end_adventure:true},
  fair_gm:()=>({text:'Hrenk avanza.'}),narr_gm:()=>({text:'Un colpo netto.'}),ending:()=>({outcome:'b',text:'Il porto cade.'}),
};
const mkFetch=(counter)=>async(url,init,body)=>{
  const t=/=== COMPITO \[(\w+)\] ===/.exec(body.messages[0].content)[1];
  counter[t]=(counter[t]||0)+1;
  const f=ai[t];if(!f)return {ok:false,status:500,json:async()=>({error:{message:'nessun mock '+t}})};
  return {ok:true,status:200,json:async()=>({content:[{type:'text',text:'```json\n'+JSON.stringify(f(counter[t]))+'\n```'}]})};
};

module.exports={ai,mkFetch};

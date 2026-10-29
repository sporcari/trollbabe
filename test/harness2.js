const {JSDOM}=require('jsdom');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function makePeerClass(registry,opts){
  opts=opts||{};
  class Conn{constructor(p){this.peer=p;this.h={};this.open=false;this.other=null;}
    on(e,f){(this.h[e]=this.h[e]||[]).push(f);return this;}
    emit(e,...a){(this.h[e]||[]).forEach(f=>f(...a));}
    send(d){const o=this.other,s=JSON.stringify(d);setTimeout(()=>{if(o&&o.open&&this.open)o.emit('data',JSON.parse(s));},2);}
    close(){if(!this.open)return;this.open=false;const o=this.other;if(o&&o.open){o.open=false;setTimeout(()=>o.emit('close'),2);}this.emit('close');}}
  return class Peer{
    constructor(id){this.id=id||('p-'+Math.random().toString(36).slice(2,8));this.destroyed=false;this.h={};this.conns=[];
      if(registry.has(this.id)){setTimeout(()=>this.emit('error',{type:'unavailable-id'}),5);}
      else{registry.set(this.id,this);setTimeout(()=>{if(!this.destroyed)this.emit('open',this.id);},5);}}
    on(e,f){(this.h[e]=this.h[e]||[]).push(f);return this;}
    emit(e,...a){(this.h[e]||[]).forEach(f=>f(...a));}
    connect(id){const c=new Conn(this);this.conns.push(c);
      setTimeout(()=>{const t=registry.get(id);
        if(!t||t.destroyed||opts.down){this.emit('error',{type:'peer-unavailable'});return;}
        const c2=new Conn(t);c.other=c2;c2.other=c;t.conns.push(c2);t.emit('connection',c2);
        setTimeout(()=>{c.open=true;c2.open=true;c.emit('open');c2.emit('open');},3);},5);
      return c;}
    destroy(){this.destroyed=true;if(registry.get(this.id)===this)registry.delete(this.id);this.conns.forEach(c=>{try{c.close();}catch(e){}});}
  };
}
function makeStandalone(registry,o){
  o=o||{};
  const html=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
  const fetches=[];
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://sporcari.github.io/trollbabe/',beforeParse(w){
    w.HTMLCanvasElement.prototype.getContext=()=>null;// jsdom non disegna: la mappa si prova a parte
    w.__TB_TEST__=true;
    w.Peer=makePeerClass(registry,o.peer);
    if(o.ls)Object.keys(o.ls).forEach(k=>w.localStorage.setItem(k,o.ls[k]));
    w.fetch=async(url,init)=>{
      const body=JSON.parse(init.body);fetches.push({url,init,body});
      if(o.fetch)return o.fetch(url,init,body);
      return {ok:true,status:200,json:async()=>({content:[{type:'text',text:'{}'}]})};
    };
    w.__fetches=fetches;
  }});
  return dom.window;
}
const lsDump=w=>{const o={};for(let i=0;i<w.localStorage.length;i++){const k=w.localStorage.key(i);o[k]=w.localStorage.getItem(k);}return o;};
module.exports={makeStandalone,sleep,lsDump};

// ► Pegá acá la URL del Apps Script. Si queda vacío, el formulario abre un mail prearmado.
const FORM_ENDPOINT = "https://script.google.com/macros/s/AKfycbxg0CYL3-NOZPaGWs8Jh5UhXsd-IApnAMhDif5PugpGtZQ-DzOYf2wpDEoN5w2qxnI/exec";

const root=document.documentElement, header=document.querySelector("header");
const secs=[...document.querySelectorAll("main > section[data-temp]")];
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const mix=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t));
const rgb=c=>`rgb(${c[0]},${c[1]},${c[2]})`;
let temp=90;
function update(){
  const mid=scrollY+innerHeight*.5;
  let i=0; while(i<secs.length-1 && secs[i+1].offsetTop<=mid) i++;
  const a=secs[i], b=secs[Math.min(i+1,secs.length-1)];
  const span=Math.max(1,(b.offsetTop-a.offsetTop));
  const t=a===b?0:Math.min(1,Math.max(0,(mid-a.offsetTop)/span));
  const e=t*t*(3-2*t);
  const bg=mix(hex(a.dataset.bg),hex(b.dataset.bg),e), ac=mix(hex(a.dataset.accent),hex(b.dataset.accent),e);
  temp=+a.dataset.temp+(+b.dataset.temp - +a.dataset.temp)*e;
  root.style.setProperty("--bg",rgb(bg)); root.style.setProperty("--accent",rgb(ac)); root.style.setProperty("--glow",ac.join(","));
  document.getElementById("tval").textContent=Math.round(temp);
  document.getElementById("tdot").style.top=((90-temp)/90*100).toFixed(1)+"%";
  document.getElementById("tlab").textContent=(t<.5?a:b).dataset.label;
  header.classList.toggle("solid",scrollY>40);
}
addEventListener("scroll",update,{passive:true}); addEventListener("resize",update); update();

const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll(".reveal").forEach(el=>io.observe(el));

// ambient: steam when hot, drifting cold particles + water lines when cold
(()=>{
  const c=document.getElementById("fx"), x=c.getContext("2d");
  if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let W,H,dpr; const P=[];
  const size=()=>{dpr=Math.min(devicePixelRatio||1,2);W=c.width=innerWidth*dpr;H=c.height=innerHeight*dpr};
  size(); addEventListener("resize",size);
  const N=innerWidth<700?22:42;
  for(let i=0;i<N;i++)P.push({x:Math.random(),y:Math.random(),r:.3+Math.random()*.7,s:.2+Math.random()*.6,p:Math.random()*6.28});
  const R=[];let lastR=0;
  addEventListener("pointermove",e=>{const now=performance.now();if(now-lastR<90)return;lastR=now;R.push({x:e.clientX*dpr,y:e.clientY*dpr,r:0,a:1})},{passive:true});
  addEventListener("pointerdown",e=>{R.push({x:e.clientX*dpr,y:e.clientY*dpr,r:0,a:1.4})},{passive:true});
  let tt=0;
  (function loop(){
    tt+=.006; x.clearRect(0,0,W,H);
    const heat=Math.max(0,Math.min(1,(temp-30)/60)), cold=Math.max(0,Math.min(1,(30-temp)/28));
    const ac=getComputedStyle(root).getPropertyValue("--glow");
    if(heat>0.02){
      for(const p of P){
        p.y-=.0009*p.s*(1+heat); if(p.y<-.15){p.y=1.1;p.x=Math.random()}
        const px=(p.x+Math.sin(tt*2+p.p)*.02)*W, py=p.y*H, rad=(60+p.r*140)*dpr;
        const g=x.createRadialGradient(px,py,0,px,py,rad);
        g.addColorStop(0,`rgba(${ac},${.05*heat*(1-p.y*.5)})`); g.addColorStop(1,"rgba(0,0,0,0)");
        x.fillStyle=g; x.beginPath(); x.arc(px,py,rad,0,6.283); x.fill();
      }
    }
    if(cold<=0.02)R.length=0;
    if(cold>0.02){
      x.lineWidth=1*dpr;
      for(let k=0;k<5;k++){
        const base=H*(.62+k*.08);
        x.strokeStyle=`rgba(${ac},${(.16-k*.022)*cold})`; x.beginPath();
        for(let px=0;px<=W;px+=12*dpr){const y=base+Math.sin(px/(140*dpr)+tt*3+k)*10*dpr+Math.sin(px/(57*dpr)-tt*2)*4*dpr; px?x.lineTo(px,y):x.moveTo(px,y)}
        x.stroke();
      }
      for(let i=R.length-1;i>=0;i--){const q=R[i];q.r+=2.2*dpr;q.a-=.012;if(q.a<=0){R.splice(i,1);continue}
        for(let k=0;k<2;k++){x.strokeStyle=`rgba(${ac},${Math.min(.5,q.a*.4)*cold/(k+1)})`;x.beginPath();x.ellipse(q.x,q.y,q.r*(1+k*.5),q.r*.42*(1+k*.5),0,0,6.283);x.stroke()}}
      for(const p of P){ const px=p.x*W, py=((p.y+tt*.05*p.s)%1)*H; x.fillStyle=`rgba(${ac},${.35*cold*p.r})`; x.fillRect(px,py,1.4*dpr,1.4*dpr) }
    }
    requestAnimationFrame(loop);
  })();
})();


const form=document.getElementById("lista"), err=document.getElementById("err");
form.addEventListener("submit",async ev=>{
  ev.preventDefault();
  const d=new FormData(form);
  if(d.get("empresa")) return; // bot
  if(Date.now()-FORM_T0<3000||form.dataset.busy) return; // envío demasiado rápido o repetido
  form.dataset.busy="1";
  const nombre=(d.get("nombre")||"").trim(), wa=(d.get("whatsapp")||"").replace(/\D/g,""), email=(d.get("email")||"").trim();
  if(nombre.length<2||nombre.length>80||wa.length<8||wa.length>15||email.length>120||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){err.style.display="block";delete form.dataset.busy;return}
  err.style.display="none";
  const q=new URLSearchParams(location.search);
  const data={nombre,whatsapp:d.get("whatsapp").trim(),email,membresia:d.get("membresia"),horario:d.get("horario"),origen:d.get("origen"),utm_source:q.get("utm_source")||q.get("ref")||"",pagina:location.href};
  const btn=form.querySelector("button");btn.disabled=true;btn.textContent="Enviando…";
  if(FORM_ENDPOINT){
    try{await fetch(FORM_ENDPOINT,{method:"POST",mode:"no-cors",body:new URLSearchParams(data)});form.classList.add("sent")}
    catch(e){btn.disabled=false;btn.textContent="Solicitar mi lugar";delete form.dataset.busy;err.innerHTML='No se pudo enviar. <a href="https://wa.me/5491156669528?text=Hola%2C%20quiero%20mi%20lugar%20Founder%20en%20SHIRO." target="_blank" rel="noopener" style="color:inherit">Escribinos por WhatsApp</a> y te anotamos.';err.style.display="block"}
  }else{
    const body=Object.entries(data).map(([k,v])=>k+": "+v).join("\n");
    location.href="mailto:santicastro@shirowellness.com?subject="+encodeURIComponent("Lista Founders — "+nombre)+"&body="+encodeURIComponent(body);
    form.classList.add("sent");
  }
});

// ---- breathing (starts on demand, 3 cycles of 10 s)
(()=>{const sec=document.getElementById("balance"),w=document.getElementById("bw"),btn=document.getElementById("borb"),hint=document.getElementById("bhint"),sub=document.getElementById("bsub");let tm,to;
 const say=t=>{if(w.textContent===t)return;w.style.opacity=0;setTimeout(()=>{w.textContent=t;w.style.opacity=1},300)};
 const stop=(msg)=>{clearInterval(tm);clearTimeout(to);sec.classList.remove("run");say(msg||"Respirá");hint.textContent="Tocá el círculo para comenzar";btn.dataset.on=""};
 btn.addEventListener("click",()=>{
   if(btn.dataset.on){stop();return}
   btn.dataset.on="1";hint.textContent="Tocá para detener";sec.classList.remove("run");void sec.offsetWidth;sec.classList.add("run");
   let i=0;say("Inhalá");
   tm=setInterval(()=>{i++;const c=i%10;say(c<4?"Inhalá":c<5?"Sostené":"Exhalá")},1000);
   to=setTimeout(()=>{stop("Balance.");sub.textContent="Así se siente volver a tu día.";hint.textContent="Tocá para repetir";},30000);
 });
 new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting&&btn.dataset.on)stop()}),{threshold:0}).observe(sec);
})();

// ---- planta interactiva
(()=>{const sp=document.querySelectorAll(".plan-i .spot"),t=document.getElementById("pcT"),d=document.getElementById("pcD");
 sp.forEach(b=>{b.setAttribute("aria-pressed","false");b.addEventListener("click",()=>{sp.forEach(o=>o.setAttribute("aria-pressed","false"));b.setAttribute("aria-pressed","true");t.textContent=b.dataset.t;d.textContent=b.dataset.d})})})();


// ===== premium motion =====
(()=>{
 const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
 const go=()=>root.classList.add("go");
 // intro: once per session
 const intro=document.getElementById("intro");let seen=false;
 try{seen=sessionStorage.getItem("shiroIntro")==="1";sessionStorage.setItem("shiroIntro","1")}catch(e){}
 if(reduce||seen){intro.remove();go()}else{
   const out=()=>{if(intro.classList.contains("out"))return;intro.classList.add("out");setTimeout(go,250);setTimeout(()=>intro.remove(),1200)};
   intro.addEventListener("click",out);setTimeout(out,2100);
 }
 if(reduce)return;
 // titles word by word
 const split=el=>{let n=0;const walk=node=>{[...node.childNodes].forEach(c=>{
   if(c.nodeType===3){const parts=c.textContent.split(/(\s+)/);const f=document.createDocumentFragment();
     parts.forEach(p=>{if(!p)return;if(/^\s+$/.test(p)){f.appendChild(document.createTextNode(p));return}
       const w=document.createElement("span");w.className="w";const i=document.createElement("i");i.textContent=p;i.style.setProperty("--d",(n++*0.06)+"s");w.appendChild(i);f.appendChild(w)});
     c.replaceWith(f)}else if(c.nodeType===1)walk(c)})};walk(el);el.classList.add("split")};
 document.querySelectorAll("h2.reveal").forEach(split);
 // count up numbers when revealed
 const count=el=>{const tn=[...el.childNodes].find(c=>c.nodeType===3&&/^\s*\d+/.test(c.textContent));if(!tn)return;
   const m=tn.textContent.match(/^(\s*)(\d+)(.*)$/s);if(!m||/^\s*\d+\s*[–-]/.test(tn.textContent))return;
   const end=+m[2],t0=performance.now(),dur=1400;
   const step=t=>{const k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,3);tn.textContent=m[1]+Math.round(end*e)+m[3];if(k<1)requestAnimationFrame(step)};
   tn.textContent=m[1]+"0"+m[3];requestAnimationFrame(step)};
 const cio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){count(e.target);cio.unobserve(e.target)}}),{threshold:.6});
 document.querySelectorAll(".specs b,.stat .n,.visit b,.state .deg").forEach(el=>cio.observe(el));
 // plan zoom on scroll
 const plan=document.querySelector(".f-plan");
 if(plan){const z=()=>{const r=plan.getBoundingClientRect(),k=Math.min(1,Math.max(0,1-(r.top/innerHeight)));plan.style.setProperty("--z",(1.08-k*0.08).toFixed(3))};addEventListener("scroll",z,{passive:true});z()}
 // cursor + magnetic buttons (desktop only)
 if(matchMedia("(hover:hover) and (pointer:fine)").matches){
   const c=document.getElementById("cur"),d=document.getElementById("curDot");let mx=innerWidth/2,my=innerHeight/2,cx=mx,cy=my;
   addEventListener("pointermove",e=>{mx=e.clientX;my=e.clientY;d.style.transform=`translate(${mx}px,${my}px)`},{passive:true});
   (function f(){cx+=(mx-cx)*.16;cy+=(my-cy)*.16;c.style.transform=`translate(${cx}px,${cy}px)`;requestAnimationFrame(f)})();
   document.querySelectorAll("a,button,summary,.spot").forEach(el=>{el.addEventListener("pointerenter",()=>c.classList.add("big"));el.addEventListener("pointerleave",()=>c.classList.remove("big"))});
   document.querySelectorAll(".btn").forEach(b=>{b.addEventListener("pointermove",e=>{const r=b.getBoundingClientRect();b.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.18}px,${(e.clientY-r.top-r.height/2)*.28}px)`});b.addEventListener("pointerleave",()=>b.style.transform="")});
 }
})();


// ===== Asociate → Mercado Pago =====
// ► Pegá acá el link de suscripción de cada plan, creado en tu cuenta de Mercado Pago
//   (Tu negocio → Suscripciones → Crear plan → copiar link). Si un link queda vacío,
//   ese plan lleva al formulario Founders en lugar de al pago.
const MP_PLANS = [
  {id:"White", price:"USD 66", desc:"Calm Hours, todos los días.", url:""},
  {id:"Core",  price:"USD 100", desc:"Calm todos los días + 3 Peak por semana.", url:""},
  {id:"Black", price:"USD 132", desc:"Todo ilimitado, 40 lugares.", url:""}
];
(()=>{
 const okUrl=u=>{try{const x=new URL(u);return x.protocol==="https:"&&/(^|\.)mercadopago\.com(\.ar)?$|(^|\.)mpago\.la$/.test(x.hostname)}catch(e){return false}};
 const list=document.getElementById("plans"),dlg=document.getElementById("payDlg"),btn=document.getElementById("joinBtn");
 MP_PLANS.forEach(p=>{const row=document.createElement("div");row.className="plan"+(p.id==="Black"?" black":"");
   const b=document.createElement("b");b.textContent=p.id.toUpperCase();
   const pr=document.createElement("div");pr.className="pr";pr.textContent=p.price;const sm=document.createElement("small");sm.textContent=" / mes";pr.appendChild(sm);
   const d=document.createElement("p");d.textContent=p.desc;
   const a=document.createElement("a");a.className="go";
   if(okUrl(p.url)){a.href=p.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent="Pagar"}
   else{a.href="#founders";a.textContent="Solicitar";a.addEventListener("click",()=>{dlg.close();const r=document.querySelector('input[name=membresia][value="'+p.id+'"]');if(r)r.checked=true})}
   row.append(b,pr,d,a);list.appendChild(row)});
 btn.addEventListener("click",()=>{if(typeof dlg.showModal==="function")dlg.showModal();else location.hash="#founders"});
 document.getElementById("payClose").addEventListener("click",()=>dlg.close());
 dlg.addEventListener("click",e=>{if(e.target===dlg)dlg.close()});
 // show after the hero, hide over the Founders form
 const hero=document.querySelector(".hero"),form=document.getElementById("founders");let pastHero=false,onForm=false;
 const sync=()=>{const show=pastHero&&!onForm;btn.classList.toggle("show",show);document.body.classList.toggle("has-join",show)};
 new IntersectionObserver(e=>{pastHero=!e[0].isIntersecting;sync()},{threshold:.15}).observe(hero);
 new IntersectionObserver(e=>{onForm=e[0].isIntersecting;sync()},{threshold:.25}).observe(form);
})();

// ===== protección del formulario =====
const FORM_T0=Date.now();

// ---- black card tilt
(()=>{const card=document.getElementById("bcard");if(!card)return;const wrap=card.parentElement;
 const move=(cx,cy)=>{const r=card.getBoundingClientRect(),x=(cx-r.left)/r.width,y=(cy-r.top)/r.height;
   card.style.transform=`rotateY(${(x-.5)*18}deg) rotateX(${(.5-y)*14}deg)`;card.style.setProperty("--mx",x*100+"%");card.style.setProperty("--my",y*100+"%")};
 wrap.addEventListener("pointermove",e=>move(e.clientX,e.clientY));
 wrap.addEventListener("pointerleave",()=>{card.style.transform="";});
 if(matchMedia("(hover:none)").matches&&!matchMedia("(prefers-reduced-motion: reduce)").matches){let a=0;(function f(){a+=.012;card.style.transform=`rotateY(${Math.sin(a)*8}deg) rotateX(${Math.cos(a*.7)*5}deg)`;card.style.setProperty("--mx",50+Math.sin(a)*40+"%");requestAnimationFrame(f)})()}
})();

// ---- ambient sound (procedural, off by default)
(()=>{const btn=document.getElementById("sound");let ctx,master,fireG,waterG,on=false,raf,crackRun=false,crack;
 function build(){ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
  const len=ctx.sampleRate*4,buf=ctx.createBuffer(1,len,ctx.sampleRate),d=buf.getChannelData(0);let b=0;for(let i=0;i<len;i++){const w=Math.random()*2-1;b=(b+.02*w)/1.02;d[i]=b*3.5}
  // water: brown noise, bandpassed, slow swell
  const wn=ctx.createBufferSource();wn.buffer=buf;wn.loop=true;const bp=ctx.createBiquadFilter();bp.type="lowpass";bp.frequency.value=900;
  waterG=ctx.createGain();waterG.gain.value=0;const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=.12;lg.gain.value=.25;lfo.connect(lg);lg.connect(waterG.gain);
  wn.connect(bp);bp.connect(waterG);waterG.connect(master);wn.start();lfo.start();
  // fire: low rumble + random crackles
  const fn=ctx.createBufferSource();fn.buffer=buf;fn.loop=true;const lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.value=260;fireG=ctx.createGain();fireG.gain.value=0;fn.connect(lp);lp.connect(fireG);fireG.connect(master);fn.start();
  crack=()=>{if(!on){crackRun=false;return}const heat=Math.max(0,Math.min(1,(temp-30)/60));if(heat>.1&&Math.random()<heat){const o=ctx.createBufferSource();o.buffer=buf;const hp=ctx.createBiquadFilter();hp.type="highpass";hp.frequency.value=1800+Math.random()*2500;const g=ctx.createGain();const t=ctx.currentTime;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.35*heat*Math.random()+.05,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+.03+Math.random()*.05);o.connect(hp);hp.connect(g);g.connect(fireG);o.start(t,Math.random()*3,.12)}setTimeout(crack,60+Math.random()*420)};
 }
 function mixLoop(){if(!on)return;const heat=Math.max(0,Math.min(1,(temp-25)/60)),cold=1-heat,t=ctx.currentTime;
  fireG.gain.setTargetAtTime(.9*heat,t,.4);waterG.gain.setTargetAtTime(.55*cold+.05,t,.4);raf=requestAnimationFrame(mixLoop)}
 btn.addEventListener("click",()=>{if(!ctx)build();on=!on;btn.classList.toggle("on",on);btn.setAttribute("aria-pressed",on);
  if(on){ctx.resume();master.gain.setTargetAtTime(.5,ctx.currentTime,.6);mixLoop();if(!crackRun){crackRun=true;crack()}}else{master.gain.setTargetAtTime(0,ctx.currentTime,.3);cancelAnimationFrame(raf)}});
})();

// ---- founders counter (only real data: rows marked "Founder confirmado" in the sheet)
const FOUNDERS_TOTAL=50, FOUNDERS_MIN_SHOW=20;
(async()=>{if(!FORM_ENDPOINT)return;try{const r=await fetch(FORM_ENDPOINT+"?count=1");const j=await r.json();const n=+j.founders||0;if(n<FOUNDERS_MIN_SHOW)return;
 const el=document.getElementById("fcount");el.querySelector(".big").innerHTML=`${n}<small> / ${FOUNDERS_TOTAL} Founders</small>`;el.classList.add("show");
 setTimeout(()=>el.querySelector(".bar i").style.width=Math.min(100,n/FOUNDERS_TOTAL*100)+"%",300)}catch(e){}})();

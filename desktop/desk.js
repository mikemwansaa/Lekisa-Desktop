/* Lekisa desktop shell. Runs on top of core.js (the mobile logic), so data, sync, vault and AI are identical. */
(()=>{"use strict";
const L=window.LK,{h,ic,K,F,T,short,$}=L;
const NS="http://www.w3.org/2000/svg";
const PATHS={search:"M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5",lock:"M6 11h12v10H6zM8 11V7a4 4 0 018 0v4",sun:"M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19",moon:"M20 14A8 8 0 0110 4a8 8 0 1010 10z",panel:"M3 4h18v16H3zM9 4v16",dots:"M5 12h.01M12 12h.01M19 12h.01",chev:"M9 6l6 6-6 6"};
const ico=n=>{if(!PATHS[n])return ic(n);const s=document.createElementNS(NS,"svg");s.setAttribute("viewBox","0 0 24 24");s.setAttribute("aria-hidden","true");const p=document.createElementNS(NS,"path");p.setAttribute("d",PATHS[n]);s.append(p);return s};

const NAV=[
 {g:"Overview",items:[["home","Home","home"]]},
 {g:"Build",items:[["sell","Record sale","plus"],["exp","Add expense","receipt"],["hist","Records","list"]]},
 {g:"Grow",items:[["ai","Lekisa AI","wave"],["grow","Grow","up"],["mm","Money Match","bank"]]},
 {g:"Comply",items:[["tax","Tax","bank"]]},
 {g:"Account",items:[["settings","Settings","gear"],["feedback","Feedback","doc"]]}];
const FLAG={ai:()=>F("ai"),grow:()=>F("grow"),mm:()=>F("money_match"),feedback:()=>F("feedback")};
const shown=k=>!FLAG[k]||FLAG[k]();
const TITLE={home:"Home",sell:"Record a sale",exp:"Add expense",hist:"Records",ai:"Lekisa AI",grow:"Grow",mm:"Money Match",tax:"Tax",settings:"Settings",feedback:"Feedback",pass:"Change passphrase",receipt:"Receipt"};
const SUB={hist:"Every sale and expense on this account.",grow:"Monthly summary and business insights.",settings:"Your account, appearance and session.",ai:"Say or type what happened. Check it, then confirm.",mm:"Match mobile money messages to your records."};
const CARD=new Set(["sell","exp","pass","feedback","receipt"]);
const WIDE=new Set(["home","hist","grow","settings","ai","mm","tax"]);
const st={tab:{},R:{q:"",type:"all",status:"all",key:"ts",dir:-1},cper:0};
const live=x=>x.status!=="reversed"&&x.status!=="corrected";
const text=x=>(x.note+" "+(x.cat||"")+" "+x.m+" "+(x.ref||"")+" "+x.amt/100+" "+(x.t==="sale"?"sale":"expense")).toLowerCase();
const label=x=>x.note||x.cat||(x.t==="sale"?"Sale":"Expense");
const signed=x=>(x.t==="exp"?"\u2212":"+")+K(x.amt);

// ---------- small helpers ----------
const phead=(t,sub,acts,tabs)=>h("div",{class:"ph"},h("div",{class:"pht"},h("div",{},h("h1",{},t),sub&&h("p",{class:"sub"},sub)),h("div",{class:"acts"},acts)),tabs);
const newBtns=()=>[h("button",{class:"btn ghost",title:"Shortcut: E",onclick:()=>L.go("exp")},"Add expense"),h("button",{class:"btn",title:"Shortcut: N",onclick:()=>L.go("sell")},"Record sale")];
const tabsBar=(v,items)=>{const i=Math.min(st.tab[v]||0,items.length-1);return h("div",{class:"tabs",role:"tablist"},items.map((x,j)=>h("button",{role:"tab","aria-selected":String(j===i),onclick:()=>{st.tab[v]=j;L.render()}},x)))};
const badge=x=>{const s=x.status||"recorded",pend=!x.sync&&s==="recorded";return h("span",{class:"st2 "+(pend?"wait":s)},h("i"),pend?"Not sent yet":s[0].toUpperCase()+s.slice(1))};
const dl=(name,txt)=>{const a=h("a",{href:URL.createObjectURL(new Blob([txt],{type:"text/csv"})),download:name});document.body.append(a);a.click();a.remove()};
const toggleSide=()=>{const c=L.ls.get("desk_side")==="1";L.ls.set("desk_side",c?"0":"1");$("#app").classList.toggle("collapsed",!c)};

function modal(title,body,okLabel,onOk,onCancel){
 const err=h("p",{class:"err",role:"alert"});
 let saved=false;
 const close=()=>{ov.remove();document.removeEventListener("keydown",esc);if(!saved&&onCancel)onCancel()};
 const ok=h("button",{class:"btn",onclick:async()=>{const r=await onOk();if(r)err.textContent=r;else{saved=true;close()}}},okLabel);
 const ov=h("div",{class:"ov",onclick:e=>{if(e.target===ov)close()}},h("div",{class:"dlg",role:"dialog","aria-modal":"true","aria-label":title,onkeydown:e=>{if(e.key==="Enter"&&e.target.tagName==="INPUT")ok.click()}},h("h1",{},title),body,err,h("div",{class:"dact"},h("button",{class:"btn ghost",onclick:close},"Cancel"),ok)));
 const esc=e=>{if(e.key==="Escape")close()};
 document.addEventListener("keydown",esc);document.body.append(ov);const f=ov.querySelector("input");if(f)f.focus();else ok.focus();
}

// Electron has no window.prompt(); the shared Lekisa AI code calls this instead (resolves to the text, or null if cancelled).
window.LK_ASK=(msg,def)=>new Promise(res=>{const i=h("input",{value:def||"",maxlength:20,inputmode:"decimal","aria-label":msg});let v=null;modal(msg,h("div",{},i),"OK",()=>{v=i.value;res(v)},()=>res(null))});

// ---------- shell ----------
function sidebar(v){
 const cur=v==="receipt"?"sell":v==="pass"?"settings":v;
 return h("aside",{class:"side","aria-label":"Lekisa"},
  h("button",{class:"acct",title:"Settings",onclick:()=>L.go("settings")},h("img",{src:"icon-192.png",alt:""}),h("span",{},h("b",{},L.P.biz),h("small",{},"Lekisa"))),
  h("div",{role:"navigation","aria-label":"Sections"},NAV.map(g=>{const its=g.items.filter(i=>shown(i[0]));return its.length&&h("div",{class:"grp"},h("p",{},g.g),its.map(([k,l,i])=>h("button",{class:"nv","aria-current":cur===k?"page":null,title:l,onclick:()=>L.go(k)},ico(i),h("span",{},l))))})),
  h("div",{class:"sfoot"},h("small",{},"Version "+L.CONFIG.VERSION+" \u00b7 Desktop")));
}
function topbar(v){
 const pend=L.pendN(),on=L.online(),dark=L.ls.get("theme")==="dark",stat=!on?"Offline":L.lastErr?"Sync problem":pend?pend+" to send":"Synced";
 return h("header",{class:"top2"},
  h("button",{class:"tb",title:"Collapse sidebar (Ctrl+B)","aria-label":"Collapse sidebar",onclick:toggleSide},ico("panel")),
  h("div",{class:"crumb"},h("span",{},"Lekisa"),ico("chev"),h("b",{},TITLE[v]||"")),
  h("span",{class:"grow1"}),
  h("button",{class:"srch",onclick:palette},ico("search"),h("span",{},"Search records and pages"),h("kbd",{},"Ctrl K")),
  h("button",{class:"chip "+(!on?"off":L.lastErr?"bad":pend?"wait":"ok"),title:"Sync now",onclick:()=>L.sync(true)},h("i"),stat),
  h("button",{class:"tb",title:dark?"Light theme":"Dark theme","aria-label":"Switch theme",onclick:()=>{L.ls.set("theme",dark?"light":"dark");L.applyTheme();L.render()}},ico(dark?"sun":"moon")),
  h("button",{class:"tb",title:"Lock Lekisa","aria-label":"Lock Lekisa",onclick:()=>L.lockApp()},ico("lock")));
}

// ---------- pages ----------
function split(c,first){
 const g=[{label:first,nodes:[]}],LBL={"Brain \u00b7 Business insights":"Brain","Lekisa Passport":"Passport"};
 for(const n of [...c.children]){if(n.tagName==="H2")g.push({label:LBL[n.textContent]||n.textContent,nodes:[]});else g[g.length-1].nodes.push(n)}
 return g.filter(x=>x.nodes.length);
}

function page(v){
 if(v==="home")return homePage();
 if(v==="hist")return histPage();
 if(v==="receipt"&&!L.rcpt){L.view="home";return homePage()}
 const [t,c]=L.SCREENS[v]();
 let tabs=null,body=c;
 if(v==="settings"||v==="grow"){const g=split(c,v==="grow"?"Summary":"Overview");const i=Math.min(st.tab[v]||0,g.length-1);tabs=tabsBar(v,g.map(x=>x.label));body=h("div",{},g[i].nodes)}
 return h("div",{class:"page "+(WIDE.has(v)?"wide":"narrow")},phead(t,SUB[v],null,tabs),h("div",{class:"pbody"+(v==="ai"?" ai":"")},CARD.has(v)?h("section",{class:"card"},body):body));
}

const PER=[["7D",7,"d","7 days"],["30D",30,"d","30 days"],["6M",6,"m","6 months"],["12M",12,"m","12 months"]];
function chartCard(){
 const [,c,u,long]=PER[st.cper],t=new Date();t.setHours(0,0,0,0);const B=[];
 if(u==="d")for(let i=c-1;i>=0;i--){const a=new Date(t);a.setDate(a.getDate()-i);const e=new Date(a);e.setDate(e.getDate()+1);B.push([+a,+e,a.toLocaleDateString("en-GB",c>7?{day:"numeric"}:{weekday:"short"}),a.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})])}
 else for(let i=c-1;i>=0;i--){const a=new Date(t.getFullYear(),t.getMonth()-i,1),e=new Date(t.getFullYear(),t.getMonth()-i+1,1);B.push([+a,+e,a.toLocaleDateString("en-GB",{month:"short"}),a.toLocaleDateString("en-GB",{month:"long",year:"numeric"})])}
 const v=B.map(([a,e])=>L.sumT("sale",a,e)),mx=Math.max(1,...v),tot=v.reduce((x,y)=>x+y,0);
 return h("section",{class:"card"},
  h("div",{class:"chead"},h("div",{},h("small",{},"Sales, last "+long),h("b",{class:"big num"},K(tot))),h("div",{class:"seg sm"},PER.map((p,i)=>h("button",{"aria-pressed":String(i===st.cper),onclick:()=>{st.cper=i;L.render()}},p[0])))),
  h("div",{class:"cbars",role:"img","aria-label":"Sales chart, last "+long},B.map(([,,l,f],i)=>h("div",{title:f+": "+K(v[i])},h("i",{style:"--r:"+(v[i]/mx).toFixed(3)}),h("span",{},u==="d"&&c>7&&i%5!==0?"":l)))));
}
function homePage(){
 const D=L.D,a=L.d0(),b=L.d0(1),n0=new Date(),m0=+new Date(n0.getFullYear(),n0.getMonth(),1),m1=+new Date(n0.getFullYear(),n0.getMonth()+1,1);
 const s=L.sumT("sale",a,b),e=L.sumT("exp",a,b),ms=L.sumT("sale",m0,m1);
 const cs=Array.isArray(L.CFG.coming)?L.CFG.coming:L.DEF.coming,want=k=>D.it.some(x=>x.f===k),attn=D.mm.length+L.attn().length;
 const cell=(l,v,cls)=>h("div",{class:"cell"},h("small",{},l),h("b",{class:"num "+(cls||"")},v));
 const recent=[...D.tx].sort((x,y)=>y.ts-x.ts).slice(0,8);
 const strip=h("section",{class:"card strip"},
  h("div",{class:"cols"},cell("Sales today",K(s),"sale"),cell("Expenses today",K(e),"exp"),cell("Estimated difference",K(s-e),s-e<0?"exp":""),cell("Sales this month",K(ms))),
  h("div",{class:"ratio"+(s?"":" none"),"aria-hidden":"true"},h("i",{style:"width:"+(s?Math.min(100,Math.round(e/s*100)):0)+"%"})),
  h("div",{class:"sfine"},h("p",{class:"small"},s?"Expenses are "+Math.round(e/s*100)+"% of today\u2019s sales.":"No sales recorded today."),h("p",{class:"small"},"Sales minus expenses you recorded. This is not profit: stock cost, rent and other costs may be missing.")));
 const table=h("section",{class:"card"},h("div",{class:"chead2"},h("h2",{style:"margin:0"},"Recent records"),h("button",{class:"link",onclick:()=>{st.tab.hist=0;L.go("hist")}},"View all records")),
  recent.length?h("div",{class:"tw"},h("table",{class:"dt"},h("thead",{},h("tr",{},["Record","Paid by","Date","Status"].map(x=>h("th",{},x)),h("th",{class:"r"},"Amount"))),h("tbody",{},recent.map(x=>h("tr",{},h("td",{},label(x)),h("td",{},x.m),h("td",{},short(x.ts)),h("td",{},badge(x)),h("td",{class:"r num "+x.t},signed(x))))))):h("p",{class:"empty"},"Nothing recorded yet. Press N to record your first sale."));
 const side=[
  F("money_match")&&h("section",{class:"card"},h("b",{},"Money Match"),h("p",{class:"small"},attn?attn+" payment"+(attn>1?"s need":" needs")+" attention.":"Nothing needs attention."),h("button",{class:"btn ghost sm",onclick:()=>L.go("mm")},"Open Money Match")),
  F("coming_soon")&&cs.length>0&&h("section",{class:"card"},h("b",{},T("coming_title","Coming soon")),h("p",{class:"small"},"Click the ones you want most. It helps us decide what to build."),
   cs.slice(0,6).map(c=>h("div",{class:"row"},h("span",{},String(c.label||"").slice(0,80)),want(c.key)?h("small",{},"Noted"):h("button",{class:"link",onclick:()=>{D.it.push({f:String(c.key).slice(0,40),sent:false});L.sv();setTimeout(L.sync,200);L.render()}},"I want this"))))];
 return h("div",{class:"page wide"},phead(L.P.biz,new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"}),newBtns()),strip,
  h("div",{class:"dash"},h("div",{},F("chart")&&chartCard(),table),h("div",{},side)));
}

// Records: sortable, filterable table with row actions. Correct and reverse keep the same data rules as the mobile app.
function histPage(){
 const R=st.R,D=L.D,tab=Math.min(st.tab.hist||0,1);
 const head=phead("Records",SUB.hist,newBtns(),tabsBar("hist",["Transactions","Audit history"]));
 if(tab===1){const a=(D.audit||[]).slice(0,200);return h("div",{class:"page wide"},head,h("section",{class:"card"},a.length?a.map(x=>h("div",{class:"row"},h("span",{},x.action+" \u00b7 "+x.details),h("small",{},short(x.ts)))):h("p",{class:"empty"},"No corrections or reversals yet.")))}
 const rows=()=>{const t=R.q.trim().toLowerCase(),k=R.key,d=R.dir;
  const r=D.tx.filter(x=>(R.type==="all"||x.t===R.type)&&(R.status==="all"||(x.status||"recorded")===R.status)&&(!t||text(x).includes(t)));
  const val=x=>k==="amt"?x.amt:k==="m"?x.m:k==="desc"?label(x).toLowerCase():x.ts;
  return r.sort((p,q)=>(val(p)>val(q)?1:val(p)<val(q)?-1:0)*d)};
 const body=h("tbody"),count=h("small",{}),closeMenus=()=>document.querySelectorAll(".menu").forEach(m=>m.remove());
 const reverse=x=>modal("Reverse this record?",h("p",{},"It will be excluded from totals and the action will be recorded."),"Reverse",()=>{x.status="reversed";x.sync=false;L.auditTx(x,"reversed","Transaction reversed by user");L.sv();L.render()});
 const correct=x=>{const i=h("input",{inputmode:"decimal",maxlength:10,value:(x.amt/100).toFixed(2),"aria-label":"Corrected amount in kwacha"});
  modal("Correct the amount",h("div",{},h("p",{class:"small"},label(x)+" \u00b7 now "+K(x.amt)),h("label",{},"Corrected amount (K)",i)),"Save correction",()=>{const a=L.par(i.value);if(!a)return "Enter a valid amount such as 50 or 12.50.";
   x.status="corrected";x.sync=false;D.tx.unshift({...x,id:crypto.randomUUID(),amt:a,ts:Date.now(),sync:false,status:"recorded",corrects_id:x.id,note:(x.note||x.cat||"Transaction").slice(0,55)+" (corrected)"});
   L.auditTx(x,"corrected","Original amount "+K(x.amt)+"; replacement amount "+K(a));L.sv();L.render()})};
 const menu=(x,td)=>{closeMenus();const m=h("div",{class:"menu",role:"menu"},h("button",{role:"menuitem",onclick:()=>{L.rcpt=x;L.view="receipt";L.render()}},"Receipt"),live(x)&&h("button",{role:"menuitem",onclick:()=>{closeMenus();correct(x)}},"Correct amount"),live(x)&&h("button",{class:"dng",role:"menuitem",onclick:()=>{closeMenus();reverse(x)}},"Reverse"));td.append(m)};
 const draw=()=>{const r=rows();count.textContent=r.length+" record"+(r.length===1?"":"s")+(r.length>300?" (showing 300)":"");
  body.replaceChildren(...(r.length?r.slice(0,300).map(x=>{const td=h("td",{class:"mcell"});td.append(h("button",{class:"tb","aria-label":"Actions for "+label(x),"aria-haspopup":"menu",onclick:e=>{e.stopPropagation();menu(x,td)}},ico("dots")));
   return h("tr",{class:live(x)?null:"rev"},h("td",{},short(x.ts)),h("td",{},label(x),x.ref&&h("small",{},"Ref "+x.ref)),h("td",{},x.m),h("td",{},x.t==="sale"?"Sale":"Expense"),h("td",{},badge(x)),h("td",{class:"r num "+x.t},signed(x)),td)}):[h("tr",{},h("td",{colspan:7,class:"empty"},D.tx.length?"No records match these filters.":"Nothing recorded yet. Press N to record a sale."))]))};
 const th=(k,l,cls)=>h("th",{class:cls,"aria-sort":R.key===k?(R.dir>0?"ascending":"descending"):"none"},h("button",{onclick:()=>{R.dir=R.key===k?-R.dir:(k==="ts"||k==="amt"?-1:1);R.key=k;L.render()}},l));
 const q=h("input",{placeholder:"Search records",maxlength:40,value:R.q,"aria-label":"Search records"}),sel=(key,opts)=>{const s=h("select",{"aria-label":key},opts.map(([v,l])=>h("option",{value:v},l)));s.value=R[key];s.onchange=()=>{R[key]=s.value;draw()};return s};
 q.oninput=()=>{R.q=q.value;draw()};
 const exp=()=>{const r=rows().filter(live),sa=r.filter(x=>x.t==="sale").reduce((p,x)=>p+x.amt,0),ex=r.filter(x=>x.t==="exp").reduce((p,x)=>p+x.amt,0);dl("lekisa-records.csv",L.toCsv(r,sa,ex,sa-ex))};
 draw();
 return h("div",{class:"page wide",onclick:closeMenus},head,h("section",{class:"card"},
  h("div",{class:"tools"},q,sel("type",[["all","All types"],["sale","Sales"],["exp","Expenses"]]),sel("status",[["all","All statuses"],["recorded","Recorded"],["corrected","Corrected"],["reversed","Reversed"]]),count,h("span",{class:"grow1"}),h("button",{class:"btn ghost sm",onclick:exp},"Export CSV")),
  h("div",{class:"tw"},h("table",{class:"dt"},h("thead",{},h("tr",{},th("ts","Date"),th("desc","Record"),th("m","Paid by"),h("th",{},"Type"),h("th",{},"Status"),th("amt","Amount","r"),h("th",{}))),body))));
}

// ---------- quick search (Ctrl+K) ----------
function palette(){
 if($("#pal"))return;
 const pages=NAV.flatMap(g=>g.items).filter(i=>shown(i[0])).map(([k,l])=>({l,sub:"Page",run:()=>{st.tab[k]=0;L.go(k)}}));
 const q=h("input",{placeholder:"Search records, or jump to a page",maxlength:60,"aria-label":"Search"}),list=h("div",{class:"plist",role:"listbox"});let res=[],sel=0;
 const close=()=>ov.remove(),pick=i=>{const x=res[i];if(!x)return;close();x.run()};
 const draw=()=>list.replaceChildren(...(res.length?res.map((x,i)=>h("button",{class:"pit",role:"option","aria-selected":String(i===sel),onmousemove:()=>{if(sel!==i){sel=i;list.querySelectorAll(".pit").forEach((b,j)=>b.setAttribute("aria-selected",String(j===i)))}},onclick:()=>pick(i)},h("span",{},x.l),h("small",{},x.sub))):[h("p",{class:"empty"},"No matches.")]));
 const calc=()=>{const t=q.value.trim().toLowerCase();
  const p=pages.filter(x=>!t||x.l.toLowerCase().includes(t));
  const tx=t?L.D.tx.filter(x=>text(x).includes(t)).slice(0,8).map(x=>({l:label(x),sub:short(x.ts)+" \u00b7 "+x.m+" \u00b7 "+signed(x),run:()=>{st.R.q=q.value.trim();st.tab.hist=0;L.go("hist")}})):[];
  res=[...p,...tx];sel=0;draw()};
 q.oninput=calc;
 q.onkeydown=e=>{if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();sel=(sel+(e.key==="ArrowDown"?1:-1)+res.length)%Math.max(res.length,1);draw();const s=list.children[sel];if(s)s.scrollIntoView({block:"nearest"})}else if(e.key==="Enter")pick(sel);else if(e.key==="Escape")close()};
 const ov=h("div",{class:"ov top",id:"pal",onclick:e=>{if(e.target===ov)close()}},h("div",{class:"pal",role:"dialog","aria-modal":"true","aria-label":"Quick search"},q,list));
 document.body.append(ov);calc();q.focus();
}

// ---------- render + shortcuts ----------
let lastView=null;
function render(){
 const app=$("#app"),v=L.view,an=L.CFG.announcement,prev=$(".scroller"),keep=prev&&v===lastView?prev.scrollTop:0;lastView=v;
 app.replaceChildren(sidebar(v),h("div",{class:"main"},topbar(v),h("main",{class:"content scroller"},
  an&&typeof an.text==="string"&&an.text.trim()&&h("div",{class:"msg",role:"status"},an.text.slice(0,300)),
  L.msg&&h("div",{class:"msg",role:"status"},L.msg),page(v))));
 app.classList.toggle("collapsed",L.ls.get("desk_side")==="1");
 const sc=$(".scroller");if(sc)sc.scrollTop=keep;
 if(v==="sell"||v==="exp"){const f=$(".pbody input");if(f)f.focus()}
}
window.LK_DESK={render};
addEventListener("keydown",e=>{
 if(!$("#app").classList.contains("shell"))return;
 const k=e.key.toLowerCase(),mod=e.ctrlKey||e.metaKey;
 if(mod&&k==="k"){e.preventDefault();palette();return}
 if(mod&&k==="b"){e.preventDefault();toggleSide();return}
 if(mod||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||document.querySelector(".ov"))return;
 if(k==="n")L.go("sell");else if(k==="e")L.go("exp");
});
})();

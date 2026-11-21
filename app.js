let hardwareOnline=false,roverBaseUrl="http://192.168.4.1",currentMode="manual",currentLang="en",burstsLeft=160,tankLeft=300,simAnimId=null;

window.addEventListener("DOMContentLoaded",()=>{
  writeLog("Carbota Smart Hub Ready.");
  setupHoldControls();
  setupKeyboardControls();
  runDataSim();
  calcROI();
});

function openTab(tabId,btnEl){
  document.querySelectorAll(".tab-view").forEach(s=>s.classList.remove("active-view"));
  const t=document.getElementById(tabId);
  if(t)t.classList.add("active-view");
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active-box"));
  if(btnEl){
    if(btnEl.length)btnEl.forEach(b=>{if(b.getAttribute("onclick").includes(tabId))b.classList.add("active-box");});
    else btnEl.classList.add("active-box");
  }
}

function flashActiveBox(el){if(!el)return;el.classList.add("active-box");setTimeout(()=>el.classList.remove("active-box"),300);}

function runDataSim(){
  const aEl=document.getElementById("simArea");if(!aEl)return;
  const area=Math.max(1,parseFloat(aEl.value)||4200),scale=document.getElementById("simScale").value,mode=document.getElementById("simSprayMode").value;
  const litres=area*0.045*(mode==="targeted"?0.45:1),co2=litres*5.56;
  const cost=Math.round((litres*2.25)+(scale==="large"?(co2/1350)*80:(co2/16)*40)+2),rival=Math.round(area*0.43);
  document.getElementById("resLitres").textContent=litres.toFixed(1)+" L";
  document.getElementById("resCo2").textContent=co2>=1000?(co2/1000).toFixed(2)+" kg":Math.round(co2)+" g";
  document.getElementById("resCost").textContent=cost+" EGP";
  document.getElementById("resTime").textContent=(area/(scale==="large"?750:280)).toFixed(1)+" Hrs";
  document.getElementById("lblRivalCost").textContent=rival.toLocaleString()+" EGP";
  document.getElementById("lblCarbotaCost").textContent=cost.toLocaleString()+" EGP";
  const pct=Math.min(100,Math.max(8,Math.round((cost/Math.max(1,rival))*100)));
  document.getElementById("barCarbotaCost").style.width=pct+"%";
}

function calcROI(){
  const fEl=document.getElementById("roiFeddans");if(!fEl)return;
  const f=Math.max(1,parseFloat(fEl.value)||2),s=Math.max(1,parseFloat(document.getElementById("roiSprays").value)||2);
  const mSave=f*s*1565,months=(13000/Math.max(1,mSave)).toFixed(1),yNet=(mSave*12)-13000;
  document.getElementById("roiMonthly").textContent=mSave.toLocaleString()+" EGP";
  document.getElementById("roiMonths").textContent=months+" Months";
  document.getElementById("roiYearly").textContent=(yNet>=0?"+":"")+yNet.toLocaleString()+" EGP";
}

function diagnosePest(type,btnEl){
  document.querySelectorAll(".sym-btn").forEach(b=>b.classList.remove("active-box"));
  if(btnEl)btnEl.classList.add("active-box");
  const data={
    aphids:"<strong>Diagnosis: Aphids (حشرة المنّ)</strong><br>• <strong>Recipe:</strong> 0.5% Neem Oil + 1.0% Potassium Soap.<br>• <strong>Carbota Setting:</strong> Servo Boom 20°–65° to coat undersides of young shoots.",
    whitefly:"<strong>Diagnosis: Whitefly (الذبابة البيضاء)</strong><br>• <strong>Recipe:</strong> 0.7% Neem Oil + 1.0% Potassium Soap (Dawn Patrol).<br>• <strong>Carbota Setting:</strong> Full sweep 10°–85° with 2.5s CO2 mist bursts.",
    mites:"<strong>Diagnosis: Spider Mites (العنكبوت الأحمر)</strong><br>• <strong>Recipe:</strong> 1.0% Potassium Soap + 0.5% Neem Oil.<br>• <strong>Carbota Setting:</strong> High-density 2.0 Bar misting targeting lower canopies."
  };
  document.getElementById("rxOutput").innerHTML=data[type]||data.aphids;
}

function toggleRoverSim(show){
  const canvas=document.getElementById("roverSimCanvas"),exitBtn=document.getElementById("simExitBtn");
  if(!canvas)return;
  if(!show){canvas.style.display="none";exitBtn.style.display="none";if(simAnimId)cancelAnimationFrame(simAnimId);return;}
  canvas.style.display="block";exitBtn.style.display="block";
  const ctx=canvas.getContext("2d");canvas.width=520;canvas.height=260;
  let rx=30,state="MOVING",timer=0,plants=[{x:160,inf:true},{x:310,inf:true},{x:450,inf:true}];
  function loop(){
    ctx.clearRect(0,0,520,260);
    ctx.fillStyle="#1c1917";ctx.fillRect(0,225,520,35);
    plants.forEach(p=>{
      ctx.strokeStyle="#15803d";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(p.x,225);ctx.lineTo(p.x,125);ctx.stroke();
      ctx.fillStyle=p.inf?"#eab308":"#22c55e";
      ctx.beginPath();ctx.arc(p.x-14,165,12,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(p.x+14,145,12,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#fff";ctx.font="11px sans-serif";ctx.fillText(p.inf?"⚠️ Pest":"✅ Clean",p.x-22,112);
    });
    const hit=plants.find(p=>p.inf&&Math.abs(rx+45-p.x)<10);
    if(hit&&state==="MOVING"){state="SPRAYING CO2";timer=55;}
    if(state==="MOVING"){rx+=1.8;if(rx>530){rx=-60;plants.forEach(p=>p.inf=true);}}
    else{
      timer--;ctx.fillStyle="rgba(52,211,153,0.4)";ctx.beginPath();ctx.moveTo(rx+45,175);ctx.lineTo(rx+95,125);ctx.lineTo(rx+95,205);ctx.closePath();ctx.fill();
      if(timer<=0){hit.inf=false;state="MOVING";}
    }
    ctx.fillStyle="#059669";ctx.fillRect(rx,198,65,20);
    ctx.fillStyle="#cbd5e1";ctx.fillRect(rx+8,186,24,10);
    ctx.strokeStyle="#34d399";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(rx+42,198);ctx.lineTo(rx+48,172);ctx.stroke();
    ctx.fillStyle="#0f172a";ctx.beginPath();ctx.arc(rx+14,222,8,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(rx+52,222,8,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#ecfdf5";ctx.font="bold 12px monospace";ctx.fillText("CARBOTA LIVE SIM | "+state+" | 2.0 BAR",12,22);
    simAnimId=requestAnimationFrame(loop);
  }
  loop();
}

function writeLog(t){const c=document.getElementById("consoleLog");if(!c)return;const d=document.createElement("div");d.className="log-line";d.textContent=`[${new Date().toLocaleTimeString()}] ${t}`;c.prepend(d);}
function connectRover(b){flashActiveBox(b);const ip=document.getElementById("roverIp").value.trim();if(!ip)return;roverBaseUrl="http://"+ip;const v=document.getElementById("liveVideo");v.src=roverBaseUrl+":81/stream";v.onload=()=>{hardwareOnline=true;document.getElementById("standbyOverlay").style.display="none";v.style.display="block";document.getElementById("statusBadge").className="badge online";document.getElementById("statusText").textContent="Connected";};v.onerror=()=>{writeLog("Standby Mode Active.");};}
function dispatchCommand(p,b){if(b)flashActiveBox(b);writeLog("TX -> /"+p);if(hardwareOnline)fetch(roverBaseUrl+"/"+p).catch(()=>{});}
function setupHoldControls(){document.querySelectorAll(".dir-btn").forEach(b=>{const d=b.dataset.dir;const s=e=>{e.preventDefault();b.classList.add("active-box");dispatchCommand("move?dir="+d);};const e=ev=>{ev.preventDefault();if(b.classList.contains("active-box")){b.classList.remove("active-box");dispatchCommand("move?dir=stop");}};b.addEventListener("mousedown",s);b.addEventListener("mouseup",e);b.addEventListener("mouseleave",e);b.addEventListener("touchstart",s);b.addEventListener("touchend",e);});}
function setupKeyboardControls(){const m={ArrowUp:"forward",w:"forward",ArrowDown:"backward",s:"backward",ArrowLeft:"left",a:"left",ArrowRight:"right",d:"right"};let a=null;window.addEventListener("keydown",e=>{if(m[e.key]&&a!==e.key){a=e.key;dispatchCommand("move?dir="+m[e.key]);}});window.addEventListener("keyup",e=>{if(m[e.key]){a=null;dispatchCommand("move?dir=stop");}});}
function switchMode(m,b){currentMode=m;document.querySelectorAll(".mode-btn").forEach(x=>x.classList.remove("active-box"));if(b)b.classList.add("active-box");dispatchCommand("mode?set="+m);}
function setArmAngle(d){document.getElementById("servoDeg").textContent=d;document.getElementById("armHeight").textContent=Math.round(12+(d/90)*38);dispatchCommand("servo?angle="+d);}
function fireSpray(b){if(burstsLeft<=0||tankLeft<18)return;flashActiveBox(b);dispatchCommand("spray?ms=2000");burstsLeft--;tankLeft=Math.max(0,tankLeft-18);document.getElementById("co2Pct").textContent=Math.round((burstsLeft/160)*100);document.getElementById("burstCount").textContent=burstsLeft;document.getElementById("co2Fill").style.width=Math.round((burstsLeft/160)*100)+"%";document.getElementById("tankVol").textContent=tankLeft;document.getElementById("tankFill").style.width=Math.round((tankLeft/300)*100)+"%";}
function resetSupplies(b){flashActiveBox(b);burstsLeft=160;tankLeft=300;document.getElementById("co2Pct").textContent="100";document.getElementById("burstCount").textContent="160";document.getElementById("co2Fill").style.width="100%";document.getElementById("tankVol").textContent="300";document.getElementById("tankFill").style.width="100%";}
function emergencyStop(){dispatchCommand("estop");writeLog("E-STOP!");}
function calcFormula(){const v=parseFloat(document.getElementById("mixVol").value)||0;document.getElementById("outNeem").textContent=(v*0.005).toFixed(1)+" ml";document.getElementById("outSoap").textContent=(v*0.01).toFixed(1)+" ml";document.getElementById("outWater").textContent=(v-v*0.015).toFixed(1)+" ml";}
function toggleTheme(b){document.body.classList.toggle("dark-mode");const d=document.body.classList.contains("dark-mode");b.classList.toggle("active-box",d);b.textContent=currentLang==="en"?(d?"☀️ Light":"🌙 Dark"):(d?"☀️ نهاري":"🌙 ليلي");}
function toggleLang(b) {
  currentLang = currentLang === "en" ? "ar" : "en";
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === "ar" ? "rtl" : "ltr";
  b.textContent = currentLang === "en" ? "عربي" : "English";
  b.classList.toggle("active-box", currentLang === "ar");
  document.querySelectorAll("[data-en]").forEach(e => {
    if (e.children.length === 0) {
      e.textContent = e.getAttribute("data-" + currentLang);
    }
  });
}

function diagnosePest(type, btnEl) {
  document.querySelectorAll(".sym-btn").forEach((b) => b.classList.remove("active-box"));
  if (btnEl) btnEl.classList.add("active-box");

  const dataEn = {
    aphids: "<strong>Diagnosis: Aphids</strong><br>• <strong>Bio-Recipe:</strong> 0.5% Pure Neem Oil + 1.0% Potassium Soap.<br>• <strong>Carbota Setting:</strong> Set Servo Boom sweep to <strong>20°–65°</strong> to coat undersides of young shoots.",
    whitefly: "<strong>Diagnosis: Greenhouse Whitefly</strong><br>• <strong>Bio-Recipe:</strong> 0.7% Neem Oil + 1.0% Potassium Soap (Dawn Patrol).<br>• <strong>Carbota Setting:</strong> Full sweep <strong>10°–85°</strong> with 2.5s CO2 mist bursts.",
    mites: "<strong>Diagnosis: Two-Spotted Spider Mites</strong><br>• <strong>Bio-Recipe:</strong> 1.0% Potassium Soap + 0.5% Neem Oil.<br>• <strong>Carbota Setting:</strong> High-density <strong>2.0 Bar</strong> misting targeting lower & mid-canopy undersides."
  };

  const dataAr = {
    aphids: "<strong>التشخيص: حشرة المنّ (Aphids)</strong><br>• <strong>الوصفة العضوية:</strong> 0.5% زيت نيم نقي + 1.0% صابون بوتاسي.<br>• <strong>إعدادات كاربوتا:</strong> ضبط زاوية مسح الذراع بين <strong>20° إلى 65°</strong> لتغطية أسفل البراعم والأوراق الحديثة.",
    whitefly: "<strong>التشخيص: الذبابة البيضاء (Whitefly)</strong><br>• <strong>الوصفة العضوية:</strong> 0.7% زيت نيم + 1.0% صابون بوتاسي (يُفضل الرش وقت الفجر).<br>• <strong>إعدادات كاربوتا:</strong> مسح رأسي كامل <strong>10° إلى 85°</strong> مع رشات CO2 لمدة 2.5 ثانية.",
    mites: "<strong>التشخيص: العنكبوت الأحمر (Spider Mites)</strong><br>• <strong>الوصفة العضوية:</strong> 1.0% صابون بوتاسي + 0.5% زيت نيم.<br>• <strong>إعدادات كاربوتا:</strong> تذرير عالي الكثافة عند ضغط <strong>2.0 بار</strong> مع التركيز على أسفل الأوراق السفلية والمتوسطة."
  };

  const selected = currentLang === "ar" ? dataAr : dataEn;
  document.getElementById("rxOutput").innerHTML = selected[type] || selected.aphids;
}

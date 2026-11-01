(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input").forEach(e=>{v[e.id]=parseFloat(e.value)||0});return v;}
function calc(v){const raw=v.calls*v.wh/1000;const energy=v.calls*v.wh*v.pue/1000;const kg=energy*v.grid/1000;return {raw:raw,energy:energy,kg:kg,perCall:v.wh*v.pue*v.grid/1000,per1000:v.wh*v.pue*v.grid};}
function render(){
  const v=get();
  if(!(v.calls>0&&v.wh>=0&&v.grid>=0&&v.pue>=0)){
    $("result").textContent="—";$("chipA").textContent="—";$("chipB").textContent="—";$("chipC").textContent="—";
    $("breakRows").innerHTML="";$("bars").innerHTML="";$("cumRows").innerHTML="";
    const vd=$("verdict");vd.className="verdict warn";
    $("verdictText").textContent="Enter a call count above zero, with energy, grid intensity, and PUE at zero or above, to see the estimate.";window.__summary="";return;
  }
  const r=calc(v);
  $("result").textContent=num(r.kg)+" kg CO₂e";
  $("chipA").textContent=num(r.energy)+" kWh";$("chipB").textContent=num(r.perCall)+" g CO₂e";$("chipC").textContent=num(r.per1000)+" g CO₂e";
  const row=(l,val)=>"<tr><td>"+l+"</td><td class='num'>"+val+"</td></tr>";
  $("breakRows").innerHTML=row("Inference energy (before PUE)",num(r.raw)+" kWh")+row("Facility overhead (PUE)",num(r.energy-r.raw)+" kWh")+row("Total energy",num(r.energy)+" kWh")+row("Grid intensity used",num(v.grid)+" gCO₂e/kWh")+row("Total emissions",num(r.kg)+" kg CO₂e");
  $("bars").innerHTML=barRow("Inference energy",num(r.raw)+" kWh",r.raw,Math.max(r.raw,r.energy,1),"")+barRow("Total incl. PUE",num(r.energy)+" kWh",r.energy,Math.max(r.raw,r.energy,1),"new");
  $("cumRows").innerHTML=row("10,000 calls",num(10000*v.wh*v.pue*v.grid/1000/1000)+" kg CO₂e")+row("50,000 calls",num(50000*v.wh*v.pue*v.grid/1000/1000)+" kg CO₂e")+row("100,000 calls",num(100000*v.wh*v.pue*v.grid/1000/1000)+" kg CO₂e")+row("200,000 calls",num(200000*v.wh*v.pue*v.grid/1000/1000)+" kg CO₂e");
  const vd=$("verdict");
  if(r.kg<=0){vd.className="verdict";$("verdictText").textContent="Zero on these inputs: at least one of energy per call, grid intensity, or calls is zero, so the estimate is zero.";}
  else if(v.pue<1){vd.className="verdict warn";$("verdictText").textContent="PUE below 1 is not physically meaningful for a facility total (it would imply less energy than the inference itself). Use 1.0 for no overhead, or a value above 1.";}
  else{vd.className="verdict";$("verdictText").textContent="On your assumptions, this scenario uses "+num(r.energy)+" kWh and emits "+num(r.kg)+" kg CO₂e. Treat it as a scenario estimate: the result moves in direct proportion to energy per call and grid intensity, which are the two inputs most worth verifying.";}
  window.__summary="AI carbon estimate: "+num(r.energy)+" kWh, "+num(r.kg)+" kg CO2e for "+num(v.calls)+" calls at "+num(v.wh)+" Wh/call, PUE "+num(v.pue)+", grid "+num(v.grid)+" gCO2e/kWh.";
}
function barRow(l,disp,val,maxV,cls){const p=maxV>0?Math.max(0,Math.min(100,val/maxV*100)):0;return "<div class='bar-row'><label><span>"+l+"</span><span>"+disp+"</span></label><div class='bar'><i class='"+cls+"' style='width:"+p+"%'></i></div></div>";}



document.querySelectorAll("input").forEach(e=>e.addEventListener("input",render));render();

})();

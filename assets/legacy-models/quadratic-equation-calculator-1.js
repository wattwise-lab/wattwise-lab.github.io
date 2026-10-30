(()=>{'use strict';

const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input").forEach(e=>{v[e.id]=parseFloat(e.value);if(isNaN(v[e.id]))v[e.id]=0;});return v;}
function fmt(x){return num(x);}
function render(){
  const v=get();
  if(v.a===0){
    $("result").textContent="Not a quadratic";
    $("chipDisc").textContent="—"; $("chipVertex").textContent="—";
    const vd=$("verdict"); vd.className="verdict warn";
    $("verdictText").textContent = v.b!==0
      ? "With a = 0 this is the linear equation "+num(v.b)+"x + "+num(v.c)+" = 0, whose solution is x = "+num(-v.c/v.b)+"."
      : "With a = 0 and b = 0 there is no x to solve for: the equation is just "+num(v.c)+" = 0.";
    return;
  }
  const d=v.b*v.b-4*v.a*v.c, vx=-v.b/(2*v.a);
  $("chipDisc").textContent=num(d);
  $("chipVertex").textContent=num(vx);
  const vd=$("verdict");
  if(d>0){
    const r1=(-v.b+Math.sqrt(d))/(2*v.a), r2=(-v.b-Math.sqrt(d))/(2*v.a);
    $("result").textContent="x = "+fmt(r1)+", "+fmt(r2);
    vd.className="verdict";
    $("verdictText").textContent="Two distinct real roots: the parabola crosses the x-axis twice.";
  } else if(d===0){
    $("result").textContent="x = "+fmt(vx);
    vd.className="verdict";
    $("verdictText").textContent="One repeated root: the parabola just touches the x-axis at its vertex.";
  } else {
    const re=vx, im=Math.sqrt(-d)/(2*v.a);
    $("result").textContent="x = "+fmt(re)+" ± "+fmt(im)+"i";
    vd.className="verdict";
    $("verdictText").textContent="No real roots: the parabola never crosses the x-axis. The two roots are complex conjugates.";
  }
}

document.querySelectorAll("input").forEach(e=>e.addEventListener("input",render));render();

})();

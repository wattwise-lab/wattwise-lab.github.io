import { chromium, webkit } from "playwright";

const base = process.env.BASE_URL || "http://127.0.0.1:4173";
const cases = [
  ["mortgage-calculator.html",2547.617675177489,400000],
  ["loan-calculator.html",1896.204070478896,300000],
  ["compound-interest-calculator.html",100133.6407435519,10000],
  ["profit-calculator.html",24000,100000],
  ["break-even-calculator.html",625,50000],
  ["roi-calculator.html",30,10000],
  ["ai-inference-cost.html",2850,100000],
  ["ai-workflow-savings.html",4761,999]
];
const browsers = [
  ["Google Chrome",()=>chromium.launch({channel:"chrome",headless:true})],
  ["Microsoft Edge",()=>chromium.launch({channel:"msedge",headless:true})],
  ["Safari WebKit",()=>webkit.launch({headless:true})]
];
const parseValue = text => Number(String(text).replace(/[^0-9.-]/g,""));
const near = (actual,expected,tol=Math.max(.05,Math.abs(expected)*.001)) => Number.isFinite(actual) && Math.abs(actual-expected)<=tol;

for(const [browserName,launch] of browsers){
  const browser=await launch();
  try{
    const context=await browser.newContext({viewport:{width:1365,height:900}});
    for(const [file,expected,reverseExpected] of cases){
      const page=await context.newPage();
      await page.goto(base+"/"+file,{waitUntil:"load"});
      await page.waitForSelector("#cm-decision-engine",{state:"visible",timeout:10000});

      const result=page.locator('[data-testid="cmde-result"]');
      const baseline=parseValue((await result.textContent())?.trim());
      if(!near(baseline,expected)) throw new Error(browserName+" "+file+": baseline "+baseline+" != "+expected);

      const target=page.locator("[data-cmde-target]");
      await target.selectOption({index:1});
      const reverse=parseValue((await page.locator('[data-testid="cmde-result"]').textContent())?.trim());
      if(!near(reverse,reverseExpected)) throw new Error(browserName+" "+file+": reverse "+reverse+" != "+reverseExpected);

      await page.locator('[data-cmde-tab="scenarios"]').click();
      if(await page.locator(".cmde-scenario-card").count()<3) throw new Error(browserName+" "+file+": scenarios missing");

      await page.locator('[data-cmde-tab="sensitivity"]').click();
      if(await page.locator(".cmde-sensitivity-row").count()<1) throw new Error(browserName+" "+file+": sensitivity missing");

      await page.locator('[data-cmde-tab="share"]').click();
      const share=await page.locator("#cmde-share-url").inputValue();
      if(!share.includes("de=")) throw new Error(browserName+" "+file+": share state missing");

      await page.close();
    }

    const mobile=await context.newPage();
    await mobile.setViewportSize({width:390,height:844});
    await mobile.goto(base+"/mortgage-calculator.html",{waitUntil:"load"});
    await mobile.waitForSelector("#cm-decision-engine",{state:"visible",timeout:10000});
    const overflow=await mobile.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
    if(overflow) throw new Error(browserName+": mobile horizontal overflow");
    await mobile.close();

    const restore=await context.newPage();
    await restore.goto(base+"/profit-calculator.html",{waitUntil:"load"});
    await restore.waitForSelector("#cm-decision-engine",{state:"visible",timeout:10000});
    await restore.locator("[data-cmde-target]").selectOption({index:1});
    await restore.locator('[data-cmde-tab="share"]').click();
    const shareUrl=await restore.locator("#cmde-share-url").inputValue();
    await restore.goto(shareUrl.replace("http://127.0.0.1:4173",base),{waitUntil:"load"});
    await restore.waitForSelector("#cm-decision-engine",{state:"visible",timeout:10000});
    if(await restore.locator("[data-cmde-target]").inputValue()!=="revenue") throw new Error(browserName+": shared target did not restore");
    await restore.close();

    console.log("PASS:",browserName);
  }finally{
    await browser.close();
  }
}
console.log("All CalcMintly Decision Engine browser checks passed.");
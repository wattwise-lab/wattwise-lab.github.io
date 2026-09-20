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
      await page.waitForSelector("#cmde-rail",{state:"visible",timeout:10000});

      const panel=page.locator("#cm-decision-engine");
      if(!(await panel.isHidden())) throw new Error(browserName+" "+file+": decision panel should start closed");

      await page.locator('[data-cmde-mode="solve"]').click();
      await page.locator('[data-testid="cmde-current"]').waitFor({state:"visible"});

      const current=parseValue((await page.locator('[data-testid="cmde-current"]').textContent())?.trim());
      if(!near(current,expected)) throw new Error(browserName+" "+file+": current "+current+" != "+expected);

      const reverse=parseValue((await page.locator('[data-testid="cmde-result"]').textContent())?.trim());
      if(!near(reverse,reverseExpected)) throw new Error(browserName+" "+file+": reverse "+reverse+" != "+reverseExpected);

      if(await page.locator("[data-cmde-apply]").count()<1) throw new Error(browserName+" "+file+": apply action missing");

      await page.locator('[data-cmde-mode="compare"]').click();
      if(await page.locator(".cmde-compare-card").count()<3) throw new Error(browserName+" "+file+": comparison cards missing");

      await page.locator('[data-cmde-mode="insights"]').click();
      if(await page.locator(".cmde-insight-row").count()<1) throw new Error(browserName+" "+file+": insight rows missing");

      await page.locator('[data-cmde-mode="share"]').click();
      const share=await page.locator("[data-cmde-copy]").getAttribute("data-share-url");
      if(!share || !share.includes("de=")) throw new Error(browserName+" "+file+": share URL state missing");

      const duplicateInputs=await page.locator('#cm-decision-engine input[aria-label]').count();
      if(duplicateInputs!==0) throw new Error(browserName+" "+file+": decision UI duplicated calculator inputs");

      await page.close();
    }

    const applyPage=await context.newPage();
    await applyPage.goto(base+"/profit-calculator.html",{waitUntil:"load"});
    await applyPage.waitForSelector("#cmde-rail",{state:"visible"});
    await applyPage.locator('[data-cmde-mode="solve"]').click();
    await applyPage.locator("[data-cmde-goal]").fill("30000");
    await applyPage.locator("[data-cmde-goal]").dispatchEvent("change");
    await applyPage.locator("[data-cmde-apply]").click();
    await applyPage.waitForTimeout(150);
    const revenue=Number(await applyPage.locator('input[aria-label="Revenue"]').inputValue());
    if(!near(revenue,106000,.01)) throw new Error(browserName+": apply-to-calculator did not update Revenue");
    await applyPage.close();

    const restore=await context.newPage();
    await restore.goto(base+"/profit-calculator.html",{waitUntil:"load"});
    await restore.waitForSelector("#cmde-rail",{state:"visible"});
    await restore.locator('[data-cmde-mode="solve"]').click();
    await restore.locator("[data-cmde-target]").selectOption("fixedCosts");
    await restore.locator('[data-cmde-mode="share"]').click();
    const shareUrl=await restore.locator("[data-cmde-copy]").getAttribute("data-share-url");
    await restore.goto(shareUrl.replace("http://127.0.0.1:4173",base),{waitUntil:"load"});
    await restore.waitForSelector('[data-cmde-target]',{state:"visible",timeout:10000});
    if(await restore.locator("[data-cmde-target]").inputValue()!=="fixedCosts") throw new Error(browserName+": shared solve target did not restore");
    await restore.close();

    const mobile=await context.newPage();
    await mobile.setViewportSize({width:390,height:844});
    await mobile.goto(base+"/mortgage-calculator.html",{waitUntil:"load"});
    await mobile.waitForSelector("#cmde-rail",{state:"visible",timeout:10000});
    await mobile.locator('[data-cmde-mode="insights"]').click();
    const overflow=await mobile.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
    if(overflow) throw new Error(browserName+": mobile horizontal overflow");
    await mobile.close();

    console.log("PASS:",browserName);
  }finally{
    await browser.close();
  }
}
console.log("All CalcMintly integrated Decision UI checks passed.");
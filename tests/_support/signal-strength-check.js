async (page) => {
 await page.waitForFunction(()=>document.body.dataset.status!=='pending');
 const result=await page.locator('#results').textContent();
 if(!result.startsWith('PASS'))throw Error(result);
 console.log('PASS normalized transitions, accessibility, FIFO, errors and lifecycle');
}

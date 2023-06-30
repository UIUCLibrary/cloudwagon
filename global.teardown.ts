import { chromium, FullConfig } from '@playwright/test';

export default async function globalTeardown(config: FullConfig){
    const { baseURL} = config.projects[0].use;
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(`${baseURL}/manageFiles/?path=/`);
    await page.getByRole('menuitem', {name: "Remove All Files"}).click()
    await page.getByRole('button', {name: "Yes"}).click()
}
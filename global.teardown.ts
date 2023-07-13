import { chromium, firefox, webkit, FullConfig } from '@playwright/test';
import {Browser} from "playwright-core";

export default async function globalTeardown(config: FullConfig){
    // This cleans out storage for any files generated here.
    // There is most likely a better way to do this. I just have time to figure it out.
    const { baseURL} = config.projects[0].use;
    let browser: Browser;
    try {
        browser = await chromium.launch();

    } catch (error){
        try {
            browser = await firefox.launch()

        } catch (error){
            browser = await webkit.launch()
        }
    }
    const page = await browser.newPage();
    await page.goto(`${baseURL}/manageFiles/?path=/`);
    await page.getByRole('menuitem', {name: "Remove All Files"}).click()
    await page.getByRole('button', {name: "Yes"}).click()
}
import {expect, test} from "@playwright/test";
test.describe.configure({ mode: 'serial' });
test.describe('upload files', ()=>{

    test.beforeEach(async ({page, context})=>{
        await page.goto('http://localhost:5173/manageFiles/?path=/');
        await page.getByRole('menuitem', {name: "Remove All Files"}).click()
        await page.getByRole('button', {name: "Yes"}).click()
        await expect (await page.getByText("package.json").count()).toEqual(0)
    })
    test.afterEach(async ({page})=>{
        await page.goto('http://localhost:5173/manageFiles/?path=/');
        await page.getByRole('menuitem', {name: "Remove All Files"}).click()
        await page.getByRole('button', {name: "Yes"}).click()
        // await expect (await page.getByText("package.json").count()).toEqual(0)
    })

    test('Upload', async ({ page }) => {
        await page.goto('http://localhost:5173/');
        await page.getByRole('tab', {name: "Manage Files"}).click()
        await page.getByRole('menuitem', {name: "Add Files"}).click()
        await page.locator("input[type='file']").setInputFiles('package.json')
        await page.getByRole('button', {name: "Upload"}).click()
        await expect(page.getByText("package.json")).toBeVisible()
    });
})

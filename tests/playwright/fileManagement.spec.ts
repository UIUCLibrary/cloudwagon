const fs = require('fs');

import {expect, test} from "@playwright/test";
test.describe.configure({ mode: 'parallel' });
test.describe('upload files', ()=>{
    let fileName

    test.beforeEach(async ({browserName})=>{
        fileName = `temp-file-${browserName}.txt`
    })
    test('Upload', async ({ page }, testInfo) => {
        await page.goto('/');
        const file = testInfo.outputPath(fileName)
        await fs.promises.writeFile(file, "some data","utf8");
        await page.getByRole('tab', {name: "Manage Files"}).click()
        await page.getByRole('menuitem', {name: "Add Files"}).click()
        await page.locator("input[type='file']").setInputFiles(file)
        await page.getByRole('button', {name: "Upload"}).click()
        await expect(page.getByText(fileName)).toBeVisible()
    });
})

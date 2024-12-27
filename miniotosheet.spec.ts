import { test, expect } from '@playwright/test';
import { google } from 'googleapis';
import * as fs from 'fs';

test('test', async ({ page }) => {
    await page.goto('https://moneydd-prod-minio.thinkerfint.com/login');
    
  //  await page.getByPlaceholder('Username').click();
    await page.getByPlaceholder('Username').fill('minio');
  //  await page.getByPlaceholder('Username').press('Tab');
    await page.getByPlaceholder('Password').fill('shore.line@1234');
    await page.getByRole('button', { name: 'Login' }).click();

    // รอให้ข้อมูลที่ต้องการแสดงอยู่ในหน้า
    await page.waitForSelector('span.sc-dAlyuH.kGaPxT');

    // ดึงข้อมูลจากหน้าเว็บ
    const data = await page.evaluate(() => {
        const element = document.querySelector('span.sc-dAlyuH.kGaPxT'); // ใช้ selector ที่ถูกต้อง
        console.log('Element found:', element); // ตรวจสอบว่าองค์ประกอบถูกพบ
        return element ? element.innerText : 'No data found'; // คืน innerText หากมีองค์ประกอบ
    });

    // แสดงข้อมูลใน console
    console.log('Data:', data);
    
    const SPREADSHEET_ID = '1vLEL0J_xnhqa6ImjxwZBb6LqamgV5QNRpGZ3Zu6XnpY'; // แทนที่ด้วย ID ของ Google Sheet
    const SERVICE_ACCOUNT_FILE = '/Users/kaweephat/my-playwright-project/tests/service-operation-439703-9bc8c8165988.json'; // แทนที่ด้วยที่อยู่ของไฟล์ JSON

    async function getAuth() {
        const auth = new google.auth.GoogleAuth({
            keyFile: SERVICE_ACCOUNT_FILE,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        return await auth.getClient();
    }

    async function getLastRow(sheets: any): Promise<number> {
        const request = {
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!B:B', // ดึงข้อมูลทั้งหมดในคอลัมน์ B
        };

        const response = await sheets.spreadsheets.values.get(request);
        const rows = response.data.values;

        return rows ? rows.length + 1 : 1; // คืนค่าหมายเลขแถวถัดไปที่ว่าง
    }

    async function updateSheet(data: string[][]) {
        const auth = await getAuth();
        const sheets = google.sheets({ version: 'v4', auth });

        const lastRow = await getLastRow(sheets); // ดึงหมายเลขแถวถัดไป
        const range = `Sheet1!B${lastRow}`; // ตำแหน่งที่ต้องการเขียนข้อมูล

        const request = {
            spreadsheetId: SPREADSHEET_ID,
            range: range,
            valueInputOption: 'RAW',
            resource: {
                values: data,
            },
        };

        try {
            await sheets.spreadsheets.values.update(request);
            console.log('Data updated successfully!');
        } catch (err) {
            console.error('The API returned an error: ' + err);
        }
    }

    // ตัวอย่างการเรียกใช้ฟังก์ชัน updateSheet
    const scrapedData = [
        [data], // ใช้ข้อมูลที่ scrape ได้
    ];

    await updateSheet(scrapedData); // เพิ่ม await เพื่อรอให้ฟังก์ชันทำงานเสร็จ
});

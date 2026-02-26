const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    let errors = [];
    page.on('pageerror', err => {
        console.error('Page error: ' + err.toString());
        errors.push(err.toString());
    });

    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.error('Console error: ' + msg.text());
            errors.push(msg.text());
        }
    });

    try {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 10000 });
        console.log("Page loaded successfully.");
    } catch (e) {
        console.error('Navigation error: ' + e.message);
    }
    await browser.close();
    process.exit(0);
})();

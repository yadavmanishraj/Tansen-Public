const { chromium } = require('playwright');
const { initializeApp, applicationDefault } = require("firebase-admin/app")
const { getFirestore } = require("firebase-admin/firestore")

initializeApp({
    credential: applicationDefault()
});

const collectionName = "channels";

(async () => {

    const firestore = getFirestore();

    const fchannels = await firestore.collection(collectionName).listDocuments();
    fchannels.map(async (e) => await e.delete())

    const baseUrl = 'me.crichd.tv';
    const replaceUrl = 'crichdplayer.com';

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('https://me.crichd.tv/');

    const channels = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.channels'))
            .filter((channel) => channel.classList.length === 1)
            .map((channel) => {
                const url = channel.querySelector('a').href;
                const imageUrl = channel.querySelector('img')?.src;
                return { url, imageUrl };
            });
    });

    const writeChannels = channels.map((channel) => {
        return {
            pageUrl: channel.url.replace(baseUrl, replaceUrl),
            imageUrl: channel.imageUrl,
        };
    });

    for (const channel of writeChannels) {
        try {
            const context = await browser.newContext();
            const page = await context.newPage();

            let streamUrl = null;



            await page.goto(channel.pageUrl);
            await Promise.race([
                page.waitForEvent('request', request => {
                    const url = request.url();
                    const contains = url.includes('m3u8');
                    if (contains) streamUrl = url;

                    return contains;
                }),
                page.waitForTimeout(30000)
            ]);
            await context.close();

            const data = { ...channel, streamUrl };
            const id = await firestore.collection(collectionName).add(data);

            console.log({ ...channel, streamUrl, id: id.id });
        } catch (error) {
            console.log(`error: ${error}`);
            continue;
        }
    }

    // fs.writeFileSync('channels.json', JSON.stringify(writeChannels));
    await browser.close();
})();

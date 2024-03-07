import puppeteer from 'puppeteer';
import nodemailer from 'nodemailer';
import * as process from 'process';

const GAMO2_PRODUCT_URL = 'https://www.gamo2.com/en/index.php?dispatch=products.view&product_id=';
const { SENDER_GMAIL_USER, SENDER_GMAIL_PASSWORD, TARGET_GMAIL_USER } = process.env;

if (!SENDER_GMAIL_USER || !SENDER_GMAIL_PASSWORD || !TARGET_GMAIL_USER) {
  throw new Error('GMAIL_USER and GMAIL_PASSWORD must be set');
}

type SearchItem = { productId: number; name: string };

const searchList: SearchItem[] = [
  {
    productId: 392,
    name: 'Ontroller'
  }
];

async function sendEmail({ productId, name }: SearchItem) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: SENDER_GMAIL_USER,
      pass: SENDER_GMAIL_PASSWORD
    }
  });

  await transporter.sendMail({
    from: '"Your Name" <your.email@gmail.com>',
    to: TARGET_GMAIL_USER,
    subject: `Gamo2 ${name} Restock!!`,
    html: `
<p>
    Gamo2 <b>${name}</b> Restocked<br>
    <br>
    Please check the link below<br>
    <a href="${GAMO2_PRODUCT_URL}${productId}">${GAMO2_PRODUCT_URL}${productId}</a>
</p>
`
  });
}

(async () => {
  try {
    const browser = await puppeteer.launch();

    await Promise.all(
      searchList.map(async (item) => {
        const page = await browser.newPage();

        await page.goto(`${GAMO2_PRODUCT_URL}${item.productId}`);
        await page.setViewport({ width: 1080, height: 1024 });

        try {
          await page.waitForSelector('.qty-out-of-stock', {
            timeout: 5000
          });
        } catch (e) {
          await sendEmail(item);
        }

        page.close();
      })
    );

    browser.close();

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

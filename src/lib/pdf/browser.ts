import type { PdfOptions } from "@/lib/botc/types";

const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

async function getBrowser() {
  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = (await import("puppeteer-core")).default;
    return puppeteer.launch({
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      executablePath: await chromium.executablePath(),
      headless: "shell",
    });
  } else {
    // Local dev: use system-installed Chrome/Chromium
    const puppeteer = (await import("puppeteer-core")).default;

    // Try common Chrome paths
    const paths = [
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
      "/snap/bin/chromium",
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    ];

    let executablePath: string | undefined;
    const { existsSync } = await import("fs");
    for (const p of paths) {
      if (existsSync(p)) {
        executablePath = p;
        break;
      }
    }

    if (!executablePath) {
      throw new Error(
        "Chrome/Chromium not found. Install Chrome or set PUPPETEER_EXECUTABLE_PATH.",
      );
    }

    return puppeteer.launch({
      headless: true,
      executablePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-web-security"],
    });
  }
}

export async function generatePdf(html: string, options: PdfOptions): Promise<Buffer> {
  const browser = await getBrowser();

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: ["networkidle0", "load"],
    });

    const format = options.paperSize === "A4" ? "a4" : "letter";

    const pdf = await page.pdf({
      format,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      landscape: false,
      preferCSSPageSize: true,
      waitForFonts: true,
      timeout: 60_000,
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

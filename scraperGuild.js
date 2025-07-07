const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");

puppeteer.use(StealthPlugin());

async function scrapeGuildData() {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", // Evita uso excesivo de memoria compartida
        "--disable-gpu", // No necesitamos GPU
        "--single-process",
        "--no-zygote"
      ],
    });

    const page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 720 }); // Resolución estándar baja

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    );

    await page.setExtraHTTPHeaders({
      "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    });

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (["image", "stylesheet", "font", "media"].includes(type)) {
        req.abort(); // Ahorra red y RAM
      } else {
        req.continue();
      }
    });

    await page.goto("https://axieclassic.com/guilds/mGfOIl8T", {
      waitUntil: "domcontentloaded",
      timeout: 0,
    });

    try {
      await page.waitForSelector('a[href^="/profile/"]', { timeout: 60000 });
      await page.waitForSelector("span.text-base.font-semibold", { timeout: 60000 });
    } catch (err) {
      const html = await page.content();
      fs.writeFileSync("error-page.html", html); // solo para debug
      console.error("❌ No se encontró el selector. HTML guardado.");
      throw err;
    }

    await new Promise((r) => setTimeout(r, 3000)); // Reducido a 3s para optimizar

    const guildData = await page.evaluate(() => {
      const guildName =
        document.querySelector("h2.text-center.text-2xl.font-bold.text-neutral-100")?.innerText ||
        "Nombre no encontrado";

      const players = Array.from(document.querySelectorAll('a[href^="/profile/"]')).map((player, index) => {
        const pointsElements = document.querySelectorAll("span.text-base.font-semibold");
        return {
          name: player.innerText.trim() || "Sin nombre",
          id: player.getAttribute("href")?.replace("/profile/", "") || "ID desconocido",
          points: pointsElements[index]?.innerText.trim() || "0",
        };
      });

      return { guildName, players };
    });

    await page.close(); // Cierra la página explícitamente
    await browser.close(); // Cierra el navegador completamente

    return guildData;
  } catch (error) {
    console.error("❌ Error en `scraperGuild.js`:", error);
    if (browser) await browser.close(); // Intenta cerrar si hubo error
    return null;
  }
}

module.exports = scrapeGuildData;

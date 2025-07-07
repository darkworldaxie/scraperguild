const express = require("express");
const scrapeGuildData = require("./scraperGuild");
const subirAGithub = require("./subirAGithub");

const app = express();

app.get("/ejecutar-scraper", async (req, res) => {
  try {
    const data = await scrapeGuildData();
    if (!data) throw new Error("No se pudo scrapear.");

    const filename = "guild1.json";
    const content = JSON.stringify(data, null, 2);

    const subida = await subirAGithub({
      repo: "darkworldaxie/guild-data",
      path: `guild/${filename}`,
      content,
      message: "📦 Actualización automática de guild1.json",
      token: process.env.GITHUB_TOKEN,
    });

    res.send("✅ JSON generado y subido a GitHub");
  } catch (err) {
    console.error("❌ Error al ejecutar todo:", err);
    res.status(500).send("❌ Error general");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor activo en puerto ${PORT}`));


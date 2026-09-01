import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.SHARE_CARD_CONCEPT_URL ?? "http://localhost:3000/share-card-concepts";
const outputDirectory = path.resolve("artifacts/share-card-concepts");

const fileNames = [
  "01-personal-scrapbook.png",
  "02-poster-grid.png",
  "03-film-collage-poster.png",
  "04-type-is-the-poster.png",
  "05-community-spotlight.png",
  "06-pathway-worlds.png",
  "07-community-issue.png",
  "08-split-editorial.png",
  "09-minimal-editorial.png",
  "10-color-bands.png",
  "11-collage-window.png",
];

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelectorAll("canvas[data-rendered='true']").length === 11);

  const cards = await page.locator("canvas[data-rendered='true']").evaluateAll((canvases) =>
    canvases.map((canvas) => ({
      height: canvas.height,
      png: canvas.toDataURL("image/png").split(",")[1],
      width: canvas.width,
    })),
  );

  if (cards.length !== fileNames.length) {
    throw new Error(`Expected ${fileNames.length} cards, received ${cards.length}.`);
  }

  for (const [index, card] of cards.entries()) {
    if (card.width !== 1080 || card.height !== 1350) {
      throw new Error(`${fileNames[index]} rendered at ${card.width}×${card.height}.`);
    }

    await writeFile(path.join(outputDirectory, fileNames[index]), Buffer.from(card.png, "base64"));
  }

  console.log(`Exported ${cards.length} share-card concepts to ${outputDirectory}`);
} finally {
  await browser.close();
}

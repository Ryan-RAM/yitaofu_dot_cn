import sharp from "sharp";
import fs from "fs";
import path from "path";

const INPUT_DIRS = [
  "public/images/projects",
  "public/images/stories",
];

const OUTPUT_ROOT = "public/images/web";

const MAX_SIZE = 3200;
const QUALITY = 85;

const SUPPORTED_EXTENSIONS = [".png", ".jpg", ".jpeg"];

let processed = 0;
let skipped = 0;
let originalBytes = 0;
let outputBytes = 0;

async function getFiles(dir) {
  const entries = await fs.promises.readdir(dir, {
    withFileTypes: true,
  });

  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await getFiles(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

for (const inputDir of INPUT_DIRS) {
  if (!fs.existsSync(inputDir)) {
    console.log(`Skipping missing directory: ${inputDir}`);
    continue;
  }

  const files = await getFiles(inputDir);

  for (const inputPath of files) {
    const ext = path.extname(inputPath).toLowerCase();

    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      continue;
    }

    const relativePath = path.relative(inputDir, inputPath);

    const outputDir = path.join(
      OUTPUT_ROOT,
      path.basename(inputDir)
    );

    const outputPath = path.join(
      outputDir,
      relativePath.replace(/\.(png|jpg|jpeg)$/i, ".webp")
    );

    await fs.promises.mkdir(
      path.dirname(outputPath),
      { recursive: true }
    );

    const inputStats = await fs.promises.stat(inputPath);

    originalBytes += inputStats.size;

    const image = sharp(inputPath);

    await image
      .resize({
        width: MAX_SIZE,
        height: MAX_SIZE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: QUALITY,
      })
      .toFile(outputPath);

    const outputStats = await fs.promises.stat(outputPath);

    outputBytes += outputStats.size;

    processed++;

    const saved =
      (1 - outputStats.size / inputStats.size) * 100;

    console.log(
      `${processed}. ${inputPath}`
    );

    console.log(
      `   → ${outputPath}`
    );

    console.log(
      `   ${(inputStats.size / 1024 / 1024).toFixed(2)} MB → ` +
      `${(outputStats.size / 1024 / 1024).toFixed(2)} MB ` +
      `(${saved.toFixed(1)}% smaller)`
    );
  }
}

const savedBytes = originalBytes - outputBytes;
const savedPercent =
  originalBytes > 0
    ? (savedBytes / originalBytes) * 100
    : 0;

console.log("\n========================================");
console.log(" IMAGE OPTIMIZATION COMPLETE");
console.log("========================================");

console.log(`Processed: ${processed} images`);
console.log(`Original:  ${(originalBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`WebP:      ${(outputBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`Saved:     ${(savedBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`Reduction: ${savedPercent.toFixed(1)}%`);

console.log("========================================");
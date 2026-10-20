import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const INPUT_DIRS = [
  "public/images/projects",
  "public/images/stories",
];

const OUTPUT_ROOT = "public/images/web";

// 保留现有的最大尺寸限制
const MAX_SIZE = 3200;

// 不同图片类型采用不同的 WebP 质量
const QUALITY = {
  projects: 85,
  stories: 70,
};

const SUPPORTED_EXTENSIONS = [".png", ".jpg", ".jpeg"];

const CONFIG_FILE = "public/images/web/.optimization-config.json";

const CURRENT_CONFIG = JSON.stringify({
  maxSize: MAX_SIZE,
  quality: QUALITY,
  effort: 6,
});

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
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

let previousConfig = "";

if (fs.existsSync(CONFIG_FILE)) {
  previousConfig = await fs.promises.readFile(
    CONFIG_FILE,
    "utf8"
  );
}

const configChanged = previousConfig !== CURRENT_CONFIG;

if (configChanged) {
  console.log("Image optimization config changed. Reprocessing images.");
}

for (const inputDir of INPUT_DIRS) {
  if (!fs.existsSync(inputDir)) {
    console.log(`Skipping missing directory: ${inputDir}`);
    continue;
  }

  const files = await getFiles(inputDir);
  const category = path.basename(inputDir);
  const quality = QUALITY[category] ?? 80;

  for (const inputPath of files) {
    const ext = path.extname(inputPath).toLowerCase();

    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      continue;
    }

    const relativePath = path.relative(inputDir, inputPath);

    const outputPath = path.join(
      OUTPUT_ROOT,
      category,
      relativePath.replace(/\.(png|jpg|jpeg)$/i, ".webp")
    );

    await fs.promises.mkdir(path.dirname(outputPath), {
      recursive: true,
    });

    const inputStats = await fs.promises.stat(inputPath);
    originalBytes += inputStats.size;

    // 输出已存在且比原图更新时，跳过重复处理
    if (fs.existsSync(outputPath)) {
      const outputStats = await fs.promises.stat(outputPath);

      if (!configChanged && outputStats.mtimeMs >= inputStats.mtimeMs) {
        outputBytes += outputStats.size;
        skipped++;

        console.log(`Skipped (up to date): ${outputPath}`);
        continue;
      }
    }

    const tempPath = `${outputPath}.tmp.webp`;

    try {
      await sharp(inputPath)
        .resize({
          width: MAX_SIZE,
          height: MAX_SIZE,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({
          quality,
          effort: 6,
        })
        .toFile(tempPath);

      // 成功生成后再替换正式输出，避免留下不完整文件
      await fs.promises.rename(tempPath, outputPath);
    } catch (error) {
      await fs.promises.rm(tempPath, { force: true });
      throw error;
    }

    const outputStats = await fs.promises.stat(outputPath);
    outputBytes += outputStats.size;
    processed++;

    const saved = (1 - outputStats.size / inputStats.size) * 100;

    console.log(`${processed}. ${inputPath}`);
    console.log(`   -> ${outputPath}`);
    console.log(`   Quality: ${quality}`);
    console.log(
      `   ${(inputStats.size / 1024).toFixed(1)} KiB -> ` +
      `${(outputStats.size / 1024).toFixed(1)} KiB ` +
      `(${saved.toFixed(1)}% smaller)`
    );
  }
}

const savedBytes = originalBytes - outputBytes;
const savedPercent =
  originalBytes > 0 ? (savedBytes / originalBytes) * 100 : 0;

console.log("\n========================================");
console.log(" IMAGE OPTIMIZATION COMPLETE");
console.log("========================================");
console.log(`Processed: ${processed} images`);
console.log(`Skipped:   ${skipped} images (up to date)`);
console.log(`Original:  ${(originalBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`WebP:      ${(outputBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`Saved:     ${(savedBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`Reduction: ${savedPercent.toFixed(1)}%`);
console.log("========================================");

await fs.promises.writeFile(
  CONFIG_FILE,
  CURRENT_CONFIG,
  "utf8"
);

import { rm } from "node:fs/promises";
import { resolve } from "node:path";

const directories = [
  "dist/images/projects",
  "dist/images/stories",
];

for (const directory of directories) {
  const target = resolve(directory);

  await rm(target, {
    recursive: true,
    force: true,
  });

  console.log(`Removed: ${target}`);
}

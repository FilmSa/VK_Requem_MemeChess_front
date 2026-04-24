import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const memeRoot = path.join(projectRoot, "public", "mem");
const outputFile = path.join(
  projectRoot,
  "src",
  "features",
  "chess",
  "media",
  "generated",
  "memeManifest.js"
);

const SUPPORTED_EXTENSIONS = new Set([
  ".mp4",
  ".webm",
  ".ogg",
  ".gif",
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
]);

async function walkDirectory(rootDirectory) {
  const entries = await fs.readdir(rootDirectory, { withFileTypes: true });
  const nestedEntries = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(rootDirectory, entry.name);

      if (entry.isDirectory()) {
        return walkDirectory(absolutePath);
      }

      return absolutePath;
    })
  );

  return nestedEntries.flat();
}

function normalizeTagName(tagName) {
  return String(tagName || "").trim().toUpperCase();
}

function toPublicAssetPath(absolutePath) {
  const relativePath = path.relative(path.join(projectRoot, "public"), absolutePath);
  return `/${relativePath.split(path.sep).join("/")}`;
}

async function buildManifest() {
  const manifest = {};

  try {
    const stats = await fs.stat(memeRoot);
    if (!stats.isDirectory()) {
      return manifest;
    }
  } catch {
    return manifest;
  }

  const filePaths = await walkDirectory(memeRoot);

  filePaths.forEach((filePath) => {
    const extension = path.extname(filePath).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      return;
    }

    const relativeToMemeRoot = path.relative(memeRoot, filePath);
    const pathSegments = relativeToMemeRoot.split(path.sep).filter(Boolean);
    const tagName = normalizeTagName(pathSegments[0]);

    if (!tagName) {
      return;
    }

    if (!manifest[tagName]) {
      manifest[tagName] = [];
    }

    manifest[tagName].push(toPublicAssetPath(filePath));
  });

  Object.values(manifest).forEach((assetList) => assetList.sort());

  return Object.fromEntries(
    Object.entries(manifest).sort(([leftKey], [rightKey]) =>
      leftKey.localeCompare(rightKey)
    )
  );
}

async function writeManifestFile() {
  const manifest = await buildManifest();
  const fileContents = `export const MEME_MANIFEST = ${JSON.stringify(
    manifest,
    null,
    2
  )};\n\nexport default MEME_MANIFEST;\n`;

  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, fileContents, "utf8");
}

writeManifestFile().catch((error) => {
  console.error("Failed to generate meme manifest:", error);
  process.exitCode = 1;
});

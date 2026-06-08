import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(projectRoot, "public");
const memeRoot = path.join(publicRoot, "mem");
const sourceFile = path.join(projectRoot, "scripts", "meme-catalog.source.json");
const frontendCatalogOutputFile = path.join(
  projectRoot,
  "src",
  "features",
  "chess",
  "media",
  "generated",
  "memeCatalog.js"
);
const frontendManifestOutputFile = path.join(
  projectRoot,
  "src",
  "features",
  "chess",
  "media",
  "generated",
  "memeManifest.js"
);
const serviceWorkerPrecacheOutputFile = path.join(
  projectRoot,
  "public",
  "meme-precache.js"
);

const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".ogg"]);
const IMAGE_EXTENSIONS = new Set([".gif", ".png", ".jpg", ".jpeg", ".svg"]);

function normalizeCategoryKey(categoryKey) {
  return String(categoryKey || "").trim().toUpperCase();
}

function normalizeAssetPath(assetPath) {
  const normalized = String(assetPath || "").trim().replace(/\\/g, "/");
  if (!normalized.startsWith("/")) {
    throw new Error(`Asset path must start with "/": ${assetPath}`);
  }
  return normalized;
}

function getAssetExtension(assetPath) {
  return path.extname(String(assetPath || "")).toLowerCase();
}

function getMediaType(assetPath) {
  const extension = getAssetExtension(assetPath);
  if (VIDEO_EXTENSIONS.has(extension)) {
    return "video";
  }
  if (IMAGE_EXTENSIONS.has(extension)) {
    return "image";
  }
  return "";
}

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

async function listFilesystemAssets() {
  try {
    const stats = await fs.stat(memeRoot);
    if (!stats.isDirectory()) {
      return [];
    }
  } catch {
    return [];
  }

  const filePaths = await walkDirectory(memeRoot);
  return filePaths
    .map((filePath) => {
      const relativePath = path.relative(publicRoot, filePath);
      return `/${relativePath.split(path.sep).join("/")}`;
    })
    .filter((assetPath) => Boolean(getMediaType(assetPath)))
    .sort((left, right) => left.localeCompare(right));
}

async function readSourceCatalog() {
  const fileContents = await fs.readFile(sourceFile, "utf8");
  return JSON.parse(fileContents);
}

async function buildCatalog() {
  const sourceCatalog = await readSourceCatalog();
  const filesystemAssets = await listFilesystemAssets();
  const filesystemAssetSet = new Set(filesystemAssets);
  const seenAssetPaths = new Set();
  const seenIds = new Set();
  const catalog = [];
  const catalogByCategory = {};
  const manifest = {};

  for (const [rawCategoryKey, rawEntries] of Object.entries(sourceCatalog)) {
    const categoryKey = normalizeCategoryKey(rawCategoryKey);
    if (!categoryKey) {
      throw new Error("Found meme category without a key.");
    }
    if (!Array.isArray(rawEntries) || rawEntries.length === 0) {
      throw new Error(`Category ${categoryKey} must contain at least one meme.`);
    }

    const normalizedEntries = rawEntries.map((rawEntry, index) => {
      const id = String(rawEntry?.id || "").trim();
      const repeatKey = String(rawEntry?.repeatKey || id).trim();
      const asset = normalizeAssetPath(rawEntry?.asset || "");
      const mediaType = getMediaType(asset);

      if (!id) {
        throw new Error(`Category ${categoryKey} contains meme without id at index ${index}.`);
      }
      if (seenIds.has(id)) {
        throw new Error(`Duplicate meme id detected: ${id}`);
      }
      if (!repeatKey) {
        throw new Error(`Meme ${id} must declare repeatKey or id.`);
      }
      if (!mediaType) {
        throw new Error(`Meme ${id} uses unsupported asset type: ${asset}`);
      }
      if (!filesystemAssetSet.has(asset)) {
        throw new Error(`Meme ${id} references missing asset: ${asset}`);
      }
      if (seenAssetPaths.has(asset)) {
        throw new Error(`Asset is assigned to multiple memes: ${asset}`);
      }

      seenIds.add(id);
      seenAssetPaths.add(asset);

      const normalizedEntry = {
        id,
        repeatKey,
        category: categoryKey,
        asset,
        mediaType,
      };
      catalog.push(normalizedEntry);
      return normalizedEntry;
    });

    catalogByCategory[categoryKey] = normalizedEntries;
    manifest[categoryKey] = normalizedEntries.map((entry) => entry.asset);
  }

  const unassignedAssets = filesystemAssets.filter((asset) => !seenAssetPaths.has(asset));
  if (unassignedAssets.length > 0) {
    throw new Error(
      `Every meme asset must be registered. Missing entries for: ${unassignedAssets.join(", ")}`
    );
  }

  const assetVersion = crypto
    .createHash("sha256")
    .update(JSON.stringify(catalog))
    .digest("hex")
    .slice(0, 16);

  return {
    assetVersion,
    catalog,
    catalogByCategory,
    manifest,
  };
}

function renderFrontendCatalog({ assetVersion, catalog, catalogByCategory, manifest }) {
  return `export const MEME_ASSET_VERSION = ${JSON.stringify(assetVersion)};\n\nexport const MEME_CATALOG = ${JSON.stringify(
    catalog,
    null,
    2
  )};\n\nexport const MEME_CATALOG_BY_CATEGORY = ${JSON.stringify(
    catalogByCategory,
    null,
    2
  )};\n\nexport const MEME_MANIFEST = ${JSON.stringify(
    manifest,
    null,
    2
  )};\n\nexport default MEME_CATALOG;\n`;
}

function renderFrontendManifestWrapper() {
  return `export { MEME_MANIFEST } from "./memeCatalog.js";\nexport { MEME_MANIFEST as default } from "./memeCatalog.js";\n`;
}

function renderServiceWorkerPrecache({ assetVersion, catalog }) {
  const precacheUrls = [...new Set(catalog.map((entry) => entry.asset))];
  return `self.__MEME_PRECACHE_VERSION = ${JSON.stringify(
    assetVersion
  )};\nself.__MEME_PRECACHE_URLS = ${JSON.stringify(precacheUrls, null, 2)};\n`;
}

async function writeFile(targetFile, fileContents) {
  await fs.mkdir(path.dirname(targetFile), { recursive: true });
  await fs.writeFile(targetFile, fileContents, "utf8");
}

async function generateArtifacts() {
  const catalog = await buildCatalog();

  await Promise.all([
    writeFile(frontendCatalogOutputFile, renderFrontendCatalog(catalog)),
    writeFile(frontendManifestOutputFile, renderFrontendManifestWrapper()),
    writeFile(serviceWorkerPrecacheOutputFile, renderServiceWorkerPrecache(catalog)),
  ]);
}

generateArtifacts().catch((error) => {
  console.error("Failed to generate meme manifest:", error);
  process.exitCode = 1;
});

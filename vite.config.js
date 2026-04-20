import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function normalizeBasePath(value) {
  if (!value) {
    return "/";
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") {
    return "/";
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}

function resolveBasePath() {
  const explicitBase = normalizeBasePath(process.env.VITE_BASE_PATH);
  if (explicitBase !== "/") {
    return explicitBase;
  }

  const repository = process.env.GITHUB_REPOSITORY?.split("/")[1];
  const owner = process.env.GITHUB_REPOSITORY_OWNER;
  if (!repository || !owner) {
    return "/";
  }

  if (repository.toLowerCase() === `${owner.toLowerCase()}.github.io`) {
    return "/";
  }

  return `/${repository}/`;
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: resolveBasePath(),
});

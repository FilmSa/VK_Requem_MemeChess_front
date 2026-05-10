function normalizeBasePath(value) {
  const basePath = String(value || "").trim();

  if (!basePath || basePath === "/") {
    return "/";
  }

  const withLeadingSlash = basePath.startsWith("/")
    ? basePath
    : `/${basePath}`;

  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}

export function buildAppHref(to = "/") {
  const normalizedTo = String(to || "").trim() || "/";
  const normalizedPath = normalizedTo.startsWith("/")
    ? normalizedTo
    : `/${normalizedTo}`;
  const usesHashRouter = import.meta.env.VITE_ROUTER_MODE === "hash";
  const basePath = normalizeBasePath(import.meta.env.BASE_URL || "/");
  const normalizedBasePath = basePath === "/" ? "" : basePath.replace(/\/$/, "");

  if (usesHashRouter) {
    return `${normalizedBasePath}/#${normalizedPath}`;
  }

  return `${normalizedBasePath}${normalizedPath}`;
}

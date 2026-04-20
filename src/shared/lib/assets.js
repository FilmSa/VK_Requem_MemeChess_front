function hasProtocol(value) {
  return /^(?:[a-z]+:)?\/\//i.test(value);
}

export function withAssetBase(path) {
  if (!path || typeof path !== "string") {
    return "";
  }

  if (
    hasProtocol(path) ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }

  if (!path.startsWith("/")) {
    return path;
  }

  const baseUrl = import.meta.env.BASE_URL || "/";
  if (baseUrl === "/") {
    return path;
  }

  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

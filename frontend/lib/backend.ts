export function getBackendBaseUrl() {
  return (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");
}

export function getPublicBackendBaseUrl() {
  return (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");
}

export function buildBackendUrl(path: string) {
  const baseUrl = getBackendBaseUrl();

  if (!baseUrl) {
    throw new Error("Backend URL is not configured.");
  }

  return new URL(path, `${baseUrl}/`);
}

export function buildBrowserBackendUrl(path: string) {
  const baseUrl = getPublicBackendBaseUrl();

  if (!baseUrl) {
    return path;
  }

  return new URL(path, `${baseUrl}/`).toString();
}

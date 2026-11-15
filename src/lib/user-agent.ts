/**
 * A user agent in a few words, e.g. "Safari on iPhone", "Chrome on Windows", or the program
 * for a sign-in made outside a browser, e.g. "Node.js", "PowerShell on Windows".
 */
export function browserSummary(userAgent: string | null): string {
  if (!userAgent) return "Unknown browser";
  const client = /WindowsPowerShell|PowerShell\//.test(userAgent)
    ? "PowerShell"
    : /^node$|node-fetch|undici/i.test(userAgent)
      ? "Node.js"
      : /^curl\//.test(userAgent)
        ? "curl"
        : /PostmanRuntime/.test(userAgent)
          ? "Postman"
          : /Edg\//.test(userAgent)
            ? "Edge"
            : /Firefox\//.test(userAgent)
              ? "Firefox"
              : /Chrome\//.test(userAgent)
                ? "Chrome"
                : /Safari\//.test(userAgent)
                  ? "Safari"
                  : /^Mozilla\//.test(userAgent)
                    ? "A browser"
                    : "Another app";
  const device = /iPhone/.test(userAgent)
    ? "iPhone"
    : /iPad/.test(userAgent)
      ? "iPad"
      : /Android/.test(userAgent)
        ? "Android"
        : /Mac OS X/.test(userAgent)
          ? "macOS"
          : /Windows/.test(userAgent)
            ? "Windows"
            : /Linux/.test(userAgent)
              ? "Linux"
              : null;
  return device ? `${client} on ${device}` : client;
}

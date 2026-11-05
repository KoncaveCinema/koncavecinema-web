/** Saves text the page has built (a calendar file, a CSV) as a download. Browser only. */
export function downloadFile(content: string, type: string, filename: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([content], { type }));
  link.download = filename;
  link.click();
  // Revoke after the download has started (immediate revocation cancels it in some browsers)
  setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
}

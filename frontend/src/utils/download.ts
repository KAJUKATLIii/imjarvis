/**
 * Bulletproof browser PDF file downloader.
 * Handles both native HTTP attachment streaming and persistent ArrayBuffer Blob download.
 */
export async function downloadInvoicePdf(url: string, filename: string): Promise<void> {
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  // Primary: Native HTTP attachment trigger.
  // The server responds with `Content-Disposition: attachment; filename="..."` and `Content-Type: application/pdf`.
  // Triggering the link allows the browser's native download manager to stream the exact bytes directly to disk
  // without any JavaScript blob lifecycle or premature revocation issues.
  try {
    const nativeLink = document.createElement('a');
    nativeLink.href = url;
    nativeLink.download = cleanFilename;
    nativeLink.target = '_blank';
    nativeLink.rel = 'noopener noreferrer';
    document.body.appendChild(nativeLink);
    nativeLink.click();
    document.body.removeChild(nativeLink);
    return;
  } catch (err) {
    console.warn('Native link click failed, using binary buffer fallback:', err);
  }

  // Fallback: Fetch ArrayBuffer and create persistent Blob
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Failed to download invoice (HTTP ${response.status}): ${errorText || response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength === 0) {
    throw new Error('Downloaded PDF invoice is empty (0 bytes).');
  }

  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  const blobUrl = window.URL.createObjectURL(blob);
  const fallbackLink = document.createElement('a');
  fallbackLink.href = blobUrl;
  fallbackLink.download = cleanFilename;
  document.body.appendChild(fallbackLink);
  fallbackLink.click();
  document.body.removeChild(fallbackLink);

  // Keep object URL alive for 2 minutes to prevent Chromium from aborting the write to disk
  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 120000);
}

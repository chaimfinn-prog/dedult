export async function extractPdfTextFromBuffer(
  buffer: Buffer,
): Promise<{ text: string; pageCount: number }> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  }).promise;

  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any) => item.str || '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      pages.push(text);
    } catch {
      pages.push('');
    }
  }

  return {
    text: pages.join('\n'),
    pageCount: pdf.numPages,
  };
}

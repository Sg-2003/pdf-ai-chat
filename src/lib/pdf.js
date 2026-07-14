import pdf from 'pdf-parse/lib/pdf-parse.js';

/**
 * Extract text from PDF page-by-page.
 * Returns an array of objects: [{ pageNumber: 1, text: "..." }]
 */
export async function extractPagesFromPDF(buffer) {
  try {
    const pages = [];

    const options = {
      pagerender: function (pageData) {
        return pageData.getTextContent().then(function (textContent) {
          let text = '';
          let lastY;
          for (let item of textContent.items) {
            if (lastY === item.transform[5] || !lastY) {
              text += item.str;
            } else {
              text += '\n' + item.str;
            }
            lastY = item.transform[5];
          }
          
          const pageNum = pageData.pageIndex + 1;
          pages.push({
            pageNumber: pageNum,
            text: text.trim(),
          });
          return text;
        });
      },
    };

    await pdf(buffer, options);

    // Sort pages sequentially
    pages.sort((a, b) => a.pageNumber - b.pageNumber);
    return pages;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}

/**
 * Split page text into smaller overlapping chunks.
 * Scopes chunks strictly to their respective page numbers.
 */
export function chunkTextPages(pages, chunkSize = 1000, chunkOverlap = 200) {
  const chunks = [];

  for (const page of pages) {
    const pageText = page.text;
    const pageNum = page.pageNumber;

    if (!pageText || pageText.trim().length === 0) continue;

    // If the page is smaller than the chunkSize, push it directly and proceed
    if (pageText.length <= chunkSize) {
      if (pageText.trim().length > 30) {
        chunks.push({
          text: pageText.trim(),
          pageNumber: pageNum,
        });
      }
      continue;
    }

    let start = 0;
    while (start < pageText.length) {
      let end = start + chunkSize;
      
      if (end >= pageText.length) {
        end = pageText.length;
      } else {
        // Try to break at a space or paragraph boundary to avoid clipping words
        const nextSpace = pageText.indexOf(' ', end);
        if (nextSpace !== -1 && nextSpace - end < 40) {
          end = nextSpace;
        }
      }

      const textChunk = pageText.substring(start, end).trim();
      
      // Keep only meaningful text chunks
      if (textChunk.length > 30) {
        chunks.push({
          text: textChunk,
          pageNumber: pageNum,
        });
      }

      // If we reached the end of the text, stop
      if (end >= pageText.length) {
        break;
      }

      // Step forward by (chunkSize - chunkOverlap), ensuring positive progress
      const step = chunkSize - chunkOverlap;
      const nextStart = start + (step > 0 ? step : chunkSize);
      
      if (nextStart <= start) {
        break;
      }
      
      start = nextStart;
    }
  }

  return chunks;
}

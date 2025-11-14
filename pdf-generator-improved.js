/**
 * IMPROVED PDF GENERATION SOLUTION
 * Fixes: Cut-off content, formatting loss, page breaks
 * 
 * This solution uses jsPDF 2.x with html2canvas for reliable PDF export
 * with proper margin control, page breaks, and formatting preservation
 */

// CSS for print media - add this to your stylesheet or inject via onclone
const pdfPrintCss = `
  /* Ensure box-sizing for predictable width */
  *, *:before, *:after { box-sizing: border-box; }
  
  /* Avoid breaking inside these elements */
  .avoid-page-break {
    break-inside: avoid;
    -webkit-column-break-inside: avoid;
    page-break-inside: avoid;
  }
  
  /* Force a page break after elements */
  .page-break-after {
    break-after: page;
    page-break-after: always;
  }
  
  /* Preserve textarea formatting */
  .pdf-textarea-replacement {
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  
  /* Ensure colors are printed */
  body, .timetable-container, .timetable {
    -webkit-print-color-adjust: exact;
    color-adjust: exact;
  }
  
  /* Hide UI-only elements */
  .noprint, .ui-controls, .button, .no-export { display: none !important; }
`;

/**
 * generatePdfUsingJsPdfHtml - Main PDF generation function
 * 
 * @param {string|Element} elementOrSelector - DOM element or selector for content to export
 * @param {string} filename - Output filename (e.g., 'timetable.pdf')
 * @param {Object} options - Configuration options
 *   - margin: { top, right, bottom, left } in mm (default: 20mm all sides)
 *   - format: 'a4' (default)
 *   - orientation: 'portrait' or 'landscape' (default: 'portrait')
 *   - scale: html2canvas scale (default: 2 for crisp output)
 */
async function generatePdfUsingJsPdfHtml(elementOrSelector, filename = 'timetable.pdf', options = {}) {
  // Default options
  const defaults = {
    margin: { top: 20, right: 20, bottom: 20, left: 20 }, // mm
    format: 'a4',
    orientation: 'portrait',
    scale: Math.min(2, window.devicePixelRatio || 1.5)
  };
  options = Object.assign({}, defaults, options);

  // Resolve element
  const rootEl = (typeof elementOrSelector === 'string')
    ? document.querySelector(elementOrSelector)
    : elementOrSelector;
  
  if (!rootEl) throw new Error('generatePdf: element not found');

  // Wait for webfonts to be ready
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  // Clone element into offscreen container
  const clone = rootEl.cloneNode(true);
  const offscreenContainer = document.createElement('div');
  offscreenContainer.style.position = 'fixed';
  offscreenContainer.style.left = '-10000px';
  offscreenContainer.style.top = '0';
  offscreenContainer.style.width = 'auto';
  offscreenContainer.style.height = 'auto';
  offscreenContainer.style.overflow = 'visible';
  offscreenContainer.setAttribute('aria-hidden', 'true');

  // Calculate content width to match A4 minus margins
  const PX_PER_MM = 96 / 25.4;
  const pageWidthMm = options.format.toLowerCase() === 'a4' ? 210 : 210;
  const contentWidthMm = pageWidthMm - (options.margin.left + options.margin.right);
  const contentWidthPx = Math.round(contentWidthMm * PX_PER_MM);

  // Apply print-specific styles to clone
  clone.style.boxSizing = 'border-box';
  clone.style.width = `${contentWidthPx}px`;
  clone.style.maxWidth = `${contentWidthPx}px`;
  clone.style.background = getComputedStyle(rootEl).background || '#ffffff';

  // Replace textareas with static divs that preserve formatting
  function replaceFormControlsWithStatic(el) {
    const textareas = el.querySelectorAll('textarea');
    textareas.forEach(ta => {
      const div = document.createElement('div');
      div.className = 'pdf-textarea-replacement';
      div.textContent = ta.value;
      
      const s = window.getComputedStyle(ta);
      div.style.whiteSpace = 'pre-wrap';
      div.style.wordWrap = 'break-word';
      div.style.fontFamily = s.fontFamily;
      div.style.fontSize = s.fontSize;
      div.style.lineHeight = s.lineHeight;
      div.style.color = s.color;
      div.style.padding = s.padding;
      div.style.margin = s.margin;
      div.style.border = s.border;
      div.classList.add('avoid-page-break');
      
      ta.parentNode.replaceChild(div, ta);
    });

    // Replace input fields
    const inputs = el.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="number"]');
    inputs.forEach(inp => {
      const span = document.createElement('span');
      span.className = 'pdf-input-replacement';
      span.textContent = inp.value;
      
      const s = window.getComputedStyle(inp);
      span.style.fontFamily = s.fontFamily;
      span.style.fontSize = s.fontSize;
      span.style.lineHeight = s.lineHeight;
      span.style.color = s.color;
      
      inp.parentNode.replaceChild(span, inp);
    });
  }

  replaceFormControlsWithStatic(clone);

  // Append clone to offscreen container
  offscreenContainer.appendChild(clone);
  document.body.appendChild(offscreenContainer);

  // Create jsPDF document
  const { jsPDF } = window;
  if (!jsPDF) {
    document.body.removeChild(offscreenContainer);
    throw new Error('jsPDF not found. Ensure jspdf is loaded before calling generatePdf.');
  }

  const doc = new jsPDF({
    unit: 'mm',
    format: options.format || 'a4',
    orientation: options.orientation || 'portrait'
  });

  // Prepare html2canvas options
  const html2canvasOpts = {
    scale: options.scale,
    useCORS: true,
    allowTaint: false,
    logging: false,
    windowWidth: clone.scrollWidth
  };

  // Use jsPDF.html with autoPaging for proper text flow
  return new Promise((resolve, reject) => {
    try {
      doc.html(clone, {
        x: options.margin.left,
        y: options.margin.top,
        html2canvas: html2canvasOpts,
        autoPaging: 'text',
        callback: function (pdfDoc) {
          try {
            pdfDoc.save(filename);
            resolve();
          } catch (e) {
            reject(e);
          }
        },
        onclone: function (clonedDoc) {
          // Inject print CSS into cloned document
          const style = clonedDoc.createElement('style');
          style.textContent = pdfPrintCss;
          clonedDoc.head.appendChild(style);
        }
      });
    } catch (e) {
      reject(e);
    }
  }).finally(() => {
    // Cleanup
    document.body.removeChild(offscreenContainer);
  });
}

/**
 * INTEGRATION INSTRUCTIONS:
 * 
 * 1. Add CDN scripts to your HTML <head>:
 *    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
 *    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
 * 
 * 2. Replace your existing generatePdf function call with:
 *    document.getElementById('printBtn').addEventListener('click', async () => {
 *      const loadingOverlay = document.getElementById('loadingOverlay');
 *      loadingOverlay.style.display = 'flex';
 *      try {
 *        await generatePdfUsingJsPdfHtml('#print-area', 'timetable.pdf', {
 *          margin: { top: 20, right: 20, bottom: 20, left: 20 },
 *          scale: 2
 *        });
 *      } catch (error) {
 *        console.error('PDF generation failed:', error);
 *        alert('Error generating PDF: ' + error.message);
 *      } finally {
 *        loadingOverlay.style.display = 'none';
 *      }
 *    });
 * 
 * 3. Add this CSS to your stylesheet:
 *    @media print {
 *      .avoid-page-break {
 *        break-inside: avoid;
 *        page-break-inside: avoid;
 *      }
 *      .pdf-textarea-replacement {
 *        white-space: pre-wrap;
 *        word-wrap: break-word;
 *      }
 *    }
 */

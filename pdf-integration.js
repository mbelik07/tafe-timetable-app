/**
 * PDF Integration Module
 * Integrates the improved PDF generator with the timetable app
 * Handles CDN loading and PDF generation with proper error handling
 */

// Load required libraries from CDN
function loadPdfLibraries() {
  return Promise.all([
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js')
  ]);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (window[src.includes('jspdf') ? 'jsPDF' : 'html2canvas']) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// CSS for print media
const pdfPrintCss = `
  *, *:before, *:after { box-sizing: border-box; }
  
  .avoid-page-break {
    break-inside: avoid;
    -webkit-column-break-inside: avoid;
    page-break-inside: avoid;
  }
  
  .page-break-after {
    break-after: page;
    page-break-after: always;
  }
  
  .pdf-textarea-replacement {
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  
  body, .timetable-container, .timetable {
    -webkit-print-color-adjust: exact;
    color-adjust: exact;
  }
  
  .noprint, .ui-controls, .button, .no-export { display: none !important; }
`;

/**
 * Main PDF generation function
 * @param {string|Element} elementOrSelector - DOM element or selector
 * @param {string} filename - Output filename
 * @param {Object} options - Configuration options
 */
async function generatePdfUsingJsPdfHtml(elementOrSelector, filename = 'timetable.pdf', options = {}) {
  const defaults = {
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    format: 'a4',
    orientation: 'portrait',
    scale: Math.min(2, window.devicePixelRatio || 1.5)
  };
  options = Object.assign({}, defaults, options);

  const rootEl = (typeof elementOrSelector === 'string')
    ? document.querySelector(elementOrSelector)
    : elementOrSelector;

  if (!rootEl) throw new Error('generatePdf: element not found');

  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const clone = rootEl.cloneNode(true);
  const offscreenContainer = document.createElement('div');
  offscreenContainer.style.position = 'fixed';
  offscreenContainer.style.left = '-10000px';
  offscreenContainer.style.top = '0';
  offscreenContainer.style.width = 'auto';
  offscreenContainer.style.height = 'auto';
  offscreenContainer.style.overflow = 'visible';
  offscreenContainer.setAttribute('aria-hidden', 'true');

  const PX_PER_MM = 96 / 25.4;
  const pageWidthMm = 210;
  const contentWidthMm = pageWidthMm - (options.margin.left + options.margin.right);
  const contentWidthPx = Math.round(contentWidthMm * PX_PER_MM);

  clone.style.boxSizing = 'border-box';
  clone.style.width = `${contentWidthPx}px`;
  clone.style.maxWidth = `${contentWidthPx}px`;
  clone.style.background = getComputedStyle(rootEl).background || '#ffffff';

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
  offscreenContainer.appendChild(clone);
  document.body.appendChild(offscreenContainer);

  const { jsPDF } = window;
  if (!jsPDF) {
    document.body.removeChild(offscreenContainer);
    throw new Error('jsPDF not found. Ensure jspdf is loaded.');
  }

  const doc = new jsPDF({
    unit: 'mm',
    format: options.format || 'a4',
    orientation: options.orientation || 'portrait'
  });

  const html2canvasOpts = {
    scale: options.scale,
    useCORS: true,
    allowTaint: false,
    logging: false,
    windowWidth: clone.scrollWidth
  };

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
          const style = clonedDoc.createElement('style');
          style.textContent = pdfPrintCss;
          clonedDoc.head.appendChild(style);
        }
      });
    } catch (e) {
      reject(e);
    }
  }).finally(() => {
    document.body.removeChild(offscreenContainer);
  });
}

// Initialize PDF functionality when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadPdfLibraries();
    console.log('PDF libraries loaded successfully');
    
    // Setup print button
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
      printBtn.addEventListener('click', async () => {
        printBtn.disabled = true;
        printBtn.textContent = '📄 Generating PDF...';
        
        try {
          await generatePdfUsingJsPdfHtml('#print-area', 'timetable.pdf', {
            margin: { top: 20, right: 20, bottom: 20, left: 20 },
            scale: 2
          });
          console.log('PDF generated successfully');
        } catch (error) {
          console.error('PDF generation failed:', error);
          alert('Error generating PDF: ' + error.message);
        } finally {
          printBtn.disabled = false;
          printBtn.textContent = '📄 Download PDF';
        }
      });
    }
  } catch (error) {
    console.error('Failed to load PDF libraries:', error);
  }
});

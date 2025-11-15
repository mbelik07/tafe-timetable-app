/**
 * IMPROVED PDF GENERATION SOLUTION
 * Fixes: Cut-off content, formatting loss, page breaks, day spacing, text wrapping
 * 
 * This solution uses jsPDF 2.x with html2canvas for reliable PDF export
 * with proper margin control, page breaks, and formatting preservation
 */

async function generatePdf() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  loadingOverlay.style.display = 'flex';

  try {
    // Ensure jsPDF and html2canvas are loaded
    if (!window.jsPDF || !window.html2canvas) {
      throw new Error('jsPDF or html2canvas not loaded. Please ensure CDN scripts are included.');
    }

    const element = document.getElementById('print-area');
    if (!element) {
      throw new Error('Print area element not found');
    }

    // Get current semester for filename
    const semesterLabel = document.getElementById('main-timetable-title')?.textContent || 'timetable';
    const filename = `${semesterLabel.replace(/\s+/g, '_')}.pdf`;

    await generatePdfFromElement(element, filename);
    
  } catch (error) {
    console.error('PDF generation failed:', error);
    alert('Error generating PDF: ' + error.message);
  } finally {
    loadingOverlay.style.display = 'none';
  }
}

/**
 * Main PDF generation function using jsPDF + html2canvas
 * 
 * @param {Element} element - DOM element to convert to PDF
 * @param {string} filename - Output filename
 * @param {Object} options - Configuration options
 */
async function generatePdfFromElement(element, filename = 'timetable.pdf', options = {}) {
  const defaults = {
    margin: 20,
    format: 'a4',
    orientation: 'portrait',
    scale: 2,
    quality: 0.95
  };
  
  options = Object.assign({}, defaults, options);

  // Wait for fonts to be ready
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  // Clone the element
  const clone = element.cloneNode(true);
  
  // Create offscreen container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = 'auto';
  container.style.height = 'auto';
  container.style.overflow = 'visible';
  container.style.zIndex = '-9999';
  
  // Add the pdf-snapshot class to enable snapshot-friendly CSS
  clone.classList.add('pdf-snapshot');
  
  container.appendChild(clone);
  document.body.appendChild(container);

  try {
    // Calculate dimensions
    const PX_PER_MM = 96 / 25.4;
    const pageWidthMm = options.format === 'a4' ? 210 : 210;
    const pageHeightMm = options.format === 'a4' ? 297 : 297;
    const contentWidthMm = pageWidthMm - (options.margin * 2);
    const contentWidthPx = Math.round(contentWidthMm * PX_PER_MM);

    // Set clone width to match page content width
    clone.style.width = `${contentWidthPx}px`;
    clone.style.maxWidth = `${contentWidthPx}px`;
    clone.style.boxSizing = 'border-box';
    clone.style.background = '#ffffff';

    // Replace form controls with static content
    replaceFormControls(clone);

    // Create jsPDF instance
    const { jsPDF } = window;
    const doc = new jsPDF({
      unit: 'mm',
      format: options.format,
      orientation: options.orientation,
      compress: true
    });

    // Prepare html2canvas options for better snapshot quality
    const html2canvasOptions = {
      scale: options.scale,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: contentWidthPx,
      windowHeight: clone.scrollHeight,
      scrollX: 0,
      scrollY: 0
    };

    // Use jsPDF.html with proper options
    await new Promise((resolve, reject) => {
      try {
        doc.html(clone, {
          x: options.margin,
          y: options.margin,
          width: contentWidthMm,
          html2canvas: html2canvasOptions,
          autoPaging: 'slice',
          callback: function(pdfDoc) {
            try {
              pdfDoc.save(filename);
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      } catch (e) {
        reject(e);
      }
    });

  } finally {
    // Cleanup
    document.body.removeChild(container);
  }
}

/**
 * Replace form controls with static content for PDF rendering
 * @param {Element} element - Element to process
 */
function replaceFormControls(element) {
  // Replace textareas
  const textareas = element.querySelectorAll('textarea');
  textareas.forEach(textarea => {
    const div = document.createElement('div');
    div.className = 'pdf-textarea-replacement';
    div.textContent = textarea.value;
    
    const style = window.getComputedStyle(textarea);
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    div.style.fontFamily = style.fontFamily || "'Courier New', monospace";
    div.style.fontSize = style.fontSize || '10pt';
    div.style.lineHeight = style.lineHeight || '1.4';
    div.style.color = style.color;
    div.style.padding = style.padding || '8px';
    div.style.margin = style.margin || '8px 0';
    div.style.border = style.border || '1px solid #ccc';
    div.style.backgroundColor = '#fafafa';
    div.style.display = 'block';
    
    textarea.parentNode.replaceChild(div, textarea);
  });

  // Replace input fields
  const inputs = element.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="number"]');
  inputs.forEach(input => {
    const span = document.createElement('span');
    span.className = 'pdf-input-replacement';
    span.textContent = input.value;
    
    const style = window.getComputedStyle(input);
    span.style.fontFamily = style.fontFamily;
    span.style.fontSize = style.fontSize;
    span.style.lineHeight = style.lineHeight;
    span.style.color = style.color;
    span.style.display = 'inline-block';
    
    input.parentNode.replaceChild(span, input);
  });
}

// Initialize PDF generation when page loads
document.addEventListener('DOMContentLoaded', () => {
  const printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', generatePdf);
  }
});

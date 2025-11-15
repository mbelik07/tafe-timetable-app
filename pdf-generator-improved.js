/**
 * COMPLETELY NEW PDF GENERATION - DIRECT APPROACH
 * This uses html2pdf.js for simpler, more reliable PDF generation
 * Directly manipulates the DOM to force proper spacing and wrapping
 */

async function generatePdf() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  loadingOverlay.style.display = 'flex';

  try {
    const element = document.getElementById('print-area');
    if (!element) {
      throw new Error('Print area element not found');
    }

    // Clone the element
    const clone = element.cloneNode(true);
    
    // Create container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = '210mm';
    container.style.padding = '10mm';
    container.style.backgroundColor = 'white';
    container.appendChild(clone);
    document.body.appendChild(container);

    try {
      // CRITICAL FIX: Add spacing after day headers
      const dayHeaders = clone.querySelectorAll('.print-day-header');
      dayHeaders.forEach(header => {
        // Force explicit height and spacing
        header.style.height = '60px';
        header.style.minHeight = '60px';
        header.style.paddingBottom = '15px';
        header.style.marginBottom = '15px';
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.justifyContent = 'center';
        header.style.boxSizing = 'border-box';
        
        // Add a spacer div after each header
        const spacer = document.createElement('div');
        spacer.style.height = '20px';
        spacer.style.width = '100%';
        spacer.style.backgroundColor = 'transparent';
        spacer.style.display = 'block';
        header.parentNode.insertBefore(spacer, header.nextSibling);
      });

      // CRITICAL FIX: Force text wrapping in all cells
      const cells = clone.querySelectorAll('.print-cell, .print-session, .teacher-contact-info, .notes-section, .legend-section');
      cells.forEach(cell => {
        cell.style.whiteSpace = 'normal';
        cell.style.wordWrap = 'break-word';
        cell.style.overflowWrap = 'break-word';
        cell.style.wordBreak = 'break-word';
        cell.style.overflow = 'visible';
        cell.style.boxSizing = 'border-box';
      });

      // CRITICAL FIX: Ensure bottom sections don't get cut off
      const bottomSections = clone.querySelector('.bottom-sections-container');
      if (bottomSections) {
        bottomSections.style.pageBreakInside = 'avoid';
        bottomSections.style.marginTop = '20px';
        bottomSections.style.marginBottom = '20px';
      }

      // Replace textareas with divs
      const textareas = clone.querySelectorAll('textarea');
      textareas.forEach(textarea => {
        const div = document.createElement('div');
        div.textContent = textarea.value;
        div.style.whiteSpace = 'pre-wrap';
        div.style.wordWrap = 'break-word';
        div.style.padding = '8px';
        div.style.border = '1px solid #ccc';
        div.style.backgroundColor = '#fafafa';
        div.style.fontFamily = 'Arial, sans-serif';
        div.style.fontSize = '12px';
        div.style.lineHeight = '1.4';
        textarea.parentNode.replaceChild(div, textarea);
      });

      // Use html2pdf if available, otherwise fallback to html2canvas + jsPDF
      if (window.html2pdf) {
        const opt = {
          margin: 10,
          filename: 'timetable.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };
        
        await html2pdf().set(opt).from(clone).save();
      } else {
        // Fallback to jsPDF + html2canvas
        const { jsPDF } = window;
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        await doc.html(clone, {
          callback: function(doc) {
            doc.save('timetable.pdf');
          },
          x: 10,
          y: 10,
          width: 277,
          windowWidth: 1200,
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false
          }
        });
      }

    } finally {
      document.body.removeChild(container);
    }

  } catch (error) {
    console.error('PDF generation failed:', error);
    alert('Error generating PDF: ' + error.message);
  } finally {
    loadingOverlay.style.display = 'none';
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
      printBtn.addEventListener('click', generatePdf);
    }
  });
} else {
  const printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', generatePdf);
  }
}

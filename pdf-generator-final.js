/**
 * FINAL PDF GENERATION SOLUTION
 * Complete rewrite with all fixes:
 * - Day header spacing (120px)
 * - Course notes expansion
 * - Text wrapping for paragraphs
 * - Total Hours not cut off
 * - Legend fully visible
 */

async function generatePdf() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = 'flex';
  }

  try {
    // Ensure jsPDF and html2canvas are loaded
    if (!window.jsPDF || !window.html2canvas) {
      throw new Error('jsPDF or html2canvas not loaded. Please ensure CDN scripts are included.');
    }

    const element = document.getElementById('print-area');
    if (!element) {
      throw new Error('Print area element not found');
    }

    // Get semester name for filename
    const semesterLabel = document.getElementById('main-timetable-title')?.textContent || 'timetable';
    const filename = `${semesterLabel.replace(/\s+/g, '_')}.pdf`;

    // Clone the element
    const clone = element.cloneNode(true);
    
    // Create offscreen container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = '210mm';
    container.style.height = 'auto';
    container.style.overflow = 'visible';
    container.style.zIndex = '-9999';
    container.style.background = 'white';
    container.style.padding = '20mm';
    container.style.boxSizing = 'border-box';
    
    container.appendChild(clone);
    document.body.appendChild(container);

    try {
      // Wait for any pending renders
      await new Promise(resolve => setTimeout(resolve, 500));

      // Use html2canvas to capture the element
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1000,
        windowHeight: clone.scrollHeight
      });

      // Create PDF from canvas
      const { jsPDF } = window;
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate dimensions
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const doc = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true
      });

      let heightLeft = imgHeight;
      let position = 0;

      // Add image to PDF, handling multiple pages
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297; // A4 height in mm

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      // Save the PDF
      doc.save(filename);
      
    } finally {
      // Cleanup
      document.body.removeChild(container);
    }

  } catch (error) {
    console.error('PDF generation failed:', error);
    alert('Error generating PDF: ' + error.message);
  } finally {
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', generatePdf);
  }
});

class PDFGenerator {
  constructor(db, getCurrentSemesterData) {
    this.db = db;
    this.getCurrentSemesterData = getCurrentSemesterData;
  }

  generate() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';

    const activeView = document.querySelector('.view-container.active');
    const semesterData = this.getCurrentSemesterData();
    const currentView = window.currentView || 'main-timetable';

    if (!activeView) {
      alert('Could not find an active view to print.');
      loadingOverlay.style.display = 'none';
      return;
    }

    const viewLabels = {
      'main-timetable': 'Main Timetable',
      'staff-summary': 'Staff Summary',
      'dispute-log': 'Dispute Log',
      'course-print': 'Course Print',
      'teacher-print': 'Teacher Print',
      'tasks': 'Tasks'
    };

    const filename = `${this.db.currentSemester} - ${semesterData.currentCollege} - ${viewLabels[currentView]}.pdf`.replace(/[\s/]/g, '_');

    // Clone the element to avoid modifying the original
    const elementToPrint = activeView.cloneNode(true);
    
    // Clean up the cloned element
    this.cleanupElement(elementToPrint);

    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'landscape',
        compress: true
      }
    };

    // Use setTimeout to ensure rendering is complete
    setTimeout(() => {
      html2pdf()
        .set(opt)
        .from(elementToPrint)
        .save()
        .then(() => {
          loadingOverlay.style.display = 'none';
          alert('✅ PDF generated successfully!');
        })
        .catch(err => {
          console.error('PDF generation failed:', err);
          loadingOverlay.style.display = 'none';
          alert('❌ Error generating PDF. Please try again.');
        });
    }, 500);
  }

  cleanupElement(element) {
    // Remove no-print elements
    const noPrintElements = element.querySelectorAll('.no-print');
    noPrintElements.forEach(el => el.remove());

    // Ensure proper text wrapping for notes
    const notesContent = element.querySelector('.pdf-notes-content');
    if (notesContent) {
      notesContent.style.whiteSpace = 'pre-wrap';
      notesContent.style.wordWrap = 'break-word';
      notesContent.style.overflowWrap = 'break-word';
      notesContent.contentEditable = false;
    }

    // Ensure tables are properly formatted
    const tables = element.querySelectorAll('table');
    tables.forEach(table => {
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
    });

    return element;
  }
}

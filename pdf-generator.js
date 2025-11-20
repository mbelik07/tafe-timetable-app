class PDFGenerator {
  constructor(db, getCurrentSemesterData) {
    this.db = db;
    this.getCurrentSemesterData = getCurrentSemesterData;
  }

  generate() {
    const semesterData = this.getCurrentSemesterData();
    const element = document.getElementById('print-area');
    
    if (!element) {
      alert('Error: Print area not found');
      return;
    }

    // Get the current view type
    const currentView = window.currentView || 'main-timetable';
    
    // Get additional info based on view type
    let additionalInfo = '';
    
    if (currentView === 'teacher-print') {
      // Get the selected teacher from the active view
      const teacherPrintView = document.getElementById('teacher-print-view');
      const teacherTitle = teacherPrintView?.querySelector('.pdf-title h2')?.textContent || '';
      if (teacherTitle) {
        additionalInfo = `-${teacherTitle.split(' - ')[0].replace(/\s+/g, '-')}`;
      }
    } else if (currentView === 'course-print') {
      // Get the selected course from the active view
      const coursePrintView = document.getElementById('course-print-view');
      const courseTitle = coursePrintView?.querySelector('.pdf-title h2')?.textContent || '';
      if (courseTitle) {
        const courseCode = courseTitle.split(' (')[1]?.replace(')', '') || '';
        if (courseCode) {
          additionalInfo = `-${courseCode}`;
        }
      }
    }

    const filename = `timetable-${this.db.currentSemester}-${semesterData.currentCollege}-${currentView}${additionalInfo}-${new Date().toISOString().split('T')[0]}.pdf`;

    const opt = {
      margin: 10,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(opt).from(element).save();
  }
}

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
      const teacherDropdown = document.getElementById('teacherDropdown');
      const selectedTeacherItem = teacherDropdown?.querySelector('.dropdown-item');
      additionalInfo = selectedTeacherItem ? `-${selectedTeacherItem.textContent.replace(/\s+/g, '-')}` : '';
    } else if (currentView === 'course-print') {
      const courseDropdown = document.getElementById('courseDropdown');
      const selectedCourseItem = courseDropdown?.querySelector('.dropdown-item');
      additionalInfo = selectedCourseItem ? `-${selectedCourseItem.textContent.split(' - ')[0]}` : '';
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

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

    const opt = {
      margin: 10,
      filename: `timetable-${this.db.currentSemester}-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(opt).from(element).save();
  }
}

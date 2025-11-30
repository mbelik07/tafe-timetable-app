// Enhanced Timetable Download Manager with Draft/Final PDF Support
// This file handles PDF generation with optional draft watermark

class TimetableDownloadManager {
    constructor() {
        this.isDraftMode = false;
        this.downloadMode = 'final'; // 'draft' or 'final'
    }

    /**
     * Initialize download UI components
     */
    initializeDownloadUI() {
        // Find or create download container
        let downloadContainer = document.querySelector('[data-download-container]') || 
                               document.querySelector('.download-section') ||
                               document.getElementById('download-controls');
        
        if (!downloadContainer) {
            // Create container if it doesn't exist
            downloadContainer = document.createElement('div');
            downloadContainer.className = 'download-controls';
            downloadContainer.id = 'download-controls';
            document.body.appendChild(downloadContainer);
        }

        // Create mode selector
        const modeSelector = document.createElement('div');
        modeSelector.className = 'download-mode-selector';
        modeSelector.innerHTML = `
            <h4>Download Options</h4>
            <div class="mode-options">
                <label class="mode-option">
                    <input type="radio" name="download-mode" value="draft" class="mode-radio">
                    <span class="mode-label">
                        <strong>Draft Version</strong>
                        <small>Includes watermark - for internal review</small>
                    </span>
                </label>
                <label class="mode-option">
                    <input type="radio" name="download-mode" value="final" class="mode-radio" checked>
                    <span class="mode-label">
                        <strong>Final Version</strong>
                        <small>Clean version - for official use</small>
                    </span>
                </label>
            </div>
        `;

        // Create download button
        const downloadBtn = document.createElement('button');
        downloadBtn.id = 'download-pdf-btn';
        downloadBtn.className = 'btn btn-primary download-btn';
        downloadBtn.innerHTML = `
            <span class="btn-icon">📄</span>
            <span class="btn-text">Download PDF</span>
        `;
        downloadBtn.addEventListener('click', () => this.downloadPDF());

        // Create status display
        const statusDisplay = document.createElement('div');
        statusDisplay.id = 'download-status';
        statusDisplay.className = 'download-status';

        // Insert into container
        downloadContainer.appendChild(modeSelector);
        downloadContainer.appendChild(downloadBtn);
        downloadContainer.appendChild(statusDisplay);

        // Listen for mode changes
        document.querySelectorAll('.mode-radio').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.downloadMode = e.target.value;
                this.updateDownloadButton();
            });
        });

        this.updateDownloadButton();
    }

    /**
     * Update download button based on selected mode
     */
    updateDownloadButton() {
        const btn = document.getElementById('download-pdf-btn');
        const btnText = btn.querySelector('.btn-text');
        
        if (this.downloadMode === 'draft') {
            btnText.textContent = 'Download Draft PDF';
            btn.classList.add('draft-mode');
        } else {
            btnText.textContent = 'Download Final PDF';
            btn.classList.remove('draft-mode');
        }
    }

    /**
     * Show download status message
     */
    showStatus(message, type = 'info') {
        const statusDisplay = document.getElementById('download-status');
        if (statusDisplay) {
            statusDisplay.className = `download-status ${type}`;
            statusDisplay.textContent = message;
            statusDisplay.style.display = 'block';
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                statusDisplay.style.display = 'none';
            }, 3000);
        }
    }

    /**
     * Download timetable as PDF with draft/final options
     */
    async downloadPDF() {
        try {
            this.showStatus('Preparing PDF...', 'info');
            
            const element = document.querySelector('[data-timetable]') || 
                          document.querySelector('.timetable-container') ||
                          document.querySelector('#timetable') ||
                          document.querySelector('.timetable');
            
            if (!element) {
                this.showStatus('Timetable not found', 'error');
                return;
            }

            // Clone element to avoid modifying original
            const clone = element.cloneNode(true);
            clone.style.position = 'relative';
            clone.style.width = element.offsetWidth + 'px';
            clone.style.height = element.offsetHeight + 'px';

            // Add watermark if draft mode
            if (this.downloadMode === 'draft') {
                this.addWatermark(clone);
            }

            // Configure PDF options
            const opt = {
                margin: 10,
                filename: this.generateFilename(),
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff'
                },
                jsPDF: { 
                    orientation: 'landscape', 
                    unit: 'mm', 
                    format: 'a4',
                    compress: true
                }
            };

            // Generate and download PDF
            this.showStatus('Generating PDF...', 'info');
            
            // Check if html2pdf is available
            if (typeof html2pdf === 'undefined') {
                this.showStatus('PDF library not loaded. Please refresh the page.', 'error');
                return;
            }

            await html2pdf().set(opt).from(clone).save();
            
            this.showStatus('PDF downloaded successfully!', 'success');

        } catch (error) {
            console.error('PDF download failed:', error);
            this.showStatus('Failed to download PDF. Please try again.', 'error');
        }
    }

    /**
     * Generate filename based on mode and current date
     */
    generateFilename() {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const modeStr = this.downloadMode === 'draft' ? 'draft' : 'final';
        return `timetable-${modeStr}-${dateStr}.pdf`;
    }

    /**
     * Add "DRAFT" watermark to the element
     */
    addWatermark(element) {
        const watermarkDiv = document.createElement('div');
        watermarkDiv.className = 'pdf-watermark';
        watermarkDiv.innerHTML = 'DRAFT';
        
        // Apply watermark styles
        watermarkDiv.style.cssText = `
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) rotate(-45deg) !important;
            font-size: 120px !important;
            font-weight: bold !important;
            color: rgba(255, 0, 0, 0.15) !important;
            z-index: 1000 !important;
            pointer-events: none !important;
            font-family: Arial, sans-serif !important;
            letter-spacing: 10px !important;
            white-space: nowrap !important;
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
        `;

        element.appendChild(watermarkDiv);
    }

    /**
     * Alternative: Add watermark using canvas overlay
     */
    addCanvasWatermark(element) {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');

        // Semi-transparent background
        ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw text
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 4);
        ctx.font = 'bold 100px Arial';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('DRAFT', 0, 0);
        ctx.restore();

        const watermarkImg = canvas.toDataURL();
        const watermarkDiv = document.createElement('div');
        watermarkDiv.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: url('${watermarkImg}');
            background-repeat: repeat;
            pointer-events: none;
            z-index: 999;
        `;

        element.appendChild(watermarkDiv);
    }

    /**
     * Check if html2pdf library is available
     */
    checkHtml2pdfLibrary() {
        if (typeof html2pdf === 'undefined') {
            console.warn('html2pdf library not found. Please include it in your HTML:');
            console.warn('<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>');
            return false;
        }
        return true;
    }
}

// Initialize download manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const downloadManager = new TimetableDownloadManager();
    downloadManager.initializeDownloadUI();
    
    // Make it globally available for debugging
    window.timetableDownloadManager = downloadManager;
});

// Fallback initialization if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const downloadManager = new TimetableDownloadManager();
        downloadManager.initializeDownloadUI();
        window.timetableDownloadManager = downloadManager;
    });
} else {
    // DOM is already ready
    const downloadManager = new TimetableDownloadManager();
    downloadManager.initializeDownloadUI();
    window.timetableDownloadManager = downloadManager;
}
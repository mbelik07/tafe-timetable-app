// Draft Toggle Feature for Timetable Application

(function() {
    // Create draft toggle styles
    const style = document.createElement('style');
    style.textContent = `
        .draft-toggle-container {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-right: 1rem;
        }
        .draft-toggle {
            position: relative;
            width: 48px;
            height: 24px;
            background: #cbd5e0;
            border-radius: 12px;
            cursor: pointer;
            transition: background 0.3s;
        }
        .draft-toggle.active {
            background: #48bb78;
        }
        .draft-toggle-slider {
            position: absolute;
            top: 2px;
            left: 2px;
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
            transition: transform 0.3s;
        }
        .draft-toggle.active .draft-toggle-slider {
            transform: translateX(24px);
        }
        .draft-watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            font-weight: bold;
            color: rgba(200, 200, 200, 0.15);
            pointer-events: none;
            z-index: 9999;
            display: none;
        }
        body.draft-mode .draft-watermark {
            display: block;
        }
        @media print {
            .draft-watermark {
                display: block !important;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
            }
        }
    `;
    document.head.appendChild(style);

    // Create draft toggle function
    function createDraftToggle() {
        // Find the header controls section
        const headerControls = document.querySelector('.header-controls');
        if (!headerControls) return;

        // Create draft toggle container
        const draftToggleContainer = document.createElement('div');
        draftToggleContainer.className = 'draft-toggle-container';
        draftToggleContainer.innerHTML = `
            <span>Draft</span>
            <div class="draft-toggle" id="draftToggle">
                <div class="draft-toggle-slider"></div>
            </div>
        `;

        // Create watermark element
        const watermark = document.createElement('div');
        watermark.className = 'draft-watermark';
        watermark.textContent = 'DRAFT';
        document.body.appendChild(watermark);

        // Insert draft toggle before print button
        const printBtn = document.getElementById('printBtn');
        if (printBtn) {
            headerControls.insertBefore(draftToggleContainer, printBtn);
        } else {
            headerControls.appendChild(draftToggleContainer);
        }

        // Toggle functionality
        const draftToggle = document.getElementById('draftToggle');
        
        // Load saved draft state
        function loadDraftState() {
            const currentSemester = window.db?.currentSemester || 'default';
            const draftStates = JSON.parse(localStorage.getItem('draftStates') || '{}');
            const isDraft = draftStates[currentSemester] || false;
            
            if (isDraft) {
                draftToggle.classList.add('active');
                document.body.classList.add('draft-mode');
            } else {
                draftToggle.classList.remove('active');
                document.body.classList.remove('draft-mode');
            }
        }

        // Save draft state
        function saveDraftState(isDraft) {
            const currentSemester = window.db?.currentSemester || 'default';
            const draftStates = JSON.parse(localStorage.getItem('draftStates') || '{}');
            draftStates[currentSemester] = isDraft;
            localStorage.setItem('draftStates', JSON.stringify(draftStates));
        }

        // Toggle event listener
        draftToggle.addEventListener('click', () => {
            const isActive = draftToggle.classList.contains('active');
            
            if (isActive) {
                draftToggle.classList.remove('active');
                document.body.classList.remove('draft-mode');
                saveDraftState(false);
            } else {
                draftToggle.classList.add('active');
                document.body.classList.add('draft-mode');
                saveDraftState(true);
            }
        });

        // Load initial state
        loadDraftState();

        // Modify semester change to reset draft state
        const originalChangeSemester = window.changeSemester;
        if (originalChangeSemester) {
            window.changeSemester = function(...args) {
                originalChangeSemester.apply(this, args);
                loadDraftState();
            };
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createDraftToggle);
    } else {
        createDraftToggle();
    }
})();
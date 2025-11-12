// draft-toggle.js
// Adds a per-semester "Draft" toggle to the header and shows a diagonal DRAFT watermark.
// Persists state in localStorage and ensures watermark appears when printing.

(function() {
    const STORAGE_KEY = 'draftStates_v1';
    const TOGGLE_ID = 'draftToggleBtn';
    const WATERMARK_ID = 'draftWatermark';
    const POLL_INTERVAL_MS = 800;

    // Create styles
    const styleText = `
#${TOGGLE_ID} {
    appearance: none;
    -webkit-appearance: none;
    border: 0;
    padding: 6px 10px;
    margin-left: 8px;
    margin-right: 4px;
    background: #edf2f7;
    color: #1a202c;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
}
#${TOGGLE_ID}[aria-pressed="true"] {
    background: #38a169;
    color: #fff;
}
#${TOGGLE_ID} .draft-pill {
    width: 36px;
    height: 20px;
    background: #e2e8f0;
    border-radius: 999px;
    position: relative;
    flex: none;
}
#${TOGGLE_ID}[aria-pressed="true"] .draft-pill { background: #2f855a; }
#${TOGGLE_ID} .draft-pill::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.18s ease;
    box-shadow: 0 1px 2px rgba(0,0,0,0.12);
}
#${TOGGLE_ID}[aria-pressed="true"] .draft-pill::before {
    transform: translateX(16px);
}
#${WATERMARK_ID} {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 120px;
    font-weight: 900;
    color: rgba(200,200,200,0.18);
    pointer-events: none;
    z-index: 99999;
    display: none;
    white-space: nowrap;
    text-align: center;
    user-select: none;
}
body.draft-mode #${WATERMARK_ID} {
    display: block;
}
@media print {
    #${WATERMARK_ID} {
        display: block !important;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        color: rgba(180,180,180,0.18);
        font-size: 140px;
        z-index: 999999 !important;
    }
}
`;
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-name', 'draft-toggle-styles');
    styleEl.appendChild(document.createTextNode(styleText));
    document.head.appendChild(styleEl);

    function safeJSONParse(s, fallback) {
        try { return JSON.parse(s); } catch (e) { return fallback; }
    }
    function readStates() {
        return safeJSONParse(localStorage.getItem(STORAGE_KEY) || '{}', {});
    }
    function writeStates(states) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(states)); } catch (e) {}
    }

    function getCurrentSemester() {
        try {
            if (window.db && window.db.currentSemester) return String(window.db.currentSemester);
            const dataSemester = document.querySelector('[data-semester]')?.dataset?.semester;
            if (dataSemester) return String(dataSemester);
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('semester')) return urlParams.get('semester');
        } catch (e) {}
        return 'default';
    }

    function ensureWatermark() {
        let wm = document.getElementById(WATERMARK_ID);
        if (!wm) {
            wm = document.createElement('div');
            wm.id = WATERMARK_ID;
            wm.setAttribute('aria-hidden', 'true');
            wm.textContent = 'DRAFT';
            document.body.appendChild(wm);
        }
        return wm;
    }

    const HEADER_SELECTORS = [
        '.header-controls .flex.items-center.gap-3',
        '.header-controls',
        'header',
        '.app-header',
        '.topbar',
        '.navbar',
        '.controls',
        '.toolbar'
    ];

    function findHeaderContainer() {
        for (const sel of HEADER_SELECTORS) {
            const el = document.querySelector(sel);
            if (el) return el;
        }
        const banner = document.querySelector('[role="banner"]');
        if (banner) return banner;
        return document.body;
    }

    function createToggleElement() {
        const btn = document.createElement('button');
        btn.id = TOGGLE_ID;
        btn.type = 'button';
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('title', 'Toggle Draft Mode');
        btn.setAttribute('aria-label', 'Toggle Draft Mode');
        const label = document.createElement('span');
        label.textContent = 'Draft';
        const pill = document.createElement('span');
        pill.className = 'draft-pill';
        btn.appendChild(label);
        btn.appendChild(pill);
        return btn;
    }

    function applyDraftState(isDraft) {
        const btn = document.getElementById(TOGGLE_ID);
        if (btn) btn.setAttribute('aria-pressed', isDraft ? 'true' : 'false');
        if (isDraft) document.body.classList.add('draft-mode');
        else document.body.classList.remove('draft-mode');
    }

    function loadDraftForCurrentSemester() {
        const sem = getCurrentSemester();
        const states = readStates();
        return Boolean(states[sem]);
    }
    function saveDraftForCurrentSemester(value) {
        const sem = getCurrentSemester();
        const states = readStates();
        states[sem] = !!value;
        writeStates(states);
    }

    function insertToggle() {
        if (document.getElementById(TOGGLE_ID)) return true;
        const header = findHeaderContainer();
        if (!header) return false;

        const printBtn = document.getElementById('printBtn');
        const toggle = createToggleElement();

        toggle.addEventListener('click', function() {
            const pressed = toggle.getAttribute('aria-pressed') === 'true';
            applyDraftState(!pressed);
            saveDraftForCurrentSemester(!pressed);
        });

        try {
            if (printBtn && header.contains(printBtn)) {
                header.insertBefore(toggle, printBtn);
            } else {
                header.appendChild(toggle);
            }
        } catch (e) {
            return false;
        }

        const active = loadDraftForCurrentSemester();
        applyDraftState(active);

        return true;
    }

    function wrapChangeSemester() {
        try {
            if (typeof window.changeSemester === 'function' && !window.changeSemester._wrappedForDraftToggle) {
                const original = window.changeSemester;
                const self = window;
                window.changeSemester = function(...args) {
                    const result = original.apply(self, args);
                    setTimeout(() => {
                        const active = loadDraftForCurrentSemester();
                        applyDraftState(active);
                    }, 120);
                    return result;
                };
                window.changeSemester._wrappedForDraftToggle = true;
            }
        } catch (e) {}
    }

    let lastSeenSemester = getCurrentSemester();
    let pollHandle = null;
    function startSemesterPoll() {
        if (pollHandle) return;
        pollHandle = setInterval(() => {
            const cur = getCurrentSemester();
            if (cur !== lastSeenSemester) {
                lastSeenSemester = cur;
                const active = loadDraftForCurrentSemester();
                applyDraftState(active);
            }
        }, POLL_INTERVAL_MS);
    }

    let observer = null;
    function startHeaderObserver() {
        if (observer) return;
        const target = document.documentElement || document.body;
        observer = new MutationObserver((mutations) => {
            if (document.getElementById(TOGGLE_ID)) {
                if (observer) { observer.disconnect(); observer = null; }
                return;
            }
            const inserted = insertToggle();
            if (inserted && observer) {
                observer.disconnect();
                observer = null;
            }
        });
        observer.observe(target, { childList: true, subtree: true });
    }

    function init() {
        ensureWatermark();
        const inserted = insertToggle();
        wrapChangeSemester();
        startSemesterPoll();
        if (!inserted) startHeaderObserver();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window._draftToggle = {
        insertToggle,
        applyDraftState,
        loadDraftForCurrentSemester,
        saveDraftForCurrentSemester,
        getCurrentSemester
    };
})();
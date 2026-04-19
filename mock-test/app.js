/* ═══════════════════════════════════════════════
   AWS MOCK EXAM — app.js
   LocalStorage key prefix: "mockExam_" (unique)
   ═══════════════════════════════════════════════ */

/* ════════════════════════════════════
   THEME MANAGER  (runs immediately, outside exam IIFE)
   3 states stored in 'mockExamTheme':
     null / missing  → system  (follow OS)
     'dark'          → forced dark
     'light'         → forced light
   Cycle: system → dark → light → system
════════════════════════════════════ */
(function initTheme() {
    var KEY = 'mockExamTheme';
    var btn;

    function getEffective() {
        var saved = localStorage.getItem(KEY);
        if (saved === 'dark' || saved === 'light') return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme() {
        document.documentElement.setAttribute('data-theme', getEffective());
        btn = btn || document.getElementById('btn-theme-toggle');
        if (!btn) return;
        var saved = localStorage.getItem(KEY);
        if (saved === 'dark')  { btn.textContent = '☀️'; btn.title = 'Switch to light theme'; }
        else if (saved === 'light') { btn.textContent = '🖥'; btn.title = 'Switch to system theme'; }
        else                   { btn.textContent = '🌙'; btn.title = 'Switch to dark theme'; }
    }

    function cycleTheme() {
        var saved = localStorage.getItem(KEY);
        if (!saved)           localStorage.setItem(KEY, 'dark');
        else if (saved === 'dark')  localStorage.setItem(KEY, 'light');
        else                  localStorage.removeItem(KEY);
        applyTheme();
    }

    /* Listen for OS preference change when in system mode */
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
        if (!localStorage.getItem(KEY)) applyTheme();
    });

    /* Wire button after DOM ready */
    document.addEventListener('DOMContentLoaded', function() {
        btn = document.getElementById('btn-theme-toggle');
        if (btn) btn.addEventListener('click', cycleTheme);
        applyTheme(); /* sync icon to current state */
    });

    /* Initial apply runs immediately via the <script> tag in <head> already.
       This call just ensures the icon is correct once DOM is ready. */
}());


(function () {
    'use strict';

    /* ─── Storage keys (distinct from the main app) ─── */
    const KEY_ANSWERS  = 'mockExam_answers';   // { [qIdx]: ['A','B'] }
    const KEY_FLAGS    = 'mockExam_flags';      // Set serialised as array  [1, 5, 9]
    const KEY_CURRENT  = 'mockExam_currentQ';  // number
    const KEY_START_TS = 'mockExam_startedAt'; // ISO timestamp
    const KEY_CLOCK    = 'mockExam_clockVisible'; // 'true' | 'false'

    /* ─── State ─── */
    let questions   = [];
    let answers     = {};      // { idx: ['A'] | ['B','D'] }
    let flagged     = new Set();
    let currentIdx  = 0;
    let timerInterval = null;
    let clockVisible  = localStorage.getItem(KEY_CLOCK) !== 'false';

    /* ─── DOM refs ─── */
    const loadingScreen   = document.getElementById('loading-screen');
    const examShell       = document.getElementById('exam-shell');
    const summaryOverlay  = document.getElementById('summary-overlay');
    const confirmOverlay  = document.getElementById('confirm-overlay');

    const timerDisplay    = document.getElementById('timer-display');
    const btnClockToggle  = document.getElementById('btn-clock-toggle');
    const currentQNum     = document.getElementById('current-q-num');
    const totalQNum       = document.getElementById('total-q-num');
    const navigator_      = document.getElementById('question-navigator');

    const qNumberBadge    = document.getElementById('q-number-badge');
    const qTypeBadge      = document.getElementById('q-type-badge');
    const questionText    = document.getElementById('question-text');
    const optionsContainer= document.getElementById('options-container');

    const btnFlag         = document.getElementById('btn-flag');
    const btnPrev         = document.getElementById('btn-prev');
    const btnNext         = document.getElementById('btn-next');
    const btnNewExam      = document.getElementById('btn-new-exam');
    const btnNewExamSummary = document.getElementById('btn-new-exam-summary');
    const btnQuizSummary  = document.getElementById('btn-quiz-summary');
    const btnSummaryFooter= document.getElementById('btn-summary-footer');
    const btnCloseSummary = document.getElementById('btn-close-summary');
    const btnCloseSummaryBottom = document.getElementById('btn-close-summary-bottom');
    const btnConfirmYes   = document.getElementById('btn-confirm-yes');
    const btnConfirmNo    = document.getElementById('btn-confirm-no');

    const summaryScoreRow = document.getElementById('summary-score-row');
    const summaryList     = document.getElementById('summary-list');

    /* ════════════════════════════════════
       INIT
    ════════════════════════════════════ */

    /* ── Clock visibility ── */
    function applyClockVisibility() {
        timerDisplay.classList.toggle('clock-hidden', !clockVisible);
        if (btnClockToggle) {
            btnClockToggle.textContent = clockVisible ? '👁' : '🚫';
            btnClockToggle.title = clockVisible ? 'Hide clock' : 'Show clock';
        }
    }
    if (btnClockToggle) {
        btnClockToggle.addEventListener('click', function() {
            clockVisible = !clockVisible;
            localStorage.setItem(KEY_CLOCK, clockVisible ? 'true' : 'false');
            applyClockVisibility();
        });
    }
    applyClockVisibility();

    fetch('questions.json')
        .then(r => r.json())
        .then(data => {
            questions = data.filter(q => q.title && q.body);
            totalQNum.textContent = questions.length;

            loadState();

            /* Fade out loading screen */
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    examShell.classList.remove('hidden');
                    buildNavigator();
                    renderQuestion(currentIdx);
                    startTimer();
                }, 500);
            }, 1200);
        })
        .catch(err => {
            console.error('Failed to load questions:', err);
            loadingScreen.innerHTML = '<div class="loading-content" style="color:#da3633">⚠️ Failed to load questions.json</div>';
        });

    /* ════════════════════════════════════
       PERSISTENCE
    ════════════════════════════════════ */
    function loadState() {
        const savedAnswers = localStorage.getItem(KEY_ANSWERS);
        const savedFlags   = localStorage.getItem(KEY_FLAGS);
        const savedCurrent = localStorage.getItem(KEY_CURRENT);

        if (savedAnswers) {
            try { answers = JSON.parse(savedAnswers); } catch(e) { answers = {}; }
        }
        if (savedFlags) {
            try { flagged = new Set(JSON.parse(savedFlags)); } catch(e) { flagged = new Set(); }
        }
        if (savedCurrent !== null) {
            const n = parseInt(savedCurrent, 10);
            if (!isNaN(n) && n >= 0) currentIdx = n;
        }
        if (!localStorage.getItem(KEY_START_TS)) {
            localStorage.setItem(KEY_START_TS, new Date().toISOString());
        }
    }

    function saveState() {
        localStorage.setItem(KEY_ANSWERS,  JSON.stringify(answers));
        localStorage.setItem(KEY_FLAGS,    JSON.stringify([...flagged]));
        localStorage.setItem(KEY_CURRENT,  String(currentIdx));
    }

    function clearState() {
        [KEY_ANSWERS, KEY_FLAGS, KEY_CURRENT, KEY_START_TS].forEach(k => localStorage.removeItem(k));
        answers  = {};
        flagged  = new Set();
        currentIdx = 0;
        localStorage.setItem(KEY_START_TS, new Date().toISOString());
    }

    /* ════════════════════════════════════
       TIMER
    ════════════════════════════════════ */
    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        tickTimer();
        timerInterval = setInterval(tickTimer, 1000);
    }
    function tickTimer() {
        const started = new Date(localStorage.getItem(KEY_START_TS) || new Date().toISOString());
        const elapsed = Math.floor((Date.now() - started.getTime()) / 1000);
        const h = Math.floor(elapsed / 3600);
        const m = Math.floor((elapsed % 3600) / 60);
        const s = elapsed % 60;
        const hh = h > 0 ? `${h}:` : '';
        const mm = String(m).padStart(2, '0');
        const ss = String(s).padStart(2, '0');
        timerDisplay.textContent = `⏱ ${hh}${mm}:${ss}`;
    }

    /* ════════════════════════════════════
       QUESTION PARSING
    ════════════════════════════════════ */
    /**
     * Parse the question body into { body, options }
     * Options are lines that start with **A:** / **B:** etc.
     */
    function parseQuestion(q) {
        const raw = q.body;
        const optionRegex = /\*\*([A-Z]):\*\*/g;
        let match;
        const positions = [];

        while ((match = optionRegex.exec(raw)) !== null) {
            positions.push({ key: match[1], start: match.index, contentStart: match.index + match[0].length });
        }

        if (positions.length === 0) {
            return { body: raw, options: [] };
        }

        const body = raw.slice(0, positions[0].start).trim();
        const options = positions.map((pos, i) => {
            const end = i + 1 < positions.length ? positions[i + 1].start : raw.length;
            return {
                key: pos.key,
                text: raw.slice(pos.contentStart, end).trim()
            };
        });

        return { body, options };
    }

    /** Number of answers allowed based on the canonical answer string */
    function allowedCount(answerStr) {
        return answerStr ? answerStr.length : 1;
    }

    function questionType(q) {
        const c = allowedCount(q.answer);
        if (c === 1) return 'single';
        if (c === 2) return 'multiple-2';
        return 'multiple-3';
    }

    /* ════════════════════════════════════
       RENDER QUESTION
    ════════════════════════════════════ */
    function renderQuestion(idx) {
        if (idx < 0 || idx >= questions.length) return;

        /* ── Deactivate the previous pill BEFORE updating currentIdx ── */
        const prevIdx = currentIdx;
        currentIdx = idx;
        if (prevIdx !== idx) refreshPill(prevIdx);

        currentQNum.textContent = idx + 1;

        const q = questions[idx];
        const { body, options } = parseQuestion(q);
        const type = questionType(q);
        const maxSelect = allowedCount(q.answer);
        const userSel = answers[idx] || [];

        /* badges */
        qNumberBadge.textContent = `Q${idx + 1}`;
        if (type === 'single') {
            qTypeBadge.textContent = 'Single Answer';
            qTypeBadge.style.borderColor = '';
        } else if (type === 'multiple-2') {
            qTypeBadge.textContent = 'Multiple Answers (Choose 2)';
            qTypeBadge.style.borderColor = 'rgba(210,153,34,0.5)';
            qTypeBadge.style.color = 'var(--review)';
        } else {
            qTypeBadge.textContent = 'Multiple Answers (Choose 3)';
            qTypeBadge.style.borderColor = 'rgba(165,108,193,0.4)';
            qTypeBadge.style.color = 'var(--answered-review)';
        }

        /* body text */
        questionText.innerHTML = renderMarkdown(body);

        /* options */
        optionsContainer.innerHTML = '';
        options.forEach(opt => {
            const isChecked = userSel.includes(opt.key);
            const inputType = type === 'single' ? 'radio' : 'checkbox';
            const name = `q-${idx}`;

            const label = document.createElement('label');
            label.className = 'option-label' + (isChecked ? ' selected' : '');
            label.innerHTML = `
                <input type="${inputType}" name="${name}" value="${opt.key}" ${isChecked ? 'checked' : ''}>
                <span class="option-key">${opt.key}.</span>
                <span class="option-text">${renderMarkdown(opt.text)}</span>
            `;

            const input = label.querySelector('input');
            input.addEventListener('change', () => onOptionChange(idx, opt.key, input.checked, maxSelect, type === 'single'));

            optionsContainer.appendChild(label);
        });

        /* Flag button */
        syncFlagButton(idx);

        /* Nav buttons */
        btnPrev.disabled = idx === 0;
        btnNext.disabled = idx === questions.length - 1;

        /* Scroll nav pill into view */
        scrollPillIntoView(idx);
        refreshPill(idx);
        /* also refresh previous/next if state changed */

        saveState();
    }

    function renderMarkdown(text) {
        if (!text) return '';
        // Step 1: HTML-escape special chars
        let out = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        // Step 2: Convert **bold** — works on already-escaped text because
        // the ** delimiters are not affected by HTML escaping.
        // We need to operate on the raw text before escaping to match ** properly,
        // so extract, escape content, then wrap.
        // Reset and do it correctly: escape first, then replace **..** in escaped string.
        out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        // Step 3: newlines → <br>
        out = out.replace(/\n/g, '<br>');
        return out;
    }

    /* ════════════════════════════════════
       OPTION SELECTION
    ════════════════════════════════════ */
    function onOptionChange(idx, key, checked, maxSelect, isSingle) {
        let sel = answers[idx] ? [...answers[idx]] : [];

        if (isSingle) {
            sel = checked ? [key] : [];
        } else {
            if (checked) {
                if (sel.length < maxSelect) sel.push(key);
                else {
                    /* Enforce max: uncheck it visually */
                    const inp = optionsContainer.querySelector(`input[value="${key}"]`);
                    if (inp) inp.checked = false;
                    return;
                }
            } else {
                sel = sel.filter(k => k !== key);
            }
        }

        /* Sort selection alphabetically for consistency */
        sel.sort();

        if (sel.length === 0) {
            delete answers[idx];
        } else {
            answers[idx] = sel;
        }

        /* Sync selected styles */
        optionsContainer.querySelectorAll('.option-label').forEach(label => {
            const inp = label.querySelector('input');
            label.classList.toggle('selected', inp.checked);
        });

        refreshPill(idx);
        saveState();
    }

    /* ════════════════════════════════════
       FLAG
    ════════════════════════════════════ */
    function syncFlagButton(idx) {
        const isFlagged = flagged.has(idx);
        btnFlag.classList.toggle('active', isFlagged);
        btnFlag.textContent = isFlagged ? '🚩 Flagged for Review' : '🚩 Flag for Review';
    }

    btnFlag.addEventListener('click', () => {
        if (flagged.has(currentIdx)) flagged.delete(currentIdx);
        else flagged.add(currentIdx);
        syncFlagButton(currentIdx);
        refreshPill(currentIdx);
        saveState();
    });

    /* ════════════════════════════════════
       NAVIGATOR
    ════════════════════════════════════ */
    function buildNavigator() {
        navigator_.innerHTML = '';
        questions.forEach((_, i) => {
            const pill = document.createElement('button');
            pill.className = 'nav-pill';
            pill.id = `nav-pill-${i}`;
            pill.textContent = i + 1;
            pill.title = `Question ${i + 1}`;
            pill.addEventListener('click', () => renderQuestion(i));
            navigator_.appendChild(pill);
            refreshPill(i);
        });
    }

    function refreshPill(idx) {
        const pill = document.getElementById('nav-pill-' + idx);
        if (!pill) return;

        const isAnswered = answers[idx] && answers[idx].length > 0;
        const isFlagged  = flagged.has(idx);
        const isCurrent  = idx === currentIdx;

        /* Reset all classes, then re-apply independently so they can combine */
        pill.className = 'nav-pill';

        /* Current ring (blue glow) ─ always set when this is the active question */
        if (isCurrent) pill.classList.add('current');

        /* State colour ─ set regardless of current, CSS combinators handle blending */
        if (isAnswered && isFlagged) pill.classList.add('answered-for-review');
        else if (isFlagged)          pill.classList.add('for-review');
        else if (isAnswered)         pill.classList.add('answered');
    }

    function refreshAllPills() {
        questions.forEach((_, i) => refreshPill(i));
    }

    function scrollPillIntoView(idx) {
        const pill = document.getElementById(`nav-pill-${idx}`);
        if (pill) pill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    /* ════════════════════════════════════
       NAVIGATION BUTTONS
    ════════════════════════════════════ */
    btnPrev.addEventListener('click', () => {
        if (currentIdx > 0) renderQuestion(currentIdx - 1);
    });
    btnNext.addEventListener('click', () => {
        if (currentIdx < questions.length - 1) renderQuestion(currentIdx + 1);
    });

    /* ════════════════════════════════════
       SUMMARY
    ════════════════════════════════════ */
    /** Current filter: 'all' | 'correct' | 'wrong' | 'skipped' | 'flagged' */
    let summaryFilter = 'all';

    function openSummary() {
        summaryFilter = 'all';
        buildSummary();
        summaryOverlay.classList.remove('hidden');
    }
    function closeSummary() {
        summaryOverlay.classList.add('hidden');
    }

    function filterSummary(filter) {
        /* Toggle off if clicking the already-active chip */
        summaryFilter = (summaryFilter === filter) ? 'all' : filter;

        /* Update chip active states */
        summaryScoreRow.querySelectorAll('.score-chip').forEach(chip => {
            chip.classList.toggle('chip-active', chip.dataset.filter === summaryFilter);
        });

        /* Show / hide items */
        summaryList.querySelectorAll('.summary-item').forEach(item => {
            if (summaryFilter === 'all') {
                item.style.display = '';
            } else {
                const match = item.dataset.category === summaryFilter ||
                              (summaryFilter === 'flagged' && item.dataset.flagged === 'true');
                item.style.display = match ? '' : 'none';
            }
        });
    }

    function buildSummary() {
        let correct = 0, wrong = 0, skipped = 0, reviewCount = 0;

        summaryList.innerHTML = '';

        questions.forEach(function(q, i) {
            const userSel    = answers[i] || [];
            const correctKeys = (q.answer || '').toUpperCase().split('').sort();
            const userKeys    = userSel.slice().sort();

            const isAnswered = userKeys.length > 0;
            const isCorrect  = isAnswered && JSON.stringify(userKeys) === JSON.stringify(correctKeys);
            const isFlagged  = flagged.has(i);

            if (!isAnswered) skipped++;
            else if (isCorrect) correct++;
            else wrong++;
            if (isFlagged) reviewCount++;

            const icon = !isAnswered ? '⬜' : isCorrect ? '✅' : '❌';
            const cls  = !isAnswered ? 'si-skipped' : isCorrect ? 'si-correct' : 'si-wrong';
            const category = !isAnswered ? 'skipped' : isCorrect ? 'correct' : 'wrong';

            const flagHtml = isFlagged ? '&nbsp;&nbsp;🚩' : '';

            let answerHtml;
            if (isAnswered) {
                const tagClass = isCorrect ? 'tag-correct' : 'tag-wrong';
                answerHtml = '<span class="si-answer-tag ' + tagClass + '">Your: ' + userKeys.join(', ') + '</span>';
            } else {
                answerHtml = '<span class="si-answer-tag tag-skipped">Not answered</span>';
            }
            const correctHtml = !isCorrect
                ? '<span class="si-answer-tag tag-right-ans">Correct: ' + correctKeys.join(', ') + '</span>'
                : '';

            const item = document.createElement('div');
            item.className = 'summary-item ' + cls;
            item.dataset.category = category;
            item.dataset.flagged  = isFlagged ? 'true' : 'false';
            item.innerHTML =
                '<span class="si-icon">' + icon + '</span>' +
                '<div class="si-body">' +
                    '<div class="si-q-num">Q' + (i + 1) + flagHtml + '</div>' +
                    '<div class="si-title">' + truncate(q.title, 90) + '</div>' +
                    '<div class="si-answer-row">' + answerHtml + correctHtml + '</div>' +
                '</div>';

            item.addEventListener('click', function() {
                closeSummary();
                renderQuestion(i);
            });
            summaryList.appendChild(item);
        });

        const total = questions.length;
        const pct   = total > 0 ? Math.round((correct / total) * 100) : 0;

        summaryScoreRow.innerHTML = `
            <div class="score-chip chip-score" data-filter="all" title="Show all questions">
                <div class="chip-num">${pct}%</div>
                <div class="chip-lbl">Score</div>
            </div>
            <div class="score-chip chip-correct" data-filter="correct" title="Show correct answers">
                <div class="chip-num">${correct}</div>
                <div class="chip-lbl">Correct</div>
            </div>
            <div class="score-chip chip-wrong" data-filter="wrong" title="Show incorrect answers">
                <div class="chip-num">${wrong}</div>
                <div class="chip-lbl">Incorrect</div>
            </div>
            <div class="score-chip chip-unanswered" data-filter="skipped" title="Show unanswered questions">
                <div class="chip-num">${skipped}</div>
                <div class="chip-lbl">Unanswered</div>
            </div>
            <div class="score-chip chip-review" data-filter="flagged" title="Show flagged questions">
                <div class="chip-num">${reviewCount}</div>
                <div class="chip-lbl">Flagged</div>
            </div>
        `;

        /* Wire up chip click handlers */
        summaryScoreRow.querySelectorAll('.score-chip').forEach(chip => {
            chip.style.cursor = 'pointer';
            chip.addEventListener('click', () => filterSummary(chip.dataset.filter));
        });
    }

    function truncate(str, len) {
        if (!str) return '';
        return str.length > len ? str.slice(0, len) + '…' : str;
    }

    btnQuizSummary  .addEventListener('click', openSummary);
    btnSummaryFooter.addEventListener('click', openSummary);
    btnCloseSummary .addEventListener('click', closeSummary);
    btnCloseSummaryBottom.addEventListener('click', closeSummary);

    /* Close on overlay click */
    summaryOverlay.addEventListener('click', e => { if (e.target === summaryOverlay) closeSummary(); });

    /* ════════════════════════════════════
       NEW EXAM / CONFIRM
    ════════════════════════════════════ */
    function requestNewExam() {
        confirmOverlay.classList.remove('hidden');
    }
    function cancelNewExam() {
        confirmOverlay.classList.add('hidden');
    }
    function doNewExam() {
        confirmOverlay.classList.add('hidden');
        closeSummary();
        clearState();
        refreshAllPills();
        renderQuestion(0);
        startTimer();
    }

    btnNewExam       .addEventListener('click', requestNewExam);
    btnNewExamSummary.addEventListener('click', requestNewExam);
    btnConfirmYes    .addEventListener('click', doNewExam);
    btnConfirmNo     .addEventListener('click', cancelNewExam);
    confirmOverlay   .addEventListener('click', e => { if (e.target === confirmOverlay) cancelNewExam(); });

    /* ════════════════════════════════════
       KEYBOARD SHORTCUTS
    ════════════════════════════════════ */
    document.addEventListener('keydown', e => {
        if (summaryOverlay.classList.contains('hidden') === false) return;
        if (confirmOverlay.classList.contains('hidden') === false) return;

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            if (currentIdx < questions.length - 1) renderQuestion(currentIdx + 1);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            if (currentIdx > 0) renderQuestion(currentIdx - 1);
        } else if (e.key === 'f' || e.key === 'F') {
            btnFlag.click();
        }
    });

})();

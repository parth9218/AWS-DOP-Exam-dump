/* =============================================
   THEME MANAGEMENT  (three-state: system / dark / light)
   ─────────────────────────────────────────────
   States stored in localStorage under STORAGE_KEY:
     null / absent  → "system" mode (auto-follows OS)
     "dark"         → forced dark
     "light"        → forced light

   Toggle cycle:  system → dark → light → system …
   Icon:          🖥  (system) │ ☀️ (dark override) │ 🌙 (light override)
   ============================================= */
(function () {
    const STORAGE_KEY = 'examPrepTheme';
    const html = document.documentElement;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    /** Returns the resolved visual theme ('dark' | 'light'). */
    function resolvedTheme() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'dark' || stored === 'light') return stored;
        return mq.matches ? 'dark' : 'light';   // follow system
    }

    /** Returns the stored preference key (null = system mode). */
    function storedPref() {
        return localStorage.getItem(STORAGE_KEY); // 'dark' | 'light' | null
    }

    /** Apply a resolved theme to the DOM and update the toggle icon. */
    function applyTheme(theme, animate) {
        if (animate) {
            html.classList.add('theme-transitioning');
            setTimeout(() => html.classList.remove('theme-transitioning'), 400);
        }
        html.setAttribute('data-theme', theme);
        syncIcon();
    }

    /** Update the toggle button icon to reflect current state. */
    function syncIcon() {
        const icon = document.getElementById('theme-toggle-icon');
        if (!icon) return;
        const pref = storedPref();
        if (pref === 'dark')  icon.textContent = '☀️';  // forced dark → offer switch to light
        else if (pref === 'light') icon.textContent = '🌙'; // forced light → offer switch to system
        else icon.textContent = '🖥';                    // system mode → offer switch to dark
    }

    /** Update tooltip/aria-label to reflect next action. */
    function syncLabel(btn) {
        if (!btn) return;
        const pref = storedPref();
        if (pref === 'dark')  btn.setAttribute('title', 'Switch to light mode');
        else if (pref === 'light') btn.setAttribute('title', 'Use system theme');
        else btn.setAttribute('title', 'Switch to dark mode');
    }

    // ── Initial paint (runs before DOMContentLoaded to prevent FOUC) ──
    applyTheme(resolvedTheme(), false);

    // ── System preference change listener ──
    // Always fires; only overrides the CSS when NOT in forced manual mode.
    mq.addEventListener('change', (e) => {
        if (storedPref() === null) {
            // Follow the system change
            applyTheme(e.matches ? 'dark' : 'light', true);
        }
        // When forced, we still update the icon in case the indicator is relevant
        syncIcon();
    });

    // ── Wire toggle button once DOM is ready ──
    document.addEventListener('DOMContentLoaded', () => {
        const btn = document.getElementById('theme-toggle-btn');
        syncIcon();
        syncLabel(btn);

        if (!btn) return;

        btn.addEventListener('click', () => {
            const pref = storedPref();

            if (pref === null) {
                // system → force dark
                localStorage.setItem(STORAGE_KEY, 'dark');
                applyTheme('dark', true);
            } else if (pref === 'dark') {
                // dark → force light
                localStorage.setItem(STORAGE_KEY, 'light');
                applyTheme('light', true);
            } else {
                // light → back to system
                localStorage.removeItem(STORAGE_KEY);
                applyTheme(resolvedTheme(), true);  // pick up current OS preference
            }

            syncLabel(btn);
        });
    });
})();


document.addEventListener('DOMContentLoaded', () => {
    let allQuestions = [];
    const questionsContainer = document.getElementById('questions-container');
    const questionCountDisplay = document.getElementById('question-count');
    const attemptedCountDisplay = document.getElementById('attempted-count');
    const searchInput = document.getElementById('search-input');

    let attemptedQuestions = JSON.parse(localStorage.getItem('examPrepAttempted') || '[]');
    
    function updateAttemptedCount() {
        if (attemptedCountDisplay) {
            attemptedCountDisplay.textContent = attemptedQuestions.length;
        }
    }

    // Load questions from JSON
    fetch('questions.json')
        .then(response => response.json())
        .then(data => {
            allQuestions = data;
            // Filter out empty questions or unrelated text if any
            allQuestions = allQuestions.filter(q => q.title && q.body);
            
            // Add stable IDs
            allQuestions.forEach((q, i) => q.id = i.toString());
            
            if (questionCountDisplay) {
                questionCountDisplay.textContent = allQuestions.length;
            }
            updateAttemptedCount();
            renderQuestions(allQuestions);
            
            // Scroll to the last viewed question
            const lastViewedId = localStorage.getItem('examPrepLastQuestion');
            if (lastViewedId !== null) {
                setTimeout(() => {
                    const targetElement = document.getElementById(`question-card-${lastViewedId}`);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'instant', block: 'center' });
                        
                        // Optionally auto-open the answer for the last viewed question
                        const answerBtn = targetElement.querySelector('.toggle-answer-btn');
                        if (answerBtn) {
                            // Don't auto-click, let the user trigger it
                        }
                    }
                }, 300); // Slight delay ensures rendering is completed
            }
        })
        .catch(err => {
            console.error('Failed to load questions:', err);
            questionsContainer.innerHTML = '<p style="color: red; padding: 2rem;">Error loading questions. Ensure questions.json exists.</p>';
        });

    // Handle search input
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        
        // Use a debounce or just filter immediately since it's only ~300 items
        const filtered = allQuestions.filter(q => 
            q.title.toLowerCase().includes(query) || 
            q.body.toLowerCase().includes(query)
        );
        
        renderQuestions(filtered);
    });

    // Render questions
    function renderQuestions(questions) {
        questionsContainer.innerHTML = '';
        
        if (questions.length === 0) {
            questionsContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <h3>No questions found matching your search.</h3>
                </div>
            `;
            return;
        }

        // Limit initially rendered to improve performance, 
        // a simple solution for ~300 items is just append them since DOM handles ~300 elements okay,
        // but let's render all for simplicity as requested.
        const fragment = document.createDocumentFragment();

        questions.forEach((q, index) => {
            const card = document.createElement('div');
            card.className = 'question-card';
            card.id = `question-card-${q.id}`;
            
            // Format body by replacing multiple newlines with proper spacing
            // Using pre-wrap handles most of the formatting cleanly.
            
            // Check if attempted
            const isAttempted = attemptedQuestions.includes(q.id);
            const titleColor = isAttempted ? 'var(--success-color)' : '';
            const statusIcon = isAttempted ? '✅ ' : '';
            
            card.innerHTML = `
                <div class="question-header">
                    <div class="question-title" style="color: ${titleColor}">${statusIcon}${escapeHTML(q.title)}</div>
                    <div class="question-meta">
                        ${q.timestamp ? `<span class="meta-tag">🕘 ${escapeHTML(q.timestamp.split(' ')[0])}</span>` : ''}
                    </div>
                </div>
                
                <div class="question-body">${escapeHTML(q.body)}</div>
                
                <div class="answer-section" id="answer-${q.id}">
                    <div class="answer-label">Correct Answer</div>
                    <div class="answer-value">${escapeHTML(q.answer)}</div>
                </div>
                
                <div class="question-actions">
                    <button class="btn btn-primary toggle-answer-btn" data-target="answer-${q.id}" data-id="${q.id}">
                        <span class="btn-text">Show Answer</span>
                    </button>
                    
                    ${q.link ? `<a href="${q.link}" target="_blank" class="btn btn-outline">View Discussion &rarr;</a>` : ''}
                </div>
            `;
            
            fragment.appendChild(card);
        });

        questionsContainer.appendChild(fragment);

        // Add event listeners for buttons
        document.querySelectorAll('.toggle-answer-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.currentTarget.getAttribute('data-target');
                const questionId = e.currentTarget.getAttribute('data-id');
                const answerSection = document.getElementById(targetId);
                const btnText = e.currentTarget.querySelector('.btn-text');
                
                // Track attempted question
                if (!attemptedQuestions.includes(questionId)) {
                    attemptedQuestions.push(questionId);
                    localStorage.setItem('examPrepAttempted', JSON.stringify(attemptedQuestions));
                    updateAttemptedCount();
                    
                    // Update UI lightly
                    const card = document.getElementById(`question-card-${questionId}`);
                    if (card) {
                        const titleEl = card.querySelector('.question-title');
                        if (titleEl && !titleEl.textContent.startsWith('✅')) {
                            titleEl.style.color = 'var(--success-color)';
                            titleEl.textContent = '✅ ' + titleEl.textContent;
                        }
                    }
                }
                
                // Track last viewed question
                localStorage.setItem('examPrepLastQuestion', questionId);

                if (answerSection.classList.contains('visible')) {
                    answerSection.classList.remove('visible');
                    btnText.textContent = 'Show Answer';
                    e.currentTarget.classList.remove('btn-outline');
                    e.currentTarget.classList.add('btn-primary');
                } else {
                    answerSection.classList.add('visible');
                    btnText.textContent = 'Hide Answer';
                    e.currentTarget.classList.remove('btn-primary');
                    e.currentTarget.classList.add('btn-outline');
                }
            });
        });
    }

    // Helper to prevent XSS and preserve safe formatting
    function escapeHTML(str) {
        if (!str) return '';
        let escaped = str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
            
        // Parse basic markdown bold **text** for options
        escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        
        return escaped;
    }
});

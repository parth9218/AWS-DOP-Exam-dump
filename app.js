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

// --- Sound Effects --- //
function playSound(type) {
    // Create AudioContext for sound generation
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    if (type === 'success') {
        // Success sound - ascending notes
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
        frequencies.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.1);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime + index * 0.1);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + index * 0.1 + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.1 + 0.3);
            
            oscillator.start(audioContext.currentTime + index * 0.1);
            oscillator.stop(audioContext.currentTime + index * 0.1 + 0.3);
        });
    } else if (type === 'error') {
        // Error sound - low descending tone
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.5);
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } else if (type === 'click') {
        // Click sound - short beep
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }
}

// --- DOM Elements --- //
const themeToggle = document.getElementById('theme-toggle');
const currentDateEl = document.getElementById('current-date');
const tableSelectionContainer = document.getElementById('table-selection-buttons');
const selectionScreen = document.getElementById('selection-screen');
const quizScreen = document.getElementById('quiz-screen');
const quizTitle = document.getElementById('quiz-title');
const quizForm = document.getElementById('quiz-form');
const finishQuizBtn = document.getElementById('finish-quiz-btn');
const certificateScreen = document.getElementById('certificate-screen');
const certificateText = document.getElementById('certificate-text');
const saveCertificateBtn = document.getElementById('save-certificate-btn');
const screenshotGuideBtn = document.getElementById('screenshot-guide-btn');
const certBackToMainBtn = document.getElementById('cert-back-to-main-btn');
const saveGuideModal = document.getElementById('save-guide-modal');
const closeGuideModalBtn = document.getElementById('close-guide-modal-btn');
const resultsModal = document.getElementById('results-modal');
const errorList = document.getElementById('error-list');
const retryQuizBtn = document.getElementById('retry-quiz-btn');
const modalBackToMainBtn = document.getElementById('modal-back-to-main-btn');
const whatsappShareBtn = document.getElementById('whatsapp-share-btn');
const timerEnabled = document.getElementById('timer-enabled');
const timerDisplay = document.getElementById('timer-display');
const timerText = document.getElementById('timer-text');
const visitCountEl = document.getElementById('visit-count');

// --- State --- //
let currentTable = 0;
let questions = [];
let timerInterval = null;
let timeRemaining = 300; // 5 minutes in seconds

// --- Visit Counter --- //
function initVisitCounter() {
    // Get current visit count from localStorage
    let visitCount = localStorage.getItem('taleenmath-visits');
    
    if (visitCount === null) {
        // First visit
        visitCount = 1;
    } else {
        // Increment visit count
        visitCount = parseInt(visitCount) + 1;
    }
    
    // Save updated count
    localStorage.setItem('taleenmath-visits', visitCount);
    
    // Display the count with animation
    animateCounter(visitCount);
}

function animateCounter(finalCount) {
    let currentCount = 0;
    const increment = Math.ceil(finalCount / 30); // Animation duration
    const timer = setInterval(() => {
        currentCount += increment;
        if (currentCount >= finalCount) {
            currentCount = finalCount;
            clearInterval(timer);
        }
        visitCountEl.textContent = currentCount.toLocaleString('ar-SA');
    }, 50);
}

// --- Initialization --- //
document.addEventListener('DOMContentLoaded', () => {
    // Initialize visit counter
    initVisitCounter();
    
    // Set today's date
    const today = new Date();
    currentDateEl.textContent = `التاريخ: ${today.toLocaleDateString('ar-SA')}`;

    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.checked = savedTheme === 'dark';

    // Generate table selection buttons from 0 to 10
    for (let i = 0; i <= 10; i++) {
        const button = document.createElement('button');
        button.className = 'btn btn-table';
        button.innerHTML = `<span>🔢</span> ${i}`;
        button.dataset.table = i;
        button.addEventListener('click', () => {
            playSound('click');
            startQuiz(i);
        });
        tableSelectionContainer.appendChild(button);
    }

    // Setup WhatsApp share link
    const message = encodeURIComponent('لقد أتممت تحدي جدول الضرب! تعال وجرب بنفسك.');
    const appUrl = encodeURIComponent(window.location.href);
    whatsappShareBtn.href = `https://api.whatsapp.com/send?text=${message}%20${appUrl}`;

    // Timer toggle functionality
    timerEnabled.addEventListener('change', () => {
        if (timerEnabled.checked) {
            timerDisplay.style.display = 'block';
            startTimer();
        } else {
            timerDisplay.style.display = 'none';
            stopTimer();
        }
    });
});

// --- Theme Switcher --- //
themeToggle.addEventListener('change', () => {
    const newTheme = themeToggle.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// --- Screen Navigation --- //
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// --- Quiz Logic --- //
function startQuiz(tableNumber) {
    currentTable = tableNumber;
    quizTitle.textContent = `اختبار جدول الضرب للعدد ${tableNumber}`;
    generateQuestions(tableNumber);
    
    // Reset timer
    timeRemaining = 300;
    updateTimerDisplay();
    timerEnabled.checked = false;
    timerDisplay.style.display = 'none';
    stopTimer();
    
    showScreen('quiz-screen');
    
    // Focus on first input after a short delay to ensure the screen is rendered
    setTimeout(() => {
        if (questions.length > 0) {
            const firstInput = document.getElementById(questions[0].id);
            if (firstInput) {
                firstInput.focus();
            }
        }
    }, 100);
}

// --- Timer Functions --- //
function startTimer() {
    stopTimer(); // Clear any existing timer
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 60) {
            timerDisplay.classList.add('warning');
        }
        
        if (timeRemaining <= 0) {
            stopTimer();
            alert('انتهى الوقت! سيتم إنهاء الاختبار تلقائياً.');
            finishQuizBtn.click();
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timerDisplay.classList.remove('warning');
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerText.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function generateQuestions(table) {
    questions = [];
    quizForm.innerHTML = ''; // Clear previous questions
    
    // Create an array of numbers from 0 to 10
    let multipliers = Array.from({ length: 11 }, (_, i) => i);
    
    // Shuffle the array for random order
    for (let i = multipliers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [multipliers[i], multipliers[j]] = [multipliers[j], multipliers[i]];
    }

    multipliers.forEach((num, index) => {
        const questionData = {
            num1: table,
            num2: num,
            correctAnswer: table * num,
            id: `q${index}`
        };
        questions.push(questionData);

        const questionEl = document.createElement('div');
        questionEl.className = 'quiz-question';
        questionEl.innerHTML = `
            <label for="${questionData.id}">${questionData.num1} &times; ${questionData.num2} =</label>
            <input type="number" id="${questionData.id}" name="${questionData.id}" required>
        `;
        
        // Add enter key navigation
        const input = questionEl.querySelector('input');
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Find next input field
                const currentIndex = questions.findIndex(q => q.id === questionData.id);
                if (currentIndex < questions.length - 1) {
                    const nextInput = document.getElementById(questions[currentIndex + 1].id);
                    nextInput.focus();
                } else {
                    // If it's the last question, focus on finish button
                    finishQuizBtn.focus();
                }
            }
        });
        
        quizForm.appendChild(questionEl);
    });
}

// --- Results Logic --- //
finishQuizBtn.addEventListener('click', () => {
    // Clear any previous error highlighting
    document.querySelectorAll('.quiz-question input').forEach(input => {
        input.classList.remove('error');
    });

    // Check if all questions are answered
    const emptyFields = [];
    questions.forEach(q => {
        const input = document.getElementById(q.id);
        if (!input.value || input.value.trim() === '') {
            emptyFields.push(q);
            input.classList.add('error'); // Highlight empty fields
        }
    });

    // Show confirmation dialog if there are empty fields
    if (emptyFields.length > 0) {
        const confirmMessage = `هناك ${emptyFields.length} أسئلة لم تجيبي عليها. هل تريدين المتابعة وإنهاء الاختبار؟`;
        if (!confirm(confirmMessage)) {
            // Scroll to first empty field
            if (emptyFields.length > 0) {
                document.getElementById(emptyFields[0].id).scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return; // Don't submit if user cancels
        }
    }

    // Final confirmation before submitting
    if (!confirm('هل أنت متأكدة من إنهاء الاختبار؟')) {
        return;
    }

    const userAnswers = [];
    const wrongAnswers = [];

    questions.forEach(q => {
        const input = document.getElementById(q.id);
        const userAnswer = parseInt(input.value, 10);
        userAnswers.push({ ...q, userAnswer });

        if (isNaN(userAnswer) || userAnswer !== q.correctAnswer) {
            wrongAnswers.push({ ...q, userAnswer: input.value });
        }
    });

    if (wrongAnswers.length === 0) {
        // Perfect score
        stopTimer(); // Stop timer when quiz is finished
        displayCertificate();
    } else {
        // Some mistakes
        stopTimer(); // Stop timer when quiz is finished
        displayErrorModal(wrongAnswers);
    }
});

function displayCertificate() {
    playSound('success'); // Play success sound
    certificateText.innerHTML = `تهانينا! لقد أتقنتِ جدول الضرب للعدد <strong>${currentTable}</strong> بنجاح باهر.`;
    showScreen('certificate-screen');
}

function displayErrorModal(errors) {
    playSound('error'); // Play error sound
    errorList.innerHTML = ''; // Clear previous errors
    errors.forEach(err => {
        const errorItem = document.createElement('div');
        errorItem.className = 'error-item';
        errorItem.innerHTML = `
            السؤال: ${err.num1} &times; ${err.num2}، 
            إجابتك: <span class="wrong-answer">${err.userAnswer || 'فارغ'}</span>، 
            الإجابة الصحيحة: <span class="correct-answer">${err.correctAnswer}</span>
        `;
        errorList.appendChild(errorItem);
    });
    resultsModal.style.display = 'block';
}

// --- Certificate Functions --- //
function saveCertificateAsImage() {
    // Get the certificate element
    const certificate = document.querySelector('.certificate');
    const nameInput = document.getElementById('student-name-cert');
    
    // Temporarily hide buttons and style for saving
    const buttons = document.querySelector('.certificate-buttons');
    buttons.style.display = 'none';
    nameInput.style.border = 'none';
    nameInput.setAttribute('readonly', 'true');
    
    // Use html2canvas library alternative - create canvas manually
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;
    
    // Fill background
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--card-bg');
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add border
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color');
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    // Add text content
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';
    
    // Title
    ctx.font = 'bold 48px Arial';
    ctx.fillText('🏆', canvas.width / 2, 100);
    
    ctx.font = 'bold 36px Arial';
    ctx.fillText('شهادة إتقان', canvas.width / 2, 160);
    
    // Student name
    const studentName = nameInput.value || 'الطالب/ة';
    ctx.font = '24px Arial';
    ctx.fillText(`اسم الطالب/ة: ${studentName}`, canvas.width / 2, 220);
    
    // Achievement text
    ctx.font = '20px Arial';
    const achievementText = `تهانينا! لقد أتقنتِ جدول الضرب للعدد ${currentTable} بنجاح باهر.`;
    
    // Split text for multiple lines
    const words = achievementText.split(' ');
    let line = '';
    let y = 280;
    
    for (let word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > canvas.width - 100 && line !== '') {
            ctx.fillText(line, canvas.width / 2, y);
            line = word + ' ';
            y += 30;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, canvas.width / 2, y);
    
    // Add date and school info
    ctx.font = '16px Arial';
    const today = new Date().toLocaleDateString('ar-SA');
    ctx.fillText(`التاريخ: ${today}`, canvas.width / 2, y + 80);
    ctx.fillText('المدرسة: الابتدائية 65', canvas.width / 2, y + 110);
    ctx.fillText('معلمة المادة: الأستاذة / مها اليامي', canvas.width / 2, y + 140);
    
    // Convert to blob and download
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `شهادة_جدول_الضرب_${currentTable}_${studentName}_${new Date().getTime()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Restore original state
        buttons.style.display = 'flex';
        nameInput.style.borderBottom = '2px solid var(--primary-color)';
        nameInput.removeAttribute('readonly');
        
        alert('تم حفظ الشهادة بنجاح! 🎉');
    }, 'image/png');
}

// --- Event Listeners for Buttons --- //

// Back to main menu from certificate
certBackToMainBtn.addEventListener('click', () => {
    playSound('click');
    showScreen('selection-screen');
});

// Save certificate as image
saveCertificateBtn.addEventListener('click', () => {
    playSound('click');
    saveCertificateAsImage();
});

// Show screenshot guide
screenshotGuideBtn.addEventListener('click', () => {
    playSound('click');
    saveGuideModal.style.display = 'block';
});

// Close screenshot guide modal
closeGuideModalBtn.addEventListener('click', () => {
    playSound('click');
    saveGuideModal.style.display = 'none';
});

// Retry quiz from modal
retryQuizBtn.addEventListener('click', () => {
    playSound('click');
    resultsModal.style.display = 'none';
    startQuiz(currentTable); // Restart quiz for the same table
});

// Back to main menu from modal
modalBackToMainBtn.addEventListener('click', () => {
    playSound('click');
    resultsModal.style.display = 'none';
    showScreen('selection-screen');
});

// Close modal if user clicks outside of it
window.addEventListener('click', (event) => {
    if (event.target == resultsModal) {
        resultsModal.style.display = 'none';
    }
    if (event.target == saveGuideModal) {
        saveGuideModal.style.display = 'none';
    }
});

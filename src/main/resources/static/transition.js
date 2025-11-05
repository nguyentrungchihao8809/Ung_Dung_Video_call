// ============================================
// ============================================

// Thêm CSS animations vào document
function addTransitionStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Animation slide out sang trái */
        @keyframes slideOutToLeft {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(-100px);
            }
        }
        
        /* Animation slide out sang phải */
        @keyframes slideOutToRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100px);
            }
        }

        /* Fade overlay */
        .page-transition.active {
            opacity: 1 !important;
        }
    `;
    document.head.appendChild(style);
}

// Gọi function thêm styles khi page load
addTransitionStyles();

// ============================================
// Hàm chuyển sang trang Register
// ============================================
function goToRegister() {
    const transition = document.querySelector('.page-transition');
    const content = document.getElementById('mainContent');
    
    // Kiểm tra element có tồn tại không
    if (!transition || !content) {
        console.error('Không tìm thấy elements cần thiết!');
        window.location.href = 'register.html';
        return;
    }
    
    // Kích hoạt overlay đen
    transition.classList.add('active');
    
    // Slide content sang trái
    content.style.animation = 'slideOutToLeft 0.3s ease forwards';
    
    // Chuyển trang sau 500ms (khớp với thời gian animation)
    setTimeout(() => {
        window.location.href = 'register.html';
    }, 300);
}

// ============================================
// Hàm chuyển sang trang Login
// ============================================
function goToLogin() {
    const transition = document.querySelector('.page-transition');
    const content = document.getElementById('mainContent');
    
    // Kiểm tra element có tồn tại không
    if (!transition || !content) {
        console.error('Không tìm thấy elements cần thiết!');
        window.location.href = 'login.html';
        return;
    }
    
    // Kích hoạt overlay đen
    transition.classList.add('active');
    
    // Slide content sang phải
    content.style.animation = 'slideOutToRight 0.3s ease forwards';
    
    // Chuyển trang sau 500ms (khớp với thời gian animation)
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 300);
}

// ============================================
// Xử lý khi trang vừa load xong
// ============================================
window.addEventListener('DOMContentLoaded', function() {
    const transition = document.querySelector('.page-transition');
    
    // Fade out overlay khi trang load xong
    if (transition) {
        setTimeout(() => {
            transition.style.opacity = '0';
        }, 100);
    }
    
    console.log('Page transition script loaded successfully!');
});

// ============================================
// Ngăn chặn double-click (optional - tránh spam click)
// ============================================
let isTransitioning = false;

function goToRegisterSafe() {
    if (isTransitioning) return;
    isTransitioning = true;
    goToRegister();
}

function goToLoginSafe() {
    if (isTransitioning) return;
    isTransitioning = true;
    goToLogin();
}

// ============================================
// Debug helper (có thể xóa khi deploy production)
// ============================================
console.log('%c🎬 Transition.js loaded! ', 'background: #222; color: #bada55; font-size: 16px; padding: 10px;');
console.log('Available functions: goToRegister(), goToLogin()');
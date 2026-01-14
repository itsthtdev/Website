// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href && href !== '#' && !this.classList.contains('signup-trigger') && this.id !== 'login-btn' && this.id !== 'signup-btn' && this.id !== 'show-login' && this.id !== 'show-signup') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu if open
                const navMenu = document.querySelector('.nav-menu');
                const menuToggle = document.querySelector('.mobile-menu-toggle');
                if (navMenu && menuToggle) {
                    navMenu.classList.remove('active');
                    menuToggle.classList.remove('active');
                }
            }
        }
    });
});

// Mobile menu toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');

if (mobileMenuToggle && navMenu) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
    });
}

// Auth Modal functionality
const modal = document.getElementById('auth-modal');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const modalClose = document.querySelector('.modal-close');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const showSignupLink = document.getElementById('show-signup');
const showLoginLink = document.getElementById('show-login');
const signupTriggers = document.querySelectorAll('.signup-trigger');

// Open modal with signup form
if (signupBtn) {
    signupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('active');
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
    });
}

// Open modal with login form
if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('active');
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
    });
}

// All signup triggers
signupTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('active');
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
    });
});

// Switch to signup form
if (showSignupLink) {
    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
    });
}

// Switch to login form
if (showLoginLink) {
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
    });
}

// Close modal
if (modalClose) {
    modalClose.addEventListener('click', () => {
        modal.classList.remove('active');
    });
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
    }
});

// Handle form submissions (placeholder - would integrate with backend)
document.querySelectorAll('.auth-form form').forEach(form => {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        // Close modal and show success message
        modal.classList.remove('active');
        // In production, this would actually authenticate and redirect to dashboard
    });
});

// Animated counters for stats
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = formatNumber(target);
            clearInterval(timer);
        } else {
            element.textContent = formatNumber(Math.floor(start));
        }
    }, 16);
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Initialize counters when hero section is visible
const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const clipsCreated = document.getElementById('clips-created');
                const hoursSaved = document.getElementById('hours-saved');
                const socialPosts = document.getElementById('social-posts');
                
                if (clipsCreated && clipsCreated.textContent === '0') {
                    animateCounter(clipsCreated, 0, 1000); // Will show 0 initially
                    animateCounter(hoursSaved, 0, 1000);
                    animateCounter(socialPosts, 0, 1000);
                }
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    statsObserver.observe(heroStats);
}

// Add scroll effect to header
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
        header.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }
});

// Add animation on scroll for elements
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all feature cards, steps, and pricing cards
document.querySelectorAll('.feature-card, .step, .pricing-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Handle CTA button clicks (placeholder - you can add actual functionality later)
document.querySelectorAll('.btn').forEach(button => {
    if (button.textContent.includes('Start') || button.textContent.includes('Get Started')) {
        button.addEventListener('click', (e) => {
            // For demo purposes, scroll to contact section
            // In production, this would redirect to a signup page
            if (!button.getAttribute('href') || button.getAttribute('href') === '#' || button.getAttribute('href') === '#get-started') {
                e.preventDefault();
                const contactSection = document.querySelector('#contact');
                if (contactSection) {
                    contactSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }
});

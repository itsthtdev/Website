// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3000/api' 
  : '/api';

// Authentication state
let authToken = localStorage.getItem('authToken');
let currentUser = null;

// Initialize Stripe (will be loaded from server)
let stripe = null;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  await initializeAuth();
  await initializeStripe();
  checkAuthState();
});

// Initialize authentication state
async function initializeAuth() {
  if (authToken) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok) {
        currentUser = await response.json();
        updateUIForLoggedInUser();
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('authToken');
        authToken = null;
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    }
  }
}

// Initialize Stripe
async function initializeStripe() {
  try {
    const response = await fetch(`${API_BASE_URL}/stripe/config`);
    const { publishableKey } = await response.json();
    stripe = Stripe(publishableKey);
  } catch (error) {
    console.error('Stripe initialization error:', error);
  }
}

// Check authentication state and update UI
function checkAuthState() {
  const loggedOutNav = document.getElementById('nav-cta-logged-out');
  const loggedInNav = document.getElementById('nav-cta-logged-in');
  const downloadNotice = document.getElementById('download-login-notice');
  const downloadGrid = document.getElementById('download-grid');
  
  if (currentUser) {
    if (loggedOutNav) loggedOutNav.style.display = 'none';
    if (loggedInNav) loggedInNav.style.display = 'flex';
    if (downloadNotice) downloadNotice.style.display = 'none';
    if (downloadGrid) downloadGrid.style.display = 'grid';
  } else {
    if (loggedOutNav) loggedOutNav.style.display = 'flex';
    if (loggedInNav) loggedInNav.style.display = 'none';
    if (downloadNotice) downloadNotice.style.display = 'block';
    if (downloadGrid) downloadGrid.style.display = 'none';
  }
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
  checkAuthState();
}

// Logout functionality
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    checkAuthState();
    window.location.reload();
  });
}

// Download login link
const downloadLoginLink = document.getElementById('download-login-link');
if (downloadLoginLink) {
  downloadLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    const modal = document.getElementById('auth-modal');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (modal && loginForm && signupForm) {
      modal.classList.add('active');
      signupForm.style.display = 'none';
      loginForm.style.display = 'block';
    }
  });
}

// Download buttons
document.querySelectorAll('.download-btn').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const platform = btn.dataset.platform;
    if (!authToken) {
      alert('Please login to download');
      return;
    }
    
    try {
      btn.disabled = true;
      btn.textContent = 'Generating download link...';
      
      const response = await fetch(`${API_BASE_URL}/download/${platform}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Open download in new window
        window.open(data.downloadUrl, '_blank');
        btn.textContent = '✓ Download Started';
        
        // Track download
        await fetch(`${API_BASE_URL}/download/track`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            platform,
            version: '1.0.0',
            success: true
          })
        });
        
        setTimeout(() => {
          btn.textContent = `Download for ${platform.charAt(0).toUpperCase() + platform.slice(1)}`;
          btn.disabled = false;
        }, 3000);
      } else {
        throw new Error(data.error || 'Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to generate download link. Please try again.');
      btn.textContent = `Download for ${platform.charAt(0).toUpperCase() + platform.slice(1)}`;
      btn.disabled = false;
    }
  });
});

// Contact form submission
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
      name: document.getElementById('contact-name').value,
      email: document.getElementById('contact-email').value,
      type: document.getElementById('contact-type').value,
      subject: document.getElementById('contact-subject').value,
      message: document.getElementById('contact-message').value,
    };
    
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const resultDiv = document.getElementById('contact-form-result');
    
    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      
      const endpoint = formData.type === 'complaint' 
        ? `${API_BASE_URL}/contact/complaint` 
        : `${API_BASE_URL}/contact/submit`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        resultDiv.textContent = data.message;
        resultDiv.className = 'form-result success';
        resultDiv.style.display = 'block';
        contactForm.reset();
      } else {
        throw new Error(data.error || 'Submission failed');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      resultDiv.textContent = 'Failed to send message. Please try again.';
      resultDiv.className = 'form-result error';
      resultDiv.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
      
      setTimeout(() => {
        resultDiv.style.display = 'none';
      }, 5000);
    }
  });
}

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

// Handle login form submission
if (loginForm) {
  const form = loginForm.querySelector('form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Logging in...';
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', authToken);
        
        modal.classList.remove('active');
        form.reset();
        updateUIForLoggedInUser();
        
        // Show success message
        alert('Login successful!');
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert(error.message || 'Login failed. Please check your credentials.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Login';
    }
  });
}

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

// Password validation and strength checking
const signupPassword = document.getElementById('signup-password');
const signupConfirm = document.getElementById('signup-confirm');
const passwordStrengthBar = document.querySelector('.password-strength-bar');
const signupSubmitBtn = document.getElementById('signup-submit-btn');
const passwordMatchMessage = document.getElementById('password-match-message');

// Password requirements validation
function validatePassword(password) {
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    // Update requirement list UI
    document.getElementById('req-length').className = requirements.length ? 'requirement-met' : 'requirement-unmet';
    document.getElementById('req-uppercase').className = requirements.uppercase ? 'requirement-met' : 'requirement-unmet';
    document.getElementById('req-lowercase').className = requirements.lowercase ? 'requirement-met' : 'requirement-unmet';
    document.getElementById('req-number').className = requirements.number ? 'requirement-met' : 'requirement-unmet';
    document.getElementById('req-special').className = requirements.special ? 'requirement-met' : 'requirement-unmet';
    
    return Object.values(requirements).every(Boolean);
}

// Calculate password strength
function calculatePasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    
    return strength;
}

// Update password strength indicator
if (signupPassword) {
    signupPassword.addEventListener('input', () => {
        const password = signupPassword.value;
        const isValid = validatePassword(password);
        const strength = calculatePasswordStrength(password);
        
        // Update strength bar
        passwordStrengthBar.classList.remove('weak', 'medium', 'strong');
        if (strength <= 2) {
            passwordStrengthBar.classList.add('weak');
        } else if (strength <= 4) {
            passwordStrengthBar.classList.add('medium');
        } else {
            passwordStrengthBar.classList.add('strong');
        }
        
        checkFormValidity();
    });
}

// Check password match
if (signupConfirm) {
    signupConfirm.addEventListener('input', () => {
        const password = signupPassword.value;
        const confirm = signupConfirm.value;
        
        if (confirm.length > 0) {
            if (password === confirm) {
                passwordMatchMessage.textContent = '✓ Passwords match';
                passwordMatchMessage.classList.add('match');
            } else {
                passwordMatchMessage.textContent = '✗ Passwords do not match';
                passwordMatchMessage.classList.remove('match');
            }
        } else {
            passwordMatchMessage.textContent = '';
        }
        
        checkFormValidity();
    });
}

// Add input listeners for other fields to check form validity
const nameField = document.getElementById('signup-name');
const emailField = document.getElementById('signup-email');
const phoneField = document.getElementById('signup-phone');
const termsCheckbox = document.getElementById('terms');

if (nameField) nameField.addEventListener('input', checkFormValidity);
if (emailField) emailField.addEventListener('input', checkFormValidity);
if (phoneField) phoneField.addEventListener('input', checkFormValidity);
if (termsCheckbox) termsCheckbox.addEventListener('change', checkFormValidity);

// Check overall form validity
function checkFormValidity() {
    const password = signupPassword ? signupPassword.value : '';
    const confirm = signupConfirm ? signupConfirm.value : '';
    const name = document.getElementById('signup-name') ? document.getElementById('signup-name').value : '';
    const email = document.getElementById('signup-email') ? document.getElementById('signup-email').value : '';
    const phone = document.getElementById('signup-phone') ? document.getElementById('signup-phone').value : '';
    const terms = document.getElementById('terms') ? document.getElementById('terms').checked : false;
    
    const isPasswordValid = validatePassword(password);
    const doPasswordsMatch = password === confirm && password.length > 0;
    const areFieldsFilled = name.length > 0 && email.length > 0 && phone.length >= 10;
    const areTermsAccepted = terms;
    
    if (signupSubmitBtn) {
        signupSubmitBtn.disabled = !(isPasswordValid && doPasswordsMatch && areFieldsFilled && areTermsAccepted);
    }
}

// Handle signup form submission
const signupFormElement = document.getElementById('signup-form-element');
if (signupFormElement) {
    signupFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const phone = document.getElementById('signup-phone').value;
        const password = document.getElementById('signup-password').value;
        
        const submitBtn = document.getElementById('signup-submit-btn');
        
        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating account...';
            
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, phone, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Show SMS verification step
                document.getElementById('signup-form').style.display = 'none';
                document.getElementById('sms-verification').style.display = 'block';
                document.getElementById('verification-phone').textContent = phone;
                
                // Store temp data for after verification
                window.tempSignupData = {
                    token: data.token,
                    user: data.user
                };
            } else {
                throw new Error(data.error || data.errors?.[0]?.msg || 'Signup failed');
            }
        } catch (error) {
            console.error('Signup error:', error);
            alert(error.message || 'Signup failed. Please try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
        }
    });
}

// Handle verification code inputs
const verificationDigits = document.querySelectorAll('.verification-digit');
verificationDigits.forEach((digit, index) => {
    digit.addEventListener('input', (e) => {
        const value = e.target.value;
        
        // Only allow numbers
        if (!/^[0-9]$/.test(value)) {
            e.target.value = '';
            return;
        }
        
        // Auto-focus next input
        if (value && index < verificationDigits.length - 1) {
            verificationDigits[index + 1].focus();
        }
    });
    
    digit.addEventListener('keydown', (e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
            verificationDigits[index - 1].focus();
        }
    });
});

// Handle verification form submission
const verificationForm = document.getElementById('verification-form');
if (verificationForm) {
    verificationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Collect verification code
        const code = Array.from(verificationDigits).map(input => input.value).join('');
        
        // Validate all digits are entered
        if (code.length !== 6 || !/^\d{6}$/.test(code)) {
            const errorMsg = document.createElement('small');
            errorMsg.style.color = '#ef4444';
            errorMsg.textContent = 'Please enter all 6 digits';
            const submitBtn = verificationForm.querySelector('button[type="submit"]');
            if (submitBtn && !submitBtn.nextElementSibling) {
                submitBtn.parentNode.insertBefore(errorMsg, submitBtn.nextSibling);
                setTimeout(() => errorMsg.remove(), 3000);
            }
            return;
        }
        
        try {
            const submitBtn = verificationForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Verifying...';
            
            const response = await fetch(`${API_BASE_URL}/auth/verify-sms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phone: document.getElementById('verification-phone').textContent,
                    code
                })
            });
            
            const data = await response.json();
            
            if (response.ok && window.tempSignupData) {
                // Complete signup with stored data
                authToken = window.tempSignupData.token;
                currentUser = window.tempSignupData.user;
                localStorage.setItem('authToken', authToken);
                
                // Clear temp data
                delete window.tempSignupData;
                
                // Close modal and reset forms
                modal.classList.remove('active');
                document.getElementById('signup-form').style.display = 'block';
                document.getElementById('sms-verification').style.display = 'none';
                signupFormElement.reset();
                verificationDigits.forEach(digit => digit.value = '');
                
                updateUIForLoggedInUser();
                alert('Account created successfully!');
            } else {
                throw new Error(data.error || 'Verification failed');
            }
        } catch (error) {
            console.error('Verification error:', error);
            alert(error.message || 'Verification failed. Please try again.');
        } finally {
            const submitBtn = verificationForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Verify & Complete Signup';
        }
    });
}

// Handle resend code
const resendCodeBtn = document.getElementById('resend-code');
if (resendCodeBtn) {
    resendCodeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // In production: Resend SMS code
        console.log('Resending SMS verification code');
        
        // Show success message
        const successMsg = document.createElement('small');
        successMsg.style.color = '#10b981';
        successMsg.textContent = 'Code resent successfully!';
        const parentDiv = resendCodeBtn.parentElement;
        if (parentDiv && !parentDiv.querySelector('.success-message')) {
            successMsg.className = 'success-message';
            parentDiv.appendChild(successMsg);
            setTimeout(() => successMsg.remove(), 3000);
        }
    });
}

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

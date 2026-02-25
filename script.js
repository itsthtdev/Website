// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3000/api' 
  : '/api';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initFAQ();
  animateStatsSection();
});

// FAQ accordion
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      // Close all other open items
      document.querySelectorAll('.faq-item.open').forEach(openItem => {
        if (openItem !== item) {
          openItem.classList.remove('open');
          openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        }
      });

      // Toggle current item
      btn.setAttribute('aria-expanded', String(!isOpen));
      item.classList.toggle('open', !isOpen);
    });
  });
}

// Animate stats counters when the section scrolls into view
function animateStatsSection() {
  const statsSection = document.querySelector('.stats-section');
  if (!statsSection) return;

  let animated = false;

  function runCounters() {
    if (animated) return;
    animated = true;
    document.querySelectorAll('.stats-value').forEach(el => {
      const target = parseInt(el.dataset.target, 10);
      const suffix = el.dataset.suffix || '';
      animateCounter(el, target, suffix, 2000);
    });
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runCounters();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    observer.observe(statsSection);
  } else {
    runCounters();
  }
}

// Download buttons
document.querySelectorAll('.download-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const platform = btn.dataset.platform;

    try {
      btn.disabled = true;
      btn.textContent = 'Generating download link...';

      const response = await fetch(`${API_BASE_URL}/download/${platform}`);
      const data = await response.json();

      if (response.ok) {
        window.open(data.downloadUrl, '_blank');
        btn.textContent = '✓ Download Started';

        setTimeout(() => {
          btn.textContent = `Download for ${platform.charAt(0).toUpperCase() + platform.slice(1)}`;
          btn.disabled = false;
        }, 3000);
      } else {
        throw new Error(data.error || 'Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to generate download link. Please try again or contact support.');
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
        if (!href || href === '#') {
            return;
        }
        const target = document.querySelector(href);
        if (!target) {
            return;
        }
        e.preventDefault();
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

// Animated counter helper
function animateCounter(element, target, suffix, duration) {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = formatNumber(target) + suffix;
            clearInterval(timer);
        } else {
            element.textContent = formatNumber(Math.floor(start)) + suffix;
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

// Hero stats counters (animate on load)
const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
    if ('IntersectionObserver' in window) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const clipsCreated = document.getElementById('clips-created');
                    const hoursSaved = document.getElementById('hours-saved');
                    const socialPosts = document.getElementById('social-posts');
                    
                    if (clipsCreated && clipsCreated.textContent === '0') {
                        animateCounter(clipsCreated, 1200000, '', 2000);
                        animateCounter(hoursSaved, 320000, '', 2000);
                        animateCounter(socialPosts, 870000, '', 2000);
                    }
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        statsObserver.observe(heroStats);
    } else {
        const clipsCreated = document.getElementById('clips-created');
        const hoursSaved = document.getElementById('hours-saved');
        const socialPosts = document.getElementById('social-posts');
        if (clipsCreated) animateCounter(clipsCreated, 1200000, '', 2000);
        if (hoursSaved) animateCounter(hoursSaved, 320000, '', 2000);
        if (socialPosts) animateCounter(socialPosts, 870000, '', 2000);
    }
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

// Add animation on scroll for elements (with fallback for older browsers)
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card, .step, .stats-card, .download-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
} else {
    document.querySelectorAll('.feature-card, .step, .stats-card, .download-card').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
    });
}

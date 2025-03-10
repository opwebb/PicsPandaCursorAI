/**
 * PicsPanda - main.js
 * Common functionality for the entire site
 */

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('nav');
    
    if (mobileMenuBtn && nav) {
        // Add ARIA attributes
        mobileMenuBtn.setAttribute('aria-label', 'Toggle menu');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        
        mobileMenuBtn.addEventListener('click', function() {
            nav.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
            
            // Update ARIA expanded state
            const isExpanded = nav.classList.contains('active');
            mobileMenuBtn.setAttribute('aria-expanded', isExpanded);
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!nav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                nav.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            }
        });
        
        // Close menu when clicking a link
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                nav.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Handle theme toggle if present
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        // Check for saved theme preference or use preferred color scheme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.body.classList.toggle('dark-theme', savedTheme === 'dark');
            themeToggle.classList.toggle('active', savedTheme === 'dark');
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-theme');
            themeToggle.classList.add('active');
            localStorage.setItem('theme', 'dark');
        }

        // Theme toggle click handler
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-theme');
            themeToggle.classList.toggle('active');
            const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
            localStorage.setItem('theme', currentTheme);
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId !== '#') {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80, // Offset for header
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Initialize tooltips if any
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(tooltip => {
        tooltip.addEventListener('mouseenter', function() {
            const tooltipText = this.getAttribute('data-tooltip');
            const tooltipEl = document.createElement('div');
            tooltipEl.className = 'tooltip';
            tooltipEl.textContent = tooltipText;
            document.body.appendChild(tooltipEl);
            
            const rect = this.getBoundingClientRect();
            tooltipEl.style.top = `${rect.top - tooltipEl.offsetHeight - 10 + window.scrollY}px`;
            tooltipEl.style.left = `${rect.left + (rect.width / 2) - (tooltipEl.offsetWidth / 2) + window.scrollX}px`;
        });
        
        tooltip.addEventListener('mouseleave', function() {
            const tooltipEl = document.querySelector('.tooltip');
            if (tooltipEl) {
                tooltipEl.remove();
            }
        });
    });

    // Search functionality
    const searchInput = document.getElementById('tool-search');
    const searchBtn = document.getElementById('search-btn');
    const toolCards = document.querySelectorAll('.tool-card');

    function searchTools(searchTerm) {
        searchTerm = searchTerm.toLowerCase().trim();
        
        toolCards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const description = card.querySelector('p').textContent.toLowerCase();
            const isMatch = title.includes(searchTerm) || description.includes(searchTerm);
            
            card.style.display = isMatch || searchTerm === '' ? 'block' : 'none';
            
            // Add fade effect
            if (isMatch || searchTerm === '') {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(10px)';
            }
        });

        // Update sections visibility
        const imageTools = document.getElementById('image-tools');
        const pdfTools = document.getElementById('pdf-tools');

        [imageTools, pdfTools].forEach(section => {
            if (section) {
                const hasVisibleTools = Array.from(section.querySelectorAll('.tool-card'))
                    .some(card => card.style.display !== 'none');
                section.style.display = hasVisibleTools ? 'block' : 'none';
            }
        });
    }

    // Search on input
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTools(e.target.value);
        });

        // Clear search on 'Escape' key
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                searchTools('');
                searchInput.blur();
            }
        });
    }

    // Search button click
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            if (searchInput) {
                searchTools(searchInput.value);
            }
        });
    }
});
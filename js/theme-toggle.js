const ThemeManager = {
    init() {
        // Don't initialize theme toggle on tool pages
        if (window.location.pathname.includes('/tools/')) {
            return;
        }

        const htmlElement = document.documentElement;
        const currentTheme = localStorage.getItem('theme');

        // Set initial theme
        if (currentTheme) {
            htmlElement.setAttribute('data-theme', currentTheme);
            this.updateThemeIcon(currentTheme);
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const initialTheme = prefersDark ? 'dark' : 'light';
            htmlElement.setAttribute('data-theme', initialTheme);
            localStorage.setItem('theme', initialTheme);
            this.updateThemeIcon(initialTheme);
        }

        // Add theme toggle button
        const headerNav = document.querySelector('header nav');
        if (headerNav) {
            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'theme-toggle-btn';
            toggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
            headerNav.after(toggleBtn);

            // Toggle theme click handler
            toggleBtn.addEventListener('click', () => {
                const currentTheme = htmlElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                htmlElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                this.updateThemeIcon(newTheme);
            });
        }
    },

    updateThemeIcon(theme) {
        const icon = document.querySelector('#theme-toggle-btn i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }
};

// Initialize theme manager
document.addEventListener('DOMContentLoaded', () => ThemeManager.init());

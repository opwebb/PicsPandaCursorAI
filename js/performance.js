const Performance = {
    init() {
        this.preloadCriticalAssets();
        this.setupLazyLoading();
        this.optimizeEventListeners();
        this.cacheDOM();
    },

    preloadCriticalAssets() {
        const criticalAssets = [
            '../css/styles.css',
            '../js/main.js',
            '../images/picspanda-logo.svg'
        ];
        criticalAssets.forEach(asset => {
            const preloadLink = document.createElement('link');
            preloadLink.rel = 'preload';
            preloadLink.href = asset;
            preloadLink.as = asset.endsWith('.css') ? 'style' : 
                            asset.endsWith('.js') ? 'script' : 'image';
            document.head.appendChild(preloadLink);
        });
    },

    setupLazyLoading() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    imageObserver.unobserve(img);
                }
            });
        });
        lazyImages.forEach(img => imageObserver.observe(img));
    },

    optimizeEventListeners() {
        const debounce = (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        };

        // Apply to common events
        window.addEventListener('resize', debounce(() => {
            // Handle resize
        }, 150));

        window.addEventListener('scroll', debounce(() => {
            // Handle scroll
        }, 150), { passive: true });
    },

    cacheDOM() {
        window.DOMCache = {};
        document.querySelectorAll('[id]').forEach(element => {
            window.DOMCache[element.id] = element;
        });
    }
};

// Initialize performance optimizations
document.addEventListener('DOMContentLoaded', () => Performance.init());

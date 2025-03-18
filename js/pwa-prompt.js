class PWAPrompt {
    constructor() {
        this.prompt = null;
        this.installButton = null;
        this.showCount = 0;
        this.maxPrompts = 3;
        this.daysToWait = 7;
        this.deferredPrompt = null; // Add this line
    }

    init() {
        // Only setup event listener first
        this.setupInstallPrompt();
        
        // Then check if we should show prompt
        if (this.isPWACompatible()) {
            this.createPrompt();
            this.setupEventListeners();
            this.checkAndShow();
        }
    }

    isPWACompatible() {
        return (
            'serviceWorker' in navigator &&
            'BeforeInstallPromptEvent' in window &&
            !window.matchMedia('(display-mode: standalone)').matches &&
            !localStorage.getItem('pwaInstalled')
        );
    }

    createPrompt() {
        const prompt = document.createElement('div');
        prompt.className = 'pwa-prompt';
        prompt.innerHTML = `
            <div class="pwa-header">
                <img src="/images/picspanda-logo.svg" alt="PicsPanda" class="pwa-logo">
                <h3 class="pwa-title">Install PicsPanda</h3>
                <button class="pwa-close">&times;</button>
            </div>
            <p class="pwa-description">Install PicsPanda for quick access to all tools, even when you're offline!</p>
            <div class="pwa-actions">
                <button class="pwa-install-btn">Install App</button>
                <button class="pwa-later-btn">Maybe Later</button>
            </div>
        `;
        document.body.appendChild(prompt);
        this.prompt = prompt;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const closeBtn = this.prompt.querySelector('.pwa-close');
        const laterBtn = this.prompt.querySelector('.pwa-later-btn');
        const installBtn = this.prompt.querySelector('.pwa-install-btn');

        closeBtn.addEventListener('click', () => this.hidePrompt());
        laterBtn.addEventListener('click', () => this.hidePrompt());
        installBtn.addEventListener('click', () => this.installPWA());
        
        this.installButton = installBtn;
    }

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome 76+ from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later
            this.deferredPrompt = e;
            console.log('Install prompt ready');
        });

        window.addEventListener('appinstalled', () => {
            this.hidePrompt();
            localStorage.setItem('pwaInstalled', 'true');
            console.log('PWA installed successfully');
        });
    }

    async installPWA() {
        if (!this.deferredPrompt) {
            console.log('No installation prompt available');
            return;
        }

        // Show the install prompt
        this.deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await this.deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // Clear the saved prompt since it can't be used again
        this.deferredPrompt = null;
    }

    showPrompt() {
        this.prompt.classList.add('show');
        this.showCount++;
        localStorage.setItem('pwaPromptCount', this.showCount);
        localStorage.setItem('pwaLastPrompt', Date.now());
    }

    hidePrompt() {
        this.prompt.classList.remove('show');
    }

    checkAndShow() {
        if (localStorage.getItem('pwaInstalled')) return;
        
        this.showCount = parseInt(localStorage.getItem('pwaPromptCount') || 0);
        const lastPrompt = parseInt(localStorage.getItem('pwaLastPrompt') || 0);
        const daysSinceLastPrompt = (Date.now() - lastPrompt) / (1000 * 60 * 60 * 24);

        if (this.showCount < this.maxPrompts && daysSinceLastPrompt >= this.daysToWait) {
            setTimeout(() => this.showPrompt(), 5000);
        }
    }
}

// Initialize only when DOM is ready
window.addEventListener('load', () => {
    const pwaPrompt = new PWAPrompt();
    pwaPrompt.init();
});

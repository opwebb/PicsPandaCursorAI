let deferredPrompt;

const InstallPrompt = {
    init() {
        // Create install prompt element
        const promptEl = document.createElement('div');
        promptEl.className = 'install-prompt';
        promptEl.innerHTML = `
            <div class="install-prompt-content">
                <div class="install-prompt-header">
                    <img src="/images/picspanda-logo.svg" alt="PicsPanda Logo" width="32">
                    <h3>Install PicsPanda</h3>
                    <button class="install-prompt-close">&times;</button>
                </div>
                <p>Install PicsPanda for quick access to all tools, even offline!</p>
                <div class="install-prompt-actions">
                    <button class="install-btn">Install</button>
                    <button class="later-btn">Maybe Later</button>
                </div>
            </div>
        `;
        document.body.appendChild(promptEl);

        // Add event listeners
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            // Show prompt after 5 seconds
            setTimeout(() => this.showPrompt(), 5000);
        });

        // Handle close button
        promptEl.querySelector('.install-prompt-close').addEventListener('click', () => {
            this.hidePrompt();
            localStorage.setItem('installPromptDismissed', Date.now());
        });

        // Handle install button
        promptEl.querySelector('.install-btn').addEventListener('click', () => {
            this.hidePrompt();
            this.installPWA();
        });

        // Handle later button
        promptEl.querySelector('.later-btn').addEventListener('click', () => {
            this.hidePrompt();
            localStorage.setItem('installPromptDismissed', Date.now());
        });
    },

    showPrompt() {
        // Check if prompt was dismissed in last 7 days
        const lastDismissed = localStorage.getItem('installPromptDismissed');
        if (lastDismissed && Date.now() - lastDismissed < 7 * 24 * 60 * 60 * 1000) {
            return;
        }
        document.querySelector('.install-prompt').classList.add('show');
    },

    hidePrompt() {
        document.querySelector('.install-prompt').classList.remove('show');
    },

    async installPWA() {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        if (result.outcome === 'accepted') {
            console.log('PWA installed');
        }
        deferredPrompt = null;
    }
};

// Initialize install prompt
document.addEventListener('DOMContentLoaded', () => InstallPrompt.init());

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
                
                // Check for updates
                if (registration.waiting) {
                    // New version available
                    if (confirm('New version available! Would you like to update?')) {
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                }
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });

    // Handle service worker updates
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            window.location.reload();
            refreshing = true;
        }
    });
}

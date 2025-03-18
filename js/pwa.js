if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { 
      scope: '.',
      updateViaCache: 'none'
    })
    .then(registration => {
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available
            if (confirm('New version available! Would you like to update?')) {
              window.location.reload();
            }
          }
        });
      });
      console.log('ServiceWorker registration successful');
    })
    .catch(err => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

// Handle service worker updates
let refreshing = false;
navigator.serviceWorker.addEventListener('controllerchange', () => {
  if (!refreshing) {
    window.location.reload();
    refreshing = true;
  }
});

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const processBtn = document.getElementById('process-btn');
    const results = document.getElementById('results');
    
    let files = [];

    // File upload handling
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
    
    const debouncedHandleFiles = debounce((files) => {
        handleFiles(files);
    }, 100);

    fileInput.addEventListener('change', (e) => {
        debouncedHandleFiles(e.target.files);
    }, { passive: true });

    function handleFiles(fileList) {
        for (let file of fileList) {
            if (file.type === 'application/pdf') {
                addFileToList(file);
            } else {
                showError('Only PDF files are supported');
            }
        }
        updateUI();
    }

    function addFileToList(file) {
        const fileId = `file-${Date.now()}`;
        files.push({ id: fileId, file: file });
        
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item file-item-new';
        fileItem.innerHTML = `
            <div class="file-info">
                <i class="fas fa-file-pdf file-icon"></i>
                <div>
                    <div class="file-name">${file.name}</div>
                    <div class="file-meta">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <button class="file-remove" data-id="${fileId}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        fileList.appendChild(fileItem);
        
        fileItem.querySelector('.file-remove').addEventListener('click', () => {
            files = files.filter(f => f.id !== fileId);
            fileItem.remove();
            updateUI();
        });
    }

    function updateProcessButton() {
        processBtn.disabled = files.length === 0;
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function showError(message) {
        const error = document.createElement('div');
        error.className = 'error-message';
        error.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        `;
        fileList.insertBefore(error, fileList.firstChild);
        setTimeout(() => error.remove(), 5000);
    }

    // Quality controls
    const imageQualityInput = document.getElementById('image-quality');
    const imageQualityValue = document.getElementById('image-quality-value');
    const compressionLevel = document.getElementById('compression-level');
    
    if (imageQualityInput && imageQualityValue) {
        imageQualityInput.addEventListener('input', (e) => {
            imageQualityValue.textContent = e.target.value;
        });
    }

    // Compression mode toggle
    const cachedElements = {
        compressionMode: document.getElementById('compression-mode'),
        qualityControls: document.getElementById('quality-controls'),
        sizeControls: document.getElementById('size-controls'),
        imageQuality: document.getElementById('image-quality'),
        compressionLevel: document.getElementById('compression-level'),
        targetSize: document.getElementById('target-size'),
        removeMetadata: document.getElementById('remove-metadata')
    };

    if (cachedElements.compressionMode) {
        cachedElements.compressionMode.addEventListener('change', (e) => {
            if (e.target.value === 'quality') {
                cachedElements.qualityControls.style.display = 'block';
                cachedElements.sizeControls.style.display = 'none';
            } else {
                cachedElements.qualityControls.style.display = 'none';
                cachedElements.sizeControls.style.display = 'block';
            }
        });
    }

    // Add metadata button toggle functionality
    const metadataBtn = document.getElementById('remove-metadata');
    if (metadataBtn) {
        metadataBtn.addEventListener('click', () => {
            metadataBtn.classList.toggle('active');
        });
    }

    // Process button click handler
    processBtn.addEventListener('click', async () => {
        const mode = cachedElements.compressionMode.value;
        const quality = mode === 'quality' ? cachedElements.imageQuality.value : null;
        const targetSize = mode === 'size' ? cachedElements.targetSize.value : null;
        const level = cachedElements.compressionLevel.value;
        const removeMetadata = cachedElements.removeMetadata.checked;

        processBtn.disabled = true;
        processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        try {
            for (const fileData of files) {
                // Calculate compression ratio based on mode
                const compressionRatio = calculateCompression(fileData.file, {
                    mode,
                    quality,
                    level,
                    targetSize,
                    removeMetadata
                });

                const finalSize = Math.round(fileData.file.size * compressionRatio);
                await simulateProcessing(fileData.file);

                // Add result item
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                resultItem.innerHTML = `
                    <div class="result-info">
                        <i class="fas fa-file-pdf file-icon"></i>
                        <div>
                            <div class="result-name">${fileData.file.name}</div>
                            <div class="result-meta">
                                Original: ${formatFileSize(fileData.file.size)}
                                <br>Compressed: ${formatFileSize(finalSize)}
                                ${removeMetadata ? '<br>✓ Metadata removed' : ''}
                                <br>Reduction: ${Math.round((1 - compressionRatio) * 100)}%
                            </div>
                        </div>
                    </div>
                    <div class="result-actions">
                        <button class="download-btn" data-filename="${fileData.file.name}">
                            <i class="fas fa-download"></i>
                            <span>Download</span>
                        </button>
                    </div>
                `;

                // Add download handler
                const downloadBtn = resultItem.querySelector('.download-btn');
                downloadBtn.addEventListener('click', () => {
                    downloadCompressedFile(fileData.file, finalSize);
                });

                results.appendChild(resultItem);
            }
        } catch (error) {
            showError('Error processing files: ' + error.message);
        } finally {
            processBtn.disabled = false;
            processBtn.innerHTML = 'Compress PDF';
            files = [];
            fileList.innerHTML = '';
            updateUI();
        }
    });

    // Enhanced compression calculation
    function calculateCompression(file, options) {
        const { mode, quality, level, targetSize, removeMetadata } = options;
        let ratio;

        if (mode === 'size') {
            // Size-based compression
            ratio = Math.min(1, (targetSize * 1024) / file.size);
        } else {
            // Quality-based compression
            const qualityFactor = quality / 100;
            const levelFactors = {
                'low': 0.9,
                'medium': 0.7,
                'high': 0.5,
                'very-high': 0.3
            };
            ratio = levelFactors[level] + (qualityFactor * 0.3);
        }

        // Additional reduction if metadata removal is selected
        if (removeMetadata) {
            ratio *= 0.95;
        }

        // Ensure ratio stays between 0.1 and 1
        return Math.max(0.1, Math.min(1, ratio));
    }

    // Download handler
    function downloadCompressedFile(originalFile, finalSize) {
        // Create a mock compressed file for demonstration
        const blob = new Blob([originalFile], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compressed_${originalFile.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Helper function to calculate compression ratio
    function getCompressionRatio(level, imageQuality) {
        const baseRatios = {
            'low': 0.9,
            'medium': 0.7,
            'high': 0.5,
            'very-high': 0.3
        };

        // Adjust ratio based on image quality
        const imageQualityFactor = imageQuality / 100;
        const baseRatio = baseRatios[level];
        return baseRatio + (imageQualityFactor * 0.3); // Allow up to 30% quality boost
    }

    // Enhanced simulation function
    function simulateProcessing(file, options) {
        return new Promise(resolve => {
            console.log('Processing with options:', options);
            setTimeout(resolve, 2000);
        });
    }

    // Use requestAnimationFrame for UI updates
    function updateUI() {
        requestAnimationFrame(() => {
            updateProcessButton();
        });
    }
});

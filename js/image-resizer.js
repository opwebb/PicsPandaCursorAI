/**
 * Image Resizer Tool - PicsPanda
 * This file handles all functionality specific to the image resizer tool
 */

// Global variables
let uploadedFiles = [];
let currentPreviewFile = null;
let originalImage = null;
let previewCanvas = null;
let previewContext = null;
let processingInProgress = false;
let aspectRatio = null;
let aspectRatioLocked = true;

// DOM elements
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the tool
    initImageResizer();
    
    // Add modal styles if not already in the document
    if (!document.getElementById('modal-styles')) {
        const modalStyles = document.createElement('style');
        modalStyles.id = 'modal-styles';
        modalStyles.textContent = `
            .modal {
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                overflow: auto;
                background-color: rgba(0, 0, 0, 0.7);
            }
            
            .modal-content {
                background-color: #fff;
                margin: 5% auto;
                padding: 20px;
                border-radius: 8px;
                max-width: 90%;
                max-height: 90%;
                overflow: auto;
                position: relative;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            }
            
            .modal-close {
                position: absolute;
                top: 10px;
                right: 15px;
                color: #aaa;
                font-size: 24px;
                font-weight: bold;
                cursor: pointer;
            }
            
            .modal-close:hover {
                color: #333;
            }
            
            .modal-body {
                margin-top: 15px;
                text-align: center;
            }
            
            .modal-body img {
                max-width: 100%;
                max-height: 70vh;
                border-radius: 4px;
            }
            
            #notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .notification {
                background-color: white;
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-width: 300px;
                max-width: 400px;
                animation: slide-in 0.3s ease-out;
            }
            
            .notification.info {
                border-left: 4px solid #3498db;
            }
            
            .notification.success {
                border-left: 4px solid #2ecc71;
            }
            
            .notification.warning {
                border-left: 4px solid #f39c12;
            }
            
            .notification.error {
                border-left: 4px solid #e74c3c;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .notification-content i {
                font-size: 18px;
            }
            
            .notification-content span {
                font-size: 14px;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: #999;
                cursor: pointer;
                font-size: 14px;
                padding: 5px;
            }
            
            .notification-close:hover {
                color: #333;
            }
            
            .notification.fade-out {
                opacity: 0;
                transform: translateX(30px);
                transition: opacity 0.3s, transform 0.3s;
            }
            
            @keyframes slide-in {
                from {
                    opacity: 0;
                    transform: translateX(30px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
        `;
        document.head.appendChild(modalStyles);
    }
});

/**
 * Initialize the image resizer tool
 */
function initImageResizer() {
    console.log('Initializing Image Resizer Tool');
    
    // Get DOM elements
    const fileInput = document.getElementById('file-input');
    const uploadArea = document.getElementById('upload-area');
    const fileList = document.getElementById('file-list');
    const processBtn = document.getElementById('process-btn');
    const resizeMethod = document.getElementById('resize-method');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const percentageInput = document.getElementById('percentage');
    const maintainAspectRatio = document.getElementById('maintain-aspect-ratio');
    const dimensionsGroup = document.getElementById('dimensions-group');
    const percentageGroup = document.getElementById('percentage-group');
    
    // Set up event listeners
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    if (uploadArea) {
        // Click on upload area to trigger file input
        uploadArea.addEventListener('click', function(e) {
            if (e.target.closest('.upload-btn') || e.target === uploadArea) {
                fileInput.click();
            }
        });
        
        // Drag and drop functionality
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', function() {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            if (e.dataTransfer.files.length > 0) {
                handleFiles(e.dataTransfer.files);
            }
        });
    }
    
    // Process button click
    if (processBtn) {
        processBtn.addEventListener('click', processFiles);
    }
    
    // Resize method change
    if (resizeMethod) {
        resizeMethod.addEventListener('change', function() {
            if (resizeMethod.value === 'dimensions') {
                dimensionsGroup.style.display = 'block';
                percentageGroup.style.display = 'none';
            } else {
                dimensionsGroup.style.display = 'none';
                percentageGroup.style.display = 'block';
            }
            updatePreview();
        });
    }
    
    // Width input change
    if (widthInput) {
        widthInput.addEventListener('input', function() {
            if (aspectRatioLocked && aspectRatio && currentPreviewFile) {
                heightInput.value = Math.round(widthInput.value / aspectRatio);
            }
            updatePreview();
        });
    }
    
    // Height input change
    if (heightInput) {
        heightInput.addEventListener('input', function() {
            if (aspectRatioLocked && aspectRatio && currentPreviewFile) {
                widthInput.value = Math.round(heightInput.value * aspectRatio);
            }
            updatePreview();
        });
    }
    
    // Percentage input change
    if (percentageInput) {
        percentageInput.addEventListener('input', updatePreview);
    }
    
    // Maintain aspect ratio change
    if (maintainAspectRatio) {
        maintainAspectRatio.addEventListener('change', function() {
            aspectRatioLocked = maintainAspectRatio.checked;
            updatePreview();
        });
    }
    
    // Create preview container
    createPreviewContainer();
}

/**
 * Handle file selection from input
 */
function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        handleFiles(e.target.files);
    }
}

/**
 * Handle files from input or drop
 */
function handleFiles(files) {
    const fileList = document.getElementById('file-list');
    const processBtn = document.getElementById('process-btn');
    const uploadArea = document.getElementById('upload-area');
    
    // Show file list
    if (fileList) {
        fileList.style.display = 'block';
    }
    
    // Enable process button
    if (processBtn) {
        processBtn.disabled = false;
    }
    
    // Process each file
    Array.from(files).forEach(file => {
        // Check if file is an image
        if (!file.type.match('image.*')) {
            showNotification('Only image files are supported', 'error');
            return;
        }
        
        // Check if file is already in the list
        const fileExists = uploadedFiles.some(f => f.name === file.name && f.size === file.size);
        if (fileExists) {
            showNotification(`File "${file.name}" is already added`, 'warning');
            return;
        }
        
        // Add file to array
        const fileObj = {
            file: file,
            id: generateUniqueId(),
            preview: null
        };
        uploadedFiles.push(fileObj);
        
        // Create file item in the list
        createFileItem(fileObj);
        
        // Generate preview
        generatePreview(fileObj);
    });
    
    // Set first file as current preview
    if (uploadedFiles.length > 0 && !currentPreviewFile) {
        setCurrentPreviewFile(uploadedFiles[0]);
    }
}

/**
 * Create file item in the list
 */
function createFileItem(fileObj) {
    const fileList = document.getElementById('file-list');
    if (!fileList) return;
    
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.dataset.id = fileObj.id;
    fileItem.innerHTML = `
        <div class="file-thumbnail"></div>
        <div class="file-info">
            <div class="file-name">${fileObj.file.name}</div>
            <div class="file-meta">${formatFileSize(fileObj.file.size)}</div>
        </div>
        <button class="file-remove" title="Remove file">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add click event to select file
    fileItem.addEventListener('click', function(e) {
        if (!e.target.closest('.file-remove')) {
            const fileItems = document.querySelectorAll('.file-item');
            fileItems.forEach(item => item.classList.remove('selected'));
            fileItem.classList.add('selected');
            
            const selectedFile = uploadedFiles.find(f => f.id === fileObj.id);
            if (selectedFile) {
                setCurrentPreviewFile(selectedFile);
            }
        }
    });
    
    // Add click event to remove button
    const removeBtn = fileItem.querySelector('.file-remove');
    if (removeBtn) {
        removeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            removeFile(fileObj.id);
        });
    }
    
    fileList.appendChild(fileItem);
}

/**
 * Generate preview for file
 */
function generatePreview(fileObj) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Create thumbnail
            const fileItem = document.querySelector(`.file-item[data-id="${fileObj.id}"]`);
            if (fileItem) {
                const thumbnail = fileItem.querySelector('.file-thumbnail');
                if (thumbnail) {
                    thumbnail.style.backgroundImage = `url(${e.target.result})`;
                }
            }
            
            // Store preview
            fileObj.preview = e.target.result;
            fileObj.width = img.width;
            fileObj.height = img.height;
            
            // Update preview if this is the current file
            if (currentPreviewFile && currentPreviewFile.id === fileObj.id) {
                updatePreview();
            }
        };
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(fileObj.file);
}

/**
 * Set current preview file
 */
function setCurrentPreviewFile(fileObj) {
    currentPreviewFile = fileObj;
    
    // Calculate aspect ratio
    if (fileObj.width && fileObj.height) {
        aspectRatio = fileObj.width / fileObj.height;
    }
    
    // Update preview
    updatePreview();
    
    // Update file list selection
    const fileItems = document.querySelectorAll('.file-item');
    fileItems.forEach(item => {
        if (item.dataset.id === fileObj.id) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

/**
 * Remove file from list
 */
function removeFile(fileId) {
    // Remove from array
    const fileIndex = uploadedFiles.findIndex(f => f.id === fileId);
    if (fileIndex !== -1) {
        uploadedFiles.splice(fileIndex, 1);
    }
    
    // Remove from DOM
    const fileItem = document.querySelector(`.file-item[data-id="${fileId}"]`);
    if (fileItem) {
        fileItem.remove();
    }
    
    // Update current preview file if needed
    if (currentPreviewFile && currentPreviewFile.id === fileId) {
        if (uploadedFiles.length > 0) {
            setCurrentPreviewFile(uploadedFiles[0]);
        } else {
            currentPreviewFile = null;
            clearPreview();
            
            // Hide file list if no files
            const fileList = document.getElementById('file-list');
            const processBtn = document.getElementById('process-btn');
            
            if (fileList) {
                fileList.style.display = 'none';
            }
            
            if (processBtn) {
                processBtn.disabled = true;
            }
        }
    }
}

/**
 * Create preview container
 */
function createPreviewContainer() {
    const toolOptions = document.getElementById('tool-options');
    if (!toolOptions) return;
    
    const previewContainer = document.createElement('div');
    previewContainer.className = 'preview-container';
    previewContainer.style.display = 'none';
    previewContainer.innerHTML = `
        <h3>Preview</h3>
        <div class="preview-comparison">
            <div class="preview-original">
                <h4>Original</h4>
                <div id="original-preview"></div>
                <div class="file-meta" id="original-meta"></div>
            </div>
            <div class="preview-processed">
                <h4>Resized</h4>
                <div id="processed-preview"></div>
                <div class="file-meta" id="processed-meta"></div>
            </div>
        </div>
    `;
    
    toolOptions.parentNode.insertBefore(previewContainer, toolOptions.nextSibling);
}

/**
 * Update preview with current settings
 */
function updatePreview() {
    if (!currentPreviewFile || !currentPreviewFile.preview) return;
    
    const previewContainer = document.querySelector('.preview-container');
    if (!previewContainer) return;
    
    // Show preview container
    previewContainer.style.display = 'block';
    
    // Get preview elements
    const originalPreview = document.getElementById('original-preview');
    const processedPreview = document.getElementById('processed-preview');
    const originalMeta = document.getElementById('original-meta');
    const processedMeta = document.getElementById('processed-meta');
    
    if (!originalPreview || !processedPreview || !originalMeta || !processedMeta) return;
    
    // Set original preview
    originalPreview.style.backgroundImage = `url(${currentPreviewFile.preview})`;
    originalMeta.textContent = `${currentPreviewFile.width} × ${currentPreviewFile.height} px`;
    
    // Create processed preview
    const img = new Image();
    img.onload = function() {
        // Get resize settings
        const resizeMethod = document.getElementById('resize-method').value;
        let newWidth, newHeight;
        
        if (resizeMethod === 'dimensions') {
            newWidth = parseInt(document.getElementById('width').value) || currentPreviewFile.width;
            newHeight = parseInt(document.getElementById('height').value) || currentPreviewFile.height;
        } else {
            const percentage = parseInt(document.getElementById('percentage').value) || 100;
            newWidth = Math.round(currentPreviewFile.width * percentage / 100);
            newHeight = Math.round(currentPreviewFile.height * percentage / 100);
        }
        
        // Create canvas for preview
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        // Set processed preview
        processedPreview.style.backgroundImage = `url(${canvas.toDataURL('image/png')})`;
        processedMeta.textContent = `${newWidth} × ${newHeight} px`;
    };
    img.src = currentPreviewFile.preview;
}

/**
 * Clear preview
 */
function clearPreview() {
    const previewContainer = document.querySelector('.preview-container');
    if (previewContainer) {
        previewContainer.style.display = 'none';
    }
    
    const originalPreview = document.getElementById('original-preview');
    const processedPreview = document.getElementById('processed-preview');
    const originalMeta = document.getElementById('original-meta');
    const processedMeta = document.getElementById('processed-meta');
    
    if (originalPreview) originalPreview.style.backgroundImage = '';
    if (processedPreview) processedPreview.style.backgroundImage = '';
    if (originalMeta) originalMeta.textContent = '';
    if (processedMeta) processedMeta.textContent = '';
}

/**
 * Process files with current settings
 */
function processFiles() {
    if (uploadedFiles.length === 0 || processingInProgress) return;
    
    processingInProgress = true;
    const processBtn = document.getElementById('process-btn');
    if (processBtn) {
        processBtn.disabled = true;
        processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }
    
    // Get resize settings
    const resizeMethod = document.getElementById('resize-method').value;
    const maintainAspectRatio = document.getElementById('maintain-aspect-ratio').checked;
    
    // Create results container if not exists
    let resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) {
        const results = document.getElementById('results');
        if (results) {
            results.innerHTML = '<h3>Resized Images</h3><div id="results-container" class="results-container"></div>';
            resultsContainer = document.getElementById('results-container');
        }
    }
    
    // Process each file
    let processedCount = 0;
    
    uploadedFiles.forEach(fileObj => {
        const img = new Image();
        img.onload = function() {
            // Calculate new dimensions
            let newWidth, newHeight;
            
            if (resizeMethod === 'dimensions') {
                newWidth = parseInt(document.getElementById('width').value) || img.width;
                newHeight = parseInt(document.getElementById('height').value) || img.height;
                
                if (maintainAspectRatio) {
                    const ratio = img.width / img.height;
                    if (newWidth && !newHeight) {
                        newHeight = Math.round(newWidth / ratio);
                    } else if (!newWidth && newHeight) {
                        newWidth = Math.round(newHeight * ratio);
                    }
                }
            } else {
                const percentage = parseInt(document.getElementById('percentage').value) || 100;
                newWidth = Math.round(img.width * percentage / 100);
                newHeight = Math.round(img.height * percentage / 100);
            }
            
            // Create canvas for resizing
            const canvas = document.createElement('canvas');
            canvas.width = newWidth;
            canvas.height = newHeight;
            const ctx = canvas.getContext('2d');
            
            // Draw resized image
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
            
            // Get resized image data
            const resizedImageData = canvas.toDataURL(fileObj.file.type || 'image/png');
            
            // Create result item
            createResultItem(fileObj, resizedImageData, newWidth, newHeight);
            
            // Update processed count
            processedCount++;
            
            // Check if all files are processed
            if (processedCount === uploadedFiles.length) {
                processingInProgress = false;
                if (processBtn) {
                    processBtn.disabled = false;
                    processBtn.innerHTML = 'Resize Images';
                }
                
                // Scroll to results
                const results = document.getElementById('results');
                if (results) {
                    results.scrollIntoView({ behavior: 'smooth' });
                }
            }
        };
        img.src = fileObj.preview;
    });
}

/**
 * Create result item
 */
function createResultItem(fileObj, resizedImageData, width, height) {
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) return;
    
    // Create result item
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    resultItem.innerHTML = `
        <div class="result-thumbnail">
            <img src="${resizedImageData}" alt="${fileObj.file.name}">
        </div>
        <div class="result-info">
            <div class="result-name">${fileObj.file.name}</div>
            <div class="result-meta">
                ${width} × ${height} px<br>
                ${formatFileSize(estimateFileSize(resizedImageData))}
            </div>
            <div class="result-actions">
                <button class="download-btn">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="preview-btn">
                    <i class="fas fa-eye"></i> Preview
                </button>
            </div>
        </div>
    `;
    
    // Add download event
    const downloadBtn = resultItem.querySelector('.download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            downloadImage(resizedImageData, fileObj.file.name);
        });
    }
    
    // Add preview event
    const previewBtn = resultItem.querySelector('.preview-btn');
    if (previewBtn) {
        previewBtn.addEventListener('click', function() {
            previewImage(resizedImageData, fileObj.file.name);
        });
    }
    
    resultsContainer.appendChild(resultItem);
}

/**
 * Download image
 */
function downloadImage(dataUrl, fileName) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = getResizedFileName(fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Preview image in modal
 */
function previewImage(dataUrl, fileName) {
    // Create modal if not exists
    let modal = document.getElementById('preview-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'preview-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="modal-close">&times;</span>
                <h3 id="modal-title"></h3>
                <div class="modal-body">
                    <img id="modal-image" src="" alt="">
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add close event
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                modal.style.display = 'none';
            });
        }
        
        // Close when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // Set modal content
    const modalTitle = document.getElementById('modal-title');
    const modalImage = document.getElementById('modal-image');
    
    if (modalTitle) modalTitle.textContent = fileName;
    if (modalImage) modalImage.src = dataUrl;
    
    // Show modal
    modal.style.display = 'block';
}

/**
 * Get resized file name
 */
function getResizedFileName(fileName) {
    const dotIndex = fileName.lastIndexOf('.');
    if (dotIndex === -1) return `${fileName}-resized`;
    
    const name = fileName.substring(0, dotIndex);
    const ext = fileName.substring(dotIndex);
    
    return `${name}-resized${ext}`;
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Estimate file size from data URL
 */
function estimateFileSize(dataUrl) {
    // Remove metadata from data URL
    const base64 = dataUrl.split(',')[1];
    const bytes = atob(base64).length;
    
    return bytes;
}

/**
 * Generate unique ID
 */
function generateUniqueId() {
    return 'id-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    // Create notification container if not exists
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add close event
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            notification.remove();
        });
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
    
    notificationContainer.appendChild(notification);
}

/**
 * Get notification icon based on type
 */
function getNotificationIcon(type) {
    switch (type) {
        case 'success':
            return 'fa-check-circle';
        case 'error':
            return 'fa-exclamation-circle';
        case 'warning':
            return 'fa-exclamation-triangle';
        default:
            return 'fa-info-circle';
    }
} 
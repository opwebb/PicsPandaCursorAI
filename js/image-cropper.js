/**
 * Image Cropper Tool - PicsPanda
 * This file handles all functionality specific to the image cropper tool
 */

// Global variables
let uploadedFiles = [];
let currentPreviewFile = null;
let cropper = null;
let processingInProgress = false;

// DOM elements
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the tool
    initImageCropper();
    
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
    
    // Load Cropper.js if not already loaded
    if (typeof Cropper === 'undefined') {
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.js', function() {
            // Load Cropper.js CSS
            if (!document.querySelector('link[href*="cropper.min.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.css';
                document.head.appendChild(link);
            }
        });
    }
});

/**
 * Load external script
 */
function loadScript(src, callback) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = callback;
    document.head.appendChild(script);
}

/**
 * Initialize the image cropper tool
 */
function initImageCropper() {
    console.log('Initializing Image Cropper Tool');
    
    // Get DOM elements
    const fileInput = document.getElementById('file-input');
    const uploadArea = document.getElementById('upload-area');
    const fileList = document.getElementById('file-list');
    const processBtn = document.getElementById('process-btn');
    
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
                initCropper();
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
    // Destroy previous cropper if exists
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    
    currentPreviewFile = fileObj;
    
    // Update file list selection
    const fileItems = document.querySelectorAll('.file-item');
    fileItems.forEach(item => {
        if (item.dataset.id === fileObj.id) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
    
    // Initialize cropper
    initCropper();
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
            
            // Destroy cropper if exists
            if (cropper) {
                cropper.destroy();
                cropper = null;
            }
            
            // Remove cropper container
            const cropperContainer = document.querySelector('.cropper-container');
            if (cropperContainer) {
                cropperContainer.remove();
            }
            
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
 * Initialize cropper
 */
function initCropper() {
    if (!currentPreviewFile || !currentPreviewFile.preview) return;
    
    // Create cropper container if not exists
    let cropperContainer = document.querySelector('.cropper-container');
    if (!cropperContainer) {
        cropperContainer = document.createElement('div');
        cropperContainer.className = 'cropper-container';
        
        // Add container to DOM
        const toolOptions = document.getElementById('tool-options');
        if (toolOptions) {
            toolOptions.parentNode.insertBefore(cropperContainer, toolOptions.nextSibling);
        }
    }
    
    // Set container content
    cropperContainer.innerHTML = `
        <h3>Crop Image</h3>
        <div class="cropper-wrapper">
            <div class="cropper-preview">
                <img id="crop-image" src="${currentPreviewFile.preview}" alt="${currentPreviewFile.file.name}">
            </div>
        </div>
        <div class="crop-controls">
            <div class="crop-control-group">
                <h4>Aspect Ratio</h4>
                <div class="crop-aspect-ratios">
                    <div class="crop-aspect-ratio active" data-ratio="free" title="Free form cropping">
                        <i class="fas fa-crop-alt"></i> Free
                    </div>
                    <div class="crop-aspect-ratio" data-ratio="1:1" title="Square - perfect for profile pictures">
                        <i class="fas fa-square"></i> 1:1
                    </div>
                    <div class="crop-aspect-ratio" data-ratio="4:3" title="Classic photo ratio">
                        <i class="fas fa-tv"></i> 4:3
                    </div>
                    <div class="crop-aspect-ratio" data-ratio="16:9" title="Widescreen - perfect for videos">
                        <i class="fas fa-film"></i> 16:9
                    </div>
                    <div class="crop-aspect-ratio" data-ratio="3:2" title="Classic DSLR photo ratio">
                        <i class="fas fa-camera"></i> 3:2
                    </div>
                    <div class="crop-aspect-ratio" data-ratio="2:3" title="Portrait orientation">
                        <i class="fas fa-mobile-alt"></i> 2:3
                    </div>
                </div>
            </div>
            <div class="crop-control-group">
                <h4>Actions</h4>
                <div class="crop-actions">
                    <button class="crop-action-btn" id="rotate-left" title="Rotate 90° counter-clockwise">
                        <i class="fas fa-undo"></i> Rotate Left
                    </button>
                    <button class="crop-action-btn" id="rotate-right" title="Rotate 90° clockwise">
                        <i class="fas fa-redo"></i> Rotate Right
                    </button>
                    <button class="crop-action-btn" id="flip-horizontal" title="Flip horizontally">
                        <i class="fas fa-arrows-alt-h"></i> Flip H
                    </button>
                    <button class="crop-action-btn" id="flip-vertical" title="Flip vertically">
                        <i class="fas fa-arrows-alt-v"></i> Flip V
                    </button>
                    <button class="crop-action-btn danger" id="reset-crop" title="Reset all changes">
                        <i class="fas fa-sync"></i> Reset
                    </button>
                    <button class="crop-action-btn primary" id="apply-crop" title="Apply current crop">
                        <i class="fas fa-check"></i> Apply Crop
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Initialize cropper
    const image = document.getElementById('crop-image');
    if (image) {
        // Wait for Cropper.js to load
        const initCropperInterval = setInterval(function() {
            if (typeof Cropper !== 'undefined') {
                clearInterval(initCropperInterval);
                
                // Initialize cropper
                cropper = new Cropper(image, {
                    viewMode: 1,
                    dragMode: 'move',
                    aspectRatio: NaN,
                    autoCropArea: 0.8,
                    restore: false,
                    guides: true,
                    center: true,
                    highlight: false,
                    cropBoxMovable: true,
                    cropBoxResizable: true,
                    toggleDragModeOnDblclick: true,
                    ready: function() {
                        // Add animation class to aspect ratio buttons
                        setTimeout(() => {
                            const aspectRatioButtons = document.querySelectorAll('.crop-aspect-ratio');
                            aspectRatioButtons.forEach((btn, index) => {
                                setTimeout(() => {
                                    btn.classList.add('animated');
                                }, index * 50);
                            });
                        }, 300);
                    }
                });
                
                // Add event listeners for crop controls
                setupCropControls();
            }
        }, 100);
    }
}

/**
 * Setup crop controls
 */
function setupCropControls() {
    // Aspect ratio buttons
    const aspectRatioButtons = document.querySelectorAll('.crop-aspect-ratio');
    aspectRatioButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            aspectRatioButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Set aspect ratio
            const ratio = button.dataset.ratio;
            if (ratio === 'free') {
                cropper.setAspectRatio(NaN);
                showNotification('Free form cropping enabled', 'info');
            } else {
                const [width, height] = ratio.split(':');
                cropper.setAspectRatio(parseInt(width) / parseInt(height));
                showNotification(`Aspect ratio set to ${ratio}`, 'info');
            }
        });
    });
    
    // Rotate left button
    const rotateLeftBtn = document.getElementById('rotate-left');
    if (rotateLeftBtn) {
        rotateLeftBtn.addEventListener('click', function() {
            cropper.rotate(-90);
            showNotification('Image rotated 90° counter-clockwise', 'info');
            
            // Add animation class
            rotateLeftBtn.classList.add('clicked');
            setTimeout(() => {
                rotateLeftBtn.classList.remove('clicked');
            }, 300);
        });
    }
    
    // Rotate right button
    const rotateRightBtn = document.getElementById('rotate-right');
    if (rotateRightBtn) {
        rotateRightBtn.addEventListener('click', function() {
            cropper.rotate(90);
            showNotification('Image rotated 90° clockwise', 'info');
            
            // Add animation class
            rotateRightBtn.classList.add('clicked');
            setTimeout(() => {
                rotateRightBtn.classList.remove('clicked');
            }, 300);
        });
    }
    
    // Flip horizontal button
    const flipHorizontalBtn = document.getElementById('flip-horizontal');
    if (flipHorizontalBtn) {
        flipHorizontalBtn.addEventListener('click', function() {
            cropper.scaleX(cropper.getData().scaleX * -1);
            showNotification('Image flipped horizontally', 'info');
            
            // Add animation class
            flipHorizontalBtn.classList.add('clicked');
            setTimeout(() => {
                flipHorizontalBtn.classList.remove('clicked');
            }, 300);
        });
    }
    
    // Flip vertical button
    const flipVerticalBtn = document.getElementById('flip-vertical');
    if (flipVerticalBtn) {
        flipVerticalBtn.addEventListener('click', function() {
            cropper.scaleY(cropper.getData().scaleY * -1);
            showNotification('Image flipped vertically', 'info');
            
            // Add animation class
            flipVerticalBtn.classList.add('clicked');
            setTimeout(() => {
                flipVerticalBtn.classList.remove('clicked');
            }, 300);
        });
    }
    
    // Reset button
    const resetBtn = document.getElementById('reset-crop');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            cropper.reset();
            showNotification('Crop reset to original', 'info');
            
            // Reset aspect ratio
            const freeAspectRatio = document.querySelector('.crop-aspect-ratio[data-ratio="free"]');
            if (freeAspectRatio) {
                aspectRatioButtons.forEach(btn => btn.classList.remove('active'));
                freeAspectRatio.classList.add('active');
                cropper.setAspectRatio(NaN);
            }
            
            // Add animation class
            resetBtn.classList.add('clicked');
            setTimeout(() => {
                resetBtn.classList.remove('clicked');
            }, 300);
        });
    }
    
    // Apply crop button
    const applyCropBtn = document.getElementById('apply-crop');
    if (applyCropBtn) {
        applyCropBtn.addEventListener('click', function() {
            processFiles();
            
            // Add animation class
            applyCropBtn.classList.add('clicked');
            setTimeout(() => {
                applyCropBtn.classList.remove('clicked');
            }, 300);
        });
    }
    
    // Add CSS for button animations
    if (!document.getElementById('button-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'button-animation-styles';
        style.textContent = `
            .crop-aspect-ratio {
                opacity: 0;
                transform: translateY(10px);
                transition: opacity 0.3s ease, transform 0.3s ease, background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
            }
            
            .crop-aspect-ratio.animated {
                opacity: 1;
                transform: translateY(0);
            }
            
            .crop-action-btn.clicked {
                animation: button-pulse 0.3s ease;
            }
            
            @keyframes button-pulse {
                0% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(0.95);
                }
                100% {
                    transform: scale(1);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Process files with current settings
 */
function processFiles() {
    if (uploadedFiles.length === 0 || !cropper || processingInProgress) return;
    
    processingInProgress = true;
    const processBtn = document.getElementById('process-btn');
    if (processBtn) {
        processBtn.disabled = true;
        processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }
    
    // Create results container if not exists
    let resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) {
        const results = document.getElementById('results');
        if (results) {
            results.innerHTML = '<h3>Cropped Images</h3><div id="results-container" class="results-container"></div>';
            resultsContainer = document.getElementById('results-container');
        }
    }
    
    // Get cropped canvas
    const canvas = cropper.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
    });
    
    if (!canvas) {
        showNotification('Failed to crop image', 'error');
        processingInProgress = false;
        if (processBtn) {
            processBtn.disabled = false;
            processBtn.innerHTML = 'Crop Images';
        }
        return;
    }
    
    // Get cropped image data
    const croppedImageData = canvas.toDataURL(currentPreviewFile.file.type || 'image/png');
    
    // Create result item
    createResultItem(currentPreviewFile, croppedImageData, canvas.width, canvas.height);
    
    // Process complete
    processingInProgress = false;
    if (processBtn) {
        processBtn.disabled = false;
        processBtn.innerHTML = 'Crop Images';
    }
    
    // Scroll to results
    const results = document.getElementById('results');
    if (results) {
        results.scrollIntoView({ behavior: 'smooth' });
    }
    
    showNotification('Image cropped successfully', 'success');
}

/**
 * Create result item
 */
function createResultItem(fileObj, croppedImageData, width, height) {
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) return;
    
    // Create result item
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    resultItem.innerHTML = `
        <div class="result-thumbnail">
            <img src="${croppedImageData}" alt="${fileObj.file.name}">
        </div>
        <div class="result-info">
            <div class="result-name">${getCroppedFileName(fileObj.file.name)}</div>
            <div class="result-meta">
                ${width} × ${height} px<br>
                ${formatFileSize(estimateFileSize(croppedImageData))}
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
            downloadImage(croppedImageData, fileObj.file.name);
        });
    }
    
    // Add preview event
    const previewBtn = resultItem.querySelector('.preview-btn');
    if (previewBtn) {
        previewBtn.addEventListener('click', function() {
            previewImage(croppedImageData, fileObj.file.name);
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
    link.download = getCroppedFileName(fileName);
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
    
    if (modalTitle) modalTitle.textContent = getCroppedFileName(fileName);
    if (modalImage) modalImage.src = dataUrl;
    
    // Show modal
    modal.style.display = 'block';
}

/**
 * Get cropped file name
 */
function getCroppedFileName(fileName) {
    const dotIndex = fileName.lastIndexOf('.');
    if (dotIndex === -1) return `${fileName}-cropped`;
    
    const name = fileName.substring(0, dotIndex);
    const ext = fileName.substring(dotIndex);
    
    return `${name}-cropped${ext}`;
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
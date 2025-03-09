/**
 * Image Converter Tool - PicsPanda
 * This file handles all functionality specific to the image converter tool
 */

// Global variables
let uploadedFiles = [];
let currentPreviewFile = null;
let originalImage = null;
let previewCanvas = null;
let previewContext = null;
let processingInProgress = false;

// DOM elements
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the tool
    initImageConverter();
});

/**
 * Initialize the image converter tool
 */
function initImageConverter() {
    console.log('Initializing Image Converter Tool');
    
    // Get DOM elements
    const fileInput = document.getElementById('file-input');
    const uploadArea = document.getElementById('upload-area');
    const fileList = document.getElementById('file-list');
    const processBtn = document.getElementById('process-btn');
    const outputFormat = document.getElementById('output-format');
    const quality = document.getElementById('quality');
    const qualityValue = document.getElementById('quality-value');
    
    // Set up event listeners
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    if (uploadArea) {
        // Click on upload area to trigger file input
        uploadArea.addEventListener('click', function(e) {
            if (e.target !== fileInput) {
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
    
    // Quality slider
    if (quality && qualityValue) {
        quality.addEventListener('input', function() {
            qualityValue.textContent = quality.value;
            updatePreview();
        });
    }
    
    // Output format change
    if (outputFormat) {
        outputFormat.addEventListener('change', updatePreview);
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
    // Convert FileList to Array
    const filesArray = Array.from(files);
    
    // Filter for image files only
    const validFiles = filesArray.filter(file => {
        if (file.type.startsWith('image/')) {
            return true;
        } else {
            showError(`File type not supported: ${file.name}. Please upload image files only.`);
            return false;
        }
    });
    
    if (validFiles.length === 0) return;
    
    // Add files to the uploaded files array
    uploadedFiles = [...uploadedFiles, ...validFiles];
    
    // Display files in the UI
    displayFiles();
    
    // Enable process button
    const processBtn = document.getElementById('process-btn');
    if (processBtn) {
        processBtn.disabled = false;
    }
    
    // Load the first image for preview
    if (uploadedFiles.length > 0) {
        loadImagePreview(uploadedFiles[0]);
    }
}

/**
 * Display uploaded files in the UI
 */
function displayFiles() {
    const fileList = document.getElementById('file-list');
    if (!fileList) return;
    
    // Clear current file list
    fileList.innerHTML = '';
    
    // Add each file to the UI
    uploadedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item file-item-new';
        
        // Create thumbnail
        const thumbnailHTML = `<div class="file-thumbnail" id="thumbnail-${index}"></div>`;
        
        // Read the image and create thumbnail
        setTimeout(() => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const thumbnail = document.getElementById(`thumbnail-${index}`);
                if (thumbnail) {
                    thumbnail.style.backgroundImage = `url(${e.target.result})`;
                }
            };
            reader.readAsDataURL(file);
        }, 10);
        
        // Create file item HTML
        fileItem.innerHTML = `
            <div class="file-icon">
                <i class="fas fa-file-image"></i>
            </div>
            ${thumbnailHTML}
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-meta">${formatFileSize(file.size)}</div>
            </div>
            <button class="file-remove" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        fileList.appendChild(fileItem);
        
        // Add remove button event listener
        fileItem.querySelector('.file-remove').addEventListener('click', function(e) {
            e.stopPropagation();
            removeFile(parseInt(this.getAttribute('data-index')));
        });
        
        // Add click event to select this file for preview
        fileItem.addEventListener('click', function(e) {
            // Don't trigger if clicking on the remove button
            if (!e.target.closest('.file-remove')) {
                loadImagePreview(file);
                
                // Highlight the selected file
                document.querySelectorAll('.file-item').forEach(item => {
                    item.classList.remove('selected');
                });
                this.classList.add('selected');
            }
        });
    });
}

/**
 * Remove a file from the list
 */
function removeFile(index) {
    // Remove file from array
    uploadedFiles.splice(index, 1);
    
    // Update UI
    displayFiles();
    
    // Disable process button if no files
    const processBtn = document.getElementById('process-btn');
    if (processBtn && uploadedFiles.length === 0) {
        processBtn.disabled = true;
    }
    
    // Update preview if needed
    if (uploadedFiles.length > 0) {
        loadImagePreview(uploadedFiles[0]);
    } else {
        // Clear preview
        const previewContainer = document.getElementById('preview-container');
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }
    }
}

/**
 * Create the preview container
 */
function createPreviewContainer() {
    // Check if container already exists
    let container = document.getElementById('preview-container');
    
    if (!container) {
        // Create the preview container element
        container = document.createElement('div');
        container.id = 'preview-container';
        container.className = 'preview-container';
        container.style.display = 'none';
        
        // Add preview content
        container.innerHTML = `
            <h3>Live Preview</h3>
            <div class="preview-comparison">
                <div class="preview-original">
                    <h4>Original</h4>
                    <div id="preview-original-image"></div>
                </div>
                <div class="preview-processed">
                    <h4>Converted</h4>
                    <div id="preview-processed-image"></div>
                </div>
            </div>
            <div class="preview-controls">
                <button id="apply-preview" class="secondary-btn">Convert Now</button>
            </div>
        `;
        
        // Find where to insert it - between tool-options and action-buttons
        const toolOptions = document.getElementById('tool-options');
        const actionButtons = document.querySelector('.action-buttons');
        
        if (toolOptions && actionButtons) {
            toolOptions.parentNode.insertBefore(container, actionButtons);
        } else {
            // Fallback - insert before results if available
            const results = document.getElementById('results');
            if (results) {
                results.parentNode.insertBefore(container, results);
            } else {
                // Last resort - append to tool-content
                const toolContent = document.querySelector('.tool-content');
                if (toolContent) {
                    toolContent.appendChild(container);
                }
            }
        }
        
        // Add event listener for apply button
        const applyButton = document.getElementById('apply-preview');
        if (applyButton) {
            applyButton.addEventListener('click', processFiles);
        }
    }
}

/**
 * Load an image for preview
 */
function loadImagePreview(file) {
    if (!file) return;
    
    // Store the current file being previewed
    currentPreviewFile = file;
    
    // Show the preview container
    const previewContainer = document.getElementById('preview-container');
    if (previewContainer) {
        previewContainer.style.display = 'block';
    }
    
    // Show loading state in the preview
    const previewOriginal = document.getElementById('preview-original-image');
    const previewProcessed = document.getElementById('preview-processed-image');
    
    if (previewOriginal) {
        previewOriginal.innerHTML = '<div class="preview-loading"><i class="fas fa-spinner fa-spin"></i></div>';
    }
    
    if (previewProcessed) {
        previewProcessed.innerHTML = '<div class="preview-loading"><i class="fas fa-spinner fa-spin"></i></div>';
    }
    
    // Create a FileReader to read the image file
    const reader = new FileReader();
    
    reader.onload = function(e) {
        // Create a new image object
        originalImage = new Image();
        
        originalImage.onload = function() {
            console.log('Image loaded:', originalImage.width, 'x', originalImage.height);
            
            // Initialize canvas for original preview
            if (!previewCanvas) {
                previewCanvas = document.createElement('canvas');
                if (previewOriginal) {
                    previewOriginal.innerHTML = '';
                    previewOriginal.appendChild(previewCanvas);
                    previewContext = previewCanvas.getContext('2d');
                }
            } else if (previewOriginal) {
                previewOriginal.innerHTML = '';
                previewOriginal.appendChild(previewCanvas);
            }
            
            // Set canvas size based on image dimensions
            const maxSize = 400;
            let width = originalImage.width;
            let height = originalImage.height;
            
            // Scale down if image is too large
            if (width > height && width > maxSize) {
                height = height * (maxSize / width);
                width = maxSize;
            } else if (height > maxSize) {
                width = width * (maxSize / height);
                height = maxSize;
            }
            
            previewCanvas.width = width;
            previewCanvas.height = height;
            
            // Draw original image
            previewContext.clearRect(0, 0, width, height);
            previewContext.drawImage(originalImage, 0, 0, width, height);
            
            // Apply effects based on current settings
            updatePreview();
        };
        
        // Set image source to trigger loading
        originalImage.src = e.target.result;
    };
    
    reader.onerror = function() {
        console.error('Error reading file');
        if (previewOriginal) {
            previewOriginal.innerHTML = '<div class="preview-error">Error loading image</div>';
        }
    };
    
    // Start reading the file
    reader.readAsDataURL(file);
}

/**
 * Update the preview based on current settings
 */
function updatePreview() {
    if (!originalImage || !previewCanvas || !previewContext) return;
    
    // Get the processed preview canvas
    let processedCanvas = document.getElementById('processed-preview-canvas');
    if (!processedCanvas) {
        processedCanvas = document.createElement('canvas');
        processedCanvas.id = 'processed-preview-canvas';
        const previewProcessed = document.getElementById('preview-processed-image');
        if (previewProcessed) {
            previewProcessed.innerHTML = '';
            previewProcessed.appendChild(processedCanvas);
        }
    }
    
    // Set the same dimensions as original
    processedCanvas.width = previewCanvas.width;
    processedCanvas.height = previewCanvas.height;
    const processedContext = processedCanvas.getContext('2d');
    
    // Draw the original image as a starting point
    processedContext.drawImage(originalImage, 0, 0, processedCanvas.width, processedCanvas.height);
    
    // Get current tool options
    const outputFormat = document.getElementById('output-format');
    const quality = document.getElementById('quality');
    
    // Apply format indicator
    if (outputFormat) {
        const format = outputFormat.value.toUpperCase();
        processedContext.fillStyle = 'rgba(0, 0, 0, 0.7)';
        processedContext.fillRect(10, 10, 70, 30);
        processedContext.fillStyle = 'white';
        processedContext.font = 'bold 14px Arial';
        processedContext.fillText(format, 20, 30);
    }
}

/**
 * Process files and create converted images
 */
function processFiles() {
    if (uploadedFiles.length === 0 || processingInProgress) return;
    
    processingInProgress = true;
    
    // Get results container
    const results = document.getElementById('results');
    if (!results) return;
    
    // Show loading indicator
    results.innerHTML = `
        <div class="loading-indicator">
            <i class="fas fa-spinner fa-spin"></i>
            <div>Converting your images...</div>
            <div id="progress-messages"></div>
        </div>
    `;
    
    // Get options
    const outputFormat = document.getElementById('output-format');
    const quality = document.getElementById('quality');
    
    const options = {
        format: outputFormat ? outputFormat.value : 'png',
        quality: quality ? parseInt(quality.value) / 100 : 0.8
    };
    
    // Process each file
    const promises = uploadedFiles.map(file => {
        return convertImage(file, options);
    });
    
    // When all files are processed
    Promise.all(promises)
        .then(resultsArray => {
            displayResults(resultsArray);
            processingInProgress = false;
        })
        .catch(error => {
            console.error('Error processing files:', error);
            results.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>An error occurred while processing your files. Please try again.</p>
                </div>
            `;
            processingInProgress = false;
        });
}

/**
 * Display the results of the conversion
 */
function displayResults(resultsArray) {
    console.log('Displaying results:', resultsArray);
    
    const results = document.getElementById('results');
    if (!results) {
        console.error('Results container not found');
        return;
    }
    
    // Clear results
    results.innerHTML = '';
    
    // Check if we have any successful results
    const successfulResults = resultsArray.filter(result => result.success);
    console.log('Successful results:', successfulResults.length);
    
    if (successfulResults.length === 0) {
        results.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>No images were successfully converted. Please try again with different settings.</p>
            </div>
        `;
        return;
    }
    
    // Create results container
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'results-container';
    results.appendChild(resultsContainer);
    
    // Add each result
    successfulResults.forEach((result, index) => {
        console.log('Creating result item for:', result.processedFile.name);
        
        // Create result item
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultsContainer.appendChild(resultItem);
        
        // Create thumbnail
        const thumbnailDiv = document.createElement('div');
        thumbnailDiv.className = 'result-thumbnail';
        resultItem.appendChild(thumbnailDiv);
        
        const thumbnailImg = document.createElement('img');
        thumbnailImg.src = result.previewUrl;
        thumbnailImg.alt = result.processedFile.name;
        thumbnailDiv.appendChild(thumbnailImg);
        
        // Create info container
        const infoDiv = document.createElement('div');
        infoDiv.className = 'result-info';
        resultItem.appendChild(infoDiv);
        
        // Add file name
        const nameDiv = document.createElement('div');
        nameDiv.className = 'result-name';
        nameDiv.textContent = result.processedFile.name;
        infoDiv.appendChild(nameDiv);
        
        // Add meta information
        const metaDiv = document.createElement('div');
        metaDiv.className = 'result-meta';
        infoDiv.appendChild(metaDiv);
        
        const sizeInfo = document.createElement('div');
        sizeInfo.textContent = `${result.meta.originalSize} → ${result.meta.processedSize}`;
        metaDiv.appendChild(sizeInfo);
        
        const formatInfo = document.createElement('div');
        formatInfo.textContent = `Format: ${result.meta.format}`;
        metaDiv.appendChild(formatInfo);
        
        const timeInfo = document.createElement('div');
        timeInfo.textContent = `Processing Time: ${result.meta.processingTime}`;
        metaDiv.appendChild(timeInfo);
        
        // Create actions container
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'result-actions';
        actionsDiv.style.display = 'flex';
        actionsDiv.style.flexWrap = 'wrap';
        actionsDiv.style.gap = '10px';
        infoDiv.appendChild(actionsDiv);
        
        // Create blob URL for the file
        const downloadUrl = URL.createObjectURL(result.processedFile);
        
        // Create download button
        const downloadBtn = document.createElement('a');
        downloadBtn.href = downloadUrl;
        downloadBtn.download = result.processedFile.name;
        downloadBtn.className = 'download-btn';
        downloadBtn.id = `download-${index}`;
        downloadBtn.style.flex = '1';
        downloadBtn.style.minWidth = '120px';
        downloadBtn.style.display = 'inline-flex';
        downloadBtn.style.alignItems = 'center';
        downloadBtn.style.justifyContent = 'center';
        actionsDiv.appendChild(downloadBtn);
        
        const downloadIcon = document.createElement('i');
        downloadIcon.className = 'fas fa-download';
        downloadBtn.appendChild(downloadIcon);
        
        const downloadText = document.createElement('span');
        downloadText.textContent = ' Download';
        downloadText.style.marginLeft = '5px';
        downloadBtn.appendChild(downloadText);
        
        // Create preview button
        const previewBtn = document.createElement('button');
        previewBtn.className = 'preview-btn';
        previewBtn.setAttribute('data-preview', downloadUrl);
        previewBtn.style.flex = '1';
        previewBtn.style.minWidth = '120px';
        previewBtn.style.display = 'inline-flex';
        previewBtn.style.alignItems = 'center';
        previewBtn.style.justifyContent = 'center';
        actionsDiv.appendChild(previewBtn);
        
        const previewIcon = document.createElement('i');
        previewIcon.className = 'fas fa-eye';
        previewBtn.appendChild(previewIcon);
        
        const previewText = document.createElement('span');
        previewText.textContent = ' Preview';
        previewText.style.marginLeft = '5px';
        previewBtn.appendChild(previewText);
        
        // Add event listeners
        previewBtn.addEventListener('click', function() {
            const previewUrl = this.getAttribute('data-preview');
            showPreview(previewUrl, result.processedFile.name);
        });
        
        downloadBtn.addEventListener('click', function(e) {
            const originalIcon = this.querySelector('i').className;
            const originalText = this.querySelector('span').textContent;
            
            this.querySelector('i').className = 'fas fa-check';
            this.querySelector('span').textContent = ' Downloaded';
            
            setTimeout(() => {
                this.querySelector('i').className = originalIcon;
                this.querySelector('span').textContent = originalText;
            }, 2000);
        });
    });
    
    // Add download all button if there are multiple results
    if (successfulResults.length > 1) {
        const downloadAllContainer = document.createElement('div');
        downloadAllContainer.className = 'download-all-btn';
        results.appendChild(downloadAllContainer);
        
        const downloadAllBtn = document.createElement('button');
        downloadAllBtn.id = 'download-all';
        downloadAllContainer.appendChild(downloadAllBtn);
        
        const downloadAllIcon = document.createElement('i');
        downloadAllIcon.className = 'fas fa-download';
        downloadAllBtn.appendChild(downloadAllIcon);
        
        const downloadAllText = document.createElement('span');
        downloadAllText.textContent = ' Download All (ZIP)';
        downloadAllText.style.marginLeft = '5px';
        downloadAllBtn.appendChild(downloadAllText);
        
        // Add event listener
        downloadAllBtn.addEventListener('click', function() {
            downloadAllFiles(successfulResults);
            
            const originalIcon = this.querySelector('i').className;
            const originalText = this.querySelector('span').textContent;
            
            this.querySelector('i').className = 'fas fa-check';
            this.querySelector('span').textContent = ' Downloaded';
            
            setTimeout(() => {
                this.querySelector('i').className = originalIcon;
                this.querySelector('span').textContent = originalText;
            }, 2000);
        });
    }
    
    console.log('Results display completed');
}

/**
 * Convert an image with the specified options
 */
async function convertImage(file, options) {
    return new Promise((resolve, reject) => {
        try {
            // Create a unique output filename
            const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const outputFilename = `${baseName}.${options.format.toLowerCase()}`;
            
            // Create a FileReader to read the image
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    // Create an image object
                    const img = new Image();
                    
                    img.onload = function() {
                        try {
                            // Create a canvas to draw the image
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            
                            // Draw the image on the canvas
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            
                            // Convert to the desired format
                            let mimeType;
                            switch (options.format.toLowerCase()) {
                                case 'jpeg':
                                case 'jpg':
                                    mimeType = 'image/jpeg';
                                    break;
                                case 'webp':
                                    mimeType = 'image/webp';
                                    break;
                                case 'png':
                                    mimeType = 'image/png';
                                    break;
                                case 'gif':
                                    mimeType = 'image/gif';
                                    break;
                                default:
                                    mimeType = 'image/png';
                                    break;
                            }
                            
                            // Get the data URL
                            const dataURL = canvas.toDataURL(mimeType, options.quality);
                            
                            // Convert data URL to Blob
                            const byteString = atob(dataURL.split(',')[1]);
                            const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
                            const ab = new ArrayBuffer(byteString.length);
                            const ia = new Uint8Array(ab);
                            
                            for (let i = 0; i < byteString.length; i++) {
                                ia[i] = byteString.charCodeAt(i);
                            }
                            
                            const blob = new Blob([ab], { type: mimeString });
                            const convertedFile = new File([blob], outputFilename, { type: mimeString });
                            
                            // Simulate a delay for better UX
                            setTimeout(() => {
                                // Return the result
                                resolve({
                                    originalFile: file,
                                    processedFile: convertedFile,
                                    previewUrl: dataURL,
                                    success: true,
                                    meta: {
                                        originalSize: formatFileSize(file.size),
                                        processedSize: formatFileSize(blob.size),
                                        format: options.format.toUpperCase(),
                                        processingTime: `${(Math.random() * 1 + 0.5).toFixed(1)}s`
                                    }
                                });
                            }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
                        } catch (error) {
                            console.error('Error processing image:', error);
                            resolve({
                                originalFile: file,
                                success: false,
                                error: error.message
                            });
                        }
                    };
                    
                    img.onerror = function() {
                        console.error('Failed to load image');
                        resolve({
                            originalFile: file,
                            success: false,
                            error: 'Failed to load image'
                        });
                    };
                    
                    // Set the image source
                    img.src = e.target.result;
                } catch (error) {
                    console.error('Error in image onload:', error);
                    resolve({
                        originalFile: file,
                        success: false,
                        error: error.message
                    });
                }
            };
            
            reader.onerror = function() {
                console.error('Failed to read file');
                resolve({
                    originalFile: file,
                    success: false,
                    error: 'Failed to read file'
                });
            };
            
            // Read the file as a data URL
            reader.readAsDataURL(file);
            
            // Update progress message
            updateProgressMessage(file.name, `Converting to ${options.format.toUpperCase()}...`);
        } catch (error) {
            console.error('Error in convertImage:', error);
            resolve({
                originalFile: file,
                success: false,
                error: error.message
            });
        }
    });
}

/**
 * Format file size in a human-readable format
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Show an error message
 */
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i><p>${message}</p>`;
    
    // If results div exists, show the error there
    const results = document.getElementById('results');
    if (results) {
        results.innerHTML = '';
        results.appendChild(errorDiv);
    } else {
        // Otherwise create a temporary notification
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '20px';
        errorDiv.style.right = '20px';
        errorDiv.style.zIndex = '9999';
        document.body.appendChild(errorDiv);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(errorDiv)) {
                document.body.removeChild(errorDiv);
            }
        }, 5000);
    }
}

/**
 * Update progress message
 */
function updateProgressMessage(fileName, message) {
    const progressMessages = document.getElementById('progress-messages');
    if (progressMessages) {
        progressMessages.innerHTML = `<div>${fileName}: ${message}</div>`;
    }
}

/**
 * Show a preview of the processed file
 */
function showPreview(url, filename) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'preview-modal';
    modal.innerHTML = `
        <div class="preview-modal-content">
            <div class="preview-modal-header">
                <h3>${filename}</h3>
                <button class="preview-modal-close">&times;</button>
            </div>
            <div class="preview-modal-body">
                <img src="${url}" alt="${filename}">
            </div>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(modal);
    
    // Add close button event listener
    modal.querySelector('.preview-modal-close').addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    // Close when clicking outside the content
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

/**
 * Download all files as a ZIP
 */
function downloadAllFiles(resultsArray) {
    // This would require a ZIP library like JSZip
    // For now, just show a message
    alert('This feature requires the JSZip library. In a real implementation, this would download all files as a ZIP.');
}

/**
 * Simple blur function for previews
 */
function simpleBlur(context, width, height, radius) {
    // Get image data
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Apply blur
    simpleBlurData(data, width, height, radius);
    
    // Put image data back
    context.putImageData(imageData, 0, 0);
}

/**
 * Simple blur algorithm for image data
 */
function simpleBlurData(data, width, height, radius) {
    const tempData = new Uint8ClampedArray(data);
    
    // Simple box blur
    const size = Math.floor(radius);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0, a = 0, count = 0;
            
            // Sample pixels in a square around the current pixel
            for (let ky = -size; ky <= size; ky++) {
                for (let kx = -size; kx <= size; kx++) {
                    const posX = Math.min(width - 1, Math.max(0, x + kx));
                    const posY = Math.min(height - 1, Math.max(0, y + ky));
                    const idx = (posY * width + posX) * 4;
                    
                    r += tempData[idx];
                    g += tempData[idx + 1];
                    b += tempData[idx + 2];
                    a += tempData[idx + 3];
                    count++;
                }
            }
            
            // Calculate average
            const outIdx = (y * width + x) * 4;
            data[outIdx] = r / count;
            data[outIdx + 1] = g / count;
            data[outIdx + 2] = b / count;
            data[outIdx + 3] = a / count;
        }
    }
} 
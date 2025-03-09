/**
 * PicsPanda - enhanced-tools.js
 * Enhanced functionality for all tools with specific handling for each tool type
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get the tool ID from the script data attribute
    const scriptTag = document.querySelector('script[data-tool-id]');
    const toolId = scriptTag ? scriptTag.getAttribute('data-tool-id') : null;
    
    // Common tool functionality
    initializeToolInterface();
    
    // Tool-specific initialization
    if (toolId) {
        switch(toolId) {
            case 'image-editor':
                initializeImageEditor();
                break;
            case 'image-cropper':
                // Initialize image cropper if needed
                break;
            case 'image-resizer':
                // Initialize image resizer if needed
                break;
            // Add other tools as needed
        }
    }
});

/**
 * Initialize common tool interface elements
 */
function initializeToolInterface() {
    // File upload handling
    const fileUpload = document.getElementById('file-upload');
    const dropArea = document.querySelector('.drop-area');
    const fileInfo = document.querySelector('.file-info');
    const toolControls = document.querySelector('.tool-controls');
    
    if (fileUpload && dropArea) {
        // File input change handler
        fileUpload.addEventListener('change', handleFileSelect);
        
        // Drag and drop handlers
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            dropArea.classList.add('highlight');
        }
        
        function unhighlight() {
            dropArea.classList.remove('highlight');
        }
        
        dropArea.addEventListener('drop', handleDrop, false);
    }
    
    // Process button click handler
    const processBtn = document.getElementById('process-btn');
    if (processBtn) {
        processBtn.addEventListener('click', function() {
            // This will be handled by the specific tool function
            const toolId = document.querySelector('script[data-tool-id]').getAttribute('data-tool-id');
            if (toolId === 'image-editor') {
                processImageEdit();
            }
            // Add other tool processing as needed
        });
    }
    
    // Download button click handler
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            const canvas = document.getElementById('output-canvas');
            if (canvas) {
                const link = document.createElement('a');
                link.download = 'edited-image.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            }
        });
    }
    
    // Handle file selection
    function handleFileSelect(e) {
        const files = e.target.files;
        if (files.length) {
            handleFiles(files);
        }
    }
    
    // Handle dropped files
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    // Process the selected files
    function handleFiles(files) {
        if (files.length === 0) return;
        
        const file = files[0];
        // Check if file is an image
        if (!file.type.match('image.*')) {
            alert('Please select an image file.');
            return;
        }
        
        // Display file info
        if (fileInfo) {
            fileInfo.textContent = `File: ${file.name} (${formatFileSize(file.size)})`;
            fileInfo.style.display = 'block';
        }
        
        // Show tool controls
        if (toolControls) {
            toolControls.style.display = 'block';
        }
        
        // Load the image
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // Store the image for processing
                window.selectedImage = img;
                
                // Display the image in the preview
                const preview = document.getElementById('image-preview');
                if (preview) {
                    preview.innerHTML = '';
                    preview.appendChild(img);
                    preview.style.display = 'block';
                }
                
                // Initialize tool with the loaded image
                const toolId = document.querySelector('script[data-tool-id]').getAttribute('data-tool-id');
                if (toolId === 'image-editor') {
                    setupImageEditor(img);
                }
                // Add other tool initializations as needed
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    // Format file size for display
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

/**
 * Initialize the image editor functionality
 */
function initializeImageEditor() {
    // Create canvas for editing
    const editorContainer = document.querySelector('.editor-container');
    if (editorContainer) {
        const canvas = document.createElement('canvas');
        canvas.id = 'editor-canvas';
        canvas.style.display = 'none';
        editorContainer.appendChild(canvas);
        
        const outputCanvas = document.createElement('canvas');
        outputCanvas.id = 'output-canvas';
        outputCanvas.style.display = 'none';
        editorContainer.appendChild(outputCanvas);
    }
    
    // Set up filter controls
    setupFilterControls();
    
    // Set up adjustment controls
    setupAdjustmentControls();
    
    // Set up transform controls
    setupTransformControls();
}

/**
 * Set up the image editor with the loaded image
 */
function setupImageEditor(img) {
    const canvas = document.getElementById('editor-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match the image
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw the image on the canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Store original image data for reset
    window.originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Reset all controls to default values
    resetControls();
    
    // Show editor controls
    const editorControls = document.querySelector('.editor-controls');
    if (editorControls) {
        editorControls.style.display = 'block';
    }
}

/**
 * Set up filter controls for the image editor
 */
function setupFilterControls() {
    const filterControls = document.querySelectorAll('.filter-control');
    
    filterControls.forEach(control => {
        control.addEventListener('click', function() {
            // Remove active class from all filters
            filterControls.forEach(c => c.classList.remove('active'));
            
            // Add active class to selected filter
            this.classList.add('active');
            
            // Apply the selected filter
            const filterType = this.getAttribute('data-filter');
            applyFilter(filterType);
        });
    });
}

/**
 * Set up adjustment controls for the image editor
 */
function setupAdjustmentControls() {
    const adjustmentSliders = document.querySelectorAll('.adjustment-slider');
    
    adjustmentSliders.forEach(slider => {
        slider.addEventListener('input', function() {
            const adjustmentType = this.getAttribute('data-adjustment');
            const value = parseFloat(this.value);
            
            // Update the value display
            const valueDisplay = this.parentElement.querySelector('.slider-value');
            if (valueDisplay) {
                valueDisplay.textContent = value;
            }
            
            // Apply the adjustment
            applyAdjustment(adjustmentType, value);
        });
    });
}

/**
 * Set up transform controls for the image editor
 */
function setupTransformControls() {
    const rotateLeftBtn = document.getElementById('rotate-left');
    const rotateRightBtn = document.getElementById('rotate-right');
    const flipHorizontalBtn = document.getElementById('flip-horizontal');
    const flipVerticalBtn = document.getElementById('flip-vertical');
    
    if (rotateLeftBtn) {
        rotateLeftBtn.addEventListener('click', function() {
            rotateImage(-90);
        });
    }
    
    if (rotateRightBtn) {
        rotateRightBtn.addEventListener('click', function() {
            rotateImage(90);
        });
    }
    
    if (flipHorizontalBtn) {
        flipHorizontalBtn.addEventListener('click', function() {
            flipImage('horizontal');
        });
    }
    
    if (flipVerticalBtn) {
        flipVerticalBtn.addEventListener('click', function() {
            flipImage('vertical');
        });
    }
}

/**
 * Apply a filter to the image
 */
function applyFilter(filterType) {
    const canvas = document.getElementById('editor-canvas');
    const ctx = canvas.getContext('2d');
    
    // Reset to original image first
    ctx.putImageData(window.originalImageData, 0, 0);
    
    // Apply current adjustments
    applyCurrentAdjustments();
    
    // Apply the selected filter
    switch(filterType) {
        case 'grayscale':
            applyGrayscale(ctx, canvas);
            break;
        case 'sepia':
            applySepia(ctx, canvas);
            break;
        case 'invert':
            applyInvert(ctx, canvas);
            break;
        case 'blur':
            applyBlur(ctx, canvas);
            break;
        case 'sharpen':
            applySharpen(ctx, canvas);
            break;
        case 'none':
            // No filter, just keep the adjustments
            break;
    }
    
    // Update the preview
    updatePreview();
}

/**
 * Apply grayscale filter
 */
function applyGrayscale(ctx, canvas) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;     // Red
        data[i + 1] = avg; // Green
        data[i + 2] = avg; // Blue
    }
    
    ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply sepia filter
 */
function applySepia(ctx, canvas) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));     // Red
        data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168)); // Green
        data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131)); // Blue
    }
    
    ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply invert filter
 */
function applyInvert(ctx, canvas) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];         // Red
        data[i + 1] = 255 - data[i + 1]; // Green
        data[i + 2] = 255 - data[i + 2]; // Blue
    }
    
    ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply blur filter
 */
function applyBlur(ctx, canvas) {
    // Simple box blur
    ctx.filter = 'blur(4px)';
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.filter = 'none';
}

/**
 * Apply sharpen filter
 */
function applySharpen(ctx, canvas) {
    // Sharpen using convolution
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const sharpenedData = applySharpenConvolution(imageData, canvas.width, canvas.height);
    ctx.putImageData(sharpenedData, 0, 0);
}

/**
 * Apply sharpen convolution
 */
function applySharpenConvolution(imageData, width, height) {
    const kernel = [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
    ];
    
    const result = new ImageData(width, height);
    const data = imageData.data;
    const resultData = result.data;
    
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const offset = (y * width + x) * 4;
            
            let r = 0, g = 0, b = 0;
            
            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const kernelOffset = (ky + 1) * 3 + (kx + 1);
                    const pixelOffset = ((y + ky) * width + (x + kx)) * 4;
                    
                    r += data[pixelOffset] * kernel[kernelOffset];
                    g += data[pixelOffset + 1] * kernel[kernelOffset];
                    b += data[pixelOffset + 2] * kernel[kernelOffset];
                }
            }
            
            resultData[offset] = Math.min(255, Math.max(0, r));
            resultData[offset + 1] = Math.min(255, Math.max(0, g));
            resultData[offset + 2] = Math.min(255, Math.max(0, b));
            resultData[offset + 3] = data[offset + 3];
        }
    }
    
    return result;
}

/**
 * Apply an adjustment to the image
 */
function applyAdjustment(adjustmentType, value) {
    // Store the current adjustment value
    if (!window.currentAdjustments) {
        window.currentAdjustments = {
            brightness: 0,
            contrast: 0,
            saturation: 0
        };
    }
    
    window.currentAdjustments[adjustmentType] = value;
    
    // Reset and apply all adjustments and filters
    const canvas = document.getElementById('editor-canvas');
    const ctx = canvas.getContext('2d');
    
    // Reset to original image
    ctx.putImageData(window.originalImageData, 0, 0);
    
    // Apply all current adjustments
    applyCurrentAdjustments();
    
    // Re-apply the current filter if any
    const activeFilter = document.querySelector('.filter-control.active');
    if (activeFilter) {
        const filterType = activeFilter.getAttribute('data-filter');
        if (filterType !== 'none') {
            applyFilter(filterType);
        }
    }
    
    // Update the preview
    updatePreview();
}

/**
 * Apply all current adjustments to the image
 */
function applyCurrentAdjustments() {
    if (!window.currentAdjustments) return;
    
    const canvas = document.getElementById('editor-canvas');
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const brightness = window.currentAdjustments.brightness;
    const contrast = window.currentAdjustments.contrast * 2.55; // Scale to 0-255 range
    const saturation = window.currentAdjustments.saturation / 100 + 1; // Scale to 0-2 range
    
    // Calculate contrast factor
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    
    for (let i = 0; i < data.length; i += 4) {
        // Apply brightness
        data[i] += brightness;
        data[i + 1] += brightness;
        data[i + 2] += brightness;
        
        // Apply contrast
        data[i] = factor * (data[i] - 128) + 128;
        data[i + 1] = factor * (data[i + 1] - 128) + 128;
        data[i + 2] = factor * (data[i + 2] - 128) + 128;
        
        // Apply saturation
        const gray = 0.2989 * data[i] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2];
        data[i] = Math.min(255, Math.max(0, gray + saturation * (data[i] - gray)));
        data[i + 1] = Math.min(255, Math.max(0, gray + saturation * (data[i + 1] - gray)));
        data[i + 2] = Math.min(255, Math.max(0, gray + saturation * (data[i + 2] - gray)));
    }
    
    ctx.putImageData(imageData, 0, 0);
}

/**
 * Rotate the image
 */
function rotateImage(degrees) {
    const canvas = document.getElementById('editor-canvas');
    const ctx = canvas.getContext('2d');
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // Set dimensions based on rotation
    if (Math.abs(degrees) === 90) {
        tempCanvas.width = canvas.height;
        tempCanvas.height = canvas.width;
    } else {
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
    }
    
    // Translate and rotate
    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
    tempCtx.rotate(degrees * Math.PI / 180);
    tempCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    
    // Update canvas dimensions and draw rotated image
    canvas.width = tempCanvas.width;
    canvas.height = tempCanvas.height;
    ctx.drawImage(tempCanvas, 0, 0);
    
    // Update original image data
    window.originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Update the preview
    updatePreview();
}

/**
 * Flip the image
 */
function flipImage(direction) {
    const canvas = document.getElementById('editor-canvas');
    const ctx = canvas.getContext('2d');
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Draw the current image to the temp canvas
    tempCtx.drawImage(canvas, 0, 0);
    
    // Clear the main canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Flip horizontally or vertically
    if (direction === 'horizontal') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    } else if (direction === 'vertical') {
        ctx.translate(0, canvas.height);
        ctx.scale(1, -1);
    }
    
    // Draw the flipped image
    ctx.drawImage(tempCanvas, 0, 0);
    
    // Reset the transformation
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Update original image data
    window.originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Update the preview
    updatePreview();
}

/**
 * Reset all controls to default values
 */
function resetControls() {
    // Reset adjustment sliders
    const adjustmentSliders = document.querySelectorAll('.adjustment-slider');
    adjustmentSliders.forEach(slider => {
        slider.value = slider.getAttribute('data-default') || 0;
        
        // Update the value display
        const valueDisplay = slider.parentElement.querySelector('.slider-value');
        if (valueDisplay) {
            valueDisplay.textContent = slider.value;
        }
    });
    
    // Reset filter selection
    const filterControls = document.querySelectorAll('.filter-control');
    filterControls.forEach(control => {
        control.classList.remove('active');
    });
    
    // Set 'none' filter as active
    const noneFilter = document.querySelector('.filter-control[data-filter="none"]');
    if (noneFilter) {
        noneFilter.classList.add('active');
    }
    
    // Reset adjustments object
    window.currentAdjustments = {
        brightness: 0,
        contrast: 0,
        saturation: 0
    };
    
    // Reset the canvas to original image
    const canvas = document.getElementById('editor-canvas');
    if (canvas && window.originalImageData) {
        const ctx = canvas.getContext('2d');
        ctx.putImageData(window.originalImageData, 0, 0);
        
        // Update the preview
        updatePreview();
    }
}

/**
 * Update the image preview
 */
function updatePreview() {
    const canvas = document.getElementById('editor-canvas');
    const preview = document.getElementById('image-preview');
    
    if (canvas && preview) {
        // Clear the preview
        preview.innerHTML = '';
        
        // Create a new image from the canvas
        const img = new Image();
        img.src = canvas.toDataURL('image/png');
        
        // Add the image to the preview
        preview.appendChild(img);
    }
}

/**
 * Process the image edit
 */
function processImageEdit() {
    const canvas = document.getElementById('editor-canvas');
    const outputCanvas = document.getElementById('output-canvas');
    
    if (canvas && outputCanvas) {
        // Set output canvas dimensions
        outputCanvas.width = canvas.width;
        outputCanvas.height = canvas.height;
        
        // Draw the edited image to the output canvas
        const ctx = outputCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, 0);
        
        // Show the output section
        const outputSection = document.querySelector('.output-section');
        if (outputSection) {
            outputSection.style.display = 'block';
        }
        
        // Show the output preview
        const outputPreview = document.getElementById('output-preview');
        if (outputPreview) {
            outputPreview.innerHTML = '';
            const img = new Image();
            img.src = outputCanvas.toDataURL('image/png');
            outputPreview.appendChild(img);
            outputPreview.style.display = 'block';
        }
        
        // Enable the download button
        const downloadBtn = document.getElementById('download-btn');
        if (downloadBtn) {
            downloadBtn.disabled = false;
        }
    }
} 
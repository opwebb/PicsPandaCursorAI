document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const processBtn = document.getElementById('process-btn');
    const results = document.getElementById('results');
    const uploadBtn = document.querySelector('.upload-btn');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('quality-value');
    const outputFormat = document.getElementById('output-format');

    // Supported formats
    const supportedFormats = ['application/pdf'];

    // Handle file selection
    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', handleFileSelect);
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleDrop);

    function handleFileSelect(e) {
        const files = e.target.files;
        handleFiles(files);
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('dragover');
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        if (files.length === 0) return;

        const file = files[0];
        if (!supportedFormats.includes(file.type)) {
            showError('Please upload a PDF file');
            return;
        }

        displayFile(file);
        processBtn.disabled = false;
    }

    function displayFile(file) {
        fileList.innerHTML = `
            <div class="file-item">
                <div class="file-info">
                    <i class="fas fa-file-pdf file-icon"></i>
                    <div>
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${formatFileSize(file.size)}</div>
                    </div>
                </div>
                <button class="file-remove" onclick="removeFile()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }

    window.removeFile = function() {
        fileList.innerHTML = '';
        fileInput.value = '';
        processBtn.disabled = true;
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
        fileList.innerHTML = '';
        fileList.appendChild(error);
        setTimeout(() => error.remove(), 3000);
    }

    // Add quality slider functionality
    qualitySlider.addEventListener('input', function() {
        qualityValue.textContent = this.value;
    });

    // Update output format options
    outputFormat.innerHTML = `
        <option value="jpg">JPG</option>
        <option value="png">PNG</option>
        <option value="webp">WEBP</option>
        <option value="tiff">TIFF</option>
        <option value="bmp">BMP</option>
        <option value="gif">GIF</option>
        <option value="avif">AVIF</option>
    `;

    // Convert PDF to Image with quality settings
    async function convertToImage(canvas, format, quality) {
        switch (format) {
            case 'jpg':
                return canvas.toDataURL('image/jpeg', quality / 100);
            case 'png':
                return canvas.toDataURL('image/png');
            case 'webp':
                return canvas.toDataURL('image/webp', quality / 100);
            case 'tiff':
                // Convert to TIFF using canvas data
                const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
                return convertToTIFF(imageData);
            case 'bmp':
                return canvas.toDataURL('image/bmp');
            case 'gif':
                return canvas.toDataURL('image/gif');
            case 'avif':
                return canvas.toDataURL('image/avif', quality / 100);
            default:
                return canvas.toDataURL('image/jpeg', quality / 100);
        }
    }

    // Convert PDF to Image
    processBtn.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) return;

        try {
            processBtn.disabled = true;
            processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';

            const format = outputFormat.value;
            const quality = parseInt(qualitySlider.value);
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const images = [];

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 2 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;

                const image = await convertToImage(canvas, format, quality);
                images.push({ dataUrl: image, format: format });
            }

            displayResults(images);
        } catch (error) {
            showError('Error converting PDF: ' + error.message);
        } finally {
            processBtn.disabled = false;
            processBtn.innerHTML = 'Convert PDF';
        }
    });

    function displayResults(images) {
        results.innerHTML = '';
        images.forEach((image, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <div class="result-info">
                    <img src="${image.dataUrl}" alt="Page ${index + 1}" style="max-width: 100px;">
                    <div>
                        <div class="result-name">Page ${index + 1}</div>
                        <div class="result-size">${image.format.toUpperCase()} Format</div>
                    </div>
                </div>
                <div class="result-actions">
                    <button class="preview-btn" onclick="previewImage('${image.dataUrl}', ${index + 1})">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                    <button class="download-btn" onclick="downloadImage('${image.dataUrl}', ${index + 1}, '${image.format}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                </div>
            `;
            results.appendChild(resultItem);
        });
    }

    window.previewImage = function(dataUrl, pageNum) {
        const modal = document.createElement('div');
        modal.className = 'preview-modal';
        modal.innerHTML = `
            <div class="preview-content">
                <div class="preview-header">
                    <h3>Page ${pageNum} Preview</h3>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="preview-body">
                    <img src="${dataUrl}" alt="Page ${pageNum}" style="max-width: 100%; height: auto;">
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Close modal on outside click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Close modal on escape key
        document.addEventListener('keyup', function(e) {
            if (e.key === 'Escape' && document.contains(modal)) {
                modal.remove();
            }
        });
    }

    window.downloadImage = function(dataUrl, pageNum, format) {
        const link = document.createElement('a');
        link.download = `page_${pageNum}.${format}`;
        link.href = dataUrl;
        link.click();
    }

    // Helper function for TIFF conversion
    function convertToTIFF(imageData) {
        // Basic TIFF conversion (placeholder)
        return imageData;
    }
});

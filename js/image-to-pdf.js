document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const processBtn = document.getElementById('process-btn');
    const results = document.getElementById('results');
    const uploadBtn = document.querySelector('.upload-btn');

    // Supported formats
    const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

    // Handle file selection
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleDrop);

    let uploadedFiles = [];

    function handleFileSelect(e) {
        const files = Array.from(e.target.files);
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
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    }

    function handleFiles(files) {
        const validFiles = files.filter(file => {
            if (supportedFormats.includes(file.type)) {
                return true;
            }
            showError(`File type not supported: ${file.name}`);
            return false;
        });

        if (validFiles.length === 0) return;

        uploadedFiles = [...uploadedFiles, ...validFiles];
        displayFiles();
        processBtn.disabled = false;
    }

    function displayFiles() {
        fileList.innerHTML = '';
        uploadedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.innerHTML = `
                    <div class="file-info">
                        <img src="${e.target.result}" alt="${file.name}" style="max-width: 50px; max-height: 50px;">
                        <div>
                            <div class="file-name">${file.name}</div>
                            <div class="file-size">${formatFileSize(file.size)}</div>
                        </div>
                    </div>
                    <button class="file-remove" onclick="removeFile(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                fileList.appendChild(fileItem);
            };
            reader.readAsDataURL(file);
        });
    }

    window.removeFile = function(index) {
        uploadedFiles.splice(index, 1);
        displayFiles();
        processBtn.disabled = uploadedFiles.length === 0;
    };

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
        fileList.appendChild(error);
        setTimeout(() => error.remove(), 3000);
    }

    // Add quality slider functionality
    const qualitySlider = document.getElementById('image-quality');
    const qualityValue = document.getElementById('quality-value');

    if (qualitySlider && qualityValue) {
        qualitySlider.addEventListener('input', function() {
            qualityValue.textContent = this.value;
        });
    }

    // Paper sizes in points (72 points = 1 inch)
    const paperSizes = {
        'a3': [841.89, 1190.55],
        'a4': [595.28, 841.89],
        'a5': [419.53, 595.28],
        'letter': [612, 792],
        'legal': [612, 1008],
        'b4': [708.66, 1000.63],
        'b5': [498.90, 708.66],
        'tabloid': [792, 1224],
        'executive': [521.86, 756.00]
    };

    processBtn.addEventListener('click', async () => {
        if (uploadedFiles.length === 0) return;

        try {
            processBtn.disabled = true;
            processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';

            const pageSize = document.getElementById('page-size').value;
            const orientation = document.getElementById('orientation').value;
            const quality = document.getElementById('image-quality').value / 100;

            // Get paper dimensions
            let [width, height] = paperSizes[pageSize] || paperSizes['a4'];
            
            // Initialize PDF with selected options
            const pdf = new jspdf.jsPDF({
                orientation: orientation,
                unit: 'pt',
                format: [width, height]
            });

            let currentPage = 0;

            // Convert each image to PDF page
            for (const file of uploadedFiles) {
                await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const img = new Image();
                        img.onload = function() {
                            if (currentPage > 0) {
                                pdf.addPage();
                            }

                            // Calculate dimensions to fit page
                            const pageWidth = pdf.internal.pageSize.getWidth();
                            const pageHeight = pdf.internal.pageSize.getHeight();
                            const imgRatio = img.width / img.height;
                            const pageRatio = pageWidth / pageHeight;
                            
                            let finalWidth = pageWidth;
                            let finalHeight = pageWidth / imgRatio;

                            if (finalHeight > pageHeight) {
                                finalHeight = pageHeight;
                                finalWidth = pageHeight * imgRatio;
                            }

                            const x = (pageWidth - finalWidth) / 2;
                            const y = (pageHeight - finalHeight) / 2;

                            pdf.addImage(
                                img.src,
                                'JPEG',
                                x,
                                y,
                                finalWidth,
                                finalHeight,
                                null,
                                'MEDIUM',
                                quality
                            );
                            currentPage++;
                            resolve();
                        };
                        img.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                });
            }

            // Generate PDF
            const pdfBlob = pdf.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);

            // Display result
            results.innerHTML = `
                <div class="result-item">
                    <div class="result-info">
                        <i class="fas fa-file-pdf result-icon"></i>
                        <div>
                            <div class="result-name">Images_to_PDF.pdf</div>
                            <div class="result-size">${formatFileSize(pdfBlob.size)}</div>
                        </div>
                    </div>
                    <div class="result-actions">
                        <button class="preview-btn" onclick="previewPDF('${pdfUrl}')">
                            <i class="fas fa-eye"></i> Preview
                        </button>
                        <button class="download-btn" onclick="downloadPDF('${pdfUrl}')">
                            <i class="fas fa-download"></i> Download
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            showError('Error converting to PDF: ' + error.message);
        } finally {
            processBtn.disabled = false;
            processBtn.innerHTML = 'Convert to PDF';
        }
    });

    window.previewPDF = function(url) {
        const modal = document.createElement('div');
        modal.className = 'preview-modal';
        modal.innerHTML = `
            <div class="preview-content">
                <div class="preview-header">
                    <h3>PDF Preview</h3>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="preview-body">
                    <iframe src="${url}" width="100%" height="500px"></iframe>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.remove();
        });
    };

    window.downloadPDF = function(url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = 'converted_images.pdf';
        link.click();
    };
});

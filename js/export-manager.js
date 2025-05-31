// Export functionality
class ExportManager {
    constructor() {
        this.exportBtn = document.getElementById('exportBtn');
        this.doorSign = document.querySelector('.door-sign');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => {
                this.exportSign();
            });
        }
    }

    async exportSign() {
        if (!this.doorSign) {
            console.error('Door sign element not found');
            return;
        }

        try {
            // Show loading state
            this.setExportButtonState(true);

            // Clone the door sign to avoid modifying the original
            const clonedSign = this.doorSign.cloneNode(true);
            
            // Prepare the cloned sign for export
            this.prepareSignForExport(clonedSign);

            // Create a temporary container
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.top = '-9999px';
            tempContainer.style.left = '-9999px';
            tempContainer.appendChild(clonedSign);
            document.body.appendChild(tempContainer);

            // Generate canvas
            const canvas = await html2canvas(clonedSign, {
                backgroundColor: 'white',
                scale: 2, // Higher resolution
                useCORS: true,
                allowTaint: true,
                imageTimeout: 30000,
                logging: false
            });

            // Clean up
            document.body.removeChild(tempContainer);

            // Create download
            this.downloadCanvas(canvas);

        } catch (error) {
            console.error('Error exporting sign:', error);
            this.showExportError();
        } finally {
            this.setExportButtonState(false);
        }
    }

    prepareSignForExport(signElement) {
        // Ensure the sign has proper dimensions for export
        const computedStyle = window.getComputedStyle(this.doorSign);
        signElement.style.width = computedStyle.width;
        signElement.style.height = computedStyle.height;
        signElement.style.transform = computedStyle.transform;
        signElement.style.border = computedStyle.border;
        signElement.style.borderRadius = computedStyle.borderRadius;
        signElement.style.background = computedStyle.background;
        signElement.style.position = 'relative';
        signElement.style.margin = '0';
        signElement.style.boxSizing = 'border-box';

        // Ensure all images are loaded and visible
        const images = signElement.querySelectorAll('img, svg, object');
        images.forEach(img => {
            if (img.tagName === 'OBJECT') {
                // Replace object with img for better compatibility
                const objectData = img.getAttribute('data');
                if (objectData) {
                    const imgElement = document.createElement('img');
                    imgElement.src = objectData;
                    imgElement.style.cssText = img.style.cssText;
                    img.parentNode.replaceChild(imgElement, img);
                }
            }
        });

        // Ensure text elements are properly styled
        const textElements = signElement.querySelectorAll('*');
        textElements.forEach(el => {
            const computedStyle = window.getComputedStyle(el);
            el.style.fontSize = computedStyle.fontSize;
            el.style.fontFamily = computedStyle.fontFamily;
            el.style.fontWeight = computedStyle.fontWeight;
            el.style.color = computedStyle.color;
            el.style.lineHeight = computedStyle.lineHeight;
        });
    }

    downloadCanvas(canvas) {
        // Get filename based on current form data
        const filename = this.generateFilename();
        
        // Create download link
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Show success message
        this.showExportSuccess();
    }

    generateFilename() {
        const formData = window.formManager?.getFormData() || {};
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        
        let filename = 'unbc-door-sign';
        
        if (formData.name && formData.name.trim()) {
            const cleanName = formData.name.trim().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').toLowerCase();
            filename = `unbc-door-sign-${cleanName}`;
        } else if (formData.roomName && formData.roomName.trim()) {
            const cleanRoomName = formData.roomName.trim().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').toLowerCase();
            filename = `unbc-door-sign-${cleanRoomName}`;
        }
        
        return `${filename}-${timestamp}.png`;
    }

    setExportButtonState(isLoading) {
        if (!this.exportBtn) return;

        if (isLoading) {
            this.exportBtn.disabled = true;
            this.exportBtn.textContent = 'Exporting...';
            this.exportBtn.style.opacity = '0.7';
        } else {
            this.exportBtn.disabled = false;
            this.exportBtn.textContent = 'Export Sign';
            this.exportBtn.style.opacity = '1';
        }
    }

    showExportSuccess() {
        // Create temporary success message
        const message = document.createElement('div');
        message.textContent = 'Sign exported successfully!';
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #38a169;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 3000);
    }

    showExportError() {
        // Create temporary error message
        const message = document.createElement('div');
        message.textContent = 'Error exporting sign. Please try again.';
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e53e3e;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 5000);
    }
}

// Make available globally
window.ExportManager = ExportManager;
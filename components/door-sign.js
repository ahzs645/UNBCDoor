// Door sign component class
class DoorSign {
    constructor(element) {
        this.element = element;
        this.config = null;
        this.data = null;
    }

    // Update the sign with new data and configuration
    update(data, config) {
        this.data = data;
        this.config = config;
        this.render();
    }

    // Render the door sign
    render() {
        this.updateHeader();
        this.updateContent();
        this.updateClasses();
    }

    // Update the header section
    updateHeader() {
        const header = this.element.querySelector('.sign-header');
        header.innerHTML = this.generateHeaderHTML();
    }

    // Update the content section
    updateContent() {
        const content = this.element.querySelector('.sign-content');
        content.innerHTML = this.generateContentHTML();
    }

    // Update classes based on sign type
    updateClasses() {
        this.element.className = `door-sign ${this.data.signType}`;
    }

    // Generate header HTML
    generateHeaderHTML() {
        // Determine which department name to display
        const selectedMainDept = this.data.mainDepartment || '';
        const selectedSubDept = this.data.subDepartment || '';
        const displayDept = selectedSubDept && selectedSubDept !== 'none' ? selectedSubDept : selectedMainDept;

        // Create the SVG content
        const svgContent = `
            <div class="unbc-logo">
                <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" width="178" height="80" viewBox="0 0 178 80">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <g id="logoAndTextGroup" transform="translate(0, 15)">
                            <text transform="translate(57.73 36.56)" fill="#fff" font-family="HelveticaNeue-Black, 'Helvetica Neue'" font-size="8.23" font-weight="800" id="svgDepartmentText" xml:space="preserve"><tspan x="0" y="0">${displayDept || ''}</tspan></text>
                            <g>
                                <g>
                                    <polygon points="17.3 6.57 12.41 30.68 16.66 30.68 19.93 14.87 22.34 23.75 26.4 23.75 31.22 0 27.13 0 24.14 14.98 21.39 6.57 17.3 6.57" fill="#fff"/>
                                    <!-- ... rest of the SVG paths ... -->
                                </g>
                            </g>
                        </g>
                    </g>
                </svg>
            </div>
            ${this.config.showAlumni && this.data.isAlumni ? `
                <div class="alumni-badge">
                    <img src="components/alumni-badge.svg" alt="Alumni Badge">
                </div>
            ` : ''}
        `;

        return svgContent;
    }

    // Generate content HTML
    generateContentHTML() {
        if (this.data.signType === 'general-room' || this.data.signType === 'custodian-closet') {
            return this.generateRoomContent();
        } else if (this.data.signType === 'lab') {
            return this.generateLabContent();
        } else {
            return this.generatePersonContent();
        }
    }

    // Generate room content
    generateRoomContent() {
        const isCustodian = this.data.signType === 'custodian-closet';
        return `
            <div class="main-content">
                <h2 class="main-title">${isCustodian ? 'Custodian\nCloset' : (this.data.roomName || 'Room Name')}</h2>
            </div>
        `;
    }

    // Generate lab content
    generateLabContent() {
        const labName = this.data.name ? `${this.data.name} Lab` : 'Lab Name';
        return `
            <div class="main-content">
                <h2 class="main-title">${labName}</h2>
            </div>
        `;
    }

    // Generate person content
    generatePersonContent() {
        let displayName = this.data.name || '';
        
        // Handle designations
        let designations = [];
        if (this.data.enableDesignations) {
            // Get selected checkboxes
            if (this.data.selectedDesignations) {
                designations.push(...this.data.selectedDesignations);
            }
            
            // Add custom designation if present
            if (this.data.customDesignation) {
                const customList = this.data.customDesignation.split(',')
                    .map(item => item.trim())
                    .filter(item => item !== '');
                designations.push(...customList);
            }
        }

        const formattedDesignations = designations.join(', ');

        return `
            <div class="main-content">
                <h2 class="main-title">${displayName}${formattedDesignations ? ',' : ''}</h2>
                ${formattedDesignations ? 
                    `<div class="designations-display">(${formattedDesignations})</div>` : ''}
                ${this.config.showPosition && this.data.position ? 
                    `<div class="position">${this.data.position}</div>` : ''}
                ${this.config.showContact ? `
                    <div class="contact-info">
                        ${this.data.email ? `<div class="email">Email: ${this.data.email}</div>` : ''}
                        ${this.data.phone ? `<div class="phone">Phone: ${this.data.phone}</div>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Helper function to wrap text
    wrapText(text, maxCharsPerLine) {
        if (!text) return [''];
        const words = text.split(' ');
        let currentLine = '';
        const lines = [];

        words.forEach(word => {
            if (currentLine.length + word.length + (currentLine ? 1 : 0) > maxCharsPerLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                if (currentLine) {
                    currentLine += ' ' + word;
                } else {
                    currentLine = word;
                }
            }
        });
        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    // Export the door sign as an image
    export() {
        return html2canvas(this.element, {
            scale: 2,
            backgroundColor: null,
            logging: false,
            useCORS: true
        });
    }
}

// Export the DoorSign class
export default DoorSign; 
// Sign rendering functionality
class SignRenderer {
    constructor() {
        this.signContent = document.querySelector('.sign-content .main-content');
        this.alumniBadge = document.querySelector('.alumni-badge');
        this.alumniToggle = document.getElementById('alumniToggle');
        this.designationsToggle = document.getElementById('designationsToggle');
        this.designationsContainer = document.getElementById('designationsContainer');
        
        this.designationList = [
            "PhD", "MD", "JD", "MBA", "MSc", "MA", "BSc", "BA", "BEng", "BBA",
            "PEng", "PGeo", "P.Ag", "RPF", "RPP", "MCIP", "CPA", "CA", "CMA", "CGA"
        ];

        this.initializeDesignations();
        this.setupEventListeners();
        this.loadUNBCLogo();
    }

    setupEventListeners() {
        console.log('Setting up SignRenderer event listeners...');
        
        // Alumni toggle
        if (this.alumniToggle) {
            this.alumniToggle.addEventListener('click', () => {
                console.log('Alumni toggle clicked');
                this.alumniToggle.classList.toggle('active');
                this.updateAlumniBadgeVisibility();
                this.updateSign();
            });
        }

        // Designations toggle
        if (this.designationsToggle) {
            this.designationsToggle.addEventListener('click', () => {
                console.log('Designations toggle clicked');
                this.designationsToggle.classList.toggle('active');
                this.updateDesignationsVisibility();
                this.updateSign();
            });
        }

        // Custom designation handler
        const addCustomDesignation = document.getElementById('addCustomDesignation');
        const customDesignation = document.getElementById('customDesignation');
        if (addCustomDesignation && customDesignation) {
            addCustomDesignation.addEventListener('click', () => {
                console.log('Add custom designation clicked');
                this.addCustomDesignation(customDesignation.value.trim());
                customDesignation.value = '';
            });

            // Allow Enter key to add designation
            customDesignation.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('Enter key pressed in custom designation');
                    this.addCustomDesignation(customDesignation.value.trim());
                    customDesignation.value = '';
                }
            });
        }

        console.log('SignRenderer event listeners setup complete');
    }

    getDefaultValues(signType) {
        switch(signType) {
            case 'faculty':
            case 'staff':
                return {
                    name: 'Dr. John Smith',
                    position: 'Professor',
                    email: 'john.smith@unbc.ca',
                    phone: '250-960-5555'
                };
            case 'student':
                return {
                    name: 'Student Name',
                    email: 'student@unbc.ca'
                };
            case 'lab':
                return {
                    roomName: 'Research Lab'
                };
            case 'general-room':
                return {
                    roomName: 'Conference Room'
                };
            case 'custodian-closet':
                return {
                    roomName: 'Storage Room'
                };
            default:
                return {};
        }
    }

    async loadUNBCLogo() {
        try {
            const response = await fetch('components/unbc-logo.svg');
            if (!response.ok) {
                throw new Error(`Failed to load UNBC logo: ${response.status} ${response.statusText}`);
            }
            
            const svgText = await response.text();
            const logoContainer = document.querySelector('.unbc-logo');
            if (!logoContainer) {
                throw new Error('Logo container not found');
            }
            
            logoContainer.innerHTML = svgText;
            
            const svg = logoContainer.querySelector('svg');
            if (svg) {
                svg.style.width = 'auto';
                svg.style.height = 'auto';
            }
            
            return true;
        } catch (error) {
            console.error('Failed to load UNBC logo:', error);
            const logoContainer = document.querySelector('.unbc-logo');
            if (logoContainer) {
                logoContainer.innerHTML = `<div style="color: white; font-size: 14px; text-align: center;">Error: Could not load UNBC logo</div>`;
            }
            return false;
        }
    }

    initializeDesignations() {
        const container = document.querySelector('.designation-options');
        if (!container) return;

        container.innerHTML = ''; // Clear existing content

        this.designationList.forEach(designation => {
            const label = document.createElement('label');
            label.className = 'designation-option';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'designations';
            checkbox.value = designation;
            
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(designation));
            container.appendChild(label);
        });

        // Add event listeners for designation changes
        container.addEventListener('change', () => {
            this.updateSelectedDesignations();
        });
    }

    addCustomDesignation(value) {
        if (!value) return;

        const container = document.querySelector('.designation-options');
        if (container) {
            const label = document.createElement('label');
            label.className = 'designation-option';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'designations';
            checkbox.value = value;
            checkbox.checked = true;
            
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(value));
            container.appendChild(label);
            
            this.updateSelectedDesignations();
        }
    }

    updateSelectedDesignations() {
        const selectedDesignations = document.getElementById('selectedDesignations');
        const checkedDesignations = Array.from(document.querySelectorAll('input[name="designations"]:checked'))
            .map(checkbox => checkbox.value);
        
        if (selectedDesignations) {
            selectedDesignations.innerHTML = checkedDesignations.length > 0 
                ? `<strong>Selected Designations:</strong> ${checkedDesignations.join(', ')}`
                : '';
        }
        
        this.updateSign();
    }

    updateAlumniBadgeVisibility() {
        if (!this.alumniBadge) return;

        const signType = document.getElementById('signType')?.value || 'faculty';
        const shouldShowAlumni = (signType === 'faculty' || signType === 'staff') && 
            this.alumniToggle?.classList.contains('active');
        
        this.alumniBadge.style.display = shouldShowAlumni ? 'block' : 'none';
    }

    updateDesignationsVisibility() {
        if (!this.designationsContainer || !this.designationsToggle) return;

        const signType = document.getElementById('signType')?.value || 'faculty';
        const isActive = this.designationsToggle.classList.contains('active');
        const shouldShow = (signType === 'faculty' || signType === 'staff') && isActive;
        
        this.designationsContainer.style.display = shouldShow ? 'block' : 'none';
        
        if (shouldShow) {
            const toggleButtonsContainer = document.querySelector('.toggle-buttons-container');
            if (toggleButtonsContainer && toggleButtonsContainer.nextSibling !== this.designationsContainer) {
                toggleButtonsContainer.parentNode.insertBefore(this.designationsContainer, toggleButtonsContainer.nextSibling);
            }
        }
    }

    updateSign() {
        console.log('Updating sign...');
        if (!this.signContent) {
            console.error('Sign content element not found');
            return;
        }

        const formData = window.formManager ? window.formManager.getFormData() : {
            signType: document.getElementById('signType')?.value || 'faculty',
            name: document.getElementById('name')?.value || '',
            position: document.getElementById('position')?.value || '',
            email: document.getElementById('email')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            roomName: document.getElementById('roomName')?.value || '',
            showEmail: document.getElementById('showEmail') ? document.getElementById('showEmail').checked : true,
            showPhone: document.getElementById('showPhone') ? document.getElementById('showPhone').checked : true
        };
        
        console.log('Form data:', formData);
        
        const defaults = window.formManager ? window.formManager.getDefaultValues(formData.signType) : this.getDefaultValues(formData.signType);
        
        // Get actual values or use defaults
        const getName = () => formData.name || defaults.name || '';
        const getPosition = () => formData.position || defaults.position || '';
        const getEmail = () => formData.email || defaults.email || '';
        const getPhone = () => formData.phone || defaults.phone || '';
        const getRoomName = () => formData.roomName || defaults.roomName || '';

        let content = '';

        // Build content based on sign type
        if (formData.signType === 'faculty' || formData.signType === 'staff') {
            const name = getName();
            const position = getPosition();
            
            if (name) content += `<div class="name">${name}</div>`;
            if (position) content += `<div class="position">${position}</div>`;
            
            // Add contact info
            const email = getEmail();
            const phone = getPhone();
            if ((email && formData.showEmail) || (phone && formData.showPhone)) {
                content += '<div class="contact-info">';
                if (email && formData.showEmail) content += `<div>Email: ${email}</div>`;
                if (phone && formData.showPhone) content += `<div>Phone: ${phone}</div>`;
                content += '</div>';
            }
            
            // Add designations if enabled
            if (this.designationsToggle?.classList.contains('active')) {
                const checkedDesignations = Array.from(document.querySelectorAll('input[name="designations"]:checked'))
                    .map(checkbox => checkbox.value);
                if (checkedDesignations.length > 0) {
                    content += `<div class="designations">${checkedDesignations.join(', ')}</div>`;
                }
            }
        } 
        else if (formData.signType === 'student') {
            const name = getName();
            const email = getEmail();
            
            if (name) content += `<div class="name">${name}</div>`;
            if (email) {
                content += '<div class="contact-info">';
                content += `<div>Email: ${email}</div>`;
                content += '</div>';
            }
        }
        else if (formData.signType === 'lab' || formData.signType === 'general-room' || formData.signType === 'custodian-closet') {
            const roomName = getRoomName();
            if (roomName) content += `<div class="room-name">${roomName}</div>`;
        }

        // Update the content
        this.signContent.innerHTML = content;
        console.log('Sign content updated:', content);

        // Update alumni badge visibility
        this.updateAlumniBadgeVisibility();

        // Update department display
        this.updateDepartmentDisplay();
        
        // Re-apply card holder scaling if a card holder is selected
        if (window.cardHolderManager) {
            window.cardHolderManager.reapplyScalingIfNeeded();
        }
        
        console.log('Sign update complete');
    }

    updateDepartmentDisplay() {
        const deptType = document.getElementById('departmentType')?.value;
        const mainDept = document.getElementById('mainDepartment')?.value;
        const subDept = document.getElementById('subDepartment')?.value;
        const subSubDept = document.getElementById('subSubDepartment')?.value;

        // Use the most specific department level available for display
        let displayDept = '';
        if (subSubDept) {
            displayDept = subSubDept;
        } else if (subDept) {
            displayDept = subDept;
        } else if (mainDept) {
            displayDept = mainDept;
        }

        // Only update if we have department info
        if (deptType && displayDept) {
            this.updateSVGText(displayDept);
        } else {
            // Clear the text if no department is selected
            const textElement = document.querySelector('#svgDepartmentText');
            if (textElement) {
                textElement.innerHTML = '';
            }
        }
    }

    updateSVGText(departmentText) {
        const textElement = document.querySelector('#svgDepartmentText');
        if (!textElement) return;
        
        // Clear existing tspans
        textElement.innerHTML = '';
        
        if (departmentText) {
            // Split text into words and create lines
            const words = departmentText.split(' ');
            let currentLine = '';
            let lines = [];
            
            // Create lines with max 25 characters
            words.forEach(word => {
                if (currentLine.length + word.length + 1 <= 25) {
                    currentLine += (currentLine ? ' ' : '') + word;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            });
            if (currentLine) {
                lines.push(currentLine);
            }
            
            // Create tspans for each line
            lines.forEach((line, index) => {
                const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                tspan.setAttribute('x', '0');
                tspan.setAttribute('dy', index === 0 ? '0' : '10');
                tspan.textContent = line;
                textElement.appendChild(tspan);
            });

            // Adjust logo position if there are 3 or more lines
            const logoContainer = document.querySelector('.unbc-logo');
            if (logoContainer) {
                if (lines.length >= 3) {
                    logoContainer.style.transform = 'translate(0px, -10px)';
                } else {
                    logoContainer.style.transform = 'translate(0px, 0px)';
                }
            }
        }
    }
}

// Make available globally
window.SignRenderer = SignRenderer;
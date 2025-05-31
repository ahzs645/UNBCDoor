// Form management functionality
class FormManager {
    constructor() {
        this.signType = document.getElementById('signType');
        this.nameInput = document.getElementById('name');
        this.positionInput = document.getElementById('position');
        this.emailInput = document.getElementById('email');
        this.phoneInput = document.getElementById('phone');
        this.roomNameInput = document.getElementById('roomName');
        this.showEmail = document.getElementById('showEmail');
        this.showPhone = document.getElementById('showPhone');
        
        // Only setup basic form validation in constructor
        this.setupFormValidation();
        console.log('FormManager constructor completed');
    }

    setupEventListeners() {
        console.log('Setting up FormManager event listeners...');
        
        // Sign type change handler
        if (this.signType) {
            this.signType.addEventListener('change', () => {
                const type = this.signType.value;
                console.log('Sign type changed to:', type);
                this.updateFieldVisibility(type);
                // Sign update will be handled by app.js cross-component events
            });
        }

        // Input field event listeners will be handled by app.js
        console.log('FormManager event listeners setup complete');
    }

    setupFormValidation() {
        // Email validation
        if (this.emailInput) {
            this.emailInput.addEventListener('blur', () => {
                this.validateEmail(this.emailInput);
            });
        }

        // Phone validation and formatting will be handled by app.js
        console.log('Form validation setup complete');
    }

    validateEmail(emailInput) {
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email && !emailRegex.test(email)) {
            emailInput.style.borderColor = '#fc8181';
            emailInput.setAttribute('title', 'Please enter a valid email address');
            return false;
        } else {
            emailInput.style.borderColor = '';
            emailInput.removeAttribute('title');
            return true;
        }
    }

    updateFieldVisibility(signType) {
        console.log('Updating field visibility for sign type:', signType);

        // Define which fields should be visible for each sign type
        const fieldVisibility = {
            name: signType === 'faculty' || signType === 'staff' || signType === 'student' || signType === 'lab',
            position: signType === 'faculty' || signType === 'staff',
            email: signType === 'faculty' || signType === 'staff' || signType === 'student',
            phone: signType === 'faculty' || signType === 'staff',
            roomName: signType === 'lab' || signType === 'general-room' || signType === 'custodian-closet'
        };

        // Update field visibility
        Object.entries(fieldVisibility).forEach(([fieldName, shouldShow]) => {
            const element = document.getElementById(fieldName);
            if (element && element.parentElement) {
                element.parentElement.style.display = shouldShow ? 'block' : 'none';
            }
        });

        // Handle contact info group visibility
        const contactInfoGroup = document.querySelector('.contact-info-group');
        if (contactInfoGroup) {
            const shouldShowContactInfo = fieldVisibility.email || fieldVisibility.phone;
            contactInfoGroup.style.display = shouldShowContactInfo ? 'flex' : 'none';
        }

        // Update toggle buttons visibility
        const toggleButtonsContainer = document.querySelector('.toggle-buttons-container');
        if (toggleButtonsContainer) {
            const shouldShowToggles = signType === 'faculty' || signType === 'staff';
            toggleButtonsContainer.style.display = shouldShowToggles ? 'flex' : 'none';
        }

        // Update designations container visibility
        const designationsContainer = document.getElementById('designationsContainer');
        const designationsToggle = document.getElementById('designationsToggle');
        if (designationsContainer && designationsToggle) {
            const shouldShowDesignations = (signType === 'faculty' || signType === 'staff') && 
                designationsToggle.classList.contains('active');
            designationsContainer.style.display = shouldShowDesignations ? 'block' : 'none';
        }

        console.log('Field visibility updated');
    }

    getFormData() {
        return {
            signType: this.signType?.value || 'faculty',
            name: this.nameInput?.value || '',
            position: this.positionInput?.value || '',
            email: this.emailInput?.value || '',
            phone: this.phoneInput?.value || '',
            roomName: this.roomNameInput?.value || '',
            showEmail: this.showEmail ? this.showEmail.checked : true, // Default to true if element missing
            showPhone: this.showPhone ? this.showPhone.checked : true  // Default to true if element missing
        };
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

    validateForm() {
        let isValid = true;

        // Validate email if present
        if (this.emailInput && this.emailInput.value) {
            isValid = this.validateEmail(this.emailInput) && isValid;
        }

        // Validate phone if present
        if (this.phoneInput && this.phoneInput.value) {
            const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
            if (!phoneRegex.test(this.phoneInput.value)) {
                this.phoneInput.style.borderColor = '#fc8181';
                isValid = false;
            }
        }

        return isValid;
    }

    reset() {
        const form = document.getElementById('signForm');
        if (form) {
            form.reset();
            this.updateFieldVisibility(this.signType?.value || 'faculty');
        }
    }
}

// Make available globally
window.FormManager = FormManager;
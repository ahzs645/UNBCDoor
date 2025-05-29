// Controls component class
class Controls {
    constructor(element, doorSign) {
        this.element = element;
        this.doorSign = doorSign;
        this.config = null;
        this.setupEventListeners();
    }

    // Set up event listeners
    setupEventListeners() {
        // Sign type change
        this.element.querySelector('#signType').addEventListener('change', (e) => {
            this.updateFieldVisibility(e.target.value);
            this.updateSign();
        });

        // Department changes
        this.element.querySelector('#mainDepartment').addEventListener('change', () => this.updateSign());
        this.element.querySelector('#subDepartment').addEventListener('change', () => this.updateSign());

        // Name input
        this.element.querySelector('#name').addEventListener('input', () => this.updateSign());

        // Position input
        this.element.querySelector('#position').addEventListener('input', () => this.updateSign());

        // Contact info
        this.element.querySelector('#email').addEventListener('input', () => this.updateSign());
        this.element.querySelector('#phone').addEventListener('input', () => this.updateSign());

        // Room name
        this.element.querySelector('#roomName').addEventListener('input', () => this.updateSign());

        // Alumni checkbox
        this.element.querySelector('#isAlumni').addEventListener('change', () => this.updateSign());

        // Designations
        const enableDesignations = this.element.querySelector('#enableDesignations');
        enableDesignations.addEventListener('change', () => {
            const designationsContainer = this.element.querySelector('#designationsContainer');
            designationsContainer.style.display = enableDesignations.checked ? 'block' : 'none';
            this.updateSign();
        });

        // Designation checkboxes
        const designationCheckboxes = this.element.querySelectorAll('.designation-checkbox');
        designationCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateSign());
        });

        // Custom designation
        this.element.querySelector('#customDesignation').addEventListener('input', () => this.updateSign());

        // Export button
        this.element.querySelector('#exportButton').addEventListener('click', () => this.exportSign());
    }

    // Update field visibility based on sign type
    updateFieldVisibility(signType) {
        const fields = {
            name: ['faculty', 'staff', 'student', 'lab'],
            position: ['faculty', 'staff'],
            email: ['faculty', 'staff', 'student'],
            phone: ['faculty', 'staff'],
            roomName: ['general-room', 'custodian-closet'],
            isAlumni: ['faculty', 'staff', 'student'],
            enableDesignations: ['faculty', 'staff', 'student']
        };

        // Hide all fields first
        Object.keys(fields).forEach(field => {
            const element = this.element.querySelector(`#${field}`);
            if (element) {
                element.closest('.form-group').style.display = 'none';
            }
        });

        // Show relevant fields
        fields[signType]?.forEach(field => {
            const element = this.element.querySelector(`#${field}`);
            if (element) {
                element.closest('.form-group').style.display = 'block';
            }
        });

        // Special handling for designations
        const designationsContainer = this.element.querySelector('#designationsContainer');
        if (designationsContainer) {
            designationsContainer.style.display = 
                (signType === 'faculty' || signType === 'staff' || signType === 'student') &&
                this.element.querySelector('#enableDesignations').checked
                    ? 'block'
                    : 'none';
        }
    }

    // Update the sign with current form data
    updateSign() {
        const formData = this.getFormData();
        this.doorSign.update(formData, this.config);
    }

    // Get current form data
    getFormData() {
        const formData = {
            signType: this.element.querySelector('#signType').value,
            mainDepartment: this.element.querySelector('#mainDepartment').value,
            subDepartment: this.element.querySelector('#subDepartment').value,
            name: this.element.querySelector('#name').value,
            position: this.element.querySelector('#position').value,
            email: this.element.querySelector('#email').value,
            phone: this.element.querySelector('#phone').value,
            roomName: this.element.querySelector('#roomName').value,
            isAlumni: this.element.querySelector('#isAlumni').checked,
            enableDesignations: this.element.querySelector('#enableDesignations').checked
        };

        // Get selected designations
        if (formData.enableDesignations) {
            const selectedDesignations = [];
            this.element.querySelectorAll('.designation-checkbox:checked').forEach(checkbox => {
                selectedDesignations.push(checkbox.value);
            });
            formData.selectedDesignations = selectedDesignations;

            // Add custom designation if present
            const customDesignation = this.element.querySelector('#customDesignation').value;
            if (customDesignation) {
                formData.customDesignation = customDesignation;
            }
        }

        return formData;
    }

    // Export the sign as an image
    async exportSign() {
        try {
            const canvas = await this.doorSign.export();
            const link = document.createElement('a');
            link.download = 'door-sign.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Error exporting sign:', error);
            alert('Error exporting sign. Please try again.');
        }
    }

    // Reset the form
    reset() {
        this.element.reset();
        this.updateFieldVisibility(this.element.querySelector('#signType').value);
        this.updateSign();
    }

    // Set configuration
    setConfig(config) {
        this.config = config;
        this.updateSign();
    }
}

// Export the Controls class
export default Controls; 
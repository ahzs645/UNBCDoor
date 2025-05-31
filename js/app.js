// Main application initialization
class UNBCDoorSignApp {
    constructor() {
        this.components = {};
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // Wait for DOM to be fully loaded
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Wait for all external scripts to load
            await this.waitForDependencies();

            // Initialize components in order
            this.initializeComponents();
            
            // Connect all components after initialization
            this.connectComponents();
            
            // Set up initial state
            this.setupInitialState();
            
            this.isInitialized = true;
            console.log('UNBC Door Sign Generator initialized successfully');
        } catch (error) {
            console.error('Error initializing UNBC Door Sign Generator:', error);
        }
    }

    async waitForDependencies() {
        // Wait for external data to be available
        let attempts = 0;
        while (attempts < 50) { // Max 5 seconds
            if (typeof departmentTypes !== 'undefined' && 
                typeof cardHolders !== 'undefined' && 
                window.PhoneFormatter &&
                window.SignRenderer &&
                window.FormManager &&
                window.DepartmentSearch &&
                window.CardHolderManager &&
                window.ExportManager) {
                console.log('All dependencies loaded');
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        console.warn('Some dependencies may not have loaded properly');
    }

    initializeComponents() {
        console.log('Initializing components...');
        
        // Initialize sign renderer first (others depend on it)
        this.components.signRenderer = new window.SignRenderer();
        window.signRenderer = this.components.signRenderer;
        console.log('SignRenderer initialized');

        // Initialize form manager 
        this.components.formManager = new window.FormManager();
        window.formManager = this.components.formManager;
        console.log('FormManager initialized');

        // Initialize department search
        this.components.departmentSearch = new window.DepartmentSearch();
        window.departmentSearch = this.components.departmentSearch;
        console.log('DepartmentSearch initialized');

        // Initialize card holder manager
        this.components.cardHolderManager = new window.CardHolderManager();
        window.cardHolderManager = this.components.cardHolderManager;
        console.log('CardHolderManager initialized');

        // Initialize export manager
        this.components.exportManager = new window.ExportManager();
        window.exportManager = this.components.exportManager;
        console.log('ExportManager initialized');

        console.log('All components initialized:', Object.keys(this.components));
    }

    connectComponents() {
        console.log('Connecting components...');
        
        // Setup additional event listeners now that all components exist
        this.components.formManager.setupEventListeners();
        this.components.departmentSearch.setupProgressiveEventListeners();
        
        // Re-setup event listeners now that all components exist
        this.setupCrossComponentEvents();
        
        console.log('Components connected');
    }

    setupCrossComponentEvents() {
        // Department search should trigger sign updates
        const departmentInputs = [
            document.getElementById('departmentType'),
            document.getElementById('mainDepartment'),
            document.getElementById('subDepartment'),
            document.getElementById('subSubDepartment')
        ];

        departmentInputs.forEach(input => {
            if (input) {
                input.addEventListener('change', () => {
                    console.log('Department changed, updating sign');
                    this.components.signRenderer.updateSign();
                });
            }
        });

        // Form inputs should trigger sign updates
        const formInputs = [
            document.getElementById('signType'),
            document.getElementById('name'),
            document.getElementById('position'),
            document.getElementById('email'),
            document.getElementById('phone'),
            document.getElementById('roomName'),
            document.getElementById('showEmail'),
            document.getElementById('showPhone')
        ];

        formInputs.forEach(input => {
            if (input) {
                const events = input.type === 'checkbox' ? ['change'] : ['input', 'change'];
                events.forEach(eventType => {
                    input.addEventListener(eventType, () => {
                        console.log(`${input.id} changed, updating sign`);
                        this.components.signRenderer.updateSign();
                    });
                });
            }
        });

        // Card holder selection should trigger sign updates
        const cardHolderSelect = document.getElementById('cardHolderType');
        if (cardHolderSelect) {
            cardHolderSelect.addEventListener('change', () => {
                console.log('Card holder changed, updating sign');
                this.components.signRenderer.updateSign();
            });
        }

        console.log('Cross-component events setup complete');
    }

    setupInitialState() {
        console.log('Setting up initial state...');
        
        // Set initial state of alumni badge
        const alumniBadge = document.querySelector('.alumni-badge');
        if (alumniBadge) {
            alumniBadge.style.display = 'none';
        }

        // Initialize phone formatting
        const phoneInput = document.getElementById('phone');
        if (phoneInput && window.PhoneFormatter) {
            window.PhoneFormatter.setupPhoneInput(phoneInput);
            console.log('Phone formatting initialized');
        } else {
            console.warn('Phone input or PhoneFormatter not found');
        }

        // Trigger initial form state update
        const signType = document.getElementById('signType');
        if (signType) {
            this.components.formManager.updateFieldVisibility(signType.value);
            console.log('Initial field visibility set for:', signType.value);
        }

        // Initialize department dropdowns
        this.components.departmentSearch.populateMainDepartments();
        console.log('Department dropdowns initialized');

        // Update initial sign display
        this.components.signRenderer.updateSign();
        console.log('Initial sign display updated');

        // Show debugging info
        console.log('Current form state:', this.components.formManager.getFormData());

        console.log('Initial state setup complete');
    }

    // Method to get current application state
    getState() {
        return {
            formData: this.components.formManager?.getFormData(),
            selectedCardHolder: document.getElementById('cardHolderType')?.value,
            isAlumniActive: document.getElementById('alumniToggle')?.classList.contains('active'),
            isDesignationsActive: document.getElementById('designationsToggle')?.classList.contains('active')
        };
    }

    // Method to reset the application
    reset() {
        // Reset form
        this.components.formManager?.reset();

        // Reset toggles
        const alumniToggle = document.getElementById('alumniToggle');
        const designationsToggle = document.getElementById('designationsToggle');
        
        if (alumniToggle) {
            alumniToggle.classList.remove('active');
        }
        
        if (designationsToggle) {
            designationsToggle.classList.remove('active');
        }

        // Reset card holder selection
        const cardHolderType = document.getElementById('cardHolderType');
        if (cardHolderType) {
            cardHolderType.value = '';
            this.components.cardHolderManager?.updateCardHolderInfo('');
            this.components.cardHolderManager?.updateDoorSignDimensions('');
        }

        // Clear department search
        const departmentSearch = document.getElementById('departmentSearch');
        if (departmentSearch) {
            departmentSearch.value = '';
        }

        // Reset designations
        const designationCheckboxes = document.querySelectorAll('input[name="designations"]:checked');
        designationCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });

        // Update display
        this.components.signRenderer?.updateSign();

        console.log('Application reset');
    }

    // Method to export current configuration
    exportConfig() {
        const config = {
            state: this.getState(),
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(config, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `unbc-door-sign-config-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
    }

    // Method to handle errors gracefully
    handleError(error, context = 'Unknown') {
        console.error(`Error in ${context}:`, error);
        
        // Show user-friendly error message
        const errorMessage = document.createElement('div');
        errorMessage.textContent = `An error occurred in ${context}. Please refresh the page if the issue persists.`;
        errorMessage.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #fed7d7;
            color: #9b2c2c;
            padding: 12px 20px;
            border-radius: 8px;
            border: 1px solid #feb2b2;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(errorMessage);
        
        setTimeout(() => {
            if (errorMessage.parentNode) {
                errorMessage.parentNode.removeChild(errorMessage);
            }
        }, 5000);
    }
}

// Global error handler
window.addEventListener('error', (event) => {
    if (window.unbcApp) {
        window.unbcApp.handleError(event.error, 'Global');
    }
});

// Initialize the application
window.unbcApp = new UNBCDoorSignApp();

// Make reset function available globally for debugging
window.resetApp = () => {
    if (window.unbcApp) {
        window.unbcApp.reset();
    }
};

// Debug function to check component status
window.debugApp = () => {
    console.log('=== UNBC App Debug Info ===');
    console.log('App initialized:', window.unbcApp?.isInitialized);
    console.log('Components:', Object.keys(window.unbcApp?.components || {}));
    console.log('Global components available:', {
        SignRenderer: !!window.SignRenderer,
        FormManager: !!window.FormManager,
        DepartmentSearch: !!window.DepartmentSearch,
        CardHolderManager: !!window.CardHolderManager,
        ExportManager: !!window.ExportManager,
        PhoneFormatter: !!window.PhoneFormatter
    });
    console.log('Data available:', {
        departmentTypes: !!window.departmentTypes,
        cardHolders: !!window.cardHolders
    });
    
    // Test form inputs
    console.log('Form elements found:', {
        signType: !!document.getElementById('signType'),
        name: !!document.getElementById('name'),
        position: !!document.getElementById('position'),
        email: !!document.getElementById('email'),
        phone: !!document.getElementById('phone'),
        roomName: !!document.getElementById('roomName'),
        showEmail: !!document.getElementById('showEmail'),
        showPhone: !!document.getElementById('showPhone')
    });
    
    // Test current form values
    if (window.unbcApp?.components?.formManager) {
        console.log('Current form data:', window.unbcApp.components.formManager.getFormData());
    }
    
    // Test department search
    console.log('Department search element:', !!document.getElementById('departmentSearch'));
    
    // Test toggle buttons
    console.log('Toggle buttons found:', {
        alumniToggle: !!document.getElementById('alumniToggle'),
        designationsToggle: !!document.getElementById('designationsToggle')
    });
    
    console.log('=== End Debug Info ===');
};

// Test function to manually trigger sign update
window.testSignUpdate = () => {
    console.log('Testing sign update...');
    if (window.unbcApp?.components?.signRenderer) {
        window.unbcApp.components.signRenderer.updateSign();
        console.log('Sign update triggered');
    } else {
        console.error('SignRenderer not available');
    }
};

// Test function to check event listeners
window.testEventListeners = () => {
    console.log('Testing event listeners...');
    
    // Test name input
    const nameInput = document.getElementById('name');
    if (nameInput) {
        nameInput.value = 'Test Name';
        nameInput.dispatchEvent(new Event('input'));
        console.log('Name input test completed');
    }
    
    // Test sign type change
    const signType = document.getElementById('signType');
    if (signType) {
        const currentValue = signType.value;
        signType.value = 'staff';
        signType.dispatchEvent(new Event('change'));
        console.log('Sign type change test completed');
        // Reset
        signType.value = currentValue;
        signType.dispatchEvent(new Event('change'));
    }
};
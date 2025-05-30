// Enhanced phone number formatting
function formatPhoneNumber(input) {
    // Remove all non-digit characters
    let value = input.value.replace(/\D/g, '');
    
    // Format the number as the user types
    if (value.length > 0) {
        if (value.length <= 3) {
            input.value = value;
        } else if (value.length <= 6) {
            input.value = value.slice(0, 3) + '-' + value.slice(3);
        } else {
            input.value = value.slice(0, 3) + '-' + value.slice(3, 6) + '-' + value.slice(6, 10);
        }
    } else {
        input.value = '';
    }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners for phone formatting
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        // Format on input
        phoneInput.addEventListener('input', function() {
            formatPhoneNumber(this);
        });

        // Validate on blur
        phoneInput.addEventListener('blur', function() {
            if (this.value && !this.value.match(/^\d{3}-\d{3}-\d{4}$/)) {
                this.style.borderColor = '#fc8181';
                this.setAttribute('title', 'Please enter a valid phone number (XXX-XXX-XXXX)');
            } else {
                this.style.borderColor = '';
                this.removeAttribute('title');
            }
        });

        // Format on paste
        phoneInput.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const digits = pastedText.replace(/\D/g, '');
            this.value = digits;
            formatPhoneNumber(this);
        });
    }
}); 
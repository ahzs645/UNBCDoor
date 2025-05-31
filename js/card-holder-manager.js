// Card holder management functionality
class CardHolderManager {
    constructor() {
        this.cardHolderTypeSelect = document.getElementById('cardHolderType');
        this.cardHolderInfoDiv = document.getElementById('cardHolderInfo');
        this.doorSign = document.querySelector('.door-sign');
        this.currentCardHolderType = null; // Track current type for resize handling
        
        this.setupEventListeners();
        this.populateCardHolderTypes();
        this.setupResizeHandler();
    }

    setupResizeHandler() {
        // Handle window resize to adjust card holder preview on mobile
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // Re-apply card holder preview if one is selected
                if (this.currentCardHolderType) {
                    this.updateDoorSignDimensions(this.currentCardHolderType);
                }
            }, 250); // Debounce resize events
        });
    }

    setupEventListeners() {
        if (this.cardHolderTypeSelect) {
            this.cardHolderTypeSelect.addEventListener('change', (e) => {
                const type = e.target.value;
                console.log('Card holder type changed to:', type);
                this.currentCardHolderType = type || null; // Track current selection
                this.updateCardHolderInfo(type);
                this.updateDoorSignDimensions(type);
                // Sign update will be handled by app.js cross-component events
            });
        }
    }

    populateCardHolderTypes() {
        if (!this.cardHolderTypeSelect) {
            console.error('cardHolderType element not found');
            return;
        }
        
        this.cardHolderTypeSelect.innerHTML = '<option value="">Select Card Holder Type</option>';
        
        if (typeof cardHolders !== 'undefined' && cardHolders) {
            console.log('cardHolders found:', cardHolders);
            Object.entries(cardHolders).forEach(([type, spec]) => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = `${spec.name} (${spec.viewableArea.width}" × ${spec.viewableArea.height}")`;
                this.cardHolderTypeSelect.appendChild(option);
            });
            console.log('Card holder options populated successfully');
        } else {
            console.log('cardHolders object not found, retrying...');
            // Retry after a short delay to ensure cardHolders.js has loaded
            setTimeout(() => this.populateCardHolderTypes(), 100);
        }
    }

    updateCardHolderInfo(type) {
        if (!this.cardHolderInfoDiv) return;

        if (type && cardHolders[type]) {
            const spec = cardHolders[type];
            this.cardHolderInfoDiv.innerHTML = `
                <p><strong>Description:</strong> ${spec.description}</p>
                <p><strong>Viewable Area:</strong> ${spec.viewableArea.width}" × ${spec.viewableArea.height}"</p>
                <p><strong>Total Area:</strong> ${spec.totalArea.width}" × ${spec.totalArea.height}"</p>
                <p><strong>Border Width:</strong> ${spec.borderWidth}"</p>
            `;
            this.cardHolderInfoDiv.style.display = 'block';
        } else {
            this.cardHolderInfoDiv.style.display = 'none';
        }
    }

    updateDoorSignDimensions(type) {
        if (!this.doorSign) return;

        // Reset to default state first
        this.resetDoorSignToDefault();

        if (type && cardHolders && cardHolders[type]) {
            this.applyCardHolderPreview(type);
        }
    }

    resetDoorSignToDefault() {
        // Remove card holder preview class
        this.doorSign.classList.remove('card-holder-preview');
        
        // Reset door sign container to original size and styling
        this.doorSign.style.transform = 'none';
        this.doorSign.style.border = 'none';
        this.doorSign.style.padding = '0';
        this.doorSign.style.background = 'white';
        this.doorSign.style.width = '500px';
        this.doorSign.style.height = '300px';
        this.doorSign.style.borderRadius = '8px';
        this.doorSign.style.position = 'relative';
        this.doorSign.style.margin = '0 auto';
        this.doorSign.style.boxSizing = 'border-box';

        // Reset all child elements to default
        const signContent = this.doorSign.querySelector('.sign-content');
        const signHeader = this.doorSign.querySelector('.sign-header');

        if (signContent) {
            signContent.style.boxShadow = 'none';
            signContent.style.borderRadius = '';
            signContent.style.padding = '25px';
            signContent.style.height = '220px';
            signContent.style.width = '';
            signContent.style.background = 'white';
            signContent.style.display = 'flex';
            signContent.style.alignItems = 'center';
            signContent.style.justifyContent = 'space-between';
            signContent.style.margin = '';
            signContent.style.overflow = '';
            signContent.style.boxSizing = '';
            
            const mainContent = signContent.querySelector('.main-content');
            if (mainContent) {
                mainContent.style.flex = '1';
                mainContent.style.display = '';
                mainContent.style.flexDirection = '';
                mainContent.style.justifyContent = '';
                mainContent.style.gap = '';
                mainContent.style.overflow = '';
            }
        }

        if (signHeader) {
            signHeader.style.boxShadow = 'none';
            signHeader.style.height = '80px';
            signHeader.style.padding = '15px 20px';
            signHeader.style.width = '';
            signHeader.style.background = '#035b42';
            signHeader.style.borderRadius = '0';
            signHeader.style.margin = '';
            signHeader.style.boxSizing = '';
            signHeader.style.display = 'flex';
            signHeader.style.alignItems = 'center';
            signHeader.style.justifyContent = 'flex-start';
        }

        // Reset logo to original size and positioning
        this.resetLogoToDefault();

        // Reset alumni badge to original size and positioning
        this.resetAlumniBadgeToDefault();

        // Reset font sizes
        this.resetFontSizes();

        // Remove any existing info element
        const existingInfo = this.doorSign.querySelector('.card-holder-preview-info');
        if (existingInfo) {
            existingInfo.remove();
        }
    }

    resetLogoToDefault() {
        const logoContainer = this.doorSign.querySelector('.sign-header .unbc-logo');
        const logo = this.doorSign.querySelector('.sign-header .unbc-logo img, .sign-header .unbc-logo svg');
        
        if (logo) {
            logo.style.width = 'auto';
            logo.style.height = 'auto';
        }
        
        if (logoContainer) {
            logoContainer.style.transform = '';
            logoContainer.style.transformOrigin = '';
        }
    }

    resetAlumniBadgeToDefault() {
        const alumniBadge = this.doorSign.querySelector('.alumni-badge');
        if (alumniBadge) {
            alumniBadge.style.transform = '';
            alumniBadge.style.transformOrigin = '';
            alumniBadge.style.marginLeft = '20px';
            alumniBadge.style.flexShrink = '0';
            alumniBadge.style.alignSelf = 'center';
            alumniBadge.style.display = '';
            alumniBadge.style.alignItems = '';
            alumniBadge.style.justifyContent = '';
            alumniBadge.style.marginBottom = '';
            alumniBadge.style.marginTop = '';
        }
    }

    resetFontSizes() {
        const nameElements = this.doorSign.querySelectorAll('.name, .room-name');
        const positionElements = this.doorSign.querySelectorAll('.position');
        const contactElements = this.doorSign.querySelectorAll('.contact-info');
        const designationElements = this.doorSign.querySelectorAll('.designations');

        nameElements.forEach(el => el.style.fontSize = '24px');
        positionElements.forEach(el => el.style.fontSize = '18px');
        contactElements.forEach(el => el.style.fontSize = '14px');
        designationElements.forEach(el => el.style.fontSize = '14px');
    }

    applyCardHolderPreview(type) {
        this.doorSign.classList.add('card-holder-preview');
        
        const spec = cardHolders[type];
        const viewableWidthIn = spec.viewableArea.width;
        const viewableHeightIn = spec.viewableArea.height;
        const borderWidthIn = spec.borderWidth;

        // Calculate the aspect ratio of the viewable area
        const viewableAspectRatio = viewableWidthIn / viewableHeightIn;

        // Responsive preview width based on screen size
        const maxPreviewWidth = this.getResponsivePreviewWidth();
        const previewWidth = maxPreviewWidth;
        const previewHeight = previewWidth / viewableAspectRatio;

        // Calculate scaling factor compared to original DOOR SIGN (not card holder)
        const doorSignAspectRatio = 500 / 300; // Original door sign ratio
        const scaledDoorSignWidth = previewWidth;
        const scaledDoorSignHeight = scaledDoorSignWidth / doorSignAspectRatio; // Maintain door sign ratio

        // Calculate border thickness based on viewable area
        const borderRatio = borderWidthIn / viewableWidthIn;
        const borderThickness = borderRatio * previewWidth;

        // Set dimensions maintaining door sign aspect ratio
        this.doorSign.style.width = `${scaledDoorSignWidth}px`;
        this.doorSign.style.height = `${scaledDoorSignHeight}px`;
        this.doorSign.style.border = `${borderThickness}px solid #cbd5e0`;
        this.doorSign.style.borderRadius = '12px';
        this.doorSign.style.background = '#f7fafc';
        this.doorSign.style.position = 'relative';
        this.doorSign.style.padding = '0';
        this.doorSign.style.margin = '0 auto';
        this.doorSign.style.overflow = 'hidden'; // Ensure content respects rounded corners

        // Calculate scale based on door sign dimensions
        const scale = scaledDoorSignWidth / 500; // Scale based on door sign width
        
        this.updateContentAreas(scale, previewWidth, previewHeight, scaledDoorSignHeight);
        this.scaleFonts(scale);
        this.scaleAlumniBadge(scale);
    }

    getResponsivePreviewWidth() {
        const screenWidth = window.innerWidth;
        
        // Mobile breakpoints with appropriate preview sizes
        if (screenWidth <= 480) {
            return Math.min(300, screenWidth - 60); // Very small screens
        } else if (screenWidth <= 768) {
            return Math.min(350, screenWidth - 80); // Mobile screens
        } else if (screenWidth <= 1024) {
            return 400; // Tablet screens
        } else {
            return 450; // Desktop screens
        }
    }

    updateContentAreas(scale, previewWidth, previewHeight, scaledDoorSignHeight) {
        const signContent = this.doorSign.querySelector('.sign-content');
        const signHeader = this.doorSign.querySelector('.sign-header');
        
        // Update content areas
        if (signContent) {
            signContent.style.background = 'white';
            signContent.style.borderRadius = '0'; // Match container border radius
            signContent.style.boxShadow = 'none';
            
            const headerHeight = signHeader ? (80 * scale) : 0;
            const availableContentHeight = scaledDoorSignHeight - headerHeight;
            
            signContent.style.height = `${availableContentHeight}px`;
            signContent.style.width = `${previewWidth}px`;
            signContent.style.boxSizing = 'border-box';
            signContent.style.display = 'flex';
            signContent.style.alignItems = 'center';
            signContent.style.margin = '0';
            signContent.style.overflow = 'hidden';
            // Keep original padding ratio - don't over-scale
            signContent.style.padding = `${Math.max(15, 25 * scale)}px`;
            
            const mainContent = signContent.querySelector('.main-content');
            if (mainContent) {
                mainContent.style.flex = '1';
                mainContent.style.display = 'flex';
                mainContent.style.flexDirection = 'column';
                mainContent.style.justifyContent = 'flex-start';
                // Much more conservative gap scaling to maintain original spacing feel
                mainContent.style.gap = scale > 0.8 ? '' : `${Math.max(1, 2 * scale)}px`;
                mainContent.style.overflow = 'hidden';
            }
        }
        
        // Update header
        if (signHeader) {
            signHeader.style.background = '#035b42';
            signHeader.style.borderRadius = '0'; // Match container border radius
            signHeader.style.boxShadow = 'none'; // Remove conflicting shadow
            
            const scaledHeaderHeight = Math.max(60, 80 * scale);
            // More conservative header padding scaling
            const scaledHeaderPadding = Math.max(12, 15 * scale);
            
            signHeader.style.height = `${scaledHeaderHeight}px`;
            signHeader.style.padding = `${scaledHeaderPadding}px ${scaledHeaderPadding}px`;
            signHeader.style.width = `${previewWidth}px`;
            signHeader.style.boxSizing = 'border-box';
            signHeader.style.margin = '0';
            signHeader.style.display = 'flex';
            signHeader.style.alignItems = 'center';
            signHeader.style.justifyContent = 'space-between';
            
            this.scaleLogo(scale);
        }
    }

    scaleLogo(scale) {
        const logoContainer = this.doorSign.querySelector('.sign-header .unbc-logo');
        const logo = this.doorSign.querySelector('.sign-header .unbc-logo img, .sign-header .unbc-logo svg');
        
        if (logo) {
            // Less aggressive logo scaling - keep it more visible
            const logoScale = Math.max(0.6, scale * 0.9); // Increased minimum and factor
            logo.style.width = `${200 * logoScale}px`;
            logo.style.height = 'auto';
        }
        
        if (logoContainer) {
            // Keep container scaling reasonable
            const containerScale = Math.max(0.7, Math.min(1.0, scale)); // Increased minimum
            logoContainer.style.transform = `scale(${containerScale})`;
            logoContainer.style.transformOrigin = 'center';
        }
    }

     scaleFonts(scale) {
        // More responsive font scaling - allow smaller fonts on mobile
        const screenWidth = window.innerWidth;
        const isCardHolderPreview = this.doorSign.classList.contains('card-holder-preview');
        let fontScale;
        
        if (isCardHolderPreview) {
            // Card holder previews need more aggressive scaling
            if (screenWidth <= 480) {
                // Very small screens with card holder: very aggressive scaling
                fontScale = Math.max(0.3, scale * 0.7);
            } else if (screenWidth <= 768) {
                // Mobile screens with card holder: aggressive scaling
                fontScale = Math.max(0.4, scale * 0.75);
            } else {
                // Desktop screens with card holder: moderate scaling
                fontScale = Math.max(0.6, scale * 0.85);
            }
        } else {
            // Regular door sign scaling (non card holder)
            if (screenWidth <= 480) {
                fontScale = Math.max(0.4, scale * 0.8);
            } else if (screenWidth <= 768) {
                fontScale = Math.max(0.5, scale * 0.85);
            } else {
                fontScale = Math.max(0.7, scale * 0.9);
            }
        }
        
        console.log(`Font scaling - Screen: ${screenWidth}px, Scale: ${scale}, Font scale: ${fontScale}, Card holder: ${isCardHolderPreview}`);

        const nameElements = this.doorSign.querySelectorAll('.name, .room-name');
        const positionElements = this.doorSign.querySelectorAll('.position');
        const contactElements = this.doorSign.querySelectorAll('.contact-info');
        const designationElements = this.doorSign.querySelectorAll('.designations');

        nameElements.forEach(el => {
            const fontSize = 24 * fontScale;
            el.style.fontSize = `${fontSize}px`;
            el.style.lineHeight = '1.2';
            el.style.marginBottom = scale > 0.8 ? '8px' : `${Math.max(2, 8 * fontScale)}px`;
            console.log(`Name font size set to: ${fontSize}px`);
        });

        positionElements.forEach(el => {
            const fontSize = 18 * fontScale;
            el.style.fontSize = `${fontSize}px`;
            el.style.lineHeight = '1.2';
            el.style.marginBottom = scale > 0.8 ? '12px' : `${Math.max(3, 12 * fontScale)}px`;
            console.log(`Position font size set to: ${fontSize}px`);
        });

        contactElements.forEach(el => {
            const fontSize = 14 * fontScale;
            el.style.fontSize = `${fontSize}px`;
            el.style.lineHeight = '1.3';
            el.style.marginTop = scale > 0.8 ? '12px' : `${Math.max(3, 12 * fontScale)}px`;
            console.log(`Contact font size set to: ${fontSize}px`);
            
            const contactDivs = el.querySelectorAll('div');
            contactDivs.forEach(div => {
                div.style.marginBottom = scale > 0.8 ? '3px' : `${Math.max(1, 3 * fontScale)}px`;
            });
        });

        designationElements.forEach(el => {
            const fontSize = 14 * fontScale;
            el.style.fontSize = `${fontSize}px`;
            el.style.lineHeight = '1.3';
            el.style.marginTop = scale > 0.8 ? '8px' : `${Math.max(2, 8 * fontScale)}px`;
        });
    }

    scaleAlumniBadge(scale) {
        const alumniBadge = this.doorSign.querySelector('.alumni-badge');
        if (alumniBadge) {
            // Less aggressive badge scaling - keep it more visible
            const badgeScale = Math.max(0.6, scale * 0.8); // Increased minimum and factor
            alumniBadge.style.transform = `scale(${badgeScale})`;
            alumniBadge.style.transformOrigin = 'center';
            
            // Better positioning and centering
            alumniBadge.style.marginLeft = `${Math.max(8, 15 * scale)}px`;
            alumniBadge.style.flexShrink = '0';
            alumniBadge.style.alignSelf = 'center'; // Center vertically instead of flex-end
            alumniBadge.style.display = 'flex';
            alumniBadge.style.alignItems = 'center';
            alumniBadge.style.justifyContent = 'center';
            
            // Remove bottom margin that was pushing it off-center
            alumniBadge.style.marginBottom = '0';
            alumniBadge.style.marginTop = '0';
        }
    }

    // Method to re-apply scaling after sign updates
    reapplyScalingIfNeeded() {
        if (this.currentCardHolderType && cardHolders && cardHolders[this.currentCardHolderType]) {
            console.log('Re-applying card holder scaling after sign update');
            const spec = cardHolders[this.currentCardHolderType];
            const maxPreviewWidth = this.getResponsivePreviewWidth();
            const scaledDoorSignWidth = maxPreviewWidth;
            let scale = scaledDoorSignWidth / 500;
            
            // Apply the same aggressive scaling as in applyCardHolderPreview
            const screenWidth = window.innerWidth;
            if (screenWidth <= 480 && scale < 0.8) {
                scale = scale * 0.8;
            } else if (screenWidth <= 768 && scale < 0.9) {
                scale = scale * 0.9;
            }
            
            this.scaleFonts(scale);
        }
    }
}

// Make available globally
window.CardHolderManager = CardHolderManager;
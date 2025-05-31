class DoorSign {
    constructor(element) {
        this.element = element;
        this.config = null;
        this.data = null;
        this.initialState = {
            name: '',
            position: '',
            email: '',
            phone: '',
            roomName: ''
        };
    }

    update(data, config) {
        // Check if any field has been modified from its initial state
        const isModified = (
            data.name !== this.initialState.name ||
            data.position !== this.initialState.position ||
            data.email !== this.initialState.email ||
            data.phone !== this.initialState.phone ||
            data.roomName !== this.initialState.roomName
        );
        
        this.data = data;
        this.config = config;
        this.render(isModified);
    }

    render(showPlaceholders = true) {
        const mainContent = this.element.querySelector('.main-content');
        if (!mainContent) return;

        // Clear previous content
        mainContent.innerHTML = '';

        // If showing placeholders, display them
        if (showPlaceholders) {
            if (this.data.signType === 'faculty' || this.data.signType === 'staff') {
                const nameTitle = document.createElement('div');
                nameTitle.className = 'name-title';
                nameTitle.textContent = 'Dr. John Smith';
                mainContent.appendChild(nameTitle);

                const positionDiv = document.createElement('div');
                positionDiv.className = 'position';
                positionDiv.textContent = 'Professor';
                mainContent.appendChild(positionDiv);

                const contactInfo = document.createElement('div');
                contactInfo.className = 'contact-info';
                const emailDiv = document.createElement('div');
                emailDiv.textContent = 'Email: john.smith@unbc.ca';
                contactInfo.appendChild(emailDiv);
                const phoneDiv = document.createElement('div');
                phoneDiv.textContent = 'Phone: 250-960-5555';
                contactInfo.appendChild(phoneDiv);
                mainContent.appendChild(contactInfo);

                if (this.data.enableDesignations) {
                    const designationsDiv = document.createElement('div');
                    designationsDiv.className = 'designations';
                    designationsDiv.textContent = 'PhD';
                    mainContent.appendChild(designationsDiv);
                }
            } else if (this.data.signType === 'student') {
                const nameTitle = document.createElement('div');
                nameTitle.className = 'name-title';
                nameTitle.textContent = 'Student Name';
                mainContent.appendChild(nameTitle);

                const contactInfo = document.createElement('div');
                contactInfo.className = 'contact-info';
                const emailDiv = document.createElement('div');
                emailDiv.textContent = 'Email: student@unbc.ca';
                contactInfo.appendChild(emailDiv);
                mainContent.appendChild(contactInfo);
            } else if (this.data.signType === 'lab') {
                const nameTitle = document.createElement('div');
                nameTitle.className = 'name-title';
                nameTitle.textContent = 'Research Lab';
                mainContent.appendChild(nameTitle);
            } else if (this.data.signType === 'general-room' || this.data.signType === 'custodian-closet') {
                const nameTitle = document.createElement('div');
                nameTitle.className = 'name-title';
                nameTitle.textContent = 'Room 101';
                mainContent.appendChild(nameTitle);
            }
        } else {
            // Show only the fields that have actual content
            if (this.data.signType === 'faculty' || this.data.signType === 'staff') {
                if (this.data.name) {
                    const nameTitle = document.createElement('div');
                    nameTitle.className = 'name-title';
                    nameTitle.textContent = this.data.name;
                    mainContent.appendChild(nameTitle);
                }

                if (this.data.position) {
                    const positionDiv = document.createElement('div');
                    positionDiv.className = 'position';
                    positionDiv.textContent = this.data.position;
                    mainContent.appendChild(positionDiv);
                }

                if (this.data.email || this.data.phone) {
                    const contactInfo = document.createElement('div');
                    contactInfo.className = 'contact-info';
                    if (this.data.email) {
                        const emailDiv = document.createElement('div');
                        emailDiv.textContent = `Email: ${this.data.email}`;
                        contactInfo.appendChild(emailDiv);
                    }
                    if (this.data.phone) {
                        const phoneDiv = document.createElement('div');
                        phoneDiv.textContent = `Phone: ${this.data.phone}`;
                        contactInfo.appendChild(phoneDiv);
                    }
                    mainContent.appendChild(contactInfo);
                }

                if (this.data.enableDesignations && this.data.selectedDesignations && this.data.selectedDesignations.length > 0) {
                    const designationsDiv = document.createElement('div');
                    designationsDiv.className = 'designations';
                    designationsDiv.textContent = this.data.selectedDesignations.join(', ');
                    mainContent.appendChild(designationsDiv);
                }
            } else if (this.data.signType === 'student') {
                if (this.data.name) {
                    const nameTitle = document.createElement('div');
                    nameTitle.className = 'name-title';
                    nameTitle.textContent = this.data.name;
                    mainContent.appendChild(nameTitle);
                }

                if (this.data.email) {
                    const contactInfo = document.createElement('div');
                    contactInfo.className = 'contact-info';
                    const emailDiv = document.createElement('div');
                    emailDiv.textContent = `Email: ${this.data.email}`;
                    contactInfo.appendChild(emailDiv);
                    mainContent.appendChild(contactInfo);
                }
            } else if (this.data.signType === 'lab') {
                if (this.data.roomName) {
                    const nameTitle = document.createElement('div');
                    nameTitle.className = 'name-title';
                    nameTitle.textContent = this.data.roomName;
                    mainContent.appendChild(nameTitle);
                }
            } else if (this.data.signType === 'general-room' || this.data.signType === 'custodian-closet') {
                if (this.data.roomName) {
                    const nameTitle = document.createElement('div');
                    nameTitle.className = 'name-title';
                    nameTitle.textContent = this.data.roomName;
                    mainContent.appendChild(nameTitle);
                }
            }
        }

        // Update alumni badge visibility
        const alumniBadge = this.element.querySelector('.alumni-badge');
        if (alumniBadge) {
            alumniBadge.style.display = this.data.isAlumni ? 'block' : 'none';
        }
    }
}

export default DoorSign; 
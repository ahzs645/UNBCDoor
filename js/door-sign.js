class DoorSign {
    constructor(element) {
        this.element = element;
        this.config = null;
        this.data = null;
    }

    update(data, config) {
        this.data = data;
        this.config = config;
        this.render();
    }

    render() {
        const mainContent = this.element.querySelector('.main-content');
        if (!mainContent) return;

        // Clear previous content
        mainContent.innerHTML = '';

        // Create content based on sign type
        if (this.data.signType === 'faculty' || this.data.signType === 'staff') {
            // Faculty/Staff template
            const nameTitle = document.createElement('div');
            nameTitle.className = 'name-title';
            nameTitle.textContent = this.data.name || 'Dr. John Smith';
            mainContent.appendChild(nameTitle);

            const positionDiv = document.createElement('div');
            positionDiv.className = 'position';
            positionDiv.textContent = this.data.position || 'Professor';
            mainContent.appendChild(positionDiv);

            const contactInfo = document.createElement('div');
            contactInfo.className = 'contact-info';
            const emailDiv = document.createElement('div');
            emailDiv.textContent = `Email: ${this.data.email || 'john.smith@unbc.ca'}`;
            contactInfo.appendChild(emailDiv);
            const phoneDiv = document.createElement('div');
            phoneDiv.textContent = `Phone: ${this.data.phone || '250-960-5555'}`;
            contactInfo.appendChild(phoneDiv);
            mainContent.appendChild(contactInfo);

            if (this.data.enableDesignations) {
                const designationsDiv = document.createElement('div');
                designationsDiv.className = 'designations';
                designationsDiv.textContent = (this.data.selectedDesignations || ['PhD']).join(', ');
                mainContent.appendChild(designationsDiv);
            }
        } else if (this.data.signType === 'student') {
            // Student template
            const nameTitle = document.createElement('div');
            nameTitle.className = 'name-title';
            nameTitle.textContent = this.data.name || 'Student Name';
            mainContent.appendChild(nameTitle);

            const contactInfo = document.createElement('div');
            contactInfo.className = 'contact-info';
            const emailDiv = document.createElement('div');
            emailDiv.textContent = `Email: ${this.data.email || 'student@unbc.ca'}`;
            contactInfo.appendChild(emailDiv);
            mainContent.appendChild(contactInfo);
        } else if (this.data.signType === 'lab') {
            // Lab template
            const nameTitle = document.createElement('div');
            nameTitle.className = 'name-title';
            nameTitle.textContent = this.data.roomName || 'Research Lab';
            mainContent.appendChild(nameTitle);
        } else if (this.data.signType === 'general-room' || this.data.signType === 'custodian-closet') {
            // Room template
            const nameTitle = document.createElement('div');
            nameTitle.className = 'name-title';
            nameTitle.textContent = this.data.roomName || 'Room 101';
            mainContent.appendChild(nameTitle);
        }

        // Update alumni badge visibility
        const alumniBadge = this.element.querySelector('.alumni-badge');
        if (alumniBadge) {
            alumniBadge.style.display = this.data.isAlumni ? 'block' : 'none';
        }
    }
}

export default DoorSign; 
import DoorSign from './door-sign.js';

// Department data structure
const departmentData = {
    "Faculty of Business and Economics": [
        "Accounting",
        "Finance",
        "International Business",
        "Marketing",
        "Management"
    ],
    "Faculty of Environment": [
        "Ecosystem Science and Management",
        "Environmental Planning",
        "Forest Ecology and Management",
        "Natural Resources Management",
        "Wildlife and Fisheries"
    ],
    "Faculty of Human and Health Sciences": [
        "Community Health",
        "Nursing",
        "Psychology",
        "Social Work"
    ],
    "Faculty of Indigenous Studies, Social Sciences and Humanities": [
        "Anthropology",
        "English",
        "First Nations Studies",
        "Geography",
        "History",
        "Political Science",
        "Sociology"
    ],
    "Faculty of Science and Engineering": [
        "Biology",
        "Chemistry",
        "Computer Science",
        "Engineering",
        "Mathematics",
        "Physics"
    ],
    "School of Education": [],
    "School of Planning and Sustainability": [],
    "School of Social Work": [],
    "Other": []
};

// Door sign type configurations
const DOOR_SIGN_TYPES = {
    faculty: {
        showPosition: true,
        showContact: true,
        showDesignations: true,
        showAlumni: true,
        showDepartment: true
    },
    staff: {
        showPosition: true,
        showContact: true,
        showDesignations: true,
        showAlumni: true,
        showDepartment: true
    },
    student: {
        showPosition: false,
        showContact: true,
        showDesignations: false,
        showAlumni: true,
        showDepartment: true
    },
    'general-room': {
        showPosition: false,
        showContact: false,
        showDesignations: false,
        showAlumni: false,
        showDepartment: true
    },
    'custodian-closet': {
        showPosition: false,
        showContact: false,
        showDesignations: false,
        showAlumni: false,
        showDepartment: true
    },
    lab: {
        showPosition: false,
        showContact: false,
        showDesignations: false,
        showAlumni: false,
        showDepartment: true
    }
};

// DOM Elements
const signForm = document.getElementById('signForm');
const signType = document.getElementById('signType');
const mainDepartment = document.getElementById('mainDepartment');
const subDepartment = document.getElementById('subDepartment');
const subDepartmentGroup = document.getElementById('subDepartmentGroup');
const nameInput = document.getElementById('name');
const positionInput = document.getElementById('position');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const roomNameInput = document.getElementById('roomName');
const isAlumniCheckbox = document.getElementById('isAlumni');
const enableDesignationsCheckbox = document.getElementById('enableDesignations');
const designationsContainer = document.getElementById('designationsContainer');
const doorSignElement = document.querySelector('.door-sign');

// Initialize door sign
let doorSign;
if (doorSignElement) {
    doorSign = new DoorSign(doorSignElement);
}

// Designation list
const designationList = [
    "PhD", "MD", "MA", "MBA", "MSc", "BSc", "BA", "BEd", "BEng",
    "PEng", "PGeo", "R.P.Bio", "R.P.F", "R.P.T", "R.N", "R.S.W"
];

// Initialize designation options
function initializeDesignationOptions() {
    const container = document.createElement('div');
    container.className = 'designation-options';

    designationList.forEach(designation => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = designation;
        checkbox.name = 'designations';
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(designation));
        container.appendChild(label);
    });

    const customInput = document.createElement('div');
    customInput.className = 'custom-designation';
    customInput.innerHTML = `
        <label for="customDesignation">Custom Designation:</label>
        <input type="text" id="customDesignation" name="customDesignation" 
               placeholder="Enter custom designation(s) separated by commas">
    `;

    designationsContainer.appendChild(container);
    designationsContainer.appendChild(customInput);
}

// Populate main departments
function populateMainDepartments() {
    mainDepartment.innerHTML = '<option value="">Select Department</option>';
    
    // Add academic departments
    const academicDepts = departmentTypes.academic.departments["Provost and Vice-President, Academic"];
    Object.keys(academicDepts).forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        mainDepartment.appendChild(option);
    });

    // Add administrative departments
    const adminDepts = departmentTypes.administrative.departments;
    Object.keys(adminDepts).forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        mainDepartment.appendChild(option);
    });
}

// Populate sub-departments
function populateSubDepartments(mainDept) {
    subDepartment.innerHTML = '<option value="">Select Sub-Department</option>';
    
    // Check academic departments
    const academicDepts = departmentTypes.academic.departments["Provost and Vice-President, Academic"];
    if (academicDepts[mainDept]) {
        const subDepts = academicDepts[mainDept];
        if (typeof subDepts === 'object' && !Array.isArray(subDepts)) {
            Object.keys(subDepts).forEach(subDept => {
                const option = document.createElement('option');
                option.value = subDept;
                option.textContent = subDept;
                subDepartment.appendChild(option);
            });
            subDepartmentGroup.style.display = 'block';
        } else {
            subDepartmentGroup.style.display = 'none';
        }
        return;
    }

    // Check administrative departments
    const adminDepts = departmentTypes.administrative.departments;
    if (adminDepts[mainDept]) {
        const subDepts = adminDepts[mainDept];
        if (typeof subDepts === 'object' && !Array.isArray(subDepts)) {
            Object.keys(subDepts).forEach(subDept => {
                const option = document.createElement('option');
                option.value = subDept;
                option.textContent = subDept;
                subDepartment.appendChild(option);
            });
            subDepartmentGroup.style.display = 'block';
        } else {
            subDepartmentGroup.style.display = 'none';
        }
        return;
    }

    subDepartmentGroup.style.display = 'none';
}

// Wrap text to fit width
function wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = currentLine.length + word.length + 1;
        
        if (width < maxWidth) {
            currentLine += ' ' + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

// Update sign preview
function updateSign() {
    if (!doorSign) return;

    const type = signType.value;
    const mainDept = mainDepartment.value;
    const subDept = subDepartment.value;
    const name = nameInput.value;
    const position = positionInput.value;
    const email = emailInput.value;
    const phone = phoneInput.value;
    const roomName = roomNameInput.value;
    const isAlumni = isAlumniCheckbox.checked;
    const enableDesignations = enableDesignationsCheckbox.checked;

    // Get selected designations
    const selectedDesignations = Array.from(document.querySelectorAll('input[name="designations"]:checked'))
        .map(checkbox => checkbox.value);

    // Set default values based on sign type
    let defaultName, defaultPosition, defaultEmail, defaultPhone, defaultRoomName;
    
    if (type === 'faculty' || type === 'staff') {
        defaultName = 'Dr. John Smith';
        defaultPosition = 'Professor';
        defaultEmail = 'john.smith@unbc.ca';
        defaultPhone = '250-960-5555';
    } else if (type === 'student') {
        defaultName = 'Student Name';
        defaultEmail = 'student@unbc.ca';
    } else if (type === 'lab') {
        defaultRoomName = 'Research Lab';
    } else {
        defaultRoomName = 'Room 101';
    }

    // Update door sign with new data
    doorSign.update({
        signType: type,
        mainDepartment: mainDept,
        subDepartment: subDept,
        name: name || defaultName,
        position: position || defaultPosition,
        email: email || defaultEmail,
        phone: phone || defaultPhone,
        roomName: roomName || defaultRoomName,
        isAlumni: isAlumni,
        enableDesignations: enableDesignations,
        selectedDesignations: selectedDesignations.length > 0 ? selectedDesignations : ['PhD']
    }, DOOR_SIGN_TYPES[type]);
}

// Event Listeners
mainDepartment.addEventListener('change', () => {
    populateSubDepartments(mainDepartment.value);
    updateSign();
});

subDepartment.addEventListener('change', updateSign);
nameInput.addEventListener('input', updateSign);
positionInput.addEventListener('input', updateSign);
emailInput.addEventListener('input', updateSign);
phoneInput.addEventListener('input', updateSign);
roomNameInput.addEventListener('input', updateSign);
isAlumniCheckbox.addEventListener('change', updateSign);
enableDesignationsCheckbox.addEventListener('change', () => {
    designationsContainer.style.display = enableDesignationsCheckbox.checked ? 'block' : 'none';
    updateSign();
});

document.querySelectorAll('input[name="designations"]').forEach(checkbox => {
    checkbox.addEventListener('change', updateSign);
});

document.getElementById('customDesignation').addEventListener('input', updateSign);

signType.addEventListener('change', () => {
    const isFacultyOrStaff = signType.value === 'faculty' || signType.value === 'staff';
    positionInput.parentElement.style.display = isFacultyOrStaff ? 'block' : 'none';
    emailInput.parentElement.style.display = isFacultyOrStaff ? 'block' : 'none';
    phoneInput.parentElement.style.display = isFacultyOrStaff ? 'block' : 'none';
    isAlumniCheckbox.parentElement.style.display = isFacultyOrStaff ? 'block' : 'none';
    enableDesignationsCheckbox.parentElement.style.display = isFacultyOrStaff ? 'block' : 'none';
    updateSign();
});

exportBtn.addEventListener('click', () => {
    html2canvas(doorSign).then(canvas => {
        const link = document.createElement('a');
        link.download = 'unbc-door-sign.png';
        link.href = canvas.toDataURL();
        link.click();
    });
});

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeDesignationOptions();
    populateMainDepartments();
    // Trigger initial sign type change to set up form
    if (signType) {
        signType.dispatchEvent(new Event('change'));
    }
    updateSign();
}); 
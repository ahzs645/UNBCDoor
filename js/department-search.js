// Department search functionality
class DepartmentSearch {
    constructor() {
        this.departmentSearchInput = document.getElementById('departmentSearch');
        this.departmentType = document.getElementById('departmentType');
        this.mainDepartment = document.getElementById('mainDepartment');
        this.subDepartment = document.getElementById('subDepartment');
        this.subSubDepartment = document.getElementById('subSubDepartment');
        
        // Only setup basic search functionality in constructor
        this.setupSearchEventListeners();
        console.log('DepartmentSearch constructor completed');
    }

    setupSearchEventListeners() {
        console.log('Setting up department search event listeners...');
        
        if (this.departmentSearchInput) {
            this.departmentSearchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                console.log('Department search input:', query);
                
                if (query.length > 0) {
                    this.showSearchResults(query);
                } else {
                    // If search is cleared, hide results but don't clear department selections
                    this.hideSearchResults();
                }
            });
            
            // Handle when the input loses focus
            this.departmentSearchInput.addEventListener('blur', () => {
                // Small delay to allow click on search results
                setTimeout(() => {
                    this.hideSearchResults();
                }, 150);
            });
        }

        // Close search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-input') && !e.target.closest('.search-results')) {
                this.hideSearchResults();
            }
        });

        // Also close search results when pressing Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideSearchResults();
            }
        });

        console.log('Department search event listeners setup complete');
    }

    setupProgressiveEventListeners() {
        console.log('Setting up progressive department selection listeners...');
        
        // Progressive department selection - called after all components are ready
        if (this.departmentType) {
            this.departmentType.addEventListener('change', () => {
                console.log('Department type changed');
                this.populateMainDepartments();
                // Sign update will be handled by app.js cross-component events
            });
        }

        if (this.mainDepartment) {
            this.mainDepartment.addEventListener('change', () => {
                console.log('Main department changed');
                this.populateSubDepartments(this.mainDepartment.value);
                // Sign update will be handled by app.js cross-component events
            });
        }

        if (this.subDepartment) {
            this.subDepartment.addEventListener('change', () => {
                console.log('Sub department changed');
                this.populateSubSubDepartments(this.mainDepartment.value, this.subDepartment.value);
                // Sign update will be handled by app.js cross-component events
            });
        }

        if (this.subSubDepartment) {
            this.subSubDepartment.addEventListener('change', () => {
                console.log('Sub-sub department changed');
                // Sign update will be handled by app.js cross-component events
            });
        }

        console.log('Progressive department selection listeners setup complete');
    }

    searchDepartments(query) {
        query = query.toLowerCase();
        const results = [];

        if (typeof departmentTypes !== 'undefined') {
            Object.entries(departmentTypes).forEach(([type, typeData]) => {
                if (typeData.departments && typeof typeData.departments === 'object') {
                    Object.entries(typeData.departments).forEach(([mainDept, subDepts]) => {
                        if (mainDept.toLowerCase().includes(query)) {
                            results.push({
                                type,
                                mainDept,
                                path: `${typeData.name} > ${mainDept}`
                            });
                        }

                        if (typeof subDepts === 'object' && !Array.isArray(subDepts)) {
                            Object.entries(subDepts).forEach(([subDept, subSubDepts]) => {
                                if (subDept.toLowerCase().includes(query)) {
                                    results.push({
                                        type,
                                        mainDept,
                                        subDept,
                                        path: `${typeData.name} > ${mainDept} > ${subDept}`
                                    });
                                }

                                if (typeof subSubDepts === 'object' && !Array.isArray(subSubDepts)) {
                                    Object.entries(subSubDepts).forEach(([subSubDept, _]) => {
                                        if (subSubDept.toLowerCase().includes(query)) {
                                            results.push({
                                                type,
                                                mainDept,
                                                subDept,
                                                subSubDept,
                                                path: `${typeData.name} > ${mainDept} > ${subDept} > ${subSubDept}`
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }

        return results;
    }

    showSearchResults(query) {
        // First, completely remove any existing search results
        this.hideSearchResults();

        const results = this.searchDepartments(query);
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'search-results';

        if (results.length > 0) {
            results.forEach(result => {
                const div = document.createElement('div');
                div.className = 'search-result-item';
                div.textContent = result.path;
                div.addEventListener('click', () => {
                    console.log('Search result selected:', result.path);
                    this.selectSearchResult(result);
                    // Completely remove the results container after selection
                    this.hideSearchResults();
                });
                resultsContainer.appendChild(div);
            });
            resultsContainer.style.display = 'block';
        } else {
            resultsContainer.style.display = 'none';
        }

        if (this.departmentSearchInput && this.departmentSearchInput.parentNode) {
            this.departmentSearchInput.parentNode.appendChild(resultsContainer);
        }
    }

    hideSearchResults() {
        // Find and completely remove ALL existing search results containers
        const existingResults = document.querySelectorAll('.search-results');
        existingResults.forEach(container => {
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        });
    }

    selectSearchResult(result) {
        console.log('Selecting search result:', result);
        
        // Clear the search input to show the selection was made
        if (this.departmentSearchInput) {
            this.departmentSearchInput.value = '';
        }
        
        // Hide search results immediately
        this.hideSearchResults();
        
        // Set the department values
        if (this.departmentType) this.departmentType.value = result.type;
        this.populateMainDepartments();
        
        setTimeout(() => {
            if (this.mainDepartment) this.mainDepartment.value = result.mainDept;
            this.populateSubDepartments(result.mainDept);
            
            setTimeout(() => {
                if (result.subDept && this.subDepartment) {
                    this.subDepartment.value = result.subDept;
                    this.populateSubSubDepartments(result.mainDept, result.subDept);
                    
                    setTimeout(() => {
                        if (result.subSubDept && this.subSubDepartment) {
                            this.subSubDepartment.value = result.subSubDept;
                        }
                        // Trigger change event to update sign
                        if (this.subSubDepartment) {
                            this.subSubDepartment.dispatchEvent(new Event('change'));
                        } else if (this.subDepartment) {
                            this.subDepartment.dispatchEvent(new Event('change'));
                        } else if (this.mainDepartment) {
                            this.mainDepartment.dispatchEvent(new Event('change'));
                        }
                    }, 50);
                } else {
                    // Trigger change event to update sign
                    if (this.mainDepartment) {
                        this.mainDepartment.dispatchEvent(new Event('change'));
                    }
                }
            }, 50);
        }, 50);
    }

    clearDepartmentSelections() {
        console.log('Clearing department selections');
        
        // Clear the search input
        if (this.departmentSearchInput) {
            this.departmentSearchInput.value = '';
        }
        
        // Hide any existing search results
        this.hideSearchResults();
        
        // Clear department dropdowns
        if (this.departmentType) this.departmentType.value = '';
        this.populateMainDepartments();
        
        // Trigger change event to update sign
        if (this.departmentType) {
            this.departmentType.dispatchEvent(new Event('change'));
        }
    }

    populateMainDepartments() {
        if (!this.mainDepartment) return;

        this.mainDepartment.innerHTML = '<option value="">Select Department</option>';
        if (this.subDepartment) this.subDepartment.innerHTML = '<option value="">Select Sub-Department</option>';
        if (this.subSubDepartment) this.subSubDepartment.innerHTML = '<option value="">Select Unit</option>';

        const selectedType = this.departmentType?.value;
        if (selectedType && departmentTypes[selectedType]) {
            const departments = departmentTypes[selectedType].departments;
            if (departments && typeof departments === 'object') {
                Object.keys(departments).forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept;
                    option.textContent = dept;
                    this.mainDepartment.appendChild(option);
                });
            }
            if (this.mainDepartment.parentElement) this.mainDepartment.parentElement.style.display = 'block';
        } else {
            if (this.mainDepartment.parentElement) this.mainDepartment.parentElement.style.display = 'none';
            if (this.subDepartment?.parentElement) this.subDepartment.parentElement.style.display = 'none';
            if (this.subSubDepartment?.parentElement) this.subSubDepartment.parentElement.style.display = 'none';
        }
    }

    populateSubDepartments(mainDept) {
        if (!this.subDepartment) return;

        this.subDepartment.innerHTML = '<option value="">Select Sub-Department</option>';
        if (this.subSubDepartment) this.subSubDepartment.innerHTML = '<option value="">Select Unit</option>';
        
        const selectedType = this.departmentType?.value;

        if (selectedType && mainDept && departmentTypes[selectedType].departments && departmentTypes[selectedType].departments[mainDept]) {
            const subDepts = departmentTypes[selectedType].departments[mainDept];
            if (typeof subDepts === 'object' && !Array.isArray(subDepts)) {
                Object.keys(subDepts).forEach(subDept => {
                    const option = document.createElement('option');
                    option.value = subDept;
                    option.textContent = subDept;
                    this.subDepartment.appendChild(option);
                });
                if (this.subDepartment.parentElement) this.subDepartment.parentElement.style.display = 'block';
            } else {
                if (this.subDepartment.parentElement) this.subDepartment.parentElement.style.display = 'none';
            }
        } else {
            if (this.subDepartment.parentElement) this.subDepartment.parentElement.style.display = 'none';
            if (this.subSubDepartment?.parentElement) this.subSubDepartment.parentElement.style.display = 'none';
        }
    }

    populateSubSubDepartments(mainDept, subDept) {
        if (!this.subSubDepartment) return;

        this.subSubDepartment.innerHTML = '<option value="">Select Unit</option>';
        const selectedType = this.departmentType?.value;

        if (selectedType && mainDept && departmentTypes[selectedType].departments && 
            departmentTypes[selectedType].departments[mainDept] && 
            departmentTypes[selectedType].departments[mainDept][subDept]) {
            
            const subSubDepts = departmentTypes[selectedType].departments[mainDept][subDept];
            
            if (Array.isArray(subSubDepts)) {
                subSubDepts.forEach(unit => {
                    const option = document.createElement('option');
                    option.value = unit;
                    option.textContent = unit;
                    this.subSubDepartment.appendChild(option);
                });
            } else if (typeof subSubDepts === 'object') {
                Object.entries(subSubDepts).forEach(([unitName, unitArray]) => {
                    if (Array.isArray(unitArray)) {
                        const option = document.createElement('option');
                        option.value = unitName;
                        option.textContent = unitName;
                        this.subSubDepartment.appendChild(option);
                    }
                });
            }
            
            if (this.subSubDepartment.parentElement) {
                this.subSubDepartment.parentElement.style.display = 'block';
            }
        } else {
            if (this.subSubDepartment.parentElement) {
                this.subSubDepartment.parentElement.style.display = 'none';
            }
        }
    }
}

// Make available globally
window.DepartmentSearch = DepartmentSearch;
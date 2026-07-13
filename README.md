# UNBC Door Sign Generator

A web-based tool for generating standardized door signs for the University of Northern British Columbia (UNBC). This tool allows users to create professional door signs for faculty, staff, students, labs, general rooms, and custodian closets.

## Features

- **Multiple Sign Types**
  - Faculty
  - Staff
  - Student
  - Lab
  - General Room
  - Custodian Closet

- **Dynamic Content**
  - Name and position display
  - Department information in logo area
  - Contact information (email, phone)
  - Room name display
  - Professional designations
  - Alumni badge option
  - Optional second occupant or second room/lab, with independent contact visibility

- **Saved Sign Archives**
  - Import a single sign or a multi-sign JSON archive
  - Switch between imported signs and continue editing them
  - Export the current sign as versioned, re-importable JSON

- **Enhanced Form Features**
  - Smart input validation
  - Automatic phone number formatting (XXX-XXX-XXXX)
  - Placeholder text for all fields
  - Visual feedback for valid/invalid inputs
  - Hover and focus states
  - Improved accessibility
  - Simple show/hide toggles for contact information

- **Department Management**
  - Hierarchical department structure
  - Search functionality for departments
  - Support for academic and administrative departments
  - Sub-departments and units

- **Card Holder Support**
  - Multiple card holder type options
  - Automatic scaling based on card holder dimensions
  - Detailed specifications display

- **Designation System**
  - Pre-defined professional designations
  - Custom designation support
  - Toggle functionality for designation display

## Usage

1. **Select Sign Type**
   - Choose the appropriate sign type from the dropdown menu
   - Form fields will update based on the selected type

2. **Department Selection**
   - Use the search bar to find departments
   - Select department type (Academic/Administrative)
   - Choose main department, sub-department, and unit as needed

3. **Enter Information**
   - Fill in the required fields based on sign type
   - Add contact information where applicable
   - Toggle visibility of email and phone using checkboxes
   - Phone numbers are automatically formatted as you type
   - Enter room name for lab/general room/custodian closet signs
   - Turn on the clearly labelled second occupant section when a holder is shared

4. **Customize Display**
   - Toggle alumni badge for faculty/staff
   - Enable and select designations
   - Add custom designations if needed

5. **Card Holder Selection**
   - Choose appropriate card holder type
   - View specifications and dimensions
   - Preview will automatically scale to match

6. **Export**
   - Export the artwork as PNG or print-ready PDF
   - Use **Export current** in Saved signs to save editable JSON

7. **Import an Archive**
   - Choose **Load production archive** to use the included 89-sign collection immediately
   - Choose **Import JSON** under Saved signs
   - For a multi-sign archive, choose any imported entry from the new selector
   - A transcribed 89-sign production archive is included at `data/door-sign-archive.json`

## Technical Details

- Built with HTML, CSS, and JavaScript
- Responsive design
- SVG-based logo and badge elements
- Dynamic content updates
- Real-time preview
- Enhanced form validation and formatting
- Modern UI with smooth transitions and animations

## File Structure

- `index.html` - Main application file
- `src/components` - Form, preview, archive, and export controls
- `src/sign` - Sign defaults, geometry, artwork, archive, and export logic
- `src/unbc` - Department hierarchy and UNBC artwork assets
- `data/door-sign-archive.json` - Re-importable production-sign archive

## Dependencies

- html2canvas - For export functionality
- Inter font family - For typography

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Future Enhancements

- Additional sign templates
- More customization options
- Direct printing support
- User authentication
- Department management interface
- Additional form validation rules
- Enhanced accessibility features

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

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
  - Adjustable Alumni crest size and minimum text spacing with safe maximums
  - Optional second occupant, second room/lab, or additional contact for a shared room
  - Independent alumni badges and contact visibility for each occupant

- **Saved Sign Archives**
  - Dedicated `/saved-signs/` page linked from the editor
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
  - Printable 1:1 holder template for checking a holder against the preset
  - Printable 1" cutting grid for measuring a holder that has no preset yet

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
   - Choose the Alumni crest size and text-to-crest spacing
   - Enable and select designations
   - Add custom designations if needed

5. **Card Holder Selection**
   - Choose appropriate card holder type
   - View specifications and dimensions
   - Preview will automatically scale to match

6. **Export**
   - Export the artwork as PNG or print-ready PDF
   - Use **Export current** in Saved signs to save editable JSON

7. **Check a Physical Holder**
   - Choose **Print holder template (PDF)** under the export buttons
   - Print it at 100% ("Actual size" — never "Fit to page") and check the two scale-check
     rulers on the sheet before measuring anything
   - Cut on the solid trim line, slide the sheet into the holder, and trace the frame edge
   - Anything outside the green window is hidden by the acrylic frame on a real sign
   - Record the measurements in the worksheet line and update the preset in
     `src/data/cardHolders.js` if they differ from the estimate

8. **Measure an Unknown Holder**
   - Choose **Print measuring grid (PDF)** when the holder has no preset (or you have no idea
     what size it is) — a 1" grid numbered from its top-left corner, on the selected sheet size
   - Print at 100% and check a square with a ruler: every large square is exactly 1" / 25.4 mm
   - Cut along the grid lines with scissors, trying the sheet in the holder until it just
     slides all the way in
   - Read the width off the top numbers and the height off the side numbers — that is the
     insert size; quarter-inch lines and a millimetre scale run along the origin edges
   - Slide it in and trace the frame edge to get the viewable window
   - Every known preset is drawn on the grid as a numbered dashed outline from the same
     corner, so a cut sheet shows at a glance which preset the holder matches

9. **Import an Archive**
   - Choose **Load production archive** to use the included 89-sign collection immediately
   - Choose **Import JSON** under Saved signs
   - For a multi-sign archive, choose any imported entry from the new selector
   - A transcribed 89-sign production archive is included at `data/door-sign-archive.json`

## Local Visual Comparison Utility

The standalone comparison utility under `tools/` is for checking generator output against the
PDF-compatible Illustrator source files. It is not imported by or bundled into the website.

Install its local dependencies once:

```bash
python3 -m pip install -r tools/requirements-compare.txt
brew install poppler
```

Export a PNG from the generator for the cleanest comparison, then run:

```bash
npm run compare-sign -- \
  --reference "/path/to/source/Final.ai" \
  --candidate "/path/to/unbc-door-sign.png" \
  --output "output/compare/4-229"
```

PDF generator exports are also supported. The tool automatically finds the green sign artwork
inside the print-ready PDF page and removes the paper/crop-mark area:

```bash
npm run compare-sign -- \
  --reference "/path/to/source/Final.ai" \
  --candidate "/path/to/unbc-door-sign-staff.pdf" \
  --output "output/compare/4-229-pdf"
```

Open the generated `report.html` to review the normalized source/export images, side-by-side view,
50% overlay, amplified difference heatmap, blink animation, and pixel-difference diagnostics.
Run `python3 tools/compare_door_sign.py --help` for crop overrides and rendering options.

To flip through a group of signs one by one, copy `tools/compare-manifest.example.json`, list each
source/export pair, and run:

```bash
npm run compare-sign -- \
  --manifest "/path/to/compare-manifest.json" \
  --output "output/compare/archive-review"
```

Open `output/compare/archive-review/index.html`. The local gallery has Previous/Next buttons, a sign
picker, left/right-arrow navigation, and Side by side, Overlay, Difference, and Blink views. Every
entry also links to its full diagnostic report. Manifest paths may be absolute or relative to the
manifest file.

### Review the full production archive

To compare every archived source against the current live generator without exporting 89 files:

```bash
npm run compare-all
```

This renders all PDF-compatible Illustrator sources, builds a standalone local viewer, and writes:

```text
output/compare/all-signs/index.html
```

The viewer contains all 89 production entries with Previous/Next controls, a sign picker, keyboard
navigation, side-by-side and overlay modes, and a temporary Standard/Larger content-size switch for
testing each person sign. The viewer imports the real `SignArtwork` renderer but is built separately
under `tools/compare-viewer`; it is never included in the production website.

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
- `src/sign/signTemplate.js` - Printable 1:1 template for a known holder
- `src/sign/signGrid.js` - Printable 1" cutting grid for an unmeasured holder
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

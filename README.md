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

- **Organizations: UNBC and NUGSS**
  - Click the logo in the app bar to switch the sign (and the app's colours) between **UNBC** and
    **NUGSS** (Northern Undergraduate Student Society). A NUGSS sign prints the NUGSS logo —
    outlined from the society's `nugss.ai` master, so no fonts ship — on a cerulean (#0579ba)
    band, sized and placed as on the NUGSS "Final V1" production artboards, with no department
    line. Switching to NUGSS also starts the sign on the NUGSS look (one size for the position
    and contact lines, at the new **Largest** contact size, and the wide text column); Appearance
    can still change it
  - The organization travels with the sign in share links and archives, and the editor opens on
    the organization last used in that browser

- **Dynamic Content**
  - Name and position display
  - One or more positions per person, each with an optional faculty/department and an italic
    subtext line. Each position prints its department beside it ("Position | Department", with
    the bars aligned or run in — or with the bar hidden, leaving just the gap), on a line of its
    own, or not at all, and either splits at
    | · ; or prints as typed. A position typed as "Position | Department" can be separated into
    the two fields in one click; signs saved with the older single Position field load it as
    the first position and print unchanged
  - Multi-line extra line, with Enter breaks kept on the sign; italic, with any line wrapped in
    *asterisks* printed upright
  - Department information in logo area
  - Contact information (email, phone); a person's blank email prints as first.last@unbc.ca
    from their name
  - Room name display
  - Professional designations
  - Alumni badge option
  - Adjustable Alumni crest size and minimum text spacing with safe maximums
  - Optional second occupant, second room/lab, or additional contact for a shared room
  - Independent alumni badges and contact visibility for each occupant

- **Saved Sign Archives**
  - Dedicated `/saved-signs/` page linked from the editor
  - Import a single sign or a multi-sign JSON archive (or drop the file on the page)
  - Search the archive by name, room, department, email or holder, filter by sign type, and
    preview each sign before opening it
  - Load the production archive or import JSON straight from the editor, then switch signs there
    with a search box and Previous/Next buttons (also in the preview's header)
  - Edits stay with each sign (marked **Edited**, with **Revert**) until you export
  - Export one sign or the whole archive, including edits, as versioned, re-importable JSON

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
  - The chosen department shows as its path, one level per line (area, portfolio, faculty or
    office, department or unit); each level is a dropdown of the other choices at that level,
    so a sign can move to a sibling unit or stop a level higher without searching again.
    Departments saved by name alone are placed in the path automatically
  - Clear the department to print the plain UNBC logo
  - Support for academic and administrative departments
  - Sub-departments and units
  - Department lines wrap by the UNBC logo kit's rule

- **Card Holder Support**
  - Multiple card holder type options
  - Each holder preset can name the room plate it is built into (number only, or a line with
    braille — grey, green or any colour); the on-the-door preview draws that plate, starting on
    line + braille when the preset doesn't say. The card runs to the plate's side edges, where it
    slides in and out, so the plate reads as one piece. **Number-Only Plate** is the newer plain
    plate, with its side frame estimated from a photo until it is measured
  - **Custom holders** saved in the browser (localStorage): pick **+ New custom holder…** or
    **Save a custom copy of this holder…** under Card holder, or **Save to this browser** on the
    measuring sheets page. They appear in every holder picker on that browser; they don't travel
    with share links
  - Preview modes: **Print guides** (the bleed that gets cut away is hatched, the cut line is
    dashed, the strip the holder frame hides is shaded, and the header and body margins are
    measured), **On the door** (the sign behind a room plate's window, with an optional room
    number), and **Plain**. The door view offers the plates in use (the newer number-only
    plates, and the older ones with a line — grey, green or a custom colour — and a braille
    strip) and a
    **See-through** mode that shows the whole cut card behind a translucent frame, with the cut
    edge dashed and how much each edge hides
  - **6-352** is a measured preset (178mm × 113.5mm insert; the frame hides 11mm at the top and
    10mm at each side). The NUGSS artboards fit its frame exactly
  - Automatic scaling based on card holder dimensions
  - Detailed specifications display
  - Dedicated `/measuring-sheets/` page with a live preview: configure a sheet, then print
    or download it
  - Four sheets — a 1:1 holder template, the same template with a 1" grid inside it, a
    full-sheet cutting grid for a holder that has no preset yet, and a **measuring strip** for
    surveying many holders: a 10" strip that slides through the side slot, with a ruler for the
    plate and window edges and numbered height lines (trim the top until it fits for the card
    height). Page two is a survey table, and the page turns the strip readings into the holder's
    sizes and a preset
  - Custom holder sizes entered in inches or millimetres, saved to the browser or copied back
    into the code as a preset snippet

- **Designation System**
  - Pre-defined professional designations
  - Custom designation support
  - Toggle functionality for designation display
  - Place designations beside the name, below it, or beside it but kept together (if they
    don't fit, the whole designation moves to the next line instead of breaking inside it)

## Layout

- **App bar** on every page with the UNBC wordmark and Editor / Saved signs / Measuring sheets tabs
- **Desktop (960px and wider):** the form is a column of sections (Sign, Person or Room with its
  contact details, Designations, Appearance); the preview and the
  **Print & export** card (holder, paper, PDF/PNG) stay pinned beside it
- **Phones and tablets:** a bottom dock switches between **Edit** and **Preview & export**, and a
  live copy of the sign stays pinned above the form while editing (it can be hidden)

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
   - **+ Add person** (or **+ Add contact or room** on room signs) opens the second entry as a
     tab beside the first, named after each person's first name, with its own alumni crest and
     contact details

4. **Customize Display**
   - Toggle each person's alumni crest (faculty/staff) in their tab
   - Choose the Alumni crest size and text-to-crest spacing
   - Enable and select designations
   - Add custom designations if needed

5. **Card Holder Selection**
   - Choose appropriate card holder type
   - View specifications and dimensions
   - Preview will automatically scale to match

6. **Export**
   - Export the artwork as PNG or print-ready PDF
   - **Print sheet** options for the PDF (under Print & export; see it in Preview → **Sheet**):
     - **Cards per sheet** — one card, or **Fill sheet**, which tries the paper both ways round
       and fits as many cards as it can (e.g. 2 Building 10 cards on Letter, 4 on Tabloid)
     - **Fill with** copies of this sign, or the **sheet list**: snapshots of signs added with
       **+ Add this sign as it is now** — change the sign (or open another saved sign) and add it
       again to print variants or different signs side by side. Cards for different holders share
       sheets: each size gets its own band of rows, with its own crop marks and cut lines, and the
       sheet turns whichever way fits more; the list is kept in the browser
     - **Between cards** — a gap (each card keeps its own 1/8" bleed; two cuts between
       neighbours) or butted (one shared cut; fewer cuts, less forgiving)
     - **Cut guides** — crop marks in the margin, cut lines along every cut (running through the
       gaps and past the block, for a ruler or guillotine), both, or none
     - A **1" scale check** bar and a **label** (sign, cut size, cards per sheet, page, print date)
       along the bottom margin when there is room
   - Use **Export this sign** or **Export archive** in Saved signs to save editable JSON

7. **Check a Physical Holder**
   - Open **Measuring sheets** from the editor header (or the link under the export buttons).
     Pick a sheet, a holder, a paper size and the grid options; the preview redraws as you go,
     then **Print sheet** or **Download PDF**
   - Every sheet must be printed at 100% ("Actual size" — never "Fit to page"); check the
     scale bars, or a grid square, before measuring anything
   - **Holder template** — the selected holder at 1:1, with bleed, cut line, viewable window,
     the hatched strips the frame hides, and every dimension labelled in inches and
     millimetres. Cut on the solid trim line, slide it into the holder, and trace the frame
     edge: anything outside the green window is hidden on a real sign
   - **Template + grid** — the same sheet with a 1" grid inside the insert, anchored to the
     trim corner and numbered along its top and left edges, so you can measure exactly where
     the traced frame edge falls
   - Record the measurements in the worksheet line and update the preset in
     `src/data/cardHolders.js` if they differ from the estimate

8. **Measure an Unknown Holder**
   - Pick the **Measuring grid** sheet when the holder has no preset (or you have no idea what
     size it is) — a full sheet of 1" grid numbered from its top-left corner
   - Cut along the grid lines with scissors, trying the sheet in the holder until it just
     slides all the way in
   - Read the width off the top numbers and the height off the side numbers — that is the
     insert size; quarter-inch lines and a millimetre scale run along the origin edges
   - Coordinates repeat across the middle of every grid ("3,2" = 3" across, 2" down), so an
     offcut that keeps none of the edges still says where it came from
   - Slide it in and trace the frame edge to get the viewable window
   - Every known preset is drawn on the grid as a numbered dashed outline from the same
     corner, so a cut sheet shows at a glance which preset the holder matches
   - Type what you measured into **Custom size** on the same page to print an exact template
     of the holder, and copy the preset snippet it generates into `src/data/cardHolders.js`

9. **Import an Archive**
   - Under Saved signs, choose **Production archive** to use the included 89-sign collection
     immediately, or **Import JSON** for your own file
   - Search or filter the list, then **Edit in generator** (or double-click / press Enter)
   - Back in the editor, the archive bar above the form searches every sign and steps through
     them with Previous/Next; **Browse all** returns to the list
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
- Responsive design: side-by-side editor and preview on desktop (the preview column stays in
  view and scrolls on its own); Editor/Preview tabs on phones and tablets, with a live copy of the
  sign pinned above the form while editing (tap it for the full preview, or hide it)
- SVG-based logo and badge elements
- Dynamic content updates
- Real-time preview
- Header band and logo lockup sized as in the production Illustrator files (the lockup at its
  native size), but measured from the holder window: the visible band is 20.5% of the window
  height, and the green above the logo always matches the green below it
  (`src/sign/headerGeometry.js`). With no holder this is the production band exactly
- The body text is centred on its ink, so the white above the first line matches the white below
  the last
- Department names wrap by the UNBC logo kit's rule (`splitDepartmentText` from the
  `vendor/unbc-logo` submodule), so "Northern Analytical Laboratory Services" takes two lines
  and the band grows to fit, keeping the same margin under the last line. **Appearance → Department line → Full width** instead runs a long
  name across the band on one line, to match older printed signs
- Enhanced form validation and formatting
- Modern UI with smooth transitions and animations

## File Structure

- `index.html` - Main application file
- `saved-signs/index.html` - Saved signs page
- `measuring-sheets/index.html` - Measuring sheets page
- `src/components` - Form, preview, archive, export controls, and the measuring sheets page
- `src/sign` - Sign defaults, geometry, artwork, archive, and export logic
- `src/sign/measuringSheets.js` - One entry point for the three printable measuring sheets
- `src/sign/signTemplate.js` - Printable 1:1 template for a known holder (optional grid)
- `src/sign/signGrid.js` - Printable 1" cutting grid for an unmeasured holder
- `src/sign/signContent.js` - Builds the artwork content from the editor's sign data
- `src/sign/headerGeometry.js` - Header band, lockup position, and department-line width
- `src/sign/organizations.js` - UNBC and NUGSS: band colour, logo, starting appearance
- `src/assets/nugssLogo.js` - The NUGSS logo as outlines (from `nugss.ai`)
- `src/sign/printSheet.js` - Cards per sheet, cut positions, crop marks and cut lines for the PDF
  and the Sheet preview
- `src/sign/pdfPrimitives.js` - Drawing helpers shared by the measuring sheets
- `src/sign/signShare.js` - Share links: the sign compressed into the URL with json-url
- `vendor/unbc-logo` - UNBC brand kit, as a git submodule (see below)
- `vendor/json-url` - [ahzs645/json-url](https://github.com/ahzs645/json-url), as a git submodule (see below)
- `data/door-sign-archive.json` - Re-importable production-sign archive

## The UNBC brand kit submodule

The logo lockup, department-line wrapping, department hierarchy, and artwork assets live in
their own repository — [ahzs645/unbc-logo](https://github.com/ahzs645/unbc-logo) — so other
projects can reuse them. It is vendored here as a git submodule and imported through the
`@unbc/logo` alias defined in `vite.config.js`.

Clone with it:

```bash
git clone --recurse-submodules https://github.com/ahzs645/UNBCDoor.git
```

Already cloned without it:

```bash
git submodule update --init --recursive
```

It also ships a standalone generator for building a lockup from custom department text, live at
<http://projects.ahmadjalil.com/unbc-logo/>.

To pull a newer version of the brand kit into this app:

```bash
git submodule update --remote vendor/unbc-logo
```

Then commit the updated submodule pointer.

## Share links (json-url submodule)

**Copy share link** (under Print & export) puts the whole sign into the URL, so a link like
`https://ahzs645.github.io/UNBCDoor/#sign=1.gz.…` opens straight into the editor with that sign —
no server or account involved. The token lives in the hash, so names and emails never reach a
server log. On phones the button opens the system share sheet.

Encoding uses [ahzs645/json-url](https://github.com/ahzs645/json-url) (`@firstform/json-url`),
vendored at `vendor/json-url` the same way the Webforms app consumes it. Fields still at their
default are dropped, the remaining keys are shortened through a frozen key map, the shortest of
the browser-safe codecs wins, and a checksum makes a link that was cut off fail clearly instead
of loading half a sign. Decoded links go through the same validation as imported JSON.

The submodule's `dist/` isn't committed, so `scripts/build-vendor-json-url.mjs` builds it — it
runs automatically before `npm run dev`, `npm run build` and `npm test` (and on `npm install`),
and is a no-op when the build is current. To pull a newer json-url:

```bash
git submodule update --remote vendor/json-url
```

## Dependencies

- html2canvas - For export functionality
- Inter font family - For the app's own interface
- Helvetica Neue LT Pro (55 Roman, 56 Italic, 75 Bold, 95 Black) - The sign artwork, matching
  UNBC's own documents. `python3 tools/build_brand_fonts.py` builds `Fonts/HelveticaNeueLTPro-*`
  from `Fonts/source/` (adding the kerning and ligatures those copies lack); the older
  Helvetica Neue faces in `Fonts/` stand in for characters LT Pro doesn't have.

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

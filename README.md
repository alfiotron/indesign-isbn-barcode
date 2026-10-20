# ISBN / EAN-13 Barcode for Adobe InDesign

[Italiano](README.it.md)

Generate ISBN-13 and EAN-13 barcodes directly in Adobe InDesign as native vector artwork. Choose installed fonts, set the final dimensions and digit spacing, and keep the result inside your layout.

**Version: 2.8** · **Default size: 26 × 16 mm**

## Features

- Generate EAN-13 barcodes, including ISBN-13 book identifiers.
- Validate a 13-digit code or calculate the check digit from 12 digits.
- Accept spaces, hyphens and an ISBN/EAN prefix.
- Create all bars as one compound path.
- Convert all 13 digits into a separate, single compound path, preserving character counters and curves.
- Keep the digits as editable InDesign text when outlining is disabled.
- Choose OCR B, OCR A or another installed font, including its style.
- Adjust digit font size in points and digit-to-bar spacing in millimetres.
- Set independent width and height based on the generated artwork's actual bounds.
- Add optional `<` and `>` quiet zone indicators and an optional label above the bars.
- Generate artwork with a transparent background and 100% K black.
- Run locally with a standalone `.jsx` file, without plug-ins, barcode fonts or external libraries.

## Files

| File | Purpose |
| --- | --- |
| [scripts/ISBN_EAN13_Barcode_EN.jsx](scripts/ISBN_EAN13_Barcode_EN.jsx) | English interface, messages and comments |
| [scripts/Barcode_ISBN_EAN13.jsx](scripts/Barcode_ISBN_EAN13.jsx) | Italian interface, messages and comments |
| [README.it.md](README.it.md) | Italian documentation |
| [GITHUB_DESCRIPTION.txt](GITHUB_DESCRIPTION.txt) | Short repository descriptions in English and Italian |

The two scripts use the same barcode generation and layout logic. Install either language, or both.

## Requirements

- Adobe InDesign desktop with JSX/ExtendScript and ScriptUI support.
- An installed, active font for any visible text. OCR A and OCR B are optional and are not bundled.

Compatibility has not been verified across every InDesign release and operating system.

## Installation

1. Download the `.jsx` file for your preferred language. If downloading from GitHub, save the raw file rather than the HTML page.
2. In InDesign, open **Window → Utilities → Scripts**.
3. Right-click the **User** folder and choose **Reveal in Finder** on macOS or **Reveal in Explorer** on Windows.
4. Copy the `.jsx` file into the **Scripts Panel** folder.
5. Return to InDesign and double-click the script in the Scripts panel.

See [Adobe's scripting documentation](https://helpx.adobe.com/indesign/desktop/automation-and-scripting/document-automation/automate-workflows-with-scripts.html) for the Scripts panel and installation folders.

## Usage

1. Open the layout and navigate to the view where you want to insert the barcode.
2. Run the script and enter the ISBN/EAN number.
3. Choose the dimensions, font, font size and spacing.
4. Set the text, outline and indicator options, then click **Generate**.

For example, `9780306406157` is a valid 13-digit input. Entering `978030640615` calculates the final `7`. A formatted input such as `ISBN 978-0-306-40615-7` is also accepted.

An incorrect check digit in a complete 13-digit input produces an error; the script does not silently change the number. ISBN-10 input is not supported. Checksum validation does not verify that an ISBN or EAN has been registered or assigned.

If no document is open, the script creates one for the generated artwork.

## Default settings

| Setting | Default |
| --- | --- |
| Width | 26 mm |
| Height | 16 mm |
| Show digits below the bars | On |
| Requested digit font size | 9 pt |
| Digit-to-bar gap | 0.5 mm |
| Automatic font fitting | On |
| Convert text to outlines | On |
| Label above the barcode | Off |
| Left and right indicators | Off |

OCR B is preferred when available, followed by OCR A. Other installed fonts can be selected from the font menu and filtered by name.

## Dimensions, spacing and text

Width and height refer to the complete artwork's selection bounds, including enabled text and indicators. External blank margins are excluded. No background rectangle is created.

The script measures the generated objects and adjusts the construction until their bounds match the requested size within **0.002 mm**. It rebuilds the layout rather than scaling the entire group, so digit spacing and the requested font size are preserved independently of the overall dimensions.

The digit-to-bar gap is measured from the bottom of the **short bars** to the top of the digit text area. The extended guard bars are not the reference for this setting.

With **automatic font fitting** enabled, the script may reduce all digits to the same smaller font size when they do not fit. The completion message reports any reduction. Disable this option to require the exact requested font size.

For outlined text, all digits are assembled into **one native compound path**, separate from the bars. An enabled top label remains a separate object. With outlining disabled, the digit text frames remain editable.

Because the background is transparent, keep the required clear space around the barcode when placing other artwork nearby.

## Insertion and clipboard

The script copies the generated artwork from a temporary document, closes that document, and uses normal Paste in the original layout window. It does not issue zoom or page-navigation commands to the destination view.

**The clipboard is replaced with the generated barcode.** Placement follows InDesign's native Paste behaviour in that window.

## Troubleshooting

| Problem | Action |
| --- | --- |
| Invalid check digit | Check the original number, or provide its first 12 digits to calculate the final digit. |
| OCR font unavailable | Activate the font and rerun the script, or select another installed font. |
| Text does not fit | Enable automatic font fitting, reduce the requested size or increase the width. |
| Requested dimensions cannot be reached | Reduce the text size or spacing, or increase the overall dimensions. |

When reporting a problem, include the script version, InDesign version, operating system, input number, selected options and the complete error message with its line number. For placement issues, also include the zoom level and a screenshot of the view before running the script.

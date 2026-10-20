#target "indesign"

/* ISBN / EAN-13 Barcode for Adobe InDesign - v2.8 (English)
 * Native bars, optional text, installed fonts, < > indicators and dimensions.
 * No plug-ins, barcode fonts, network access or external libraries required.
 * Nominal X dimension: 0.33 mm; 11X/7X quiet zones. Configurable height.
 * The checksum validates the number, not its registration or assignment.
 */

var ISHI_EAN13 = (function () {
    var L = ["0001101","0011001","0010011","0111101","0100011",
             "0110001","0101111","0111011","0110111","0001011"];
    var G = ["0100111","0110011","0011011","0100001","0011101",
             "0111001","0000101","0010001","0001001","0010111"];
    var R = ["1110010","1100110","1101100","1000010","1011100",
             "1001110","1010000","1000100","1001000","1110100"];
    var PARITY = ["LLLLLL","LLGLGG","LLGGLG","LLGGGL","LGLLGG",
                  "LGGLLG","LGGGLL","LGLGLG","LGLGGL","LGGLGL"];

    function clean(value) {
        var s = String(value).replace(/^\s+|\s+$/g, "");
        s = s.replace(/^(?:ISBN(?:[ -]?13)?|EAN(?:[ -]?13)?)\s*:?\s*/i, "");
        return s.replace(/[\s\-\u2010-\u2015]/g, "");
    }

    function checksum(s) {
        if (!/^\d{12}$/.test(s)) { throw Error("The calculation requires 12 digits."); }
        var sum = 0, i;
        for (i = 0; i < 12; i++) { sum += Number(s.charAt(i)) * (i % 2 ? 3 : 1); }
        return String((10 - sum % 10) % 10);
    }

    function normalize(value) {
        var s = clean(value);
        if (!/^\d{12,13}$/.test(s)) {
            throw Error("Enter 12 or 13 digits. Spaces, hyphens and the ISBN/EAN prefix are allowed.\n10-digit ISBNs are not supported.");
        }
        var check = checksum(s.substr(0, 12));
        if (s.length === 12) { return s + check; }
        if (s.charAt(12) !== check) {
            throw Error("Invalid check digit: expected " + check + ", received " + s.charAt(12) + ".\nCheck the original code: it has not been modified.");
        }
        return s;
    }

    function encode(value) {
        var s = normalize(value), p = PARITY[Number(s.charAt(0))];
        var bits = "101", i;
        for (i = 1; i <= 6; i++) {
            bits += (p.charAt(i - 1) === "L" ? L : G)[Number(s.charAt(i))];
        }
        bits += "01010";
        for (i = 7; i <= 12; i++) { bits += R[Number(s.charAt(i))]; }
        return bits + "101";
    }

    // All layout measurements are in millimetres.
    function plan(value, options) {
        var o = options || {}, code = normalize(value);
        var width = Number(o.width), height = Number(o.height), size = Number(o.fontSize);
        var digitGap = typeof o.digitGap === "undefined" ? 0.5 : Number(o.digitGap);
        var showDigits = o.showDigits !== false, header = String(o.header || "");
        var maxLayout = o.internalLayout ? 1000 : 500;
        if (!isFinite(width) || width < 5 || width > maxLayout ||
            !isFinite(height) || height < 3 || height > maxLayout) {
            throw Error("Enter width and height in mm (width 5-500; height 3-500).");
        }
        if (!isFinite(size) || size < 1 || size > 72) {
            throw Error("Text size must be between 1 and 72 points.");
        }
        if (!isFinite(digitGap) || digitGap < 0 || digitGap > 100) {
            throw Error("The digit-to-bar gap must be between 0 and 100 mm.");
        }
        var scale = width / 37.29, bits = encode(code), x = width / 113;
        var textHeight = Math.max(4.3 * scale, size * 25.4 / 72 * 1.35);
        var headerSize = size * 5 / 6, headerY = 0.65 * scale;
        var headerHeight = Math.max(3.5 * scale, headerSize * 25.4 / 72 * 1.32);
        var top = header ? Math.max(4.5 * scale, headerY + headerHeight + 0.35 * scale) : scale;
        var footer = (showDigits || o.leftMark || o.rightMark) ?
            Math.max(digitGap + 0.05 * scale + textHeight, 5 * x + 0.5 * scale) : 5 * x + 0.5 * scale;
        var h = height - top - footer, extension = 5 * x;
        if (h < 0.5) {
            throw Error("Not enough height for text and spacing. Increase the height, reduce the font size or hide the text.");
        }
        var bars = [], texts = [], marks = [], i = 0, start, guard;
        while (i < bits.length) {
            if (bits.charAt(i) !== "1") { i++; continue; }
            start = i;
            while (i < bits.length && bits.charAt(i) === "1") { i++; }
            guard = start < 3 || (start >= 45 && start < 50) || start >= 92;
            bars.push({x: (11 + start) * x, y: top, w: (i - start) * x,
                       h: h + (guard ? extension : 0)});
        }
        var textY = top + h + digitGap;
        // The first digit is outside the bars; remaining digits occupy 7X cells.
        if (showDigits) {
            texts.push({text: code.charAt(0), x: (o.leftMark ? 2.5 : 1.5) * x, y: textY,
                        w: 7 * x, h: textHeight, size: size, kind: "digit"});
            for (i = 0; i < 6; i++) {
                texts.push({text: code.charAt(i + 1), x: (14 + i * 7) * x,
                            y: textY, w: 7 * x, h: textHeight, size: size, kind: "digit"});
                texts.push({text: code.charAt(i + 7), x: (61 + i * 7) * x,
                            y: textY, w: 7 * x, h: textHeight, size: size, kind: "digit"});
            }
        }
        if (header) {
            texts.push({text: header, x: scale, y: headerY,
                        w: width - 2 * scale, h: headerHeight, size: headerSize, kind: "header"});
        }
        // Vector indicators below the bars, with tips at the outer quiet zone edges.
        var markH = Math.min(3.5 * x, textHeight * 0.65);
        var markY = textY + Math.max(0, size * 25.4 / 72 * 0.62 - markH / 2);
        if (o.leftMark) { marks.push({left: true, x: 0, y: markY, w: 2 * x, h: markH}); }
        if (o.rightMark) { marks.push({left: false, x: width - 2.5 * x, y: markY, w: 2.5 * x, h: markH}); }
        return {code: code, width: width, height: height, barHeight: h, requestedFontSize: size,
                digitGap: digitGap, digitTop: textY,
                module: x, bars: bars, texts: texts, marks: marks, header: header};
    }
    return {clean: clean, checksum: checksum, normalize: normalize, encode: encode, plan: plan};
}());

(function () {
    if (typeof app === "undefined") { return; }

    function mm(value) { return value * 72 / 25.4; }
    function trim(s) { return String(s).replace(/^\s+|\s+$/g, ""); }

    function installedFonts() {
        var result = [], fonts = app.fonts.everyItem().getElements(), i, f, name, key;
        for (i = 0; i < fonts.length; i++) {
            try {
                f = fonts[i];
                if (f.status !== FontStatus.INSTALLED) { continue; }
                name = String(f.name);
                key = name.toLowerCase().replace(/[^a-z0-9]/g, "");
                result.push({font: f, name: name, label: name.replace(/\t/g, " - "),
                    kind: /ocrb/.test(key) ? 0 : (/ocra/.test(key) ? 1 : 2)});
            } catch (skipFont) {}
        }
        result.sort(function (a, b) {
            var x = a.label.toLowerCase(), y = b.label.toLowerCase();
            return x < y ? -1 : (x > y ? 1 : 0);
        });
        return result;
    }

    function dialog(fonts) {
        var w = new Window("dialog", "ISBN / EAN-13 Barcode - Ishi 2.8");
        w.orientation = "column";
        w.alignChildren = "fill";
        w.margins = 16;
        var row = w.add("group");
        row.add("statictext", undefined, "ISBN / EAN:");
        var input = row.add("edittext", undefined, "");
        input.characters = 34;
        w.add("statictext", undefined, "12 or 13 digits. Spaces and hyphens allowed; automatic validation.");
        var status = w.add("statictext", undefined, "Enter the code to generate.");
        status.characters = 65;

        var dimensions = w.add("panel", undefined, "Actual artwork dimensions");
        dimensions.alignChildren = "left";
        row = dimensions.add("group");
        row.add("statictext", undefined, "Width (mm):");
        var width = row.add("edittext", undefined, "26");
        width.characters = 7;
        row.add("statictext", undefined, "Height (mm):");
        var height = row.add("edittext", undefined, "16");
        height.characters = 7;
        var standard = dimensions.add("button", undefined, "Reset to 26 x 16 mm");
        var info = dimensions.add("statictext", undefined, "");
        info.characters = 64;
        dimensions.add("statictext", undefined, "Selection bounds: includes bars and text, excludes external blank margins.");

        var textPanel = w.add("panel", undefined, "Text");
        textPanel.alignChildren = "fill";
        var digits = textPanel.add("checkbox", undefined, "Show the 13 digits below the bars");
        digits.value = true;
        row = textPanel.add("group");
        row.add("statictext", undefined, "Font type:");
        var fontKind = row.add("dropdownlist", undefined, ["OCR B", "OCR A", "Any installed font"]);
        var initialKind = 2, i;
        for (i = 0; i < fonts.length; i++) { if (fonts[i].kind === 1) { initialKind = 1; break; } }
        for (i = 0; i < fonts.length; i++) { if (fonts[i].kind === 0) { initialKind = 0; break; } }
        fontKind.selection = initialKind;
        row = textPanel.add("group");
        row.add("statictext", undefined, "Search fonts:");
        var filter = row.add("edittext", undefined, "");
        filter.characters = 32;
        var fontMenu = textPanel.add("dropdownlist", undefined, []);
        fontMenu.preferredSize.width = 450;
        row = textPanel.add("group");
        row.add("statictext", undefined, "Digit font size (pt):");
        var fontSize = row.add("edittext", undefined, "9");
        fontSize.characters = 6;
        row = textPanel.add("group");
        row.add("statictext", undefined, "Digit-to-bar gap (mm):");
        var gap = row.add("edittext", undefined, "0.5");
        gap.characters = 6;
        textPanel.add("statictext", undefined, "From the bottom of the short bars to the top of the text area.");
        var autoFit = textPanel.add("checkbox", undefined, "Automatically reduce the font size if the text does not fit");
        autoFit.value = true;
        var useHeader = textPanel.add("checkbox", undefined, "Label above the barcode");
        useHeader.value = false;
        var header = textPanel.add("edittext", undefined, "");
        header.characters = 44;
        var outlines = textPanel.add("checkbox", undefined, "Outline text; combine all digits into one compound path");
        outlines.value = true;

        var marksPanel = w.add("panel", undefined, "Quiet zone indicators below the bars");
        marksPanel.orientation = "row";
        var left = marksPanel.add("checkbox", undefined, "< on the left");
        var right = marksPanel.add("checkbox", undefined, "> on the right");
        w.add("statictext", undefined, "Transparent background. One compound path for bars, 100% K black.");
        var actions = w.add("group");
        actions.alignment = "right";
        actions.add("button", undefined, "Cancel", {name: "cancel"});
        var ok = actions.add("button", undefined, "Generate", {name: "ok"});
        var result = null, oldAuto = "", visibleFonts = [];

        function number(field) { return Number(trim(field.text).replace(",", ".")); }
        function options() {
            return {width: number(width), height: number(height), fontSize: number(fontSize), digitGap: number(gap),
                showDigits: digits.value, header: useHeader.value ? trim(header.text) : "",
                leftMark: left.value, rightMark: right.value};
        }
        function refresh() {
            header.enabled = useHeader.value;
            var needFont = digits.value || useHeader.value;
            fontKind.enabled = needFont;
            filter.enabled = needFont;
            fontMenu.enabled = needFont && visibleFonts.length > 0;
            fontSize.enabled = needFont || left.value || right.value;
            gap.enabled = digits.value || left.value || right.value;
            outlines.enabled = needFont;
            var code, auto;
            try {
                code = ISHI_EAN13.normalize(input.text);
                status.text = "Valid code: " + code +
                    (ISHI_EAN13.clean(input.text).length === 12 ? " (check digit calculated)" : "");
                auto = (/^97[89]/.test(code) ? "ISBN " : "EAN ") + code;
                if (!header.text || header.text === oldAuto) { header.text = auto; }
                oldAuto = auto;
            } catch (e) { status.text = "Enter a 12- or 13-digit code with a valid check digit."; }
            try {
                var p = ISHI_EAN13.plan(input.text, options());
                info.text = "Final dimensions: " + p.width.toFixed(2).replace(".", ".") +
                    " x " + p.height.toFixed(2).replace(".", ".") + " mm.";
            } catch (ignore) { info.text = "Width and height are independent. Dimensions are in millimetres."; }
        }
        function populateFonts() {
            var previous = fontMenu.selection && visibleFonts.length ? visibleFonts[fontMenu.selection.index].name : "";
            fontMenu.removeAll();
            visibleFonts = [];
            var kind = fontKind.selection.index, query = trim(filter.text).toLowerCase(), chosen = -1, j, entry;
            for (j = 0; j < fonts.length; j++) {
                entry = fonts[j];
                if (kind !== 2 && entry.kind !== kind) { continue; }
                if (query && entry.label.toLowerCase().indexOf(query) < 0) { continue; }
                if (entry.name === previous) { chosen = visibleFonts.length; }
                fontMenu.add("item", entry.label);
                visibleFonts.push(entry);
            }
            if (visibleFonts.length) {
                if (chosen < 0 && kind === 2) {
                    for (j = 0; j < visibleFonts.length; j++) {
                        if (/^(Arial|Helvetica|Myriad Pro|Liberation Sans)\t(Regular|Roman)$/i.test(visibleFonts[j].name)) {
                            chosen = j; break;
                        }
                    }
                }
                fontMenu.selection = chosen < 0 ? 0 : chosen;
            } else {
                fontMenu.add("item", kind === 2 ? "No matching fonts" : "OCR font not installed: choose another font type");
                fontMenu.selection = 0;
            }
            refresh();
        }
        input.onChanging = refresh;
        width.onChanging = refresh;
        height.onChanging = refresh;
        fontSize.onChanging = refresh;
        gap.onChanging = refresh;
        header.onChanging = refresh;
        digits.onClick = refresh;
        useHeader.onClick = refresh;
        left.onClick = refresh;
        right.onClick = refresh;
        fontKind.onChange = function () { filter.text = ""; populateFonts(); };
        filter.onChanging = populateFonts;
        standard.onClick = function () { width.text = "26"; height.text = "16"; refresh(); };
        ok.onClick = function () {
            try {
                var p = ISHI_EAN13.plan(input.text, options()), font = null;
                if (p.texts.length) {
                    if (!visibleFonts.length || !fontMenu.selection) {
                        throw Error("Select an installed font. OCR A and OCR B must be active in InDesign.");
                    }
                    font = visibleFonts[fontMenu.selection.index].font;
                    if (outlines.value && !font.allowOutlines) {
                        throw Error("This font does not allow outlining. Disable the option or choose another font.");
                    }
                }
                result = {plan: p, options: options(), font: font, outlines: outlines.value, autoFit: autoFit.value};
                w.close(1);
            } catch (e) { alert(e.message, "Check the barcode"); }
        };
        populateFonts();
        input.active = true;
        if (w.show() !== 1) { return null; }
        return result;
    }

    function color(doc, name, values) {
        var c = doc.colors.itemByName(name);
        if (!c.isValid) {
            c = doc.colors.add({name: name, model: ColorModel.PROCESS,
                                space: ColorSpace.CMYK, colorValue: values});
        }
        return c;
    }

    function resetShape(item, doc) {
        item.applyObjectStyle(doc.objectStyles.item(0), true, true);
        item.strokeWeight = 0;
        item.strokeColor = doc.swatches.item(0);
        // With a [None] fill or stroke, the corresponding overprint properties
        // are not applicable. The fill will be assigned later.
        item.nonprinting = false;
        item.rotationAngle = 0;
        item.shearAngle = 0;
        item.topLeftCornerOption = CornerOptions.NONE;
        item.topRightCornerOption = CornerOptions.NONE;
        item.bottomLeftCornerOption = CornerOptions.NONE;
        item.bottomRightCornerOption = CornerOptions.NONE;
        item.textWrapPreferences.textWrapMode = TextWrapModes.NONE;
    }

    function setFill(item, swatch) {
        item.fillColor = swatch;
        item.fillTint = 100;
        // This function is only used for the black barcode artwork.
        item.overprintFill = false;
    }

    function compound(doc, page, items, name) {
        if (!items.length) { return null; }
        var data = [], result = null, i, j, source, dest;
        // Copy every subpath, including Bezier curves and character counters,
        // into ONE Polygon; do not rely on makeCompoundPath with object arrays.
        for (i = 0; i < items.length; i++) {
            for (j = 0; j < items[i].paths.length; j++) {
                source = items[i].paths.item(j);
                data.push({points: source.entirePath, type: source.pathType});
            }
        }
        if (!data.length) { throw Error("No outlines available for " + name + "."); }
        try {
            result = page.polygons.add();
            resetShape(result, doc);
            for (i = 0; i < data.length; i++) {
                dest = i === 0 ? result.paths.item(0) : result.paths.add();
                dest.entirePath = data[i].points;
                dest.pathType = data[i].type;
            }
            if (result.paths.length !== data.length) { throw Error("Unexpected number of subpaths."); }
            setFill(result, color(doc, "Barcode K100", [0, 0, 0, 100]));
            result.name = name;
            for (i = 0; i < items.length; i++) { if (items[i].isValid) { items[i].remove(); } }
            return result;
        } catch (e) {
            if (result && result.isValid) { result.remove(); }
            throw e;
        }
    }

    function collectOutline(item, target) {
        // Some fonts produce groups: move their paths to a common level
        // before assembling the final compound path.
        if (item.constructor.name === "Group") {
            var children = item.pageItems.everyItem().getElements(), i;
            item.ungroup();
            for (i = 0; i < children.length; i++) { collectOutline(children[i], target); }
        } else { target.push(item); }
    }

    function fitTexts(doc, entries, autoFit) {
        var digits = [], headers = [], i, j;
        for (i = 0; i < entries.length; i++) {
            if (entries[i].kind === "digit") { digits.push(entries[i].frame); }
            else { headers.push(entries[i].frame); }
        }
        function overset(frames) {
            for (var k = 0; k < frames.length; k++) { if (frames[k].overflows) { return true; } }
            return false;
        }
        function shrink(frames) {
            if (!frames.length) { return null; }
            var size = Number(frames[0].parentStory.texts.item(0).pointSize), count = 0;
            while (autoFit && overset(frames) && size > 0.5 && count < 64) {
                size = Math.max(0.5, size * 0.9);
                // All digits are fitted together, using the same font size.
                for (var k = 0; k < frames.length; k++) {
                    var text = frames[k].parentStory.texts.item(0);
                    text.pointSize = size;
                    text.leading = size * 1.1;
                }
                doc.recompose();
                count++;
            }
            return size;
        }
        doc.recompose();
        var digitSize = shrink(digits);
        for (i = 0; i < headers.length; i++) { shrink([headers[i]]); }
        for (j = 0; j < entries.length; j++) {
            if (entries[j].frame.overflows) {
                throw Error((entries[j].kind === "digit" ? "A digit" : "The top label") +
                    " does not fit in its frame. Enable automatic font fitting or choose another font.");
            }
        }
        return digitSize;
    }

    function build(doc, page, p, font, convertOutlines, autoFit) {
        var black = color(doc, "Barcode K100", [0, 0, 0, 100]);
        var parts = [], barItems = [], digitOutlines = [], headerOutlines = [], textEntries = [];
        var r, b, t, tf, text, outlines, target, i, j;
        for (i = 0; i < p.bars.length; i++) {
            b = p.bars[i];
            r = page.rectangles.add();
            resetShape(r, doc);
            r.geometricBounds = [mm(b.y), mm(b.x), mm(b.y + b.h), mm(b.x + b.w)];
            setFill(r, black);
            barItems.push(r);
        }
        parts.push(compound(doc, page, barItems, "Bars - compound path"));
        for (i = 0; i < p.marks.length; i++) {
            var m = p.marks[i], points = [[1, 0], [1, 0.18], [0.28, 0.5],
                [1, 0.82], [1, 1], [0, 0.5]], path = [], k, px;
            for (k = 0; k < points.length; k++) {
                px = m.left ? points[k][0] : 1 - points[k][0];
                path.push([mm(m.x + px * m.w), mm(m.y + points[k][1] * m.h)]);
            }
            r = page.polygons.add();
            resetShape(r, doc);
            r.paths.item(0).entirePath = path;
            setFill(r, black);
            r.name = m.left ? "Indicator <" : "Indicator >";
            parts.push(r);
        }
        for (i = 0; i < p.texts.length; i++) {
            t = p.texts[i];
            tf = page.textFrames.add();
            resetShape(tf, doc);
            tf.fillColor = doc.swatches.item(0);
            tf.geometricBounds = [mm(t.y), mm(t.x), mm(t.y + t.h), mm(t.x + t.w)];
            tf.textFramePreferences.insetSpacing = [0, 0, 0, 0];
            tf.textFramePreferences.verticalJustification = VerticalJustification.TOP_ALIGN;
            tf.textFramePreferences.firstBaselineOffset = FirstBaseline.CAP_HEIGHT;
            tf.textFramePreferences.minimumFirstBaselineOffset = 0;
            tf.textFramePreferences.ignoreWrap = true;
            tf.textFramePreferences.textColumnCount = 1;
            tf.textFramePreferences.textColumnGutter = 0;
            tf.textFramePreferences.autoSizingType = AutoSizingTypeEnum.OFF;
            tf.contents = t.text;
            text = tf.parentStory.texts.item(0);
            text.appliedParagraphStyle = doc.paragraphStyles.item(0);
            text.appliedCharacterStyle = doc.characterStyles.item(0);
            text.clearOverrides(OverrideType.ALL);
            text.appliedFont = font;
            text.pointSize = t.size;
            text.leading = t.size * 1.1;
            text.fillColor = black;
            text.fillTint = 100;
            text.strokeColor = doc.swatches.item(0);
            text.strokeWeight = 0;
            text.overprintFill = false;
            text.justification = Justification.CENTER_ALIGN;
            text.hyphenation = false;
            text.ligatures = false;
            text.tracking = 0;
            text.horizontalScale = 100;
            text.verticalScale = 100;
            text.baselineShift = 0;
            text.alignToBaseline = false;
            text.capitalization = Capitalization.NORMAL;
            text.position = Position.NORMAL;
            text.underline = false;
            text.strikeThru = false;
            text.leftIndent = 0;
            text.rightIndent = 0;
            text.firstLineIndent = 0;
            text.spaceBefore = 0;
            text.spaceAfter = 0;
            text.noBreak = true;
            tf.name = t.kind === "digit" ? "Digit " + t.text : "Top label";
            textEntries.push({frame: tf, kind: t.kind});
        }
        p.effectiveFontSize = fitTexts(doc, textEntries, autoFit);
        for (i = 0; i < textEntries.length; i++) {
            tf = textEntries[i].frame;
            if (convertOutlines) {
                target = textEntries[i].kind === "digit" ? digitOutlines : headerOutlines;
                outlines = tf.createOutlines(true);
                if (outlines && typeof outlines.length === "number") {
                    for (j = 0; j < outlines.length; j++) { collectOutline(outlines[j], target); }
                } else if (outlines && outlines.isValid) { collectOutline(outlines, target); }
                else { throw Error("Cannot outline the text with the selected font."); }
                if (tf.isValid) { tf.remove(); }
            } else { parts.push(tf); }
        }
        if (digitOutlines.length) { parts.push(compound(doc, page, digitOutlines, "Digits " + p.code + " - compound path")); }
        if (headerOutlines.length) { parts.push(compound(doc, page, headerOutlines, "Top label - compound path")); }
        // InDesign cannot group a single object.
        var group = parts.length > 1 ? page.groups.add(parts) : parts[0];
        group.name = "EAN13 " + p.code;
        group.label = "EAN13=" + p.code + ";X_mm=" + p.module + ";digit_gap_mm=" + p.digitGap + ";version=2.8";
        return group;
    }

    function buildExact(doc, page, config) {
        var requested = config.options, layoutWidth = requested.width, layoutHeight = requested.height;
        var result = null, p, current, key, bounds, actualWidth, actualHeight, attempt;
        var tolerance = 0.002; // mm, compared with the actual InDesign bounds.
        for (attempt = 0; attempt < 16; attempt++) {
            current = {};
            for (key in requested) { if (requested.hasOwnProperty(key)) { current[key] = requested[key]; } }
            current.width = layoutWidth;
            current.height = layoutHeight;
            current.internalLayout = true;
            p = ISHI_EAN13.plan(config.plan.code, current);
            // The temporary layout is only used to construct the objects; it is not
            // used as the final size and does not create any background rectangle.
            bounds = page.bounds;
            if (mm(layoutWidth + 1) > bounds[3] - bounds[1]) {
                doc.documentPreferences.pageWidth = String(layoutWidth + 1) + " mm";
            }
            if (mm(layoutHeight + 1) > bounds[2] - bounds[0]) {
                doc.documentPreferences.pageHeight = String(layoutHeight + 1) + " mm";
            }
            result = build(doc, page, p, config.font, config.outlines, config.autoFit);
            doc.recompose();
            bounds = result.geometricBounds;
            actualWidth = (bounds[3] - bounds[1]) * 25.4 / 72;
            actualHeight = (bounds[2] - bounds[0]) * 25.4 / 72;
            if (!(actualWidth > 0 && actualHeight > 0)) { result.remove(); throw Error("Invalid barcode bounds."); }
            if (Math.abs(actualWidth - requested.width) <= tolerance &&
                Math.abs(actualHeight - requested.height) <= tolerance) {
                p.constructionWidth = layoutWidth;
                p.constructionHeight = layoutHeight;
                p.width = requested.width;
                p.height = requested.height;
                p.actualWidth = actualWidth;
                p.actualHeight = actualHeight;
                config.plan = p;
                result.label += ";width_mm=" + actualWidth + ";height_mm=" + actualHeight;
                return result;
            }
            result.remove();
            result = null;
            // Rebuild the bars and reposition text instead of scaling the group:
            // the requested font size and gap in millimetres remain unchanged.
            layoutWidth *= requested.width / actualWidth;
            layoutHeight += requested.height - actualHeight;
        }
        throw Error("Cannot achieve the requested dimensions with these settings.\n" +
            "Last measured bounds: " + actualWidth.toFixed(3) + " x " + actualHeight.toFixed(3) + " mm.");
    }

    function makeDocument(p, visible, extra) {
        var d = app.documents.add(visible);
        try {
            d.documentPreferences.facingPages = false;
            d.documentPreferences.pagesPerDocument = 1;
            d.pages.item(0).appliedMaster = NothingEnum.NOTHING;
            d.pages.item(0).marginPreferences.properties = {top: 0, bottom: 0, left: 0, right: 0,
                columnCount: 1, columnGutter: 0};
            // The temporary page does NOT need to match the barcode dimensions.
            // Shrinking it may fail because of inherited parent-page margins.
            // Only enlarge it when the barcode exceeds its current dimensions.
            d.viewPreferences.horizontalMeasurementUnits = MeasurementUnits.POINTS;
            d.viewPreferences.verticalMeasurementUnits = MeasurementUnits.POINTS;
            d.viewPreferences.rulerOrigin = RulerOrigin.PAGE_ORIGIN;
            d.zeroPoint = [0, 0];
            var bounds = d.pages.item(0).bounds;
            var wantedWidth = p.width + extra * 2, wantedHeight = p.height + extra * 2;
            if (mm(wantedWidth) > bounds[3] - bounds[1]) {
                d.documentPreferences.pageWidth = String(wantedWidth) + " mm";
            }
            if (mm(wantedHeight) > bounds[2] - bounds[0]) {
                d.documentPreferences.pageHeight = String(wantedHeight) + " mm";
            }
            return d;
        } catch (e) { d.close(SaveOptions.NO); throw e; }
    }

    function copyForCurrentView(group, sourceDoc, view) {
        var data = {name: group.name, label: group.label};
        try {
            // Selecting an off-screen object in the destination document
            // may scroll the view. Select the artwork ONLY in the source document.
            var sourceWindow = sourceDoc.windows.length ? sourceDoc.windows.item(0) : sourceDoc.windows.add();
            app.activeWindow = sourceWindow;
            app.select(group);
            app.copy();
            sourceDoc.close(SaveOptions.NO);
            return data;
        } finally {
            // No temporary objects, selections, zoom commands or page changes
            // have been applied to the original view.
            app.activeWindow = view;
        }
    }

    function insert(data, view) {
        var pasted = null, selection;
        try {
            app.activeWindow = view;
            app.select(NothingEnum.NOTHING);
            app.paste();
            selection = app.selection;
            if (!selection.length) { throw Error("InDesign did not select the pasted barcode."); }
            pasted = selection.length === 1 ? selection[0] : view.activeSpread.groups.add(selection);
            pasted.name = data.name;
            pasted.label = data.label;
            return pasted;
        } catch (e) {
            if (pasted && pasted.isValid) { pasted.remove(); }
            throw e;
        }
    }

    // Capture the layout window before opening the dialog or temporary
    // document, so insertion targets the view the user was working in.
    var destination = null, page = null, targetView = null;
    if (app.documents.length) {
        destination = app.activeDocument;
        try { targetView = app.activeWindow; page = targetView.activePage; }
        catch (viewError) {
            alert("Open a document layout window and run the script again.", "ISBN / EAN-13 Barcode");
            return;
        }
    }
    var config;
    try { config = dialog(installedFonts()); }
    catch (fontError) { alert(fontError.message, "ISBN / EAN-13 Barcode"); return; }
    if (!config) { return; }
    var originalUnits = app.scriptPreferences.measurementUnit;
    var temp = null, created = null, placed = null;
    try {
        app.scriptPreferences.measurementUnit = MeasurementUnits.POINTS;
        temp = makeDocument(config.plan, false, 0);
        var group = buildExact(temp, temp.pages.item(0), config);
        if (!destination) {
            created = makeDocument(config.plan, true, 10);
            destination = created;
            page = destination.pages.item(0);
            targetView = destination.layoutWindows.item(0);
        }
        var copiedBarcode = copyForCurrentView(group, temp, targetView);
        app.doScript(function () { placed = insert(copiedBarcode, targetView); },
            ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Insert barcode " + config.plan.code);
        alert("Barcode " + config.plan.code + " inserted in the centre of the current view.\n" +
            "Actual dimensions: " + config.plan.actualWidth.toFixed(2) + " x " + config.plan.actualHeight.toFixed(2) + " mm.\n" +
            (config.plan.effectiveFontSize !== null && config.plan.effectiveFontSize < config.plan.requestedFontSize - 0.01 ?
                "Digit font size adjusted: " + config.plan.effectiveFontSize.toFixed(2) + " pt (requested " + config.plan.requestedFontSize + " pt).\n" : "") +
            (config.outlines ? "Text converted to outlines." : "Text remains editable in InDesign."), "ISBN / EAN-13 Barcode");
    } catch (e) {
        if (created && created.isValid && !placed) { created.close(SaveOptions.NO); }
        alert("Operation could not be completed.\n" + e.message +
            (e.line ? "\nLine: " + e.line : ""), "ISBN / EAN-13 Barcode");
    } finally {
        try {
            if (temp && temp.isValid) { temp.close(SaveOptions.NO); }
        } finally { app.scriptPreferences.measurementUnit = originalUnits; }
    }
}());

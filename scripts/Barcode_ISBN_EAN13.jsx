#target "indesign"

/* Barcode ISBN / EAN-13 per Adobe InDesign - v2.8
 * Barre native, testo opzionale, font installati, indicatori < > e dimensioni.
 * Nessun plugin, font barcode, connessione o libreria esterna.
 * Modulo nominale X=0.33 mm; quiet zone 11X/7X. Altezza configurabile.
 * Il controllo matematico del codice non verifica la sua assegnazione.
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
        if (!/^\d{12}$/.test(s)) { throw Error("Il calcolo richiede 12 cifre."); }
        var sum = 0, i;
        for (i = 0; i < 12; i++) { sum += Number(s.charAt(i)) * (i % 2 ? 3 : 1); }
        return String((10 - sum % 10) % 10);
    }

    function normalize(value) {
        var s = clean(value);
        if (!/^\d{12,13}$/.test(s)) {
            throw Error("Inserisci 12 o 13 cifre. Sono ammessi spazi, trattini e il prefisso ISBN/EAN.\nGli ISBN a 10 cifre non sono supportati.");
        }
        var check = checksum(s.substr(0, 12));
        if (s.length === 12) { return s + check; }
        if (s.charAt(12) !== check) {
            throw Error("Cifra di controllo errata: attesa " + check + ", ricevuta " + s.charAt(12) + ".\nVerifica il codice originale: non e' stato modificato.");
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

    // Tutte le misure del piano sono in millimetri.
    function plan(value, options) {
        var o = options || {}, code = normalize(value);
        var width = Number(o.width), height = Number(o.height), size = Number(o.fontSize);
        var digitGap = typeof o.digitGap === "undefined" ? 0.5 : Number(o.digitGap);
        var showDigits = o.showDigits !== false, header = String(o.header || "");
        var maxLayout = o.internalLayout ? 1000 : 500;
        if (!isFinite(width) || width < 5 || width > maxLayout ||
            !isFinite(height) || height < 3 || height > maxLayout) {
            throw Error("Inserisci larghezza e altezza in mm (larghezza 5-500; altezza 3-500).");
        }
        if (!isFinite(size) || size < 1 || size > 72) {
            throw Error("Il corpo del testo deve essere compreso tra 1 e 72 punti.");
        }
        if (!isFinite(digitGap) || digitGap < 0 || digitGap > 100) {
            throw Error("La distanza dei numeri dalle barre deve essere compresa tra 0 e 100 mm.");
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
            throw Error("Altezza insufficiente per testo e margini. Aumenta l'altezza, riduci il corpo o disattiva il testo.");
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
        // Prima cifra esterna; le altre centrate nei rispettivi moduli di 7X.
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
        // Indicatori vettoriali sotto le barre; la punta coincide col margine esterno.
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
        var w = new Window("dialog", "Barcode ISBN / EAN-13 - Ishi 2.8");
        w.orientation = "column";
        w.alignChildren = "fill";
        w.margins = 16;
        var row = w.add("group");
        row.add("statictext", undefined, "ISBN / EAN:");
        var input = row.add("edittext", undefined, "");
        input.characters = 34;
        w.add("statictext", undefined, "12 o 13 cifre. Spazi e trattini ammessi; controllo automatico.");
        var status = w.add("statictext", undefined, "Inserisci il codice da generare.");
        status.characters = 65;

        var dimensions = w.add("panel", undefined, "Dimensioni effettive dell'oggetto");
        dimensions.alignChildren = "left";
        row = dimensions.add("group");
        row.add("statictext", undefined, "Larghezza (mm):");
        var width = row.add("edittext", undefined, "26");
        width.characters = 7;
        row.add("statictext", undefined, "Altezza (mm):");
        var height = row.add("edittext", undefined, "16");
        height.characters = 7;
        var standard = dimensions.add("button", undefined, "Ripristina 26 x 16 mm");
        var info = dimensions.add("statictext", undefined, "");
        info.characters = 64;
        dimensions.add("statictext", undefined, "Misure del riquadro di selezione: barre e testi inclusi, senza margini vuoti.");

        var textPanel = w.add("panel", undefined, "Testi");
        textPanel.alignChildren = "fill";
        var digits = textPanel.add("checkbox", undefined, "Mostra le 13 cifre sotto le barre");
        digits.value = true;
        row = textPanel.add("group");
        row.add("statictext", undefined, "Tipo di font:");
        var fontKind = row.add("dropdownlist", undefined, ["OCR B", "OCR A", "Qualsiasi font installato"]);
        var initialKind = 2, i;
        for (i = 0; i < fonts.length; i++) { if (fonts[i].kind === 1) { initialKind = 1; break; } }
        for (i = 0; i < fonts.length; i++) { if (fonts[i].kind === 0) { initialKind = 0; break; } }
        fontKind.selection = initialKind;
        row = textPanel.add("group");
        row.add("statictext", undefined, "Cerca font:");
        var filter = row.add("edittext", undefined, "");
        filter.characters = 32;
        var fontMenu = textPanel.add("dropdownlist", undefined, []);
        fontMenu.preferredSize.width = 450;
        row = textPanel.add("group");
        row.add("statictext", undefined, "Dimensione font dei numeri (pt):");
        var fontSize = row.add("edittext", undefined, "9");
        fontSize.characters = 6;
        row = textPanel.add("group");
        row.add("statictext", undefined, "Distanza numeri dalle barre (mm):");
        var gap = row.add("edittext", undefined, "0,5");
        gap.characters = 6;
        textPanel.add("statictext", undefined, "Distanza dal fondo delle barre corte all'inizio della zona del testo.");
        var autoFit = textPanel.add("checkbox", undefined, "Adatta il corpo automaticamente se il testo non entra");
        autoFit.value = true;
        var useHeader = textPanel.add("checkbox", undefined, "Dicitura sopra il barcode");
        useHeader.value = false;
        var header = textPanel.add("edittext", undefined, "");
        header.characters = 44;
        var outlines = textPanel.add("checkbox", undefined, "Converti i testi; unisci i numeri in un tracciato composto");
        outlines.value = true;

        var marksPanel = w.add("panel", undefined, "Indicatori dei margini sotto le barre");
        marksPanel.orientation = "row";
        var left = marksPanel.add("checkbox", undefined, "< a sinistra");
        var right = marksPanel.add("checkbox", undefined, "> a destra");
        w.add("statictext", undefined, "Fondo trasparente. Barre in un tracciato composto, nero 100% K.");
        var actions = w.add("group");
        actions.alignment = "right";
        actions.add("button", undefined, "Annulla", {name: "cancel"});
        var ok = actions.add("button", undefined, "Genera", {name: "ok"});
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
                status.text = "Codice valido: " + code +
                    (ISHI_EAN13.clean(input.text).length === 12 ? " (ultima cifra calcolata)" : "");
                auto = (/^97[89]/.test(code) ? "ISBN " : "EAN ") + code;
                if (!header.text || header.text === oldAuto) { header.text = auto; }
                oldAuto = auto;
            } catch (e) { status.text = "Inserisci un codice di 12 o 13 cifre con controllo valido."; }
            try {
                var p = ISHI_EAN13.plan(input.text, options());
                info.text = "Dimensioni finali: " + p.width.toFixed(2).replace(".", ",") +
                    " x " + p.height.toFixed(2).replace(".", ",") + " mm.";
            } catch (ignore) { info.text = "Larghezza e altezza sono indipendenti. Misure in millimetri."; }
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
                fontMenu.add("item", kind === 2 ? "Nessun font corrispondente" : "Font OCR non installato: scegli un altro tipo");
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
                        throw Error("Seleziona un font installato. OCR A e OCR B devono essere attivi in InDesign.");
                    }
                    font = visibleFonts[fontMenu.selection.index].font;
                    if (outlines.value && !font.allowOutlines) {
                        throw Error("Il font non consente la conversione in tracciati. Disattiva l'opzione o cambia font.");
                    }
                }
                result = {plan: p, options: options(), font: font, outlines: outlines.value, autoFit: autoFit.value};
                w.close(1);
            } catch (e) { alert(e.message, "Controlla il barcode"); }
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
        // Con riempimento o traccia [Nessuno], le relative proprieta' di
        // sovrastampa non sono applicabili. Impostiamo il riempimento dopo.
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
        // Questa funzione viene usata soltanto per il nero del barcode.
        item.overprintFill = false;
    }

    function compound(doc, page, items, name) {
        if (!items.length) { return null; }
        var data = [], result = null, i, j, source, dest;
        // Copia tutti i sottotracciati, comprese curve Bezier e controforme,
        // dentro UN Polygon; non dipende da makeCompoundPath su array di oggetti.
        for (i = 0; i < items.length; i++) {
            for (j = 0; j < items[i].paths.length; j++) {
                source = items[i].paths.item(j);
                data.push({points: source.entirePath, type: source.pathType});
            }
        }
        if (!data.length) { throw Error("Nessun contorno disponibile per " + name + "."); }
        try {
            result = page.polygons.add();
            resetShape(result, doc);
            for (i = 0; i < data.length; i++) {
                dest = i === 0 ? result.paths.item(0) : result.paths.add();
                dest.entirePath = data[i].points;
                dest.pathType = data[i].type;
            }
            if (result.paths.length !== data.length) { throw Error("Numero di sottotracciati inatteso."); }
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
        // Alcuni font producono un gruppo: portiamo i suoi tracciati sullo
        // stesso livello prima di usare il comando nativo Tracciato composto.
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
                // Tutte le cifre sono adattate insieme, allo stesso corpo.
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
                throw Error((entries[j].kind === "digit" ? "Una cifra" : "La dicitura superiore") +
                    " non entra nella cornice. Attiva l'adattamento automatico del corpo o scegli un font diverso.");
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
        parts.push(compound(doc, page, barItems, "Barre - tracciato composto"));
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
            r.name = m.left ? "Indicatore <" : "Indicatore >";
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
            tf.name = t.kind === "digit" ? "Cifra " + t.text : "Dicitura superiore";
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
                else { throw Error("Impossibile convertire il testo in tracciati con il font scelto."); }
                if (tf.isValid) { tf.remove(); }
            } else { parts.push(tf); }
        }
        if (digitOutlines.length) { parts.push(compound(doc, page, digitOutlines, "Numeri " + p.code + " - tracciato composto")); }
        if (headerOutlines.length) { parts.push(compound(doc, page, headerOutlines, "Dicitura superiore - tracciato composto")); }
        // InDesign non consente di raggruppare un oggetto singolo.
        var group = parts.length > 1 ? page.groups.add(parts) : parts[0];
        group.name = "EAN13 " + p.code;
        group.label = "EAN13=" + p.code + ";X_mm=" + p.module + ";digit_gap_mm=" + p.digitGap + ";version=2.8";
        return group;
    }

    function buildExact(doc, page, config) {
        var requested = config.options, layoutWidth = requested.width, layoutHeight = requested.height;
        var result = null, p, current, key, bounds, actualWidth, actualHeight, attempt;
        var tolerance = 0.002; // mm, confrontati coi bounds reali di InDesign.
        for (attempt = 0; attempt < 16; attempt++) {
            current = {};
            for (key in requested) { if (requested.hasOwnProperty(key)) { current[key] = requested[key]; } }
            current.width = layoutWidth;
            current.height = layoutHeight;
            current.internalLayout = true;
            p = ISHI_EAN13.plan(config.plan.code, current);
            // Il formato provvisorio serve solo a costruire gli oggetti: non
            // viene usato come misura finale e non crea alcun rettangolo.
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
            if (!(actualWidth > 0 && actualHeight > 0)) { result.remove(); throw Error("Ingombro del barcode non valido."); }
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
            // Ricostruisce le barre e riposiziona i testi. Non ridimensiona
            // il gruppo: corpo del font e distanza in mm restano quelli scelti.
            layoutWidth *= requested.width / actualWidth;
            layoutHeight += requested.height - actualHeight;
        }
        throw Error("Impossibile ottenere le dimensioni richieste con questi parametri.\n" +
            "Ultimo ingombro: " + actualWidth.toFixed(3) + " x " + actualHeight.toFixed(3) + " mm.");
    }

    function makeDocument(p, visible, extra) {
        var d = app.documents.add(visible);
        try {
            d.documentPreferences.facingPages = false;
            d.documentPreferences.pagesPerDocument = 1;
            d.pages.item(0).appliedMaster = NothingEnum.NOTHING;
            d.pages.item(0).marginPreferences.properties = {top: 0, bottom: 0, left: 0, right: 0,
                columnCount: 1, columnGutter: 0};
            // La pagina di appoggio NON deve avere le dimensioni del barcode.
            // Ridurla puo' fallire per i margini ereditati dalle pagine mastro.
            // Ingrandiamo soltanto se il barcode supera il formato corrente.
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
            // Selezionare un oggetto fuori vista nel documento di destinazione
            // puo' cambiare l'inquadratura. La selezione avviene SOLO nel sorgente.
            var sourceWindow = sourceDoc.windows.length ? sourceDoc.windows.item(0) : sourceDoc.windows.add();
            app.activeWindow = sourceWindow;
            app.select(group);
            app.copy();
            sourceDoc.close(SaveOptions.NO);
            return data;
        } finally {
            // La vista originale non ha ricevuto oggetti provvisori, selezioni,
            // comandi zoom o cambi di pagina.
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
            if (!selection.length) { throw Error("InDesign non ha selezionato il barcode incollato."); }
            pasted = selection.length === 1 ? selection[0] : view.activeSpread.groups.add(selection);
            pasted.name = data.name;
            pasted.label = data.label;
            return pasted;
        } catch (e) {
            if (pasted && pasted.isValid) { pasted.remove(); }
            throw e;
        }
    }

    // Catturiamo la finestra prima della finestra di dialogo e del documento
    // temporaneo, per lavorare sulla vista che l'utente stava guardando.
    var destination = null, page = null, targetView = null;
    if (app.documents.length) {
        destination = app.activeDocument;
        try { targetView = app.activeWindow; page = targetView.activePage; }
        catch (viewError) {
            alert("Apri una finestra di impaginazione del documento e rilancia lo script.", "Barcode ISBN / EAN-13");
            return;
        }
    }
    var config;
    try { config = dialog(installedFonts()); }
    catch (fontError) { alert(fontError.message, "Barcode ISBN / EAN-13"); return; }
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
            ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Inserisci barcode " + config.plan.code);
        alert("Barcode " + config.plan.code + " inserito al centro della vista corrente.\n" +
            "Dimensioni effettive: " + config.plan.actualWidth.toFixed(2) + " x " + config.plan.actualHeight.toFixed(2) + " mm.\n" +
            (config.plan.effectiveFontSize !== null && config.plan.effectiveFontSize < config.plan.requestedFontSize - 0.01 ?
                "Corpo delle cifre adattato: " + config.plan.effectiveFontSize.toFixed(2) + " pt (richiesto " + config.plan.requestedFontSize + " pt).\n" : "") +
            (config.outlines ? "Testi convertiti in tracciati." : "Testi modificabili in InDesign."), "Barcode ISBN / EAN-13");
    } catch (e) {
        if (created && created.isValid && !placed) { created.close(SaveOptions.NO); }
        alert("Operazione non completata.\n" + e.message +
            (e.line ? "\nRiga: " + e.line : ""), "Barcode ISBN / EAN-13");
    } finally {
        try {
            if (temp && temp.isValid) { temp.close(SaveOptions.NO); }
        } finally { app.scriptPreferences.measurementUnit = originalUnits; }
    }
}());

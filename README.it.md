# Barcode ISBN / EAN-13 per Adobe InDesign

[English](README.md)

Genera barcode ISBN-13 ed EAN-13 direttamente in Adobe InDesign come oggetti vettoriali nativi. Scegli i font installati, imposta dimensioni finali e distanza delle cifre dalle barre e usa il risultato nel tuo impaginato.

**Versione: 2.8** · **Dimensioni predefinite: 26 × 16 mm**

## Funzionalità

- Generazione di barcode EAN-13, compresi gli identificativi ISBN-13 dei libri.
- Verifica dei codici a 13 cifre e calcolo della cifra di controllo partendo da 12 cifre.
- Input con spazi, trattini e prefisso ISBN/EAN.
- Tutte le barre raccolte in un unico tracciato composto.
- Conversione delle 13 cifre in un secondo tracciato composto unico, conservando curve e controforme.
- Possibilità di mantenere le cifre come testo InDesign modificabile.
- Scelta tra OCR B, OCR A e altri font installati, comprese le varianti di stile.
- Corpo dei numeri in punti e distanza dalle barre in millimetri.
- Larghezza e altezza indipendenti, riferite all'ingombro effettivo degli oggetti generati.
- Indicatori `<` e `>` opzionali e dicitura superiore facoltativa.
- Fondo trasparente e nero 100% K.
- File `.jsx` autonomo, eseguito localmente senza plugin, font barcode o librerie esterne.

## File

| File | Contenuto |
| --- | --- |
| [scripts/Barcode_ISBN_EAN13.jsx](scripts/Barcode_ISBN_EAN13.jsx) | Interfaccia, messaggi e commenti in italiano |
| [scripts/ISBN_EAN13_Barcode_EN.jsx](scripts/ISBN_EAN13_Barcode_EN.jsx) | Interfaccia, messaggi e commenti in inglese |
| [README.md](README.md) | Documentazione in inglese |
| [GITHUB_DESCRIPTION.txt](GITHUB_DESCRIPTION.txt) | Descrizioni brevi del repository in italiano e inglese |

I due script usano la stessa logica di generazione e impaginazione. Puoi installare una sola lingua oppure entrambe.

## Requisiti

- Adobe InDesign desktop con supporto a JSX/ExtendScript e ScriptUI.
- Un font installato e attivo per gli eventuali testi visibili. OCR A e OCR B sono facoltativi e non sono inclusi.

La compatibilità non è stata verificata su tutte le versioni di InDesign e su tutti i sistemi operativi.

## Installazione

1. Scarica il file `.jsx` nella lingua desiderata. Se lo scarichi da GitHub, salva il file originale tramite **Raw**, evitando di salvare la pagina HTML.
2. In InDesign apri **Finestra → Utility → Script**.
3. Fai clic destro sulla cartella **Utente** e scegli **Mostra nel Finder** su macOS oppure **Mostra in Esplora risorse** su Windows.
4. Copia il file `.jsx` nella cartella **Scripts Panel**.
5. Torna in InDesign e fai doppio clic sullo script nel pannello Script.

La [documentazione Adobe sugli script](https://helpx.adobe.com/it/indesign/desktop/automation-and-scripting/document-automation/automate-workflows-with-scripts.html) descrive il pannello e le cartelle di installazione.

## Utilizzo

1. Apri l'impaginato e porta sullo schermo la zona in cui vuoi inserire il barcode.
2. Avvia lo script e inserisci il numero ISBN/EAN.
3. Imposta dimensioni, font, corpo e distanza dalle barre.
4. Scegli le opzioni per testi, conversione e indicatori, poi premi **Genera**.

Per esempio, `9780306406157` è un input valido a 13 cifre. Inserendo `978030640615`, lo script calcola il `7` finale. È accettato anche un input formattato come `ISBN 978-0-306-40615-7`.

Se la cifra di controllo di un codice completo a 13 cifre è errata, lo script segnala l'errore senza modificare automaticamente il numero. Gli ISBN a 10 cifre non sono supportati. Il controllo matematico non verifica la registrazione o l'assegnazione dell'ISBN/EAN.

Se non è aperto alcun documento, lo script ne crea uno per il barcode.

## Impostazioni predefinite

| Parametro | Valore |
| --- | --- |
| Larghezza | 26 mm |
| Altezza | 16 mm |
| Cifre sotto le barre | Attive |
| Corpo richiesto dei numeri | 9 pt |
| Distanza numeri dalle barre | 0,5 mm |
| Adattamento automatico del corpo | Attivo |
| Conversione del testo in tracciati | Attiva |
| Dicitura sopra il barcode | Disattiva |
| Indicatori sinistro e destro | Disattivi |

Quando disponibile, viene preferito OCR B, seguito da OCR A. Dal menu dei font puoi selezionare gli altri caratteri installati e filtrarli per nome.

## Dimensioni, distanza e testo

Larghezza e altezza corrispondono al riquadro di selezione dell'intera composizione, includendo gli eventuali testi e indicatori. I margini vuoti esterni sono esclusi. Non viene creato un rettangolo di fondo.

Lo script misura gli oggetti generati e corregge la costruzione fino a raggiungere le dimensioni richieste con una tolleranza di **0,002 mm**. Ricostruisce la composizione senza ridimensionare l'intero gruppo, mantenendo indipendenti il corpo richiesto e la distanza delle cifre dalle barre.

La distanza dei numeri dalle barre è misurata dal bordo inferiore delle **barre corte** all'inizio della zona del testo. Le barre di guardia prolungate non sono il riferimento per questa quota.

Con l'**adattamento automatico** attivo, se necessario tutte le cifre vengono ridotte allo stesso corpo. Il messaggio finale segnala la riduzione. Disattiva questa opzione per richiedere esattamente il corpo impostato.

Con la conversione attiva, tutti i numeri vengono raccolti in **un solo tracciato composto nativo**, separato da quello delle barre. L'eventuale dicitura superiore rimane un oggetto distinto. Se disattivi la conversione, le cornici delle cifre restano modificabili come testo.

Il fondo è trasparente: conserva lo spazio libero necessario attorno al barcode quando lo affianchi ad altre grafiche.

## Inserimento e appunti

Lo script copia gli oggetti generati da un documento temporaneo, chiude quel documento e usa il normale comando Incolla nella finestra di impaginazione originale. Non impartisce comandi di zoom o navigazione tra le pagine alla vista di destinazione.

**Il barcode generato sostituisce il contenuto degli appunti.** Il posizionamento segue il comportamento dell'Incolla nativo di InDesign in quella finestra.

## Risoluzione dei problemi

| Problema | Soluzione |
| --- | --- |
| Cifra di controllo errata | Verifica il numero originale oppure inserisci le prime 12 cifre per calcolare l'ultima. |
| Font OCR non disponibile | Attiva il font e riavvia lo script, oppure scegli un altro font installato. |
| Il testo non entra | Attiva l'adattamento automatico, riduci il corpo richiesto o aumenta la larghezza. |
| Dimensioni richieste non raggiungibili | Riduci corpo o distanza, oppure aumenta le dimensioni complessive. |

Per segnalare un problema, indica versione dello script, versione di InDesign, sistema operativo, codice inserito, opzioni selezionate e messaggio completo con numero di riga. Per problemi di posizionamento, aggiungi il livello di zoom e uno screenshot della vista prima di avviare lo script.

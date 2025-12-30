// Farming Manager Application with Notes
document.addEventListener('DOMContentLoaded', function() {
    // Current date
    const currentDate = new Date().toLocaleDateString('hi-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    document.getElementById('currentDate').textContent = currentDate;
    
    // Set today's date in note date field
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('noteDate').value = today;
    
    // Application state
    const state = {
        rows: [],
        unitPrice: 100,
        tools: [
            { id: 1, name: "हैरो", icon: "fa-tractor" },
            { id: 2, name: "टिलर", icon: "fa-seedling" },
            { id: 3, name: "रूटर", icon: "fa-tools" }
        ],
        nextRowId: 1,
        notes: [],
        currentNoteId: null,
        nextNoteId: 1
    };
    
    // Load notes from localStorage
    function loadNotesFromStorage() {
        const savedNotes = localStorage.getItem('farmingNotes');
        if (savedNotes) {
            state.notes = JSON.parse(savedNotes);
            if (state.notes.length > 0) {
                state.nextNoteId = Math.max(...state.notes.map(note => note.id)) + 1;
            }
            renderNotesList();
        }
    }
    
    // Save notes to localStorage
    function saveNotesToStorage() {
        localStorage.setItem('farmingNotes', JSON.stringify(state.notes));
    }
    
    // DOM Elements
    const tableBody = document.getElementById('tableBody');
    const priceInput = document.getElementById('priceInput');
    const priceDisplay = document.getElementById('priceDisplay');
    const addRowBtn = document.getElementById('addRowBtn');
    const calculateBtn = document.getElementById('calculateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const resetBtn = document.getElementById('resetBtn');
    const exportBtn = document.getElementById('exportBtn');
    const printBtn = document.getElementById('printBtn');
    
    // Notes DOM Elements
    const newNoteBtn = document.getElementById('newNoteBtn');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const clearNoteBtn = document.getElementById('clearNoteBtn');
    const noteTitle = document.getElementById('noteTitle');
    const noteFarmer = document.getElementById('noteFarmer');
    const noteDate = document.getElementById('noteDate');
    const noteLandSize = document.getElementById('noteLandSize');
    const noteTool = document.getElementById('noteTool');
    const noteContent = document.getElementById('noteContent');
    const notesList = document.getElementById('notesList');
    const notesSearch = document.getElementById('notesSearch');
    
    // Summary elements
    const totalMeasurementElement = document.getElementById('totalMeasurement');
    const totalSelectionElement = document.getElementById('totalSelection');
    const totalResultElement = document.getElementById('totalResult');
    const totalRowsElement = document.getElementById('totalRows');
    const harrowCountElement = document.getElementById('harrowCount');
    const tillerCountElement = document.getElementById('tillerCount');
    const routerCountElement = document.getElementById('routerCount');
    
    // Initialize the app
    function initApp() {
        // Add initial rows
        addNewRow();
        addNewRow();
        
        // Load notes from storage
        loadNotesFromStorage();
        
        // Set up event listeners
        setupEventListeners();
        
        // Calculate initial values
        calculateAll();
        updateSummary();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Price input change
        priceInput.addEventListener('input', function() {
            state.unitPrice = parseFloat(this.value) || 0;
            priceDisplay.textContent = `₹${state.unitPrice.toFixed(2)}`;
            calculateAll();
            updateSummary();
        });
        
        // Add row button
        addRowBtn.addEventListener('click', addNewRow);
        
        // Calculate button
        calculateBtn.addEventListener('click', function() {
            calculateAll();
            updateSummary();
            showNotification('गणना पूरी हुई!', 'success');
        });
        
        // Clear button
        clearBtn.addEventListener('click', function() {
            clearAllInputs();
            showNotification('सभी इनपुट साफ किए गए!', 'info');
        });
        
        // Reset button
        resetBtn.addEventListener('click', function() {
            if (confirm('क्या आप सभी डेटा रीसेट करना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।')) {
                resetApp();
                showNotification('एप्लिकेशन रीसेट हो गया!', 'warning');
            }
        });
        
        // Export button
        exportBtn.addEventListener('click', exportData);
        
        // Print button
        printBtn.addEventListener('click', function() {
            window.print();
        });
        
        // Notes buttons
        newNoteBtn.addEventListener('click', createNewNote);
        saveNoteBtn.addEventListener('click', saveNote);
        clearNoteBtn.addEventListener('click', clearNoteForm);
        
        // Notes search
        notesSearch.addEventListener('input', filterNotes);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(event) {
            // Ctrl + N: Add new row
            if (event.ctrlKey && event.key === 'n') {
                event.preventDefault();
                addNewRow();
            }
            
            // Ctrl + Shift + N: New note
            if (event.ctrlKey && event.shiftKey && event.key === 'N') {
                event.preventDefault();
                createNewNote();
            }
            
            // Ctrl + S: Save note
            if (event.ctrlKey && event.key === 's') {
                event.preventDefault();
                saveNote();
            }
            
            // Ctrl + Enter: Calculate all
            if (event.ctrlKey && event.key === 'Enter') {
                event.preventDefault();
                calculateAll();
                updateSummary();
            }
            
            // Ctrl + R: Reset app
            if (event.ctrlKey && event.key === 'r') {
                event.preventDefault();
                resetBtn.click();
            }
            
            // F1: Show help
            if (event.key === 'F1') {
                event.preventDefault();
                showHelp();
            }
        });
    }
    
    // Add a new row to the table
    function addNewRow() {
        const rowId = state.nextRowId++;
        const row = {
            id: rowId,
            measurement: 0,
            selection: 1,
            tool: state.tools[0].name,
            result: 0
        };
        
        state.rows.push(row);
        
        // Create table row element
        const tr = document.createElement('tr');
        tr.id = `row-${rowId}`;
        tr.innerHTML = `
            <td>${rowId}</td>
            <td>
                <input type="number" class="table-input measurement-input" 
                       data-id="${rowId}" step="0.01" min="0" 
                       placeholder="0.00" value="0">
            </td>
            <td>
                <select class="table-select selection-input" data-id="${rowId}">
                    <option value="1" selected>1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                </select>
            </td>
            <td>
                <select class="table-select tool-input" data-id="${rowId}">
                    ${state.tools.map(tool => 
                        `<option value="${tool.name}">${tool.name}</option>`
                    ).join('')}
                </select>
            </td>
            <td class="result-cell" id="result-${rowId}">₹0.00</td>
            <td>
                <button class="delete-btn" data-id="${rowId}" title="पंक्ति हटाएं">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(tr);
        
        // Add event listeners to new row inputs
        const measurementInput = tr.querySelector('.measurement-input');
        const selectionInput = tr.querySelector('.selection-input');
        const toolInput = tr.querySelector('.tool-input');
        const deleteBtn = tr.querySelector('.delete-btn');
        
        measurementInput.addEventListener('input', function() {
            updateRow(rowId);
        });
        
        selectionInput.addEventListener('change', function() {
            updateRow(rowId);
        });
        
        toolInput.addEventListener('change', function() {
            updateRow(rowId);
        });
        
        deleteBtn.addEventListener('click', function() {
            deleteRow(rowId);
        });
        
        // Update the state row
        updateRow(rowId);
        updateSummary();
        
        // Scroll to new row
        tr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Focus on measurement input
        setTimeout(() => measurementInput.focus(), 100);
    }
    
    // Update a specific row
    function updateRow(rowId) {
        const rowIndex = state.rows.findIndex(row => row.id === rowId);
        if (rowIndex === -1) return;
        
        const row = state.rows[rowIndex];
        const measurementInput = document.querySelector(`.measurement-input[data-id="${rowId}"]`);
        const selectionInput = document.querySelector(`.selection-input[data-id="${rowId}"]`);
        const toolInput = document.querySelector(`.tool-input[data-id="${rowId}"]`);
        
        if (measurementInput && selectionInput && toolInput) {
            row.measurement = parseFloat(measurementInput.value) || 0;
            row.selection = parseInt(selectionInput.value) || 1;
            row.tool = toolInput.value;
            row.result = row.measurement * row.selection * state.unitPrice;
            
            // Update result display
            const resultElement = document.getElementById(`result-${rowId}`);
            if (resultElement) {
                resultElement.textContent = `₹${row.result.toFixed(2)}`;
            }
        }
    }
    
    // Delete a row
    function deleteRow(rowId) {
        if (state.rows.length <= 1) {
            showNotification('कम से कम एक पंक्ति आवश्यक है!', 'error');
            return;
        }
        
        if (confirm('क्या आप इस पंक्ति को हटाना चाहते हैं?')) {
            // Remove from state
            state.rows = state.rows.filter(row => row.id !== rowId);
            
            // Remove from DOM
            const rowElement = document.getElementById(`row-${rowId}`);
            if (rowElement) {
                rowElement.remove();
            }
            
            // Update summary
            updateSummary();
            
            showNotification('पंक्ति हटा दी गई!', 'info');
        }
    }
    
    // Calculate all rows
    function calculateAll() {
        state.rows.forEach(row => {
            updateRow(row.id);
        });
    }
    
    // Clear all inputs
    function clearAllInputs() {
        state.rows.forEach(row => {
            const measurementInput = document.querySelector(`.measurement-input[data-id="${row.id}"]`);
            const selectionInput = document.querySelector(`.selection-input[data-id="${row.id}"]`);
            
            if (measurementInput) measurementInput.value = '';
            if (selectionInput) selectionInput.value = '1';
            
            updateRow(row.id);
        });
        
        updateSummary();
    }
    
    // Reset the entire app
    function resetApp() {
        // Clear state
        state.rows = [];
        state.nextRowId = 1;
        
        // Clear table
        tableBody.innerHTML = '';
        
        // Reset price
        priceInput.value = '100';
        state.unitPrice = 100;
        priceDisplay.textContent = '₹100.00';
        
        // Add new rows
        addNewRow();
        addNewRow();
        
        // Update summary
        updateSummary();
    }
    
    // Update summary display
    function updateSummary() {
        let totalMeasurement = 0;
        let totalSelection = 0;
        let totalResult = 0;
        
        // Count tools
        const toolCounts = {
            "हैरो": 0,
            "टिलर": 0,
            "रूटर": 0
        };
        
        state.rows.forEach(row => {
            totalMeasurement += row.measurement;
            totalSelection += row.selection;
            totalResult += row.result;
            
            if (toolCounts.hasOwnProperty(row.tool)) {
                toolCounts[row.tool]++;
            }
        });
        
        // Update summary elements
        totalMeasurementElement.textContent = `${totalMeasurement.toFixed(2)} बीघा`;
        totalSelectionElement.textContent = totalSelection;
        totalResultElement.textContent = `₹${totalResult.toFixed(2)}`;
        totalRowsElement.textContent = state.rows.length;
        
        // Update tool counts
        harrowCountElement.textContent = toolCounts["हैरो"];
        tillerCountElement.textContent = toolCounts["टिलर"];
        routerCountElement.textContent = toolCounts["रूटर"];
    }
    
    // Export data as CSV
    function exportData() {
        if (state.rows.length === 0) {
            showNotification('निर्यात करने के लिए कोई डेटा नहीं है!', 'error');
            return;
        }
        
        // Create CSV content
        let csvContent = "क्र.,माप (बीघा),चयन,उपकरण,परिणाम (₹)\n";
        
        state.rows.forEach(row => {
            csvContent += `${row.id},${row.measurement},${row.selection},${row.tool},${row.result.toFixed(2)}\n`;
        });
        
        // Add summary
        csvContent += `\nकुल योग,,,,\n`;
        csvContent += `कुल माप,${state.rows.reduce((sum, row) => sum + row.measurement, 0).toFixed(2)},,,,\n`;
        csvContent += `कुल चयन,${state.rows.reduce((sum, row) => sum + row.selection, 0)},,,,\n`;
        csvContent += `कुल राशि,${state.rows.reduce((sum, row) => sum + row.result, 0).toFixed(2)},,,,\n`;
        csvContent += `यूनिट मूल्य,${state.unitPrice.toFixed(2)},,,,\n`;
        csvContent += `निर्यात तिथि,${currentDate},,,,\n`;
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Farming_Manager_Data_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('डेटा सफलतापूर्वक निर्यात हो गया!', 'success');
    }
    
    // Notes functions
    function createNewNote() {
        state.currentNoteId = null;
        clearNoteForm();
        noteTitle.focus();
        showNotification('नया नोट तैयार है!', 'info');
    }
    
    function clearNoteForm() {
        noteTitle.value = '';
        noteFarmer.value = '';
        noteDate.value = today;
        noteLandSize.value = '';
        noteTool.value = 'हैरो';
        noteContent.value = '';
        state.currentNoteId = null;
        
        // Remove active class from all notes
        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.remove('active');
        });
    }
    
    function saveNote() {
        const title = noteTitle.value.trim();
        const farmer = noteFarmer.value.trim();
        const date = noteDate.value;
        const landSize = noteLandSize.value;
        const tool = noteTool.value;
        const content = noteContent.value.trim();
        
        if (!title) {
            showNotification('कृपया नोट का शीर्षक दर्ज करें!', 'error');
            noteTitle.focus();
            return;
        }
        
        if (!content) {
            showNotification('कृपया नोट की सामग्री दर्ज करें!', 'error');
            noteContent.focus();
            return;
        }
        
        const noteData = {
            id: state.currentNoteId || state.nextNoteId++,
            title,
            farmer,
            date,
            landSize,
            tool,
            content,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        };
        
        if (state.currentNoteId) {
            // Update existing note
            const noteIndex = state.notes.findIndex(note => note.id === state.currentNoteId);
            if (noteIndex !== -1) {
                noteData.created = state.notes[noteIndex].created;
                state.notes[noteIndex] = noteData;
                showNotification('नोट अपडेट हो गया!', 'success');
            }
        } else {
            // Add new note
            state.notes.unshift(noteData);
            showNotification('नोट सहेजा गया!', 'success');
        }
        
        // Save to localStorage
        saveNotesToStorage();
        
        // Render notes list
        renderNotesList();
        
        // Clear form if it was a new note
        if (!state.currentNoteId) {
            clearNoteForm();
        }
    }
    
    function renderNotesList(searchTerm = '') {
        notesList.innerHTML = '';
        
        let filteredNotes = state.notes;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filteredNotes = state.notes.filter(note => 
                note.title.toLowerCase().includes(term) ||
                note.farmer.toLowerCase().includes(term) ||
                note.content.toLowerCase().includes(term) ||
                note.tool.toLowerCase().includes(term)
            );
        }
        
        if (filteredNotes.length === 0) {
            notesList.innerHTML = `
                <div class="empty-notes">
                    <i class="fas fa-clipboard"></i>
                    <p>${searchTerm ? 'खोज से मेल खाता कोई नोट नहीं मिला' : 'अभी तक कोई नोट नहीं है। नया नोट बनाने के लिए "+" बटन दबाएं।'}</p>
                </div>
            `;
            return;
        }
        
        filteredNotes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = `note-item ${note.id === state.currentNoteId ? 'active' : ''}`;
            noteElement.innerHTML = `
                <div class="note-item-header">
                    <div class="note-item-title">
                        <i class="fas fa-sticky-note"></i>
                        ${note.title}
                    </div>
                    <div class="note-item-actions">
                        <button class="btn-icon edit-note" data-id="${note.id}" title="संपादित करें">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete-note" data-id="${note.id}" title="हटाएं">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="note-item-meta">
                    ${note.farmer ? `<span><i class="fas fa-user"></i> ${note.farmer}</span>` : ''}
                    ${note.landSize ? `<span><i class="fas fa-ruler"></i> ${note.landSize} बीघा</span>` : ''}
                    ${note.tool ? `<span><i class="fas fa-tractor"></i> ${note.tool}</span>` : ''}
                    ${note.date ? `<span><i class="fas fa-calendar"></i> ${formatDate(note.date)}</span>` : ''}
                </div>
                <div class="note-item-content">
                    ${note.content.length > 150 ? note.content.substring(0, 150) + '...' : note.content}
                </div>
                <div class="note-item-date">
                    अंतिम अपडेट: ${formatDateTime(note.updated)}
                </div>
            `;
            
            notesList.appendChild(noteElement);
            
            // Add event listeners
            const editBtn = noteElement.querySelector('.edit-note');
            const deleteBtn = noteElement.querySelector('.delete-note');
            
            editBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                editNote(note.id);
            });
            
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                deleteNote(note.id);
            });
            
            noteElement.addEventListener('click', function() {
                loadNote(note.id);
            });
        });
    }
    
    function loadNote(noteId) {
        const note = state.notes.find(n => n.id === noteId);
        if (!note) return;
        
        noteTitle.value = note.title;
        noteFarmer.value = note.farmer || '';
        noteDate.value = note.date || '';
        noteLandSize.value = note.landSize || '';
        noteTool.value = note.tool || 'हैरो';
        noteContent.value = note.content;
        state.currentNoteId = note.id;
        
        // Set active note
        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`.note-item[data-id="${note.id}"]`)?.classList.add('active');
        
        // Scroll to note editor
        document.querySelector('.note-editor').scrollIntoView({ behavior: 'smooth' });
    }
    
    function editNote(noteId) {
        loadNote(noteId);
        showNotification('नोट संपादित करने के लिए तैयार है!', 'info');
    }
    
    function deleteNote(noteId) {
        if (confirm('क्या आप यह नोट हटाना चाहते हैं?')) {
            state.notes = state.notes.filter(note => note.id !== noteId);
            
            if (state.currentNoteId === noteId) {
                clearNoteForm();
            }
            
            saveNotesToStorage();
            renderNotesList();
            showNotification('नोट हटा दिया गया!', 'info');
        }
    }
    
    function filterNotes() {
        renderNotesList(notesSearch.value);
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('hi-IN');
    }
    
    function formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('hi-IN');
    }
    
    // Show notification
    function showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                                type === 'error' ? 'fa-exclamation-circle' : 
                                type === 'warning' ? 'fa-exclamation-triangle' : 
                                'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Add styles for notification
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 16px 24px;
                    border-radius: 8px;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    min-width: 300px;
                    max-width: 400px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    z-index: 1000;
                    animation: slideIn 0.3s ease-out;
                }
                .notification-success {
                    background: linear-gradient(to right, #2e7d32, #4caf50);
                    border-left: 5px solid #1b5e20;
                }
                .notification-error {
                    background: linear-gradient(to right, #c62828, #f44336);
                    border-left: 5px solid #b71c1c;
                }
                .notification-warning {
                    background: linear-gradient(to right, #f57c00, #ff9800);
                    border-left: 5px solid #e65100;
                }
                .notification-info {
                    background: linear-gradient(to right, #1565c0, #2196f3);
                    border-left: 5px solid #0d47a1;
                }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .notification-close {
                    background: transparent;
                    border: none;
                    color: white;
                    cursor: pointer;
                    font-size: 18px;
                    margin-left: 15px;
                }
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', function() {
            notification.remove();
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
        
        // Add slideOut animation
        if (!document.querySelector('#notification-slideout')) {
            const slideoutStyle = document.createElement('style');
            slideoutStyle.id = 'notification-slideout';
            slideoutStyle.textContent = `
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(slideoutStyle);
        }
    }
    
    // Show help information
    function showHelp() {
        const helpMessage = `
            <strong>Farming Manager - सहायता</strong><br><br>
            <strong>कीबोर्ड शॉर्टकट:</strong><br>
            • Ctrl + N: नई पंक्ति जोड़ें<br>
            • Ctrl + Shift + N: नया नोट बनाएं<br>
            • Ctrl + S: नोट सहेजें<br>
            • Ctrl + Enter: सभी गणना करें<br>
            • Ctrl + R: एप्लिकेशन रीसेट करें<br>
            • F1: यह सहायता दिखाएं<br><br>
            <strong>उपयोग निर्देश:</strong><br>
            1. प्रति यूनिट मूल्य सेट करें<br>
            2. प्रत्येक पंक्ति में माप और चयन दर्ज करें<br>
            3. उपकरण प्रकार चुनें<br>
            4. "गणना करें" बटन दबाएं<br>
            5. कुल योग नीचे देखें<br><br>
            <strong>नोट्स सुविधा:</strong><br>
            • किसानों के जुताई हिसाब सहेजें<br>
            • खेत की जानकारी संग्रहित करें<br>
            • तारीख और उपकरण विवरण दर्ज करें<br>
            • नोट्स खोजें और संपादित करें<br><br>
            <strong>निर्यात:</strong> CSV फ़ाइल के रूप में डेटा निर्यात करें<br>
            <strong>प्रिंट:</strong> वर्तमान डेटा प्रिंट करें
        `;
        
        // Create help dialog
        const helpDialog = document.createElement('div');
        helpDialog.id = 'helpDialog';
        helpDialog.innerHTML = `
            <div class="help-dialog-content">
                <div class="help-dialog-header">
                    <h3><i class="fas fa-question-circle"></i> सहायता</h3>
                    <button class="help-dialog-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="help-dialog-body">
                    ${helpMessage}
                </div>
                <div class="help-dialog-footer">
                    <button class="btn btn-primary" id="closeHelpBtn">
                        <i class="fas fa-check"></i> ठीक है
                    </button>
                </div>
            </div>
        `;
        
        // Add styles for help dialog
        if (!document.querySelector('#help-dialog-styles')) {
            const style = document.createElement('style');
            style.id = 'help-dialog-styles';
            style.textContent = `
                #helpDialog {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    animation: fadeIn 0.3s ease-out;
                }
                .help-dialog-content {
                    background: white;
                    border-radius: 10px;
                    width: 90%;
                    max-width: 600px;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    animation: slideUp 0.4s ease-out;
                }
                .help-dialog-header {
                    background: linear-gradient(to right, #2196f3, #21cbf3);
                    color: white;
                    padding: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-radius: 10px 10px 0 0;
                }
                .help-dialog-header h3 {
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .help-dialog-close {
                    background: transparent;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                }
                .help-dialog-body {
                    padding: 25px;
                    line-height: 1.8;
                    color: #333;
                }
                .help-dialog-footer {
                    padding: 20px;
                    text-align: center;
                    border-top: 1px solid #ddd;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from {
                        transform: translateY(50px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add to DOM
        document.body.appendChild(helpDialog);
        
        // Close button functionality
        const closeBtn = helpDialog.querySelector('.help-dialog-close');
        const closeHelpBtn = helpDialog.querySelector('#closeHelpBtn');
        
        closeBtn.addEventListener('click', function() {
            helpDialog.remove();
        });
        
        closeHelpBtn.addEventListener('click', function() {
            helpDialog.remove();
        });
        
        // Close on outside click
        helpDialog.addEventListener('click', function(event) {
            if (event.target === helpDialog) {
                helpDialog.remove();
            }
        });
    }
    
    // Initialize the application
    initApp();
});

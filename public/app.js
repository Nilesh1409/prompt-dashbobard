// API Base URL
const API_BASE = window.location.origin + '/api';

// State management
let currentSchema = null;
let queryHistory = [];

// DOM Elements
const promptInput = document.getElementById('prompt-input');
const submitButton = document.getElementById('submit-query');
const statusIndicator = document.getElementById('status');
const refreshSchemaButton = document.getElementById('refresh-schema');
const resultsContainer = document.getElementById('results-container');
const sqlDisplay = document.getElementById('sql-display');
const explanationDisplay = document.getElementById('explanation-display');
const schemaContainer = document.getElementById('schema-container');
const statsContainer = document.getElementById('stats-container');
const historyContainer = document.getElementById('history-container');
const copySqlButton = document.getElementById('copy-sql');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkHealth();
    loadSchema();
    loadStats();
    setupEventListeners();
    loadHistoryFromStorage();
});

// Setup event listeners
function setupEventListeners() {
    submitButton.addEventListener('click', handleQuerySubmit);
    
    promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleQuerySubmit();
        }
    });

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Example query chips
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            promptInput.value = chip.dataset.query;
            promptInput.focus();
        });
    });

    // Refresh schema button
    refreshSchemaButton.addEventListener('click', () => {
        loadSchema();
        loadStats();
    });

    // Copy SQL button
    copySqlButton.addEventListener('click', copySqlToClipboard);
}

// Check API health
async function checkHealth() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        
        if (data.database === 'connected') {
            statusIndicator.textContent = '🟢 Database Connected';
            statusIndicator.classList.add('connected');
        } else {
            statusIndicator.textContent = '🔴 Database Disconnected';
            statusIndicator.classList.add('disconnected');
        }
    } catch (error) {
        statusIndicator.textContent = '🔴 Server Offline';
        statusIndicator.classList.add('disconnected');
        console.error('Health check failed:', error);
    }
}

// Load database schema
async function loadSchema() {
    try {
        const response = await fetch(`${API_BASE}/schema`);
        const data = await response.json();
        
        if (data.success) {
            currentSchema = data.schema;
            displaySchema(data.schema);
        } else {
            schemaContainer.innerHTML = `
                <div class="alert alert-error">
                    Failed to load schema: ${data.error}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading schema:', error);
        schemaContainer.innerHTML = `
            <div class="alert alert-error">
                Error loading schema. Please check your connection.
            </div>
        `;
    }
}

// Display database schema
function displaySchema(schema) {
    if (Object.keys(schema).length === 0) {
        schemaContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>No tables found in the database</p>
            </div>
        `;
        return;
    }

    let html = '';
    
    Object.keys(schema).forEach(tableName => {
        const columns = schema[tableName];
        html += `
            <div class="schema-table">
                <h3>📋 ${tableName}</h3>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Column Name</th>
                                <th>Data Type</th>
                                <th>Nullable</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${columns.map(col => `
                                <tr>
                                    <td><strong>${col.column}</strong></td>
                                    <td>${col.type}</td>
                                    <td>${col.nullable ? '✓' : '✗'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });

    schemaContainer.innerHTML = html;
}

// Load database statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const data = await response.json();
        
        if (data.success) {
            displayStats(data.stats);
        } else {
            statsContainer.innerHTML = `
                <div class="alert alert-error">
                    Failed to load statistics: ${data.error}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        statsContainer.innerHTML = `
            <div class="alert alert-error">
                Error loading statistics. Please check your connection.
            </div>
        `;
    }
}

// Display database statistics
function displayStats(stats) {
    if (stats.length === 0) {
        statsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <p>No statistics available</p>
            </div>
        `;
        return;
    }

    let html = '<div class="table-container"><table><thead><tr>';
    html += '<th>Table Name</th><th>Size</th><th>Row Count</th>';
    html += '</tr></thead><tbody>';
    
    stats.forEach(stat => {
        html += `
            <tr>
                <td><strong>${stat.tablename}</strong></td>
                <td>${stat.size}</td>
                <td>${stat.row_count.toLocaleString()}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    statsContainer.innerHTML = html;
}

// Handle query submission
async function handleQuerySubmit() {
    const prompt = promptInput.value.trim();
    
    if (!prompt) {
        showError('Please enter a question or query');
        return;
    }

    // Disable button and show loading state
    submitButton.disabled = true;
    document.querySelector('.btn-text').style.display = 'none';
    document.querySelector('.btn-loader').style.display = 'inline';

    try {
        const response = await fetch(`${API_BASE}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
        });

        const data = await response.json();

        if (data.success) {
            displayResults(data);
            addToHistory(prompt, data);
            switchTab('results');
        } else {
            showError(`Error: ${data.error}`);
            
            // Show generated SQL even if it failed
            if (data.generatedSQL) {
                sqlDisplay.innerHTML = `<code>${escapeHtml(data.generatedSQL)}</code>`;
            }
        }
    } catch (error) {
        console.error('Query error:', error);
        showError('Failed to execute query. Please try again.');
    } finally {
        // Re-enable button
        submitButton.disabled = false;
        document.querySelector('.btn-text').style.display = 'inline';
        document.querySelector('.btn-loader').style.display = 'none';
    }
}

// Display query results
function displayResults(data) {
    const { results, generatedSQL, explanation } = data;

    // Update SQL tab
    sqlDisplay.innerHTML = `<code>${escapeHtml(generatedSQL)}</code>`;
    explanationDisplay.innerHTML = `<p><strong>Explanation:</strong> ${explanation}</p>`;

    // Update results tab
    if (results.rows.length === 0) {
        resultsContainer.innerHTML = `
            <div class="alert alert-success">
                Query executed successfully, but returned no results.
            </div>
            <div class="result-meta">
                <span>⏱️ ${results.executionTime}ms</span>
                <span>📊 ${results.rowCount} rows</span>
            </div>
        `;
        return;
    }

    let html = `
        <div class="result-meta">
            <span>⏱️ Execution Time: ${results.executionTime}ms</span>
            <span>📊 Rows: ${results.rowCount}</span>
            <span>📋 Columns: ${results.fields.length}</span>
        </div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        ${results.fields.map(field => `<th>${field}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${results.rows.map(row => `
                        <tr>
                            ${results.fields.map(field => `
                                <td>${formatCellValue(row[field])}</td>
                            `).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    resultsContainer.innerHTML = html;
}

// Format cell values for display
function formatCellValue(value) {
    if (value === null || value === undefined) {
        return '<em style="color: #999;">NULL</em>';
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    if (typeof value === 'boolean') {
        return value ? '✓' : '✗';
    }
    return escapeHtml(String(value));
}

// Show error message
function showError(message) {
    resultsContainer.innerHTML = `
        <div class="alert alert-error">
            <strong>Error:</strong> ${message}
        </div>
    `;
    switchTab('results');
}

// Add query to history
function addToHistory(prompt, data) {
    const historyItem = {
        timestamp: new Date().toISOString(),
        prompt,
        sql: data.generatedSQL,
        rowCount: data.results.rowCount,
    };

    queryHistory.unshift(historyItem);
    
    // Keep only last 20 queries
    if (queryHistory.length > 20) {
        queryHistory = queryHistory.slice(0, 20);
    }

    saveHistoryToStorage();
    displayHistory();
}

// Display query history
function displayHistory() {
    if (queryHistory.length === 0) {
        historyContainer.innerHTML = '<p class="empty-text">No query history yet</p>';
        return;
    }

    let html = '';
    queryHistory.forEach((item, index) => {
        const date = new Date(item.timestamp);
        html += `
            <div class="history-item" data-index="${index}">
                <div class="timestamp">${date.toLocaleString()}</div>
                <div class="query">${escapeHtml(item.prompt)}</div>
                <div class="history-meta" style="font-size: 0.85rem; color: #6b7280; margin-top: 5px;">
                    ${item.rowCount} rows returned
                </div>
            </div>
        `;
    });

    historyContainer.innerHTML = html;

    // Add click handlers to history items
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = item.dataset.index;
            promptInput.value = queryHistory[index].prompt;
            promptInput.focus();
        });
    });
}

// Save history to localStorage
function saveHistoryToStorage() {
    try {
        localStorage.setItem('queryHistory', JSON.stringify(queryHistory));
    } catch (error) {
        console.error('Failed to save history:', error);
    }
}

// Load history from localStorage
function loadHistoryFromStorage() {
    try {
        const stored = localStorage.getItem('queryHistory');
        if (stored) {
            queryHistory = JSON.parse(stored);
            displayHistory();
        }
    } catch (error) {
        console.error('Failed to load history:', error);
    }
}

// Switch between tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Copy SQL to clipboard
function copySqlToClipboard() {
    const sqlText = sqlDisplay.textContent;
    
    navigator.clipboard.writeText(sqlText).then(() => {
        const originalText = copySqlButton.textContent;
        copySqlButton.textContent = '✓ Copied!';
        setTimeout(() => {
            copySqlButton.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard');
    });
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


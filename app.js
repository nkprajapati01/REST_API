// BFHL API Tester JavaScript
class BFHLTester {
    constructor() {
        this.examples = [
            {
                name: "Example A",
                description: "Mixed data with numbers, letters, and special characters",
                input: ["a","1","334","4","R", "$"],
                expectedOutput: {
                    odd_numbers: ["1"],
                    even_numbers: ["334","4"],
                    alphabets: ["A","R"],
                    special_characters: ["$"],
                    sum: "339",
                    concat_string: "Ra"
                }
            },
            {
                name: "Example B",
                description: "Larger mixed dataset",
                input: ["2","a", "y", "4", "&", "-", "*", "5","92","b"],
                expectedOutput: {
                    odd_numbers: ["5"],
                    even_numbers: ["2","4","92"],
                    alphabets: ["A", "Y", "B"],
                    special_characters: ["&", "-", "*"],
                    sum: "103",
                    concat_string: "ByA"
                }
            },
            {
                name: "Example C",
                description: "Only alphabetic strings",
                input: ["A","ABcD","DOE"],
                expectedOutput: {
                    odd_numbers: [],
                    even_numbers: [],
                    alphabets: ["A","ABCD","DOE"],
                    special_characters: [],
                    sum: "0",
                    concat_string: "EoDdCbAa"
                }
            }
        ];

        this.apiUrls = {
            local: "http://localhost:3000/bfhl",
            deployed: "https://your-app.vercel.app/bfhl"
        };

        this.requestTimeout = 10000; // 10 seconds timeout
        this.currentRequest = null; // Track current request for cancellation

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateApiUrl();
    }

    bindEvents() {
        // Example buttons
        document.querySelectorAll('.example-btn').forEach((btn, index) => {
            btn.addEventListener('click', () => this.loadExample(index));
        });

        // API type toggle
        document.querySelectorAll('input[name="apiType"]').forEach(radio => {
            radio.addEventListener('change', () => this.updateApiUrl());
        });

        // Control buttons
        document.getElementById('formatBtn').addEventListener('click', () => this.formatJSON());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearInput());
        document.getElementById('testBtn').addEventListener('click', () => this.testAPI());
        document.getElementById('copyBtn').addEventListener('click', () => this.copyResponse());

        // Enter key in textarea
        document.getElementById('jsonInput').addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.testAPI();
            }
        });
    }

    updateApiUrl() {
        const selectedType = document.querySelector('input[name="apiType"]:checked').value;
        const urlInput = document.getElementById('apiUrl');
        urlInput.value = this.apiUrls[selectedType];
    }

    loadExample(index) {
        const example = this.examples[index];
        const jsonData = {
            data: example.input
        };
        
        document.getElementById('jsonInput').value = JSON.stringify(jsonData, null, 2);
        this.showToast(`Loaded ${example.name}`, 'success');
    }

    formatJSON() {
        const input = document.getElementById('jsonInput');
        const text = input.value.trim();
        
        if (!text) {
            this.showToast('No content to format', 'error');
            return;
        }

        try {
            const parsed = JSON.parse(text);
            input.value = JSON.stringify(parsed, null, 2);
            this.showToast('JSON formatted successfully', 'success');
        } catch (e) {
            this.showToast('Invalid JSON format', 'error');
        }
    }

    clearInput() {
        document.getElementById('jsonInput').value = '';
        this.hideResults();
        this.showToast('Input cleared', 'success');
    }

    validateJSON(text) {
        try {
            const data = JSON.parse(text);
            if (!data.data || !Array.isArray(data.data)) {
                throw new Error('JSON must contain a "data" array');
            }
            return data;
        } catch (e) {
            throw new Error(`Invalid JSON: ${e.message}`);
        }
    }

    // Create fetch request with timeout
    fetchWithTimeout(url, options, timeout = this.requestTimeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        this.currentRequest = controller;

        return fetch(url, {
            ...options,
            signal: controller.signal
        }).finally(() => {
            clearTimeout(timeoutId);
            this.currentRequest = null;
        });
    }

    async testAPI() {
        const input = document.getElementById('jsonInput').value.trim();
        const apiUrl = document.getElementById('apiUrl').value.trim();
        
        if (!input) {
            this.showToast('Please enter JSON data', 'error');
            return;
        }

        if (!apiUrl) {
            this.showToast('Please enter API URL', 'error');
            return;
        }

        // Cancel any existing request
        if (this.currentRequest) {
            this.currentRequest.abort();
        }

        // Validate JSON
        let jsonData;
        try {
            jsonData = this.validateJSON(input);
        } catch (e) {
            this.showToast(e.message, 'error');
            return;
        }

        this.setLoadingState(true);
        this.updateStatus('loading', 'Sending request...');
        this.hideResults();
        
        const startTime = Date.now();

        try {
            const response = await this.fetchWithTimeout(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jsonData)
            });

            const responseTime = Date.now() - startTime;
            this.showResponseTime(responseTime);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            this.displayResults(result);
            this.updateStatus('success', 'Request completed');
            this.showToast('API request successful', 'success');

        } catch (error) {
            console.error('API Error:', error);
            
            let errorMessage = 'Request failed';
            
            if (error.name === 'AbortError') {
                errorMessage = 'Request timeout (10s)';
            } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                errorMessage = 'Network error - Check if API is running and CORS is enabled';
            } else if (error.message.includes('HTTP')) {
                errorMessage = error.message;
            } else {
                errorMessage = `Request failed: ${error.message}`;
            }
            
            this.updateStatus('error', errorMessage);
            this.showToast(errorMessage, 'error');
            this.displayErrorResult(errorMessage);

        } finally {
            this.setLoadingState(false);
        }
    }

    displayErrorResult(errorMessage) {
        // Show results section with error information
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.classList.remove('hidden');
        
        // Clear previous results and show error
        this.updateElement('responseStatus', 'Failed', 'status--error');
        this.updateElement('responseUserId', 'N/A');
        this.updateElement('responseEmail', 'N/A');
        this.updateElement('responseRollNumber', 'N/A');

        // Clear data arrays
        this.displayArray('oddNumbers', []);
        this.displayArray('evenNumbers', []);
        this.displayArray('alphabets', []);
        this.displayArray('specialCharacters', []);

        // Clear sum and concatenation
        this.updateElement('sumResult', 'N/A');
        this.updateElement('concatResult', 'N/A');

        // Show error in raw response
        const errorResponse = {
            error: true,
            message: errorMessage,
            timestamp: new Date().toISOString(),
            suggestion: "Make sure your API server is running and accessible"
        };
        this.updateElement('rawResponse', JSON.stringify(errorResponse, null, 2));

        // Scroll to results
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }

    setLoadingState(loading) {
        const btn = document.getElementById('testBtn');
        const btnText = btn.querySelector('.btn-text');
        const btnSpinner = btn.querySelector('.btn-spinner');
        
        if (loading) {
            btn.disabled = true;
            btnText.textContent = 'Testing...';
            btnSpinner.classList.remove('hidden');
            btn.classList.add('loading');
        } else {
            btn.disabled = false;
            btnText.textContent = 'Test API';
            btnSpinner.classList.add('hidden');
            btn.classList.remove('loading');
        }
    }

    updateStatus(type, message) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.getElementById('statusText');
        
        statusDot.className = `status-dot ${type}`;
        statusText.textContent = message;
    }

    showResponseTime(time) {
        const responseTimeEl = document.getElementById('responseTime');
        responseTimeEl.textContent = `Response: ${time}ms`;
        responseTimeEl.classList.remove('hidden');
    }

    displayResults(data) {
        // Show results section
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.classList.remove('hidden');
        
        // Scroll to results
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);

        // Status & User Info
        this.updateElement('responseStatus', data.is_success ? 'Success' : 'Failed', 
                          data.is_success ? 'status--success' : 'status--error');
        this.updateElement('responseUserId', data.user_id || 'N/A');
        this.updateElement('responseEmail', data.email || 'N/A');
        this.updateElement('responseRollNumber', data.roll_number || 'N/A');

        // Data Arrays
        this.displayArray('oddNumbers', data.odd_numbers || []);
        this.displayArray('evenNumbers', data.even_numbers || []);
        this.displayArray('alphabets', data.alphabets || []);
        this.displayArray('specialCharacters', data.special_characters || []);

        // Sum and Concatenation
        this.updateElement('sumResult', data.sum || '0');
        this.updateElement('concatResult', data.concat_string || '');

        // Raw Response
        this.updateElement('rawResponse', JSON.stringify(data, null, 2));
    }

    updateElement(id, content, className = '') {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
            if (className) {
                element.className = className;
            }
        }
    }

    displayArray(containerId, array) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        if (array.length === 0) {
            container.innerHTML = '<div class="empty-state">No items</div>';
            return;
        }

        array.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'data-item';
            itemEl.textContent = item;
            container.appendChild(itemEl);
        });
    }

    hideResults() {
        document.getElementById('resultsSection').classList.add('hidden');
        document.getElementById('responseTime').classList.add('hidden');
        this.updateStatus('', 'Ready');
    }

    async copyResponse() {
        const rawResponse = document.getElementById('rawResponse').textContent;
        
        try {
            await navigator.clipboard.writeText(rawResponse);
            this.showToast('Response copied to clipboard', 'success');
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = rawResponse;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                this.showToast('Response copied to clipboard', 'success');
            } catch (fallbackErr) {
                this.showToast('Failed to copy response', 'error');
            }
            
            document.body.removeChild(textArea);
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = toast.querySelector('.toast__message');
        
        toastMessage.textContent = message;
        toast.className = `toast ${type} show`;
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BFHLTester();
});

// Add some additional utility functions
window.BFHLUtils = {
    // Example data for quick access
    getExampleData: (index) => {
        const examples = [
            { data: ["a","1","334","4","R", "$"] },
            { data: ["2","a", "y", "4", "&", "-", "*", "5","92","b"] },
            { data: ["A","ABcD","DOE"] }
        ];
        return examples[index] || examples[0];
    },

    // Validate if a string is valid JSON
    isValidJSON: (str) => {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    },

    // Format response time
    formatResponseTime: (ms) => {
        if (ms < 1000) {
            return `${ms}ms`;
        } else {
            return `${(ms / 1000).toFixed(2)}s`;
        }
    }
};
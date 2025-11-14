// Google Calendar API Configuration
const CLIENT_ID = '635047176355-cf5fs6usi0eip0k2tp6fi4l6mek4f1he.apps.googleusercontent.com';  // REPLACE with your real Client ID
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Initialize Google API client
async function initializeGapiClient() {
    try {
        await gapi.client.init({
            discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        console.log('✓ Google API client initialized');
        maybeEnableButtons();
    } catch (err) {
        console.error('Error initializing gapi client:', err);
        updateSyncStatus('Failed to load Google API. Check console.', 'error');
    }
}

// Initialize Google Identity Services
function initGoogleIdentity() {
    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: '', // Set in handleAuthClick
        });
        gisInited = true;
        console.log('✓ Google Identity Services initialized');
        maybeEnableButtons();
    } catch (err) {
        console.error('Error initializing GIS:', err);
        updateSyncStatus('Failed to load auth services. Check Client ID.', 'error');
    }
}

// Show buttons when both libraries ready
function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        const authBtn = document.getElementById('authorizeBtn');
        if (authBtn) {
            authBtn.style.display = 'inline-block';
            updateSyncStatus('Ready to connect to Google Calendar', 'info');
            console.log('✓ All systems ready. Click "Connect Google Calendar"');
        }
    }
}

// Handle authorization
function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            updateSyncStatus('Authorization failed: ' + resp.error, 'error');
            console.error('Auth error:', resp);
            return;
        }
        document.getElementById('authorizeBtn').style.display = 'none';
        document.getElementById('syncBtn').style.display = 'inline-block';
        document.getElementById('signoutBtn').style.display = 'inline-block';
        updateSyncStatus('Connected! Click "Sync Tasks" to export to calendar.', 'success');
        console.log('✓ Authorized successfully');
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        tokenClient.requestAccessToken({prompt: ''});
    }
}

// Handle sign out
function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        document.getElementById('authorizeBtn').style.display = 'inline-block';
        document.getElementById('syncBtn').style.display = 'none';
        document.getElementById('signoutBtn').style.display = 'none';
        updateSyncStatus('Signed out successfully', 'info');
        console.log('✓ Signed out');
    }
}

// Sync tasks to Google Calendar
async function syncTasksToCalendar() {
    updateSyncStatus('Syncing tasks to calendar...', 'info');
    console.log('Starting sync...');
    
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const tasksWithDates = tasks.filter(task => task.dueDate);
    
    if (tasksWithDates.length === 0) {
        updateSyncStatus('No tasks with due dates to sync. Add due dates first!', 'warning');
        console.warn('No tasks with due dates found');
        return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    console.log(`Syncing ${tasksWithDates.length} tasks...`);
    
    for (const task of tasksWithDates) {
        try {
            const event = {
                summary: `[Task] ${task.title}`,
                description: `Priority: ${task.priority}\nSize: ${task.size}\nStatus: ${task.status}\n\nCreated by Task Planner`,
                start: {
                    dateTime: new Date(task.dueDate + 'T09:00:00').toISOString(),
                    timeZone: 'Asia/Kolkata'
                },
                end: {
                    dateTime: new Date(task.dueDate + 'T10:00:00').toISOString(),
                    timeZone: 'Asia/Kolkata'
                },
                colorId: task.priority === 'high' ? '11' : task.priority === 'medium' ? '5' : '2'
            };
            
            const response = await gapi.client.calendar.events.insert({
                calendarId: 'primary',
                resource: event,
            });
            
            console.log(`✓ Created event for: ${task.title}`, response);
            successCount++;
        } catch (err) {
            console.error(`✗ Error creating event for ${task.title}:`, err);
            errorCount++;
        }
    }
    
    const message = `Synced ${successCount} task${successCount !== 1 ? 's' : ''} successfully!${errorCount > 0 ? ` (${errorCount} failed)` : ' Check your Google Calendar!'}`;
    updateSyncStatus(message, successCount > 0 ? 'success' : 'error');
    console.log('Sync complete:', {successCount, errorCount});
}

// Update status message
function updateSyncStatus(message, type) {
    const statusEl = document.getElementById('syncStatus');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.style.color = type === 'success' ? '#4caf50' : 
                               type === 'error' ? '#f44336' : 
                               type === 'warning' ? '#ff9800' : '#2196f3';
        statusEl.style.fontWeight = 'bold';
        statusEl.style.marginTop = '10px';
    }
}

// Initialize when libraries are loaded
function startInitialization() {
    console.log('Starting initialization...');
    
    // Check if gapi is loaded
    if (typeof gapi !== 'undefined') {
        console.log('gapi loaded, initializing client...');
        gapi.load('client', initializeGapiClient);
    } else {
        console.error('gapi not loaded - check internet connection');
        updateSyncStatus('Failed to load Google API library', 'error');
    }
    
    // Check if google identity is loaded
    if (typeof google !== 'undefined' && google.accounts) {
        console.log('Google Identity Services loaded, initializing...');
        initGoogleIdentity();
    } else {
        console.error('Google Identity Services not loaded');
        updateSyncStatus('Failed to load Google auth services', 'error');
    }
}

// Wait for DOM and then for libraries to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Calendar sync module loaded - DOM ready');
    
    // Attach button handlers
    const authBtn = document.getElementById('authorizeBtn');
    const syncBtn = document.getElementById('syncBtn');
    const signoutBtn = document.getElementById('signoutBtn');
    
    if (authBtn) authBtn.onclick = handleAuthClick;
    if (syncBtn) syncBtn.onclick = syncTasksToCalendar;
    if (signoutBtn) signoutBtn.onclick = handleSignoutClick;
    
    console.log('Button handlers attached');
    
    // Give libraries a moment to load, then initialize
    setTimeout(startInitialization, 500);
});

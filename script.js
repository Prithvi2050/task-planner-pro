// Load existing tasks from localStorage
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let editingTaskId = null;

// Filter and sort state
let currentStatusFilter = 'all';
let currentPriorityFilter = 'all';
let currentSort = 'newest';

// Function to apply filters and sorting
function getFilteredAndSortedTasks() {
    let filteredTasks = tasks;
    
    // Apply status filter
    if (currentStatusFilter !== 'all') {
        filteredTasks = filteredTasks.filter(function(task) {
            return task.status === currentStatusFilter;
        });
    }
    
    // Apply priority filter
    if (currentPriorityFilter !== 'all') {
        filteredTasks = filteredTasks.filter(function(task) {
            return task.priority === currentPriorityFilter;
        });
    }
    
    // Apply sorting
    filteredTasks = [...filteredTasks];  // Create copy to avoid mutating original
    
    if (currentSort === 'newest') {
        filteredTasks.sort(function(a, b) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    } else if (currentSort === 'oldest') {
        filteredTasks.sort(function(a, b) {
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
    } else if (currentSort === 'dueDate') {
        filteredTasks.sort(function(a, b) {
            if (!a.dueDate) return 1;  // Tasks without dates go to end
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
    } else if (currentSort === 'priority') {
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        filteredTasks.sort(function(a, b) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }
    
    return filteredTasks;
}

// Function to display tasks (now uses filtered/sorted list)
function renderTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    
    const displayTasks = getFilteredAndSortedTasks();
    
   if (displayTasks.length === 0) {
    const message = (currentStatusFilter !== 'all' || currentPriorityFilter !== 'all') 
        ? '<div class="empty-state"><span class="empty-icon">🔍</span><p>No tasks match your filters.</p><p class="empty-hint">Try clearing filters or adding new tasks!</p></div>'
        : '<div class="empty-state"><span class="empty-icon">✨</span><p>No tasks yet. Start planning your day!</p><p class="empty-hint">Use the form above to add your first task.</p></div>';
    taskList.innerHTML = message;
    return;
}
    
    const tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks-container';
    
    displayTasks.forEach(function(task) {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        taskCard.setAttribute('data-id', task.id);
        
        let priorityClass = 'priority-' + task.priority;
        
        taskCard.innerHTML = `
            <div class="task-header">
                <h3>${task.title}</h3>
                <span class="priority-badge ${priorityClass}">${task.priority}</span>
            </div>
            <div class="task-details">
                <span><strong>Size:</strong> ${task.size}</span>
                <span><strong>Due:</strong> ${task.dueDate || 'No date'}</span>
                <span><strong>Status:</strong> ${task.status}</span>
            </div>
            <div class="task-actions">
                <button class="btn-edit" onclick="editTask(${task.id})">Edit</button>
                <button class="btn-delete" onclick="deleteTask(${task.id})">Delete</button>
            </div>
        `;
        
        tasksContainer.appendChild(taskCard);
    });
    
    taskList.appendChild(tasksContainer);
    
    // Update task count display
    updateTaskCount(displayTasks.length, tasks.length);
}

// Show task count
function updateTaskCount(filtered, total) {
    let countDisplay = document.getElementById('taskCount');
    if (!countDisplay) {
        countDisplay = document.createElement('p');
        countDisplay.id = 'taskCount';
        countDisplay.style.margin = '10px 0';
        countDisplay.style.fontWeight = 'bold';
        document.getElementById('taskList').parentNode.insertBefore(
            countDisplay, 
            document.getElementById('taskList')
        );
    }
    countDisplay.textContent = `Showing ${filtered} of ${total} tasks`;
}

// Delete task function
function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    tasks = tasks.filter(function(task) {
        return task.id !== id;
    });
    
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
    
    console.log('Task deleted, ID:', id);
}

// Edit task function
function editTask(id) {
    const task = tasks.find(function(t) {
        return t.id === id;
    });
    
    if (!task) {
        alert('Task not found!');
        return;
    }
    
    document.getElementById('title').value = task.title;
    document.getElementById('priority').value = task.priority;
    document.getElementById('size').value = task.size;
    document.getElementById('dueDate').value = task.dueDate;
    document.getElementById('status').value = task.status;
    
    editingTaskId = id;
    
    const submitBtn = document.querySelector('#taskForm button[type="submit"]');
    submitBtn.textContent = 'Update Task';
    submitBtn.style.backgroundColor = '#ff9800';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log('Editing task:', task);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('taskForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    renderTasks();
    
    // Form submission
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const title = document.getElementById('title').value.trim();
        const priority = document.getElementById('priority').value;
        const size = document.getElementById('size').value;
        const dueDate = document.getElementById('dueDate').value;
        const status = document.getElementById('status').value;
        
        if (!title) {
            alert('Please enter a task title!');
            return;
        }
        
        if (editingTaskId !== null) {
            const taskIndex = tasks.findIndex(function(t) {
                return t.id === editingTaskId;
            });
            
            if (taskIndex !== -1) {
                tasks[taskIndex] = {
                    id: editingTaskId,
                    title: title,
                    priority: priority,
                    size: size,
                    dueDate: dueDate,
                    status: status,
                    createdAt: tasks[taskIndex].createdAt,
                    updatedAt: new Date().toISOString()
                };
                
                localStorage.setItem('tasks', JSON.stringify(tasks));
                console.log('Task updated:', tasks[taskIndex]);
            }
            
            editingTaskId = null;
            submitBtn.textContent = 'Add Task';
            submitBtn.style.backgroundColor = '#007bff';
            
        } else {
            const newTask = {
                id: Date.now(),
                title: title,
                priority: priority,
                size: size,
                dueDate: dueDate,
                status: status,
                createdAt: new Date().toISOString()
            };
            
            tasks.push(newTask);
            localStorage.setItem('tasks', JSON.stringify(tasks));
            console.log('Task added:', newTask);
        }
        
        form.reset();
        renderTasks();
    });
    
    // Status filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterBtns.forEach(function(b) {
                b.classList.remove('active');
            });
            // Add active to clicked button
            this.classList.add('active');
            
            currentStatusFilter = this.getAttribute('data-status');
            renderTasks();
        });
    });
    
    // Priority filter dropdown
    document.getElementById('priorityFilter').addEventListener('change', function() {
        currentPriorityFilter = this.value;
        renderTasks();
    });
    
    // Sort dropdown
    document.getElementById('sortBy').addEventListener('change', function() {
        currentSort = this.value;
        renderTasks();
    });
    
    // Clear filters button
    document.getElementById('clearFilters').addEventListener('click', function() {
        currentStatusFilter = 'all';
        currentPriorityFilter = 'all';
        currentSort = 'newest';
        
        // Reset UI
        filterBtns.forEach(function(b) {
            b.classList.remove('active');
        });
        document.querySelector('.filter-btn[data-status="all"]').classList.add('active');
        document.getElementById('priorityFilter').value = 'all';
        document.getElementById('sortBy').value = 'newest';
        
        renderTasks();
    });
});

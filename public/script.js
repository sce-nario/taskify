const API_BASE = 'https://taskify-1-ms8i.onrender.com/api';
let allTasks = [];

// Handle form submission
document.getElementById('task-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const taskData = {
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    dueDate: document.getElementById('dueDate').value,
    status: document.getElementById('status').value,
    priority: document.getElementById('priority').value,
    category: document.getElementById('category').value
  };

  try {
    const response = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    
    if (response.ok) {
      const newTask = await response.json();
      allTasks.push(newTask);
      renderTasks();
      document.getElementById('task-form').reset();
    } else {
      alert('Failed to add task');
    }
  } catch (error) {
    console.error('Error adding task:', error);
    alert('Error adding task. Check console.');
  }
});

// Load tasks from backend on page load
async function loadTasks() {
  try {
    const response = await fetch(`${API_BASE}/tasks`);
    if (response.ok) {
      allTasks = await response.json();
      renderTasks();
      updateTaskCount();
    }
  } catch (error) {
    console.error('Error loading tasks:', error);
    alert('Failed to load tasks from server');
  }
}

// Render tasks to the DOM
function renderTasks() {
  const taskContainer = document.querySelector('.task-container') || document.getElementById('taskList');
  
  // Create container if it doesn't exist
  if (!taskContainer) {
    const section = document.querySelector('.task-section');
    const div = document.createElement('div');
    div.id = 'taskList';
    div.className = 'task-container';
    section.appendChild(div);
  }
  
  const container = document.getElementById('taskList') || document.querySelector('.task-container');
  container.innerHTML = '';

  allTasks.forEach(task => {
    const taskEl = document.createElement('div');
    taskEl.className = `task-item ${task.status === 'completed' ? 'task-completed' : ''}`;
    taskEl.dataset.taskId = task.id;
    taskEl.innerHTML = `
      <div class="task-content">
        <div class="task-header">
          <input type="checkbox" class="task-checkbox" ${task.status === 'completed' ? 'checked' : ''} 
                 onchange="toggleTask(this, '${task.id}')">
          <h3 class="task-title">${escapeHtml(task.title)}</h3>
          <span class="task-status ${task.status}">${task.status}</span>
          <span class="task-priority ${task.priority}">${task.priority}</span>
        </div>
        ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
        <div class="task-meta">
          ${task.dueDate ? `<span class="due-date">📅 ${task.dueDate}</span>` : ''}
          ${task.category ? `<span class="category">🏷️ ${escapeHtml(task.category)}</span>` : ''}
        </div>
      </div>
      <button class="delete-btn" onclick="deleteTask('${task.id}')" aria-label="Delete task">×</button>
    `;
    container.appendChild(taskEl);
  });

  updateTaskCount();
}

// Toggle task completion status
async function toggleTask(checkbox, taskId) {
  const newStatus = checkbox.checked ? 'completed' : 'pending';
  try {
    const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (response.ok) {
      const updatedTask = await response.json();
      const taskIndex = allTasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        allTasks[taskIndex] = updatedTask;
        renderTasks();
      }
    }
  } catch (error) {
    console.error('Error updating task:', error);
    checkbox.checked = !checkbox.checked; // Revert checkbox
  }
}

// Delete task
async function deleteTask(taskId) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  
  try {
    const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      allTasks = allTasks.filter(t => t.id !== taskId);
      renderTasks();
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    alert('Failed to delete task');
  }
}

// Update task count
function updateTaskCount() {
  const count = allTasks.length;
  const countEl = document.getElementById('task-count');
  if (countEl) {
    countEl.textContent = `${count} task${count !== 1 ? 's' : ''}`;
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Load tasks when page loads
window.addEventListener('load', loadTasks);
// Always use the Render backend API for the deployed frontend
const API_BASE = 'https://taskify-1-ms8i.onrender.com/api';

console.log('API Base:', API_BASE);

console.log('API Base:', API_BASE);
let allTasks = [];
let editingId = null;
let searchTerm = '';
let filterStatus = 'all';
let filterPriority = 'all';
let sortOption = 'due';
let targetTaskId = null;

const taskForm = document.getElementById('task-form');
const taskSearch = document.getElementById('task-search');
const filterStatusSelect = document.getElementById('filter-status');
const filterPrioritySelect = document.getElementById('filter-priority');
const sortTasksSelect = document.getElementById('sort-tasks');
const clearCompletedButton = document.getElementById('clear-completed');
const taskList = document.getElementById('task-list');

if (taskForm) {
  taskForm.addEventListener('submit', submitTaskForm);
}
if (taskSearch) {
  taskSearch.addEventListener('input', () => {
    searchTerm = taskSearch.value.trim().toLowerCase();
    renderTasks();
  });
}
if (filterStatusSelect) {
  filterStatusSelect.addEventListener('change', () => {
    filterStatus = filterStatusSelect.value;
    renderTasks();
  });
}
if (filterPrioritySelect) {
  filterPrioritySelect.addEventListener('change', () => {
    filterPriority = filterPrioritySelect.value;
    renderTasks();
  });
}
if (sortTasksSelect) {
  sortTasksSelect.addEventListener('change', () => {
    sortOption = sortTasksSelect.value;
    renderTasks();
  });
}
if (clearCompletedButton) {
  clearCompletedButton.addEventListener('click', clearCompletedTasks);
}

async function submitTaskForm(e) {
  e.preventDefault();

  const taskData = {
    title: document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
    dueDate: document.getElementById('dueDate').value,
    status: document.getElementById('status').value,
    priority: document.getElementById('priority').value,
    category: document.getElementById('category').value.trim()
  };

  if (!taskData.title) {
    alert('Please enter a title for the task.');
    document.getElementById('title').focus();
    return;
  }

  try {
    const url = editingId ? `${API_BASE}/tasks/${editingId}` : `${API_BASE}/tasks`;
    const method = editingId ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    const isUpdate = Boolean(editingId);
    const updatedTaskId = editingId;
    editingId = null;
    taskForm.querySelector('button[type="submit"]').textContent = 'Add Task';
    taskForm.reset();
    await loadTasks();
    if (isUpdate && updatedTaskId) {
      targetTaskId = updatedTaskId;
    }
  } catch (error) {
    console.error('Error saving task:', error);
    alert('Unable to save task. See console for details.');
  }
}

async function loadTasks() {
  try {
    const response = await fetch(`${API_BASE}/tasks`);
    if (!response.ok) {
      throw new Error(`Failed to load tasks: ${response.status}`);
    }
    allTasks = await response.json();
    renderTasks();
  } catch (error) {
    console.error('Error loading tasks:', error);
    alert('Failed to load tasks from server.');
  }
}

function applyTaskFilters() {
  let filtered = allTasks.slice();

  if (searchTerm) {
    filtered = filtered.filter(task => {
      const text = [task.title, task.description, task.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return text.includes(searchTerm);
    });
  }

  if (filterStatus !== 'all') {
    filtered = filtered.filter(task => task.status === filterStatus);
  }

  if (filterPriority !== 'all') {
    filtered = filtered.filter(task => task.priority === filterPriority);
  }

  filtered.sort((a, b) => {
    if (sortOption === 'priority') {
      const order = { high: 0, medium: 1, low: 2 };
      return (order[a.priority] || 3) - (order[b.priority] || 3);
    }
    if (sortOption === 'created') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    return new Date(a.dueDate || a.createdAt) - new Date(b.dueDate || b.createdAt);
  });

  return filtered;
}

function renderTasks() {
  if (!taskList) return;

  const tasksToRender = applyTaskFilters();
  taskList.innerHTML = '';

  tasksToRender.forEach(task => {
    const listItem = document.createElement('li');
    listItem.id = `task-item-${task.id}`;
    listItem.className = `task-item ${task.status === 'completed' ? 'task-completed' : ''}`;
    listItem.innerHTML = `
      <div class="task-card">
        <div class="task-card-top">
          <label>
            <input type="checkbox" ${task.status === 'completed' ? 'checked' : ''} onchange="toggleTask(this, '${task.id}')">
            <span class="task-title">${escapeHtml(task.title)}</span>
          </label>
          <div class="task-buttons">
            <button type="button" class="edit-btn" onclick="editTask('${task.id}')">Edit</button>
            <button type="button" class="delete-btn" onclick="deleteTask('${task.id}')">Delete</button>
          </div>
        </div>
        ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
        <div class="task-meta">
          ${task.priority ? `<span class="meta-chip priority-${task.priority}">${task.priority}</span>` : ''}
          ${task.status ? `<span class="meta-chip status-${task.status}">${task.status}</span>` : ''}
          ${task.dueDate ? `<span class="meta-chip due-date">Due: ${escapeHtml(task.dueDate)}</span>` : ''}
          ${task.category ? `<span class="meta-chip category-chip">${escapeHtml(task.category)}</span>` : ''}
        </div>
      </div>
    `;

    taskList.appendChild(listItem);
  });

  updateTaskCount(tasksToRender.length);
  if (targetTaskId) {
    requestAnimationFrame(() => scrollToTask(targetTaskId));
    targetTaskId = null;
  }
}

window.editTask = function (taskId) {
  const task = allTasks.find(t => t.id === taskId);
  if (!task) return;

  document.getElementById('title').value = task.title || '';
  document.getElementById('description').value = task.description || '';
  document.getElementById('dueDate').value = task.dueDate || '';
  document.getElementById('status').value = task.status || 'pending';
  document.getElementById('priority').value = task.priority || 'medium';
  document.getElementById('category').value = task.category || '';

  editingId = taskId;
  taskForm.querySelector('button[type="submit"]').textContent = 'Update Task';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.getElementById('title').focus();
};

async function toggleTask(checkbox, taskId) {
  const newStatus = checkbox.checked ? 'completed' : 'pending';
  try {
    const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) {
      throw new Error(`Update failed: ${response.status}`);
    }

    const updatedTask = await response.json();
    const index = allTasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      allTasks[index] = updatedTask;
      renderTasks();
    }
  } catch (error) {
    console.error('Error updating task status:', error);
    checkbox.checked = !checkbox.checked;
    alert('Unable to update task status.');
  }
}

async function deleteTask(taskId) {
  if (!confirm('Are you sure you want to delete this task?')) return;

  try {
    const response = await fetch(`${API_BASE}/tasks/${taskId}`, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status}`);
    }
    allTasks = allTasks.filter(t => t.id !== taskId);
    renderTasks();
  } catch (error) {
    console.error('Error deleting task:', error);
    alert('Unable to delete task.');
  }
}

async function clearCompletedTasks() {
  const completed = allTasks.filter(task => task.status === 'completed');
  await Promise.all(completed.map(task => fetch(`${API_BASE}/tasks/${task.id}`, { method: 'DELETE' })));
  allTasks = allTasks.filter(task => task.status !== 'completed');
  renderTasks();
}

function scrollToTask(taskId) {
  const taskElement = document.getElementById(`task-item-${taskId}`);
  if (taskElement) {
    taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    taskElement.classList.add('highlight-updated');
    setTimeout(() => taskElement.classList.remove('highlight-updated'), 2000);
  }
}

function updateTaskCount(count) {
  const countEl = document.getElementById('task-count');
  if (countEl) {
    countEl.textContent = `${count} task${count !== 1 ? 's' : ''}`;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

window.addEventListener('load', loadTasks);

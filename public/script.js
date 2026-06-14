// Function to add a new task
function addTask() {
  const input = document.getElementById('taskInput');
  const taskText = input.value.trim();
  if (!taskText) {
    alert('Please enter a task.');
    return;
  }
  
  const taskList = document.getElementById('taskList');

  const li = document.createElement('li');
  li.className = 'task-item';

  li.innerHTML = `
    <input type="checkbox" class="task-checkbox" onchange="toggleComplete(this)">
    <span class="task-text">${taskText}</span>
    <button class="delete-btn" onclick="deleteTask(this)" aria-label="Delete task">×</button>
  `;

  taskList.appendChild(li);
  input.value = '';
  input.focus();
}

// Function to toggle task completion
function toggleComplete(checkbox) {
  const taskItem = checkbox.parentElement;
  if (checkbox.checked) {
    taskItem.classList.add('task-completed');
  } else {
    taskItem.classList.remove('task-completed');
  }
}

// Function to delete a task
function deleteTask(btn) {
  const taskItem = btn.parentElement;
  taskItem.remove();
}

// Function to clear all completed tasks
function clearCompleted() {
  document.querySelectorAll('.task-item.task-completed').forEach(item => item.remove());
}

// Optional: Add task on pressing Enter
document.getElementById('taskInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    addTask();
  }
});

// Load tasks from local storage when page loads
window.onload = function() {
  loadTasks();
};

// Function to add a new task
function addTask() {
  const input = document.getElementById('taskInput');
  const taskText = input.value.trim();
  if (!taskText) {
    alert('Please enter a task.');
    return;
  }
  
  const taskList = document.getElementById('taskList');

  const li = document.createElement('li');
  li.className = 'task-item';

  li.innerHTML = `
    <input type="checkbox" class="task-checkbox" onchange="toggleComplete(this)">
    <span class="task-text">${taskText}</span>
    <button class="delete-btn" onclick="deleteTask(this)" aria-label="Delete task">×</button>
  `;

  taskList.appendChild(li);
  saveTasks(); // Save after adding
  input.value = '';
  input.focus();
}

// Function to toggle task completion
function toggleComplete(checkbox) {
  const taskItem = checkbox.parentElement;
  if (checkbox.checked) {
    taskItem.classList.add('task-completed');
  } else {
    taskItem.classList.remove('task-completed');
  }
  saveTasks(); // Save state
}

// Function to delete a task
function deleteTask(btn) {
  const taskItem = btn.parentElement;
  taskItem.remove();
  saveTasks(); // Save after deletion
}

// Function to clear all completed tasks
function clearCompleted() {
  document.querySelectorAll('.task-item.task-completed').forEach(item => {
    item.remove();
  });
  saveTasks(); // Save after clearing
}

// Save tasks to local storage
function saveTasks() {
  const tasks = [];
  document.querySelectorAll('.task-item').forEach(item => {
    const text = item.querySelector('.task-text').innerText;
    const completed = item.classList.contains('task-completed');
    tasks.push({ text, completed });
  });
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Load tasks from local storage
function loadTasks() {
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  const taskList = document.getElementById('taskList');

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item';

    li.innerHTML = `
      <input type="checkbox" class="task-checkbox" onchange="toggleComplete(this)" ${task.completed ? 'checked' : ''}>
      <span class="task-text">${task.text}</span>
      <button class="delete-btn" onclick="deleteTask(this)" aria-label="Delete task">×</button>
    `;

    if (task.completed) {
      li.classList.add('task-completed');
    }

    taskList.appendChild(li);
  });
}

// Optional: Add task on pressing Enter
document.getElementById('taskInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    addTask();
  }
});
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'tasks.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Load tasks from JSON
function loadTasks() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Error loading tasks:', e);
      return [];
    }
  }
  return [];
}

// Save tasks to JSON
function saveTasks(tasks) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
  } catch (e) {
    console.error('Error saving tasks:', e);
  }
}

let tasks = loadTasks();

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json'
};

function autoCompleteTasks() {
  const now = new Date();
  let updated = false;
  tasks.forEach(task => {
    if ((task.status === 'pending' || task.status === 'in-progress') && task.dueTime) {
      const due = new Date(task.dueTime);
      if (!isNaN(due) && now >= due) {
        task.status = 'completed';
        task.completedAt = task.completedAt || now.toISOString();
        task.updatedAt = now.toISOString();
        updated = true;
      }
    }
  });
  if (updated) {
    saveTasks(tasks);
  }
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathName = requestUrl.pathname;

  // Handle API
  if (pathName.startsWith('/api/')) {
    handleApiRequest(req, res, pathName, requestUrl);
    return;
  }

  // Serve static files from public
  let filePath = path.join(PUBLIC_DIR, pathName === '/' ? 'index.html' : pathName);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.end('<h1>404 Not Found</h1>');
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {'Content-Type': MIME_TYPES[ext] || 'text/plain'});
    res.end(data);
  });
});

function handleApiRequest(req, res, pathName, parsedUrl) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (pathName === '/api/tasks' && req.method === 'GET') {
    autoCompleteTasks();
    res.writeHead(200);
    res.end(JSON.stringify(tasks));
    return;
  }

  if (pathName === '/api/tasks' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const taskData = JSON.parse(body);
        if (!taskData.title) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Title is required' }));
          return;
        }
        const now = new Date();
        const dueTime = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
        const newTask = {
          id: Date.now().toString(),
          title: taskData.title,
          description: taskData.description || '',
          dueDate: taskData.dueDate || '',
          status: taskData.status || 'pending',
          priority: taskData.priority || 'medium',
          category: taskData.category || '',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          startTime: now.toISOString(),
          dueTime,
          completedAt: taskData.status === 'completed' ? now.toISOString() : ''
        };
        if (taskData.status === 'completed') {
          newTask.status = 'completed';
        }
        tasks.push(newTask);
        saveTasks(tasks);
        res.writeHead(201);
        res.end(JSON.stringify(newTask));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid data' }));
      }
    });
    return;
  }

  if (pathName.startsWith('/api/tasks/') && req.method === 'PUT') {
    const id = pathName.split('/').pop();
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const updateData = JSON.parse(body);
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex === -1) {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Task not found' }));
          return;
        }
        const task = tasks[taskIndex];
        const now = new Date();
        if (updateData.title) task.title = updateData.title;
        if (updateData.description !== undefined) task.description = updateData.description;
        if (updateData.dueDate !== undefined) task.dueDate = updateData.dueDate;
        if (updateData.priority) task.priority = updateData.priority;
        if (updateData.category !== undefined) task.category = updateData.category;
        if (updateData.status) {
          task.status = updateData.status;
          if (updateData.status === 'pending' || updateData.status === 'in-progress') {
            task.startTime = now.toISOString();
            task.dueTime = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
            task.completedAt = '';
          }
          if (updateData.status === 'completed') {
            task.completedAt = task.completedAt || now.toISOString();
          }
        }
        task.updatedAt = now.toISOString();
        saveTasks(tasks);
        res.writeHead(200);
        res.end(JSON.stringify(task));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid data' }));
      }
    });
    return;
  }

  if (pathName.startsWith('/api/tasks/') && req.method === 'DELETE') {
    const id = pathName.split('/').pop();
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Task not found' }));
      return;
    }
    tasks.splice(taskIndex, 1);
    saveTasks(tasks);
    res.writeHead(200);
    res.end(JSON.stringify({ message: 'Task deleted' }));
    return;
  }

  res.writeHead(405);
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}

server.listen(PORT, () => {
  console.log(`✅ Taskify Server running on port ${PORT}`);
console.log(`📡 API Base: http://localhost:${PORT}/api/tasks`);
  console.log('📁 Tasks stored in tasks.json');
});
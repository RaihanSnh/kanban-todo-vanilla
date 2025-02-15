document.addEventListener("DOMContentLoaded", function () {
    loadTasks();
    setupEventListeners();
    setInterval(updateTimers, 1000);
});

let tasks = [];
let currentEditTaskId = null;

function setupEventListeners() {
    const openModalBtn = document.getElementById('open-modal-btn');
    const createTaskModal = document.getElementById('create-task-modal');
    const editTaskModal = document.getElementById('edit-task-modal');
    const closeCreateModalBtn = document.getElementById('close-create-modal');
    const closeEditModalBtn = document.getElementById('close-edit-modal');
    const createTaskForm = document.getElementById('create-task-form');
    const editTaskForm = document.getElementById('edit-task-form');
    const searchInput = document.getElementById('search-input');

    openModalBtn.addEventListener('click', () => {
        createTaskModal.style.display = 'flex';
    });

    closeCreateModalBtn.addEventListener('click', () => {
        createTaskModal.style.display = 'none';
        resetForm('create-task-form');
    });

    closeEditModalBtn.addEventListener('click', () => {
        editTaskModal.style.display = 'none';
        resetForm('edit-task-form');
    });

    createTaskForm.addEventListener('submit', handleCreateTask);
    editTaskForm.addEventListener('submit', handleEditTask);
    searchInput.addEventListener('input', handleSearch);

    document.addEventListener('dragend', () => {
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('dragover');
        });
    });
}

// Form Handlers
function handleCreateTask(event) {
    event.preventDefault();
    if (validateForm('create-task-form')) {
        addTask();
        document.getElementById('create-task-modal').style.display = 'none';
        resetForm('create-task-form');
    }
}

function handleEditTask(event) {
    event.preventDefault();
    if (validateForm('edit-task-form')) {
        saveEditedTask();
        document.getElementById('edit-task-modal').style.display = 'none';
        resetForm('edit-task-form');
    }
}

function handleSearch(event) {
    const searchTerm = event.target.value;
    renderTasks(searchTerm);
}

// Data Manipulation Functions
function addTask() {
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const deadline = document.getElementById('task-deadline').value;
    const createdAt = new Date().toLocaleString();
    const newTask = {
        id: "task-" + Date.now(),
        title: title,
        description: description,
        deadline: deadline,
        status: "todo",
        createdAt: createdAt,
        endAt: null,
        inProgressStart: null
    };
    tasks.push(newTask);
    saveTasks();
    renderTasks();
}

function saveEditedTask() {
    const taskId = document.getElementById('edit-task-id').value;
    const title = document.getElementById('edit-task-title').value;
    const description = document.getElementById('edit-task-description').value;
    const deadline = document.getElementById('edit-task-deadline').value;

    tasks = tasks.map(task => {
        if (task.id === taskId) {
            return {
                ...task,
                title: title,
                description: description,
                deadline: deadline
            };
        }
        return task;
    });
    saveTasks();
    renderTasks();
}

function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
    renderTasks();
}

function updateTaskStatus(taskId, newStatus) {
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            const updatedTask = {
                ...task,
                status: newStatus,
            };

            if (newStatus === 'done') {
                updatedTask.endAt = new Date().toLocaleString();
            } else if (task.status === 'done') {
                // Reset endAt jika keluar dari "done"
                updatedTask.endAt = null;
            }

            if (newStatus === 'in-progress' && task.status !== 'in-progress') {
                updatedTask.inProgressStart = Date.now();
            } else if (newStatus !== 'in-progress') {
                updatedTask.inProgressStart = null;
            }

            return updatedTask;
        }
        return task;
    });
    saveTasks();
    renderTasks();
}

// Rendering Functions
function renderTasks(searchQuery = '') {
    const todoList = document.getElementById('todo-task-container');
    const inProgressList = document.getElementById('in-progress-task-container');
    const doneList = document.getElementById('done-task-container');

    todoList.innerHTML = '';
    inProgressList.innerHTML = '';
    doneList.innerHTML = '';

    const filteredTasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filteredTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        switch (task.status) {
            case 'todo':
                todoList.appendChild(taskElement);
                break;
            case 'in-progress':
                inProgressList.appendChild(taskElement);
                break;
            case 'done':
                doneList.appendChild(taskElement);
                break;
        }
    });
}

function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.classList.add('task');
    taskElement.id = task.id;
    taskElement.draggable = true;
    taskElement.addEventListener('dragstart', drag);

    const dragHandle = document.createElement('span');
    dragHandle.classList.add('drag-handle');
    dragHandle.textContent = '☰';
    taskElement.appendChild(dragHandle);

    const taskContent = document.createElement('div');
    taskContent.classList.add('task-content');

    const titleElement = document.createElement('div');
    titleElement.classList.add('task-title');
    titleElement.textContent = task.title;
    taskContent.appendChild(titleElement);

    const descriptionElement = document.createElement('div');
    descriptionElement.textContent = task.description;
    taskContent.appendChild(descriptionElement);

    const timeInfoElement = document.createElement('div');
    timeInfoElement.classList.add('time-info');

    const createdAtElement = document.createElement('div');
    createdAtElement.innerHTML = `Created: ${task.createdAt}`;
    timeInfoElement.appendChild(createdAtElement);

    const deadlineElement = document.createElement('div');
    deadlineElement.innerHTML = `Deadline: ${new Date(task.deadline).toLocaleString()}`;
    timeInfoElement.appendChild(deadlineElement);

    if (task.endAt) {
        const endAtElement = document.createElement('div');
        endAtElement.innerHTML = `Completed: ${task.endAt}`;
        timeInfoElement.appendChild(endAtElement);
    }
    taskContent.appendChild(timeInfoElement);

    if (task.status === 'in-progress') {
        const timerInfo = document.createElement('div');
        timerInfo.classList.add('timer-info');
        timerInfo.id = `timer-${task.id}`; // Unique ID for each timer
        taskContent.appendChild(timerInfo);
        updateTimerDisplay(task); // Initial update
    }

    taskElement.appendChild(taskContent);

    // Edit and Delete buttons
    const editButton = document.createElement('button');
    editButton.classList.add('edit-btn');
    editButton.textContent = 'Edit';
    editButton.onclick = () => openEditModal(task.id);
    taskElement.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-btn');
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = () => deleteTask(task.id);
    taskElement.appendChild(deleteButton);

    return taskElement;
}

function updateTimers() {
    if (!tasks) return;
    tasks.forEach(task => {
        if (task.status === 'in-progress') {
            updateTimerDisplay(task);
        }
    });
}

function updateTimerDisplay(task) {
    const timerElement = document.getElementById(`timer-${task.id}`);
    if (!timerElement) return;

    const deadline = new Date(task.deadline).getTime();
    const now = new Date().getTime();
    const timeLeft = deadline - now;

    if (timeLeft > 0) {
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        timerElement.textContent = `Time left: ${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else {
        timerElement.textContent = "Deadline passed!";
    }
}

function openEditModal(taskId) {
    currentEditTaskId = taskId;
    const task = tasks.find(task => task.id === taskId);
    if (task) {
        document.getElementById('edit-task-id').value = task.id;
        document.getElementById('edit-task-title').value = task.title;
        document.getElementById('edit-task-description').value = task.description;
        document.getElementById('edit-task-deadline').value = task.deadline;
        document.getElementById('edit-task-modal').style.display = 'flex';
    }
}

// Drag and Drop Functions
function allowDrop(event) {
    event.preventDefault();
    event.target.closest('.card').classList.add('dragover');
}

function drag(event) {
    event.dataTransfer.setData('text/plain', event.target.id);
}

function drop(event, targetStatus) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain');
    updateTaskStatus(taskId, targetStatus);
    document.querySelectorAll('.card').forEach(card => card.classList.remove('dragover'));
}

// Form Validation
function validateForm(formId) {
    let isValid = true;
    const title = document.getElementById(formId === 'create-task-form' ? 'task-title' : 'edit-task-title').value;
    const description = document.getElementById(formId === 'create-task-form' ? 'task-description' : 'edit-task-description').value;
    const deadline = document.getElementById(formId === 'create-task-form' ? 'task-deadline' : 'edit-task-deadline').value;

    isValid = validateField(title, 'task-title', 'Title must be 5-25 characters', 5, 25, formId) && isValid;
    isValid = validateField(description, 'task-description', 'Description must be 20-100 characters', 20, 100, formId) && isValid;
    isValid = validateField(deadline, 'task-deadline', 'Deadline is required', null, null, formId) && isValid;

    return isValid;
}

function validateField(value, fieldId, errorMessage, minLength, maxLength, formId) {
    const errorElementId = fieldId + '-error';
    const errorElement = document.getElementById(errorElementId);
    let isValid = true;

    if ((minLength && value.length < minLength) || (maxLength && value.length > maxLength) || (!value)) {
        errorElement.textContent = errorMessage;
        errorElement.style.display = 'block';
        isValid = false;
    } else {
        errorElement.style.display = 'none';
        errorElement.textContent = '';
    }
    return isValid;
}

// Utility Functions
function resetForm(formId) {
    const form = document.getElementById(formId);
    form.reset();

    // Hide all error messages
    const errorMessages = form.querySelectorAll('.error');
    errorMessages.forEach(error => {
        error.style.display = 'none';
        error.textContent = '';
    });
}

function loadTasks() {
    const storedTasks = localStorage.getItem('tasks');
    tasks = storedTasks ? JSON.parse(storedTasks) : [];
    renderTasks();
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}
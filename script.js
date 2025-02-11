document.addEventListener("DOMContentLoaded", function () {
    renderContent();
    setTimeout(() => {
        setInterval(() => {
            renderContent();
        }, 1000);
    }, 2000);
});

const form = document.getElementById('task-form');
const titleInput = document.getElementById('title');
const descInput = document.getElementById('description');
const titleError = document.getElementById('title-error');
const descError = document.getElementById('desc-error');
let data = JSON.parse(localStorage.getItem('tasks')) || [];

// Form submission handler
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const desc = descInput.value.trim();

    // Validation
    let isValid = true;
    
    if (title.length < 5 || title.length > 25) {
        titleError.style.display = 'block';
        isValid = false;
    } else {
        titleError.style.display = 'none';
    }
    
    if (desc.length < 20 || desc.length > 100) {
        descError.style.display = 'block';
        isValid = false;
    } else {
        descError.style.display = 'none';
    }

    if (isValid) {
        addTask(title, desc);
        form.reset();
    }
});

function addTask(title, desc) {
    data.push({
        id: "task-" + Date.now(),
        title: title,
        description: desc,
        status: "todo-list",
        timestamp: []
    });
    updateLocalStorage();
    renderContent();
}

function allowDrop(event) {
    event.preventDefault();
}

function renderContent() {
    const columns = ['todo-list', 'in-progress', 'done'];
    columns.forEach((columnId) => {
        const column = document.getElementById(columnId);
        column.querySelector('.task-container').innerHTML = '';
        data.forEach(task => {
            if (task.status === columnId) {
                const taskElement = createTaskElement(task);
                column.querySelector('.task-container').appendChild(taskElement);
            }
        });
    });
}

function createTaskElement(task) {
    const element = document.createElement("div");
    element.className = `task ${task.status === 'done' ? 'done-task' : ''}`;
    element.id = task.id;
    element.draggable = true;

    const titleElement = document.createElement('div');
    titleElement.className = 'task-title';
    titleElement.textContent = task.title;

    const descElement = document.createElement('div');
    descElement.textContent = task.description;

    const timerContainer = document.createElement('div');
    timerContainer.className = 'timer-info';
    
    if(task.status === 'in-progress') {
        const startUnix = new Date(task.timestamp[0]?.dateStart).valueOf();
        const nowUnix = Date.now();
        const diff = nowUnix - startUnix;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        timerContainer.innerHTML = `<span><b>Time elapsed:</b> ${days}d ${hours}h ${minutes}m ${seconds}s</span>`;
    }
    
    if(task.status === 'done' && task.timestamp[0]?.dateEnd) {
        timerContainer.innerHTML = `<span><b>Completed at:</b> ${new Date(task.timestamp[0].dateEnd).toLocaleString()}</span>`;
    }

    const deleteBtn = document.createElement('span');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '❌';
    deleteBtn.onclick = () => deleteTask(task.id);

    const contentWrapper = document.createElement('div');
    contentWrapper.style.flexGrow = '1';
    contentWrapper.appendChild(titleElement);
    contentWrapper.appendChild(descElement);
    contentWrapper.appendChild(timerContainer);

    element.appendChild(contentWrapper);
    element.appendChild(deleteBtn);
    element.addEventListener("dragstart", drag);

    return element;
}

function deleteTask(taskId) {
    data = data.filter(task => task.id !== taskId);
    updateLocalStorage();
    renderContent();
}

function drag(event) {
    event.dataTransfer.setData("text/plain", event.target.id);
}

function drop(event, columnId) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain");
    const draggedElement = document.getElementById(taskId);
    
    if (!draggedElement) return;

    updateTaskStatus(taskId, columnId);
    event.target.closest('.card').querySelector('.task-container').appendChild(draggedElement);
}

function updateTaskStatus(taskId, newStatus) {
    data = data.map(task => {
        if (task.id === taskId) {
            const now = Date.now();
            const newTimestamps = [...task.timestamp];
            
            if(newStatus === 'in-progress') {
                newTimestamps.push({ dateStart: now });
            }
            
            if(newStatus === 'done') {
                const lastTimestamp = newTimestamps[newTimestamps.length - 1];
                if(lastTimestamp) lastTimestamp.dateEnd = now;
            }

            return {
                ...task,
                status: newStatus,
                timestamp: newTimestamps
            };
        }
        return task;
    });
    
    updateLocalStorage();
    renderContent();
}

function updateLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(data));
}
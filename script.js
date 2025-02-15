document.addEventListener("DOMContentLoaded", function () {
    renderContent();
    setInterval(renderContent, 1000);
});

document.addEventListener('dragend', (e) => {
    document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('dragover');
    });
});

const form = document.getElementById('task-form');
const titleInput = document.getElementById('title');
const descInput = document.getElementById('description');
const deadlineInput = document.getElementById('deadline');
const titleError = document.getElementById('title-error');
const descError = document.getElementById('desc-error');
const deadlineError = document.getElementById('deadline-error');
let data = JSON.parse(localStorage.getItem('tasks')) || [];

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const desc = descInput.value.trim();
    const deadline = deadlineInput.value;

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
    
    if (!deadline) {
        deadlineError.style.display = 'block';
        isValid = false;
    } else {
        deadlineError.style.display = 'none';
    }

    if (isValid) {
        addTask(title, desc, deadline);
        form.reset();
    }
});

function addTask(title, desc, deadline) {
    const createdAt = new Date().toLocaleString();
    data.push({
        id: "task-" + Date.now(),
        title: title,
        description: desc,
        deadline: deadline,
        status: "todo-list",
        createdAt: createdAt,
        endAt: null,
        inProgressStart: null
    });
    updateLocalStorage();
    renderContent();
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

    const dragHandle = document.createElement('span');
    dragHandle.className = 'drag-handle';
    dragHandle.innerHTML = '⠿'; 
    dragHandle.draggable = true;
    dragHandle.addEventListener("dragstart", drag);
    const element = document.createElement("div");
    element.className = `task ${task.status === 'done' ? 'done-task' : ''}`;
    element.id = task.id;
    element.draggable = true;

    // task content
    const titleElement = document.createElement('div');
    titleElement.className = 'task-title';
    titleElement.textContent = task.title;

    const descElement = document.createElement('div');
    descElement.textContent = task.description;

    // time information
    const timeInfo = document.createElement('div');
    timeInfo.className = 'time-info';
    
    const startAt = document.createElement('div');
    startAt.innerHTML = `<b>Start at:</b> ${task.createdAt}`;
    
    const deadlineInfo = document.createElement('div');
    deadlineInfo.innerHTML = `<b>Deadline:</b> ${new Date(task.deadline).toLocaleString()}`;
    
    const endAt = document.createElement('div');
    endAt.innerHTML = `<b>End at:</b> ${task.endAt || '-'}`;

    // timer in-progress
    const timerContainer = document.createElement('div');
    timerContainer.className = 'timer-info';
    
    if(task.status === 'in-progress') {
        const now = new Date();
        const deadlineDate = new Date(task.deadline);
        const timeDiff = deadlineDate - now;
        
        if(timeDiff > 0) {
            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
            timerContainer.innerHTML = `
                <div><b>Time remaining:</b> ${days}d ${hours}h ${minutes}m ${seconds}s</div>
            `;
        } else {
            timerContainer.innerHTML = `<div style="color:red;"><b>Deadline passed!</b></div>`;
        }
    }

    const deleteBtn = document.createElement('span');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '❌';
    deleteBtn.onclick = () => deleteTask(task.id);

    // assemble elements
    timeInfo.appendChild(startAt);
    timeInfo.appendChild(deadlineInfo);
    timeInfo.appendChild(endAt);
    
    const contentWrapper = document.createElement('div');
    contentWrapper.style.flexGrow = '1';
    contentWrapper.appendChild(titleElement);
    contentWrapper.appendChild(descElement);
    contentWrapper.appendChild(timeInfo);
    contentWrapper.appendChild(timerContainer);

    element.appendChild(dragHandle);
    element.appendChild(contentWrapper);
    element.appendChild(deleteBtn);

    return element;
}

function deleteTask(taskId) {
    data = data.filter(task => task.id !== taskId);
    updateLocalStorage();
    renderContent();
}

function drag(event) {
    const taskElement = event.target.closest('.task');
    if(taskElement) {
        event.dataTransfer.setData("text/plain", taskElement.id);
        event.dataTransfer.effectAllowed = "move";
    }
}

function drop(event, columnId) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain");
    updateTaskStatus(taskId, columnId);
}

function allowDrop(event) {
    event.preventDefault();
    event.target.closest('.card').classList.add('dragover');
}

function updateTaskStatus(taskId, newStatus) {
    const now = new Date().toLocaleString();
    
    data = data.map(task => {
        if (task.id === taskId) {
            // R\reset endAt jika pindah dari Done
            let newEndAt = task.endAt;
            if(task.status === 'done' && newStatus !== 'done') {
                newEndAt = null;
            }
            
            // Set endAt if done
            if(newStatus === 'done') {
                newEndAt = now;
            }

            return {
                ...task,
                status: newStatus,
                endAt: newEndAt,
                // update in-progress time
                inProgressStart: newStatus === 'in-progress' ? Date.now() : null
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
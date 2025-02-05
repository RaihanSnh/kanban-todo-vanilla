document.addEventListener
    ("DOMContentLoaded", function () {
        renderContent();
        setTimeout(() => {
            setInterval(() => {
                renderContent();
            }, 1000);
        }, 2000);
    });

const TodoInput = document.getElementById('todo');
const TodoInputButton = document.getElementById('add');
let data = JSON.parse(localStorage.getItem('tasks')) || [];
const TodoListElement = document.getElementById('todo-list');

TodoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    addTask();
  }
});

TodoInputButton.addEventListener('click', () => {
    if (TodoInput.value) {
        addTask();
    }
});

function addTask() {
    data.push({
        id: "task-" + Date.now(),
        title: TodoInput.value,
        status: "todo-list",
        timestamp: []
    });
    localStorage.setItem('tasks', JSON.stringify(data));
    renderContent();
    TodoInput.value = '';
}

function allowDrop(event) {
    event.preventDefault();
}

function renderContent() {
    const columns = ['todo-list', 'in-progress', 'done'];
    columns.forEach((value) => {
        const column = document.getElementById(value);
        column.querySelector('.task-container').
            innerHTML = '';
        data.forEach(element => {
            if (element.status === value) {
                const task = createTaskElement(element);
                column.querySelector('.task-container').
                     appendChild(task);
            }
        });
    });
}

function createTaskElement(element) {
    const title = element.title;
    const id = element.id;
    const task = document.createElement("div");
    let timer = "";
    if(element.status === 'in-progress') {
        // format 0d 0h 0m 0s
        const startUnix = (new Date(element.timestamp[0].dateStart)).valueOf();
        const nowUnix = (new Date()).valueOf();
        const diff = nowUnix - startUnix;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        timer = `<span><b>Time elapsed:</b> ${days}d ${hours}h ${minutes}m ${seconds}s</span>`;
    } else if(element.status === 'done') {
        timer = `<span><b>Ends at:</b> ${element.timestamp[0].dateEnd}</span>`;
    }
    task.id = id;
    task.className = "task";
    task.draggable = true;
    task.innerHTML =
        `<div style="display: flex; flex-direction: column">${title}
        ${timer}</div>
    <span class="delete-btn"
          onclick="deleteTask('${id}')">
        ❌
    </span>`;
    task.addEventListener("dragstart", drag);
    return task;
}

function deleteTask(taskId) {
    data = data.
        filter(task => task.id !== taskId);
    updateLocalStorage();
    renderContent();
}

function drag(event) {
    event.dataTransfer.
        setData("text/plain", event.target.id);
}

function drop(event, columnId) {
    event.preventDefault();
    const dataEl = event.
        dataTransfer.getData("text/plain");
    const draggedElement =
        document.getElementById(dataEl);
    if (draggedElement) {
        const taskStatus = columnId;
        updateTaskStatus(dataEl, taskStatus);
        event.target.closest('.card').querySelector('.task-container').
            appendChild(draggedElement);
    }
}

function updateTaskStatus(taskId, newStatus) {
    const inProgress = newStatus === 'in-progress';
    const done = newStatus === 'done' || newStatus === 'todo-list';
    const dateStartValue = (dateStart) => inProgress ? new Date().valueOf(): dateStart;
    const dateEndValue = (dateEnd) => done ? new Date().valueOf() : dateEnd;
    data = data.map(task => {
        if (task.id === taskId) {
            const newTimestamp = {
                // TODO: make dateStart and dateEnd from timestamp not task
                dateStart: dateStartValue(task.dateStart),
                dateEnd: dateEndValue(task.dateEnd)
            };

            // Ensure no duplicate timestamps and merge dateStart and dateEnd into one object
            const updatedTimestamps = [...task.timestamp, newTimestamp].reduce((acc, curr) => {
                const existing = acc.find(t => t.dateStart === curr.dateStart || t.dateEnd === curr.dateEnd);
                if (existing) {
                    existing.dateStart = existing.dateStart || curr.dateStart;
                    existing.dateEnd = existing.dateEnd || curr.dateEnd;
                } else {
                    acc.push(curr);
                }
                return acc;
            }, []);

            return {
                ...task,
                status: newStatus,
                timestamp: updatedTimestamps
            };
        }
        return task;
    });
    updateLocalStorage();
}

function updateLocalStorage() {
    localStorage.setItem
        ('tasks', JSON.stringify(data));
}
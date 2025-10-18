// Global variables
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";

// DOM Elements
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskTag = document.getElementById("taskTag");
const taskDueDate = document.getElementById("taskDueDate");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const filterAll = document.getElementById("filterAll");
const filterPending = document.getElementById("filterPending");
const filterCompleted = document.getElementById("filterCompleted");
const filterTag = document.getElementById("filterTag");
const filterDate = document.getElementById("filterDate");

// Edit Modal Elements
const editTaskModal = document.getElementById("editTaskModal");
const editTaskForm = document.getElementById("editTaskForm");
const editTaskId = document.getElementById("editTaskId");
const editTaskInput = document.getElementById("editTaskInput");
const editTaskTag = document.getElementById("editTaskTag");
const editTaskDueDate = document.getElementById("editTaskDueDate");
const cancelEdit = document.getElementById("cancelEdit");

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  // Set minimum date to today in date fields
  const today = new Date().toISOString().split("T")[0];
  taskDueDate.min = today;
  filterDate.min = today;
  editTaskDueDate.min = today;

  renderTasks();

  // Event Listeners
  taskForm.addEventListener("submit", addTask);
  filterAll.addEventListener("click", () => setFilter("all"));
  filterPending.addEventListener("click", () => setFilter("pending"));
  filterCompleted.addEventListener("click", () => setFilter("completed"));
  filterTag.addEventListener("change", renderTasks);
  filterDate.addEventListener("change", renderTasks);

  // Edit modal listeners
  editTaskForm.addEventListener("submit", updateTask);
  cancelEdit.addEventListener("click", closeModal);
});

// Add new task
function addTask(e) {
  e.preventDefault();

  const text = taskInput.value.trim();
  const tag = taskTag.value;
  const dueDate = taskDueDate.value;

  if (text === "") {
    alert("Por favor, descreva a tarefa!");
    return;
  }

  const newTask = {
    id: Date.now(),
    text: text,
    completed: false,
    tag: tag,
    dueDate: dueDate,
    createdAt: new Date().toISOString(),
  };

  tasks.push(newTask);
  saveTasks();
  renderTasks();

  // Reset form
  taskInput.value = "";
  taskDueDate.value = "";
}

// Render tasks
function renderTasks() {
  // Apply filters
  let filteredTasks = tasks;

  // Status filter
  if (currentFilter === "pending") {
    filteredTasks = filteredTasks.filter((task) => !task.completed);
  }
  else if (currentFilter === "completed") {
    filteredTasks = filteredTasks.filter((task) => task.completed);
  }

  // Tag filter
  const selectedTag = filterTag.value;
  if (selectedTag) {
    filteredTasks = filteredTasks.filter((task) => task.tag === selectedTag);
  }

  // Date filter
  const selectedDate = filterDate.value;
  if (selectedDate) {
    filteredTasks = filteredTasks.filter(
      (task) => task.dueDate === selectedDate
    );
  }

  // Clear list
  taskList.innerHTML = "";

  // Show empty state if there are no tasks
  if (filteredTasks.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  } else {
    emptyState.classList.add("hidden");
  }

  // Add tasks to the list
  filteredTasks.forEach((task) => {
    const taskElement = document.createElement("div");
    taskElement.className = `task-item bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border ${
      task.completed
        ? "completed border-green-200 dark:border-green-800"
        : "border-gray-200 dark:border-gray-600"
    } transition-colors duration-300`;
    taskElement.setAttribute("data-id", task.id);

    // Format date
    const dueDateFormatted = task.dueDate
      ? // Using replace to treat date as local timezone, not UTC, avoiding day-off bug.
        // new Date('2023-10-27') -> Interpreted as UTC
        // new Date('2023/10/27') -> Interpreted as Local Time
        new Date(task.dueDate.replace(/-/g, "/")).toLocaleDateString("pt-BR")
      : "Sem data";

    taskElement.innerHTML = `
                    <div class="flex items-start justify-between">
                        <div class="flex items-start space-x-3">
                            <button class="toggle-complete mt-1 ${
                              task.completed
                                ? "text-green-500 dark:text-green-400"
                                : "text-gray-500 dark:text-gray-400"
                            }">
                                <i class="fas fa-${
                                  task.completed ? "check-circle" : "circle"
                                }"></i>
                            </button>
                            <div>
                                <p class="text-gray-800 dark:text-gray-200 ${
                                  task.completed ? "completed" : ""
                                }">${task.text}</p>
                                <div class="flex flex-wrap gap-2 mt-2">
                                    <span class="tag px-2 py-1 rounded-full text-xs font-medium 
                                        ${
                                          task.tag === "Trabalho"
                                            ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                                            : task.tag === "Educação"
                                            ? "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
                                            : "bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
                                        }">
                                        ${task.tag}
                                    </span>
                                    <span class="due-date px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
                                        <i class="far fa-calendar-alt mr-1"></i> ${dueDateFormatted}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <button class="edit-task text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-300">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-task text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-300">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;

    taskList.appendChild(taskElement);
  });

  // Add event listeners for each task's buttons
  document.querySelectorAll(".toggle-complete").forEach((button) => {
    button.addEventListener("click", toggleTask);
  });

  document.querySelectorAll(".delete-task").forEach((button) => {
    button.addEventListener("click", deleteTask);
  });

  document.querySelectorAll(".edit-task").forEach((button) => {
    button.addEventListener("click", editTask);
  });
}

// Toggle task completion status
function toggleTask(e) {
  const taskId = parseInt(
    e.target.closest(".task-item").getAttribute("data-id")
  );
  const taskIndex = tasks.findIndex((task) => task.id === taskId);

  if (taskIndex !== -1) {
    tasks[taskIndex].completed = !tasks[taskIndex].completed;
    saveTasks();
    renderTasks();
  }
}

// Delete task
function deleteTask(e) {
  if (!confirm("Tem certeza que deseja excluir esta tarefa?")) {
    return;
  }

  const taskId = parseInt(
    e.target.closest(".task-item").getAttribute("data-id")
  );
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  renderTasks();
}

// Edit task
function editTask(e) {
  const taskElement = e.target.closest(".task-item");
  const taskId = parseInt(taskElement.getAttribute("data-id"));
  const task = tasks.find((task) => task.id === taskId);

  if (!task) return;

  // Populate and show the modal
  editTaskId.value = task.id;
  editTaskInput.value = task.text;
  editTaskTag.value = task.tag;
  editTaskDueDate.value = task.dueDate;
  editTaskModal.classList.remove("hidden");
}

// Update task
function updateTask(e) {
  e.preventDefault();

  const taskId = parseInt(editTaskId.value);
  const taskIndex = tasks.findIndex((task) => task.id === taskId);

  if (taskIndex !== -1) {
    const newText = editTaskInput.value.trim();
    const newTag = editTaskTag.value;
    const newDueDate = editTaskDueDate.value;

    if (newText !== "") {
      tasks[taskIndex].text = newText;
      tasks[taskIndex].tag = newTag;
      tasks[taskIndex].dueDate = newDueDate;
      saveTasks();
      renderTasks();
      closeModal();
    } else {
      alert("A descrição da tarefa não pode estar vazia!");
    }
  }
}

// Close edit modal
function closeModal() {
  editTaskModal.classList.add("hidden");
}

// Set filter
function setFilter(filter) {
  currentFilter = filter;
  renderTasks();

  // Update filter button styles
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove(
      "bg-indigo-600",
      "bg-yellow-500",
      "bg-green-500",
      "dark:bg-indigo-500",
      "dark:bg-yellow-600",
      "dark:bg-green-600"
    );
    btn.classList.add(
      "bg-gray-300",
      "dark:bg-gray-600",
      "text-gray-700",
      "dark:text-gray-300"
    );
  });

  // Highlight the active filter
  if (filter === "all") {
    filterAll.classList.remove(
      "bg-gray-300",
      "dark:bg-gray-600",
      "text-gray-700",
      "dark:text-gray-300"
    );
    filterAll.classList.add(
      "bg-indigo-600",
      "dark:bg-indigo-500",
      "text-white"
    );
  }
  else if (filter === "pending") {
    filterPending.classList.remove(
      "bg-gray-300",
      "dark:bg-gray-600",
      "text-gray-700",
      "dark:text-gray-300"
    );
    filterPending.classList.add(
      "bg-yellow-500",
      "dark:bg-yellow-600",
      "text-white"
    );
  }
  else if (filter === "completed") {
    filterCompleted.classList.remove(
      "bg-gray-300",
      "dark:bg-gray-600",
      "text-gray-700",
      "dark:text-gray-300"
    );
    filterCompleted.classList.add(
      "bg-green-500",
      "dark:bg-green-600",
      "text-white"
    );
  }
}

// Save tasks to localStorage
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

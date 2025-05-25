document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const taskTextEl = document.getElementById('taskText');
    const taskPointsEl = document.getElementById('taskPoints');
    const assignToEl = document.getElementById('assignTo');
    // FollowUpDateEl removed
    const taskForDateEl = document.getElementById('taskForDate'); // New
    const taskDueTimeEl = document.getElementById('taskDueTime');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskListEl = document.getElementById('taskList');
    const resultPointsEl = document.getElementById('resultPoints');
    const motivationalQuoteEl = document.getElementById('motivationalQuote');
    const scoreCardEl = document.getElementById('scoreCard');
    const pendingTasksCountEl = document.getElementById('pendingTasksCount');
    const excelImportEl = document.getElementById('excelImport');
    const saveLogBtn = document.getElementById('saveLogBtn');
    const importLogEl = document.getElementById('importLog');
    const dateFilterEl = document.getElementById('dateFilter'); // For filtering display
    const showAllTasksBtn = document.getElementById('showAllTasksBtn');
    const searchInputEl = document.getElementById('searchInput');
    const archiveDayBtn = document.getElementById('archiveDayBtn');
    const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
    const importArchivedDayEl = document.getElementById('importArchivedDay');


    // --- App State ---
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilterDate = null; // Date object for filtering display

    const motivationalQuotes = [
        "\"The secret of getting ahead is getting started.\" - Mark Twain",
        "\"Don't watch the clock; do what it does. Keep going.\" - Sam Levenson",
        "\"The only way to do great work is to love what you do.\" - Steve Jobs",
        "\"Well done is better than well said.\" - Benjamin Franklin",
        "\"You are never too old to set another goal or to dream a new dream.\" - C.S. Lewis",
        "\"Act as if what you do makes a difference. It does.\" - William James",
        "\"Success is not final, failure is not fatal: It is the courage to continue that counts.\" - Winston Churchill",
        "\"The future depends on what you do today.\" - Mahatma Gandhi",
        "\"Believe you can and you're halfway there.\" - Theodore Roosevelt",
        "\"The harder I work, the luckier I get.\" - Samuel Goldwyn",
        "\"Start by doing what's necessary; then do what's possible; and suddenly you are doing the impossible.\" - Francis of Assisi",
        "\"Perseverance is not a long race; it is many short races one after the other.\" - Walter Elliot",
        "\"The best way to predict the future is to create it.\" - Peter Drucker",
        "\"Do not wait to strike till the iron is hot; but make it hot by striking.\" - William Butler Yeats",
        "\"It does not matter how slowly you go as long as you do not stop.\" - Confucius",
        "\"Quality is not an act, it is a habit.\" - Aristotle",
        "\"A year from now you may wish you had started today.\" - Karen Lamb",
        "\"The journey of a thousand miles begins with a single step.\" - Lao Tzu",
        "\"Either you run the day, or the day runs you.\" - Jim Rohn",
        "\"Opportunity is missed by most people because it is dressed in overalls and looks like work.\" - Thomas Edison",
        "\"Setting goals is the first step in turning the invisible into the visible.\" - Tony Robbins",
        "\"Your limitation—it's only your imagination.\" - Unknown",
        "\"Push yourself, because no one else is going to do it for you.\" - Unknown",
        "\"Great things never come from comfort zones.\" - Unknown",
        "\"Dream it. Wish it. Do it.\" - Unknown",
        "\"Success doesn’t just find you. You have to go out and get it.\" - Unknown",
        "\"The harder you work for something, the greater you’ll feel when you achieve it.\" - Unknown",
        "\"Dream bigger. Do bigger.\" - Unknown",
        "\"Don’t stop when you’re tired. Stop when you’re done.\" - Unknown",
        "\"Wake up with determination. Go to bed with satisfaction.\" - Unknown"
    ];

    // --- Utility Functions ---
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function formatDateTime(timestamp, includeTime = true) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
            options.hour12 = true;
        }
        return date.toLocaleString('en-US', options);
    }
     function formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    function normalizeDate(dateInput) {
        if (!dateInput) return null;
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return null;
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function getTodayNormalized() {
        const today = new Date();
        today.setHours(0,0,0,0);
        return today;
    }

    // --- Core Functions ---
    function updateArchiveButtonVisibility() {
        if (currentFilterDate) {
            const filterDayStart = currentFilterDate.getTime();
            const tasksForSelectedDay = tasks.filter(task => {
                const taskCreationDayStart = normalizeDate(new Date(task.createdAt)).getTime();
                return taskCreationDayStart === filterDayStart;
            });
            if (tasksForSelectedDay.length > 0) {
                archiveDayBtn.style.display = 'inline-block';
                archiveDayBtn.textContent = `Archive ${tasksForSelectedDay.length} for ${formatDateTime(currentFilterDate, false)}`;
            } else {
                archiveDayBtn.style.display = 'none';
            }
        } else {
            archiveDayBtn.style.display = 'none';
        }
    }

    function renderTasks() {
        taskListEl.innerHTML = '';
        const currentSearchTerm = searchInputEl.value.trim().toLowerCase();
        const now = Date.now();

        let tasksToDisplay = [...tasks];

        if (currentFilterDate) {
            const filterDayStart = currentFilterDate.getTime();
            tasksToDisplay = tasksToDisplay.filter(task => {
                const taskCreationDayStart = normalizeDate(new Date(task.createdAt)).getTime();
                return taskCreationDayStart === filterDayStart;
            });
        }

        if (currentSearchTerm) {
            tasksToDisplay = tasksToDisplay.filter(task =>
                task.text.toLowerCase().includes(currentSearchTerm) ||
                (task.assignedTo && task.assignedTo.toLowerCase().includes(currentSearchTerm))
            );
        }

        const pendingTasks = tasksToDisplay.filter(t => !t.completed)
            .sort((a, b) => (a.dueAt || Infinity) - (b.dueAt || Infinity) || (b.points || 0) - (a.points || 0) );

        const completedTasks = tasksToDisplay.filter(t => t.completed)
            .sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0));

        const sortedTasksToDisplay = [...pendingTasks, ...completedTasks];

        if (sortedTasksToDisplay.length === 0) {
            let message = "No tasks to display. Try adding some!";
            const onGlobalTasks = tasks.length > 0;

            if (currentSearchTerm) {
                 message = `No tasks match your search: "${searchInputEl.value.trim()}"`;
                 if (currentFilterDate) {
                    message += ` for ${formatDateTime(currentFilterDate, false)}`;
                 }
                 message += `. <button id="clearSearchBtnSmall" class="control-btn">Clear Search</button>`;
                 if (currentFilterDate && onGlobalTasks) {
                    message += ` or <button id="clearDateFilterBtnSmallForSearch" class="control-btn">Show All Dates for this Search</button>`;
                 }
            } else if (currentFilterDate) {
                message = `No tasks for ${formatDateTime(currentFilterDate, false)}.`;
                if (onGlobalTasks) {
                     message += ` <button id="clearDateFilterBtnSmall" class="control-btn">Show All Tasks</button>`;
                }
            } else if (!onGlobalTasks) {
                message = "No tasks yet. Add your first task!";
            }

            taskListEl.innerHTML = `<p style="text-align:center; color: #757575;">${message}</p>`;

            const clearDateBtnSmall = document.getElementById('clearDateFilterBtnSmall');
            if(clearDateBtnSmall) {
                clearDateBtnSmall.addEventListener('click', () => {
                    currentFilterDate = null;
                    dateFilterEl.value = '';
                    renderTasks();
                });
            }
            const clearDateBtnSmallForSearch = document.getElementById('clearDateFilterBtnSmallForSearch');
            if(clearDateBtnSmallForSearch) {
                clearDateBtnSmallForSearch.addEventListener('click', () => {
                    currentFilterDate = null;
                    dateFilterEl.value = '';
                    renderTasks();
                });
            }
            const clearSearchBtnSmall = document.getElementById('clearSearchBtnSmall');
            if(clearSearchBtnSmall) {
                clearSearchBtnSmall.addEventListener('click', () => {
                    searchInputEl.value = '';
                    renderTasks();
                });
            }
        }


        sortedTasksToDisplay.forEach(task => {
            const listItem = document.createElement('li');
            listItem.classList.add('task-item');
            listItem.dataset.id = task.id; // Keep ID on the li for easy access

            if (task.completed) {
                listItem.classList.add('completed');
            }
            if (task.dueAt && !task.completed && now > task.dueAt) {
                listItem.classList.add('overdue');
            }

            // Create a wrapper for the normal task content
            const contentWrapper = document.createElement('div');
            contentWrapper.classList.add('task-item-content-wrapper');

            const mainContentDiv = document.createElement('div');
            mainContentDiv.classList.add('task-item-main-content');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => toggleTaskComplete(task.id));

            const taskDetailsDiv = document.createElement('div');
            taskDetailsDiv.classList.add('task-details');

            const taskMainInfoDiv = document.createElement('div');
            taskMainInfoDiv.classList.add('task-main-info');
            const textSpan = document.createElement('span');
            textSpan.classList.add('task-text');
            textSpan.textContent = task.text;
            const pointsSpan = document.createElement('span');
            pointsSpan.classList.add('task-points');
            pointsSpan.textContent = `${task.points} Pts`;
            taskMainInfoDiv.appendChild(textSpan);
            taskMainInfoDiv.appendChild(pointsSpan);
            taskDetailsDiv.appendChild(taskMainInfoDiv);

            if (task.dueAt) {
                const dueTimeDiv = document.createElement('div');
                dueTimeDiv.classList.add('task-due-time');
                dueTimeDiv.textContent = `Due: ${formatTime(task.dueAt)}`;
                if (task.completed) {
                     dueTimeDiv.style.textDecoration = 'line-through';
                     dueTimeDiv.style.color = '#558b2f';
                } else if (now > task.dueAt) {
                    dueTimeDiv.textContent += ' (Overdue)';
                    dueTimeDiv.style.color = '#c62828';
                }
                taskDetailsDiv.appendChild(dueTimeDiv);
            }

            if (task.assignedTo) { // Only assignedTo now
                const metaInfoDiv = document.createElement('div');
                metaInfoDiv.classList.add('task-meta-info');
                metaInfoDiv.innerHTML = `Assigned to: <strong>${task.assignedTo}</strong>`;
                taskDetailsDiv.appendChild(metaInfoDiv);
            }

            const timestampsSpan = document.createElement('span');
            timestampsSpan.classList.add('task-timestamps');
            let tsText = `Task for: ${formatDateTime(task.createdAt, false) || 'N/A'}`;
            if (task.completed && task.completedAt) {
                tsText += ` | Completed: ${formatDateTime(task.completedAt)}`;
            }
            timestampsSpan.textContent = tsText;
            taskDetailsDiv.appendChild(timestampsSpan);

            mainContentDiv.appendChild(checkbox);
            mainContentDiv.appendChild(taskDetailsDiv);
            contentWrapper.appendChild(mainContentDiv); // Add main content to wrapper

            const taskActionsDiv = document.createElement('div');
            taskActionsDiv.classList.add('task-actions');

            if (!task.completed) {
                const editBtn = document.createElement('button');
                editBtn.textContent = 'Edit';
                editBtn.classList.add('edit-btn');
                editBtn.addEventListener('click', () => showEditForm(task.id, listItem));
                taskActionsDiv.appendChild(editBtn);

                const moveBtn = document.createElement('button');
                moveBtn.textContent = 'Move Task';
                moveBtn.classList.add('move-task-btn');
                moveBtn.addEventListener('click', (e) => showMoveTaskControls(e.target, task.id));
                taskActionsDiv.appendChild(moveBtn);
            }

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-btn');
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => deleteTask(task.id));
            taskActionsDiv.appendChild(deleteBtn);

            contentWrapper.appendChild(taskActionsDiv); // Add actions to wrapper
            listItem.appendChild(contentWrapper); // Add wrapper to li
            taskListEl.appendChild(listItem);
        });
        updateAllStats();
        updateArchiveButtonVisibility();
        saveTasks();
    }

    function addTask(text, points, taskDayTimestamp, dueTimeStr, assignedTo = null) { // Removed followUpDate
        const taskText = text.trim();
        const taskPointsNum = parseInt(points);

        if (taskText === '') {
            alert('Please enter a task description.');
            return false;
        }
        if (isNaN(taskPointsNum) || taskPointsNum <= 0) {
            alert('Please enter valid points (greater than 0).');
            return false;
        }

        let dueAtTimestamp = null;
        if (dueTimeStr) {
            const [hours, minutes] = dueTimeStr.split(':').map(Number);
            const dueAtDate = new Date(taskDayTimestamp);
            dueAtDate.setHours(hours, minutes, 0, 0);
            dueAtTimestamp = dueAtDate.getTime();
        }

        const newTask = {
            id: Date.now() + Math.random(),
            text: taskText,
            points: taskPointsNum,
            completed: false,
            createdAt: taskDayTimestamp,
            dueAt: dueAtTimestamp,
            completedAt: null,
            assignedTo: assignedTo ? assignedTo.trim() : null,
            // followUpDate property removed
        };
        tasks.push(newTask);
        return true;
    }

    function handleAddTaskFromInput() {
        const dueTimeValue = taskDueTimeEl.value;
        let taskDayForCreation;

        if (taskForDateEl.value) { // Use the "Task for Date" input
            taskDayForCreation = normalizeDate(taskForDateEl.value).getTime();
        } else { // Default to today if "Task for Date" is empty
            taskDayForCreation = getTodayNormalized().getTime();
            taskForDateEl.valueAsDate = getTodayNormalized(); // Set it for clarity
        }

        if (addTask(taskTextEl.value, taskPointsEl.value, taskDayForCreation, dueTimeValue, assignToEl.value)) {
            taskTextEl.value = '';
            taskPointsEl.value = '1';
            assignToEl.value = '';
            // taskForDateEl.valueAsDate = getTodayNormalized(); // Reset or leave as is for next task
            // taskDueTimeEl.value = '17:00';
            renderTasks();
        }
    }

    function toggleTaskComplete(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            if (task.completed) {
                task.completedAt = Date.now();
                updateMotivationalQuote();
            } else {
                task.completedAt = null;
            }
        }
        renderTasks();
    }

    function deleteTask(taskId) {
        tasks = tasks.filter(t => t.id !== taskId);
        renderTasks();
    }

    function showEditForm(taskId, listItemElement) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        // Hide normal content, show edit form
        const contentWrapper = listItemElement.querySelector('.task-item-content-wrapper');
        if (contentWrapper) contentWrapper.style.display = 'none';

        // Remove existing edit form if any (e.g., quick double click)
        const existingEditForm = listItemElement.querySelector('.task-item-edit-form');
        if (existingEditForm) existingEditForm.remove();

        const editFormDiv = document.createElement('div');
        editFormDiv.classList.add('task-item-edit-form');

        const editText = document.createElement('input');
        editText.type = 'text';
        editText.value = task.text;

        const editPoints = document.createElement('input');
        editPoints.type = 'number';
        editPoints.value = task.points;
        editPoints.min = "1";

        const editAssignedTo = document.createElement('input');
        editAssignedTo.type = 'text';
        editAssignedTo.value = task.assignedTo || '';
        editAssignedTo.placeholder = "Assign to (optional)";

        const editTaskForDate = document.createElement('input');
        editTaskForDate.type = 'date';
        editTaskForDate.valueAsDate = new Date(task.createdAt);

        const editDueTime = document.createElement('input');
        editDueTime.type = 'time';
        if (task.dueAt) {
            const dueDate = new Date(task.dueAt);
            editDueTime.value = `${String(dueDate.getHours()).padStart(2, '0')}:${String(dueDate.getMinutes()).padStart(2, '0')}`;
        }

        const controlsDiv = document.createElement('div');
        controlsDiv.classList.add('edit-controls');

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.addEventListener('click', () => {
            handleSaveEdit(
                taskId,
                editText.value,
                editPoints.value,
                editAssignedTo.value,
                editTaskForDate.value,
                editDueTime.value
            );
            // renderTasks() will be called by handleSaveEdit, removing the form
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.classList.add('cancel-edit-btn');
        cancelBtn.addEventListener('click', () => {
            editFormDiv.remove(); // Remove edit form
            if (contentWrapper) contentWrapper.style.display = 'flex'; // Show normal content
            // Or just call renderTasks() if simpler, but this is more targeted
        });

        editFormDiv.appendChild(document.createTextNode("Description:"));
        editFormDiv.appendChild(editText);
        editFormDiv.appendChild(document.createTextNode("Points:"));
        editFormDiv.appendChild(editPoints);
        editFormDiv.appendChild(document.createTextNode("Assigned To:"));
        editFormDiv.appendChild(editAssignedTo);
        editFormDiv.appendChild(document.createTextNode("Task for Date:"));
        editFormDiv.appendChild(editTaskForDate);
        editFormDiv.appendChild(document.createTextNode("Due Time:"));
        editFormDiv.appendChild(editDueTime);
        controlsDiv.appendChild(saveBtn);
        controlsDiv.appendChild(cancelBtn);
        editFormDiv.appendChild(controlsDiv);

        listItemElement.appendChild(editFormDiv);
    }

    function handleSaveEdit(taskId, newText, newPointsStr, newAssignedTo, newTaskForDateStr, newDueTimeStr) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const newPoints = parseInt(newPointsStr);
        if (newText.trim() === '') { alert("Task description cannot be empty."); return; }
        if (isNaN(newPoints) || newPoints <= 0) { alert("Invalid points."); return; }

        task.text = newText.trim();
        task.points = newPoints;
        task.assignedTo = newAssignedTo.trim() || null;

        const newTaskForDate = normalizeDate(newTaskForDateStr);
        if (!newTaskForDate) { alert("Invalid task for date."); return; }
        task.createdAt = newTaskForDate.getTime();

        if (newDueTimeStr) {
            const [hours, minutes] = newDueTimeStr.split(':').map(Number);
            const newDueAtDate = new Date(task.createdAt); // Base on the new task day
            newDueAtDate.setHours(hours, minutes, 0, 0);
            task.dueAt = newDueAtDate.getTime();
        } else {
            task.dueAt = null; // Due time cleared
        }

        saveTasks();
        renderTasks(); // Re-render to show changes and remove edit form
    }


    function updateMotivationalQuote() {
        const fullQuoteString = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
        const match = fullQuoteString.match(/^(".*?")(\s*-\s*.*)?$/);
        if (match) {
            const quoteText = match[1];
            const attribution = match[2] || "";
            motivationalQuoteEl.innerHTML = `<strong>${quoteText}</strong>${attribution}`;
        } else {
            motivationalQuoteEl.innerHTML = `<strong>${fullQuoteString}</strong>`;
        }
    }

    function updateAllStats() {
        const completedTasksGlobal = tasks.filter(task => task.completed);
        const pendingTasksGlobal = tasks.length - completedTasksGlobal.length;

        const totalPointsOfCompletedTasks = completedTasksGlobal.reduce((sum, task) => sum + (task.points || 0), 0);
        const totalPointsOfAllTasks = tasks.reduce((sum, task) => sum + (task.points || 0), 0);

        if (totalPointsOfAllTasks > 0) {
            scoreCardEl.textContent = `${totalPointsOfCompletedTasks} / ${totalPointsOfAllTasks} Pts`;
        } else {
            scoreCardEl.textContent = `0 / 0 Pts`;
        }

        pendingTasksCountEl.textContent = pendingTasksGlobal;
        resultPointsEl.textContent = totalPointsOfCompletedTasks;
    }

    function showMoveTaskControls(buttonElement, taskId) {
        const listItem = buttonElement.closest('li'); // Get the parent li
        const existingEditForm = listItem.querySelector('.task-item-edit-form');
        if (existingEditForm) {
            alert("Please save or cancel the current edit before moving the task.");
            return;
        }

        const existingControls = buttonElement.parentElement.querySelector('.move-task-controls');
        if (existingControls) {
            existingControls.remove();
        }
        buttonElement.style.display = 'none';

        const controlsDiv = document.createElement('div');
        controlsDiv.classList.add('move-task-controls');

        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        const task = tasks.find(t => t.id === taskId);
        dateInput.valueAsDate = task.createdAt ? new Date(task.createdAt) : new Date();

        const saveMoveBtn = document.createElement('button');
        saveMoveBtn.textContent = 'Save';
        saveMoveBtn.onclick = () => {
            if (dateInput.value) {
                const [year, month, day] = dateInput.value.split('-').map(Number);
                const newDayStartTimestamp = new Date(year, month - 1, day).getTime();
                moveTaskToDate(taskId, newDayStartTimestamp);
            }
            controlsDiv.remove();
            buttonElement.style.display = 'block';
        };

        const cancelMoveBtn = document.createElement('button');
        cancelMoveBtn.textContent = 'X';
        cancelMoveBtn.style.backgroundColor = '#aaa';
        cancelMoveBtn.onclick = () => {
            controlsDiv.remove();
            buttonElement.style.display = 'block';
        };

        controlsDiv.appendChild(dateInput);
        controlsDiv.appendChild(saveMoveBtn);
        controlsDiv.appendChild(cancelMoveBtn);
        buttonElement.insertAdjacentElement('afterend', controlsDiv);
    }

    function moveTaskToDate(taskId, newDayStartTimestamp) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.createdAt = newDayStartTimestamp;

            if (task.dueAt) {
                const oldDueAtDate = new Date(task.dueAt);
                const dueHours = oldDueAtDate.getHours();
                const dueMinutes = oldDueAtDate.getMinutes();

                const newDueAtDate = new Date(newDayStartTimestamp);
                newDueAtDate.setHours(dueHours, dueMinutes, 0, 0);
                task.dueAt = newDueAtDate.getTime();
            }
            renderTasks();
        }
    }


    // --- File Operations --- (Excel import, log save/import, archive, restore remain largely the same but without followUpDate)
    function handleExcelImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

                let tasksAddedCount = 0;
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || !row[0]) continue;

                    const taskText = String(row[0]).trim();
                    const taskPoints = parseInt(row[1]) || 1;
                    const dateCell = row[2];

                    let taskDayTimestamp;
                    let dueTimeStr = "17:00";

                    if (dateCell) {
                        let parsedDate;
                        if (dateCell instanceof Date && !isNaN(dateCell.getTime())) {
                            parsedDate = dateCell;
                        } else if (typeof dateCell === 'string') {
                            parsedDate = new Date(dateCell);
                            if (isNaN(parsedDate.getTime())) {
                                const dateParts = dateCell.split(' ')[0];
                                parsedDate = normalizeDate(dateParts) || getTodayNormalized();
                            }
                        } else if (typeof dateCell === 'number') {
                             const jsDateFromSerial = XLSX.SSF.parse_date_code(dateCell);
                             parsedDate = jsDateFromSerial ? new Date(jsDateFromSerial.y, jsDateFromSerial.m - 1, jsDateFromSerial.d,
                                                           jsDateFromSerial.H || 0, jsDateFromSerial.M || 0, jsDateFromSerial.S || 0)
                                                         : getTodayNormalized();
                        } else {
                             parsedDate = getTodayNormalized();
                        }

                        taskDayTimestamp = normalizeDate(parsedDate).getTime();
                        if (parsedDate.getHours() !== 0 || parsedDate.getMinutes() !== 0 || parsedDate.getSeconds() !== 0) {
                           dueTimeStr = `${String(parsedDate.getHours()).padStart(2, '0')}:${String(parsedDate.getMinutes()).padStart(2, '0')}`;
                        }
                    } else {
                        taskDayTimestamp = getTodayNormalized().getTime();
                    }

                    if (taskText) {
                       if (addTask(taskText, taskPoints, taskDayTimestamp, dueTimeStr)) { // Removed followUpDate
                           tasksAddedCount++;
                       }
                    }
                }
                if (tasksAddedCount > 0) {
                    renderTasks();
                    alert(`${tasksAddedCount} tasks imported successfully!`);
                } else {
                    alert("No valid tasks found/added. Ensure Excel has headers and data starts on row 2. Check format: Col A (Text), Col B (Points), Col C (Target Date & Due Time - optional).");
                }
            } catch (error) {
                 alert("Error processing Excel file: " + error.message);
                 console.error("Excel import error:", error);
            } finally {
                 excelImportEl.value = '';
            }
        };
        reader.onerror = () => alert("Failed to read the Excel file.");
        reader.readAsArrayBuffer(file);
    }

    function saveLog() { // No change needed for followUpDate removal here
        if (tasks.length === 0) { alert("No tasks to save."); return; }
        const jsonData = JSON.stringify(tasks, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `task_tracker_log_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert("Log saved successfully!");
    }

    function importLog(event) {
        const file = event.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTasks = JSON.parse(e.target.result);
                if (Array.isArray(importedTasks)) {
                    const isValid = importedTasks.every(task =>
                        typeof task.id !== 'undefined' && typeof task.text === 'string' &&
                        typeof task.points === 'number' && typeof task.completed === 'boolean' &&
                        (typeof task.createdAt === 'number' || typeof task.createdAt === 'string')
                    );
                    if (isValid) {
                        tasks = importedTasks.map(task => ({
                            ...task,
                            createdAt: new Date(task.createdAt).getTime(),
                            dueAt: task.dueAt ? new Date(task.dueAt).getTime() : null,
                            completedAt: task.completedAt ? new Date(task.completedAt).getTime() : null,
                            // followUpDate property removed
                        }));
                        currentFilterDate = null; dateFilterEl.value = ''; searchInputEl.value = '';
                        renderTasks(); alert("Log imported successfully!");
                    } else { alert("Invalid log file format. Some tasks missing properties."); }
                } else { alert("Invalid log file. Expected an array of tasks."); }
            } catch (error) { alert("Error parsing log file: " + error.message); }
            finally { importLogEl.value = '';}
        };
        reader.onerror = () => alert("Failed to read the log file.");
        reader.readAsText(file);
    }

    function downloadExcelTemplate() { // No change needed
        const headers = ["Task Description", "Points (Number)", "Target Date & Due Time (YYYY-MM-DD HH:MM or YYYY-MM-DD for default 5PM due)"];
        const todayStr = new Date().toISOString().split('T')[0];
        const exampleRow1 = ["Review quarterly report", 10, `${todayStr} 14:30`];
        const exampleRow2 = ["Prepare presentation slides", 5, todayStr];
        const exampleRow3 = ["Follow up with Client X", 3, "2024-01-15T10:00:00Z"];
        const exampleRow4 = ["Team meeting", 2, ""];

        const ws_data = [ headers, exampleRow1, exampleRow2, exampleRow3, exampleRow4 ];
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        ws['!cols'] = [ { wch: 40 }, { wch: 15 }, { wch: 60 } ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "TaskImportTemplate");
        XLSX.writeFile(wb, "Task_Import_Template.xlsx");
        alert("Excel template 'Task_Import_Template.xlsx' download started.");
    }

    function archiveSelectedDay() { // No change needed
        if (!currentFilterDate) { alert("Please select a date to archive."); return; }
        const filterDayStart = currentFilterDate.getTime();
        const tasksToArchive = tasks.filter(task => normalizeDate(new Date(task.createdAt)).getTime() === filterDayStart);
        if (tasksToArchive.length === 0) { alert(`No tasks found for ${formatDateTime(currentFilterDate, false)} to archive.`); return; }
        if (!confirm(`Are you sure you want to archive ${tasksToArchive.length} task(s) for ${formatDateTime(currentFilterDate, false)}? ...`)) return;
        try {
            const jsonData = JSON.stringify(tasksToArchive, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const formattedDateForFilename = new Date(currentFilterDate).toISOString().slice(0, 10);
            a.download = `tasks_archive_${formattedDateForFilename}.json`;
            a.href = url; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
            const taskIdsToArchive = new Set(tasksToArchive.map(t => t.id));
            tasks = tasks.filter(task => !taskIdsToArchive.has(task.id));
            saveTasks(); renderTasks();
            alert(`${tasksToArchive.length} task(s) archived...`);
        } catch (error) { alert("Error during archiving: " + error.message); console.error("Archiving error:", error); }
    }

    function handleRestoreArchive(event) { // No change for followUpDate removal needed here
        const file = event.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedArchivedTasks = JSON.parse(e.target.result);
                if (!Array.isArray(importedArchivedTasks)) { alert("Invalid archive file..."); return; }
                let restoredCount = 0, skippedCount = 0;
                const existingIds = new Set(tasks.map(t => t.id));
                importedArchivedTasks.forEach(archivedTask => {
                    if (typeof archivedTask.id === 'undefined' || typeof archivedTask.text !== 'string') { skippedCount++; return; }
                    if (existingIds.has(archivedTask.id)) { skippedCount++; }
                    else {
                        const taskToRestore = { ...archivedTask,
                            createdAt: new Date(archivedTask.createdAt).getTime(),
                            dueAt: archivedTask.dueAt ? new Date(archivedTask.dueAt).getTime() : null,
                            completedAt: archivedTask.completedAt ? new Date(archivedTask.completedAt).getTime() : null,
                        };
                        tasks.push(taskToRestore); existingIds.add(taskToRestore.id); restoredCount++;
                    }
                });
                if (restoredCount > 0) { saveTasks(); renderTasks(); }
                alert(`${restoredCount} task(s) restored. ${skippedCount > 0 ? `${skippedCount} skipped.` : ''}`);
            } catch (error) { alert("Error parsing archive file: " + error.message); console.error("Archive import error:", error); }
            finally { importArchivedDayEl.value = ''; }
        };
        reader.onerror = () => { alert("Failed to read archive file."); importArchivedDayEl.value = ''; };
        reader.readAsText(file);
    }


    // --- Event Listeners ---
    addTaskBtn.addEventListener('click', handleAddTaskFromInput);
    taskTextEl.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleAddTaskFromInput(); });
    excelImportEl.addEventListener('change', handleExcelImport);
    saveLogBtn.addEventListener('click', saveLog);
    importLogEl.addEventListener('change', importLog);
    searchInputEl.addEventListener('input', renderTasks);
    downloadTemplateBtn.addEventListener('click', downloadExcelTemplate);
    archiveDayBtn.addEventListener('click', archiveSelectedDay);
    importArchivedDayEl.addEventListener('change', handleRestoreArchive);


    dateFilterEl.addEventListener('change', (event) => { // This is the DISPLAY filter
        const selectedDateStr = event.target.value;
        currentFilterDate = selectedDateStr ? normalizeDate(selectedDateStr) : null;
        renderTasks();
    });

    showAllTasksBtn.addEventListener('click', () => {
        currentFilterDate = null;
        dateFilterEl.value = '';
        searchInputEl.value = '';
        renderTasks();
    });

    // --- Initial Setup ---
    function initializeApp() {
        taskForDateEl.valueAsDate = getTodayNormalized(); // Default "Task for Date" to today

        tasks.forEach(task => {
            task.createdAt = new Date(task.createdAt).getTime();
            task.dueAt = task.dueAt ? new Date(task.dueAt).getTime() : null;
            if (task.completedAt) task.completedAt = new Date(task.completedAt).getTime();
            delete task.followUpDate; // Remove old property if present from older logs
        });

        updateMotivationalQuote();
        renderTasks();
    }
    initializeApp();
});
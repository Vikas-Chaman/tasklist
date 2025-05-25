document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const taskTextEl = document.getElementById('taskText');
    const taskPointsEl = document.getElementById('taskPoints');
    const assignToEl = document.getElementById('assignTo');
    const taskForDateEl = document.getElementById('taskForDate');
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
    const dateFilterEl = document.getElementById('dateFilter');
    const showAllTasksBtn = document.getElementById('showAllTasksBtn');
    const searchInputEl = document.getElementById('searchInput');
    const archiveDayBtn = document.getElementById('archiveDayBtn');
    const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
    const importArchivedDayEl = document.getElementById('importArchivedDay');
    const generateReportBtn = document.getElementById('generateReportBtn');
    const taskStatusChartCanvas = document.getElementById('taskStatusChart');

    // --- App State ---
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilterDate = null;
    let notificationInterval = null;
    let hasUnsavedChanges = false;
    let userName = "User";
    let taskStatusChartInstance = null;

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
    const reportFooterQuotes = [
        "Step by step, day by day. Keep shining!",
        "You're making progress. Celebrate your efforts!",
        "Today's work is tomorrow's success. Well done!",
        "Consistency is key, and you're nailing it!",
        "Another productive day! You're on fire!"
    ];

    // --- Utility Functions ---
    function saveTasks() { localStorage.setItem('tasks', JSON.stringify(tasks)); }
    function markUnsavedChanges() { hasUnsavedChanges = true; }
    function markChangesSaved() { hasUnsavedChanges = false; }

    function formatDateTime(timestamp, includeTime = true, forPDF = false) {
        if (!timestamp) return forPDF ? 'N/A' : '';
        const date = new Date(timestamp);
        const options = { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' };
        if (includeTime) {
            options.hour = '2-digit'; options.minute = '2-digit'; options.hour12 = true;
        }
        return date.toLocaleString('en-IN', options);
    }
    function formatTime(timestamp, forPDF = false) {
        if (!timestamp) return forPDF ? 'N/A' : '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
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

    function getTomorrowNormalized() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow;
    }


    // --- Notification Functions ---
    function checkAndRequestNotificationPermission() {
        if (!("Notification" in window)) {
            console.log("Browser does not support desktop notification");
            return Promise.resolve(false);
        }
        if (Notification.permission === "granted") {
            new Notification("Task Tracker: Notifications Enabled!", {
                body: "You will receive alerts for overdue tasks.",
            });
            return Promise.resolve(true);
        }
        if (Notification.permission !== "denied") {
            return Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    console.log("Notification permission granted.");
                    new Notification("Task Tracker: Notifications Enabled!", {
                        body: "You will receive alerts for overdue tasks.",
                    });
                    return true;
                } else {
                    console.log("Notification permission denied by user.");
                    return false;
                }
            }).catch(err => {
                console.error("Error requesting permission:", err);
                return false;
            });
        }
        console.log("Notification permission was previously denied.");
        return Promise.resolve(false);
    }

    function sendOverdueTaskNotification(task) {
        if ("Notification" in window && Notification.permission === "granted") {
            const notification = new Notification("Task Overdue!", {
                body: `Task: "${task.text}" was due on ${formatDateTime(task.dueAt)}.`,
            });
            notification.onclick = () => { window.focus(); };
        }
    }

    function checkOverdueTasksAndNotify() {
        const now = Date.now();
        let aTaskWasNotified = false;
        tasks.forEach(task => {
            if (!task.completed && task.dueAt && now > task.dueAt && !task.notifiedOverdue) {
                sendOverdueTaskNotification(task);
                task.notifiedOverdue = true;
                aTaskWasNotified = true;
            }
        });
        if (aTaskWasNotified) saveTasks();
    }

    // --- Chart Function ---
    function updateTaskStatusChart() {
        if (!taskStatusChartCanvas) return;
        const completedCount = tasks.filter(task => task.completed).length;
        const pendingCount = tasks.length - completedCount;
        if (taskStatusChartInstance) {
            taskStatusChartInstance.data.labels = ['Completed', 'Pending'];
            taskStatusChartInstance.data.datasets[0].data = [completedCount, pendingCount];
            taskStatusChartInstance.update();
        } else {
            const ctx = taskStatusChartCanvas.getContext('2d');
            taskStatusChartInstance = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Completed', 'Pending'],
                    datasets: [{
                        label: 'Task Status',
                        data: [completedCount, pendingCount],
                        backgroundColor: ['#cfe8fc', 'rgba(255, 159, 64, 0.7)'],
                        borderColor: ['#a9d5f7', 'rgba(255, 159, 64, 1)'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'top', }, title: { display: true, text: 'Overall Task Status' } }
                }
            });
        }
    }

    // --- Core Functions ---
    function updateArchiveButtonVisibility() {
        if (currentFilterDate) {
            const filterDayStart = currentFilterDate.getTime();
            if (tasks.some(t => normalizeDate(new Date(t.createdAt)).getTime() === filterDayStart)) {
                archiveDayBtn.style.display = 'inline-block';
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
            tasksToDisplay = tasksToDisplay.filter(task => normalizeDate(new Date(task.createdAt)).getTime() === filterDayStart);
        }
        if (currentSearchTerm) {
            tasksToDisplay = tasksToDisplay.filter(task =>
                task.text.toLowerCase().includes(currentSearchTerm) ||
                (task.assignedTo && task.assignedTo.toLowerCase().includes(currentSearchTerm))
            );
        }
        const pendingTasks = tasksToDisplay.filter(t=>!t.completed).sort((a,b)=>(a.dueAt||Infinity)-(b.dueAt||Infinity)||(b.points||0)-(a.points||0));
        const completedTasks = tasksToDisplay.filter(t=>t.completed).sort((a,b)=>(a.completedAt||0)-(b.completedAt||0));
        const sortedTasksToDisplay = [...pendingTasks, ...completedTasks];

        if (sortedTasksToDisplay.length === 0) {
            let msg="No tasks. Add some!";
            const globalTasks=tasks.length > 0;
            if(currentSearchTerm){msg=`No tasks match: "${searchInputEl.value.trim()}"`; if(currentFilterDate)msg+=` for ${formatDateTime(currentFilterDate,false)}`; msg+=`. <button id="clearSearchBtnSmall" class="control-btn">Clear Search</button>`; if(currentFilterDate&&globalTasks)msg+=` or <button id="clearDateFilterBtnSmallForSearch" class="control-btn">Show All Dates for this Search</button>`}
            else if(currentFilterDate){msg=`No tasks for ${formatDateTime(currentFilterDate,false)}.`; if(globalTasks)msg+=` <button id="clearDateFilterBtnSmall" class="control-btn">Show All Tasks</button>`}
            else if(!globalTasks)msg="No tasks yet. Add your first!";
            taskListEl.innerHTML=`<p style="text-align:center;color:#757575;">${msg}</p>`;
            const clearDateSmall=document.getElementById('clearDateFilterBtnSmall'); if(clearDateSmall)clearDateSmall.onclick=()=>{currentFilterDate=null;dateFilterEl.valueAsDate=getTomorrowNormalized();renderTasks()};
            const clearDateSearchSmall=document.getElementById('clearDateFilterBtnSmallForSearch'); if(clearDateSearchSmall)clearDateSearchSmall.onclick=()=>{currentFilterDate=null;dateFilterEl.valueAsDate=getTomorrowNormalized();renderTasks()};
            const clearSearchSmall=document.getElementById('clearSearchBtnSmall'); if(clearSearchSmall)clearSearchSmall.onclick=()=>{searchInputEl.value='';renderTasks()};
        }

        sortedTasksToDisplay.forEach(task => {
            const li=document.createElement('li');li.classList.add('task-item');li.dataset.id=task.id;
            if(task.completed)li.classList.add('completed'); if(task.dueAt&&!task.completed&&now>task.dueAt)li.classList.add('overdue');
            const wrap=document.createElement('div');wrap.classList.add('task-item-content-wrapper');
            const main=document.createElement('div');main.classList.add('task-item-main-content');
            const chk=document.createElement('input');chk.type='checkbox';chk.checked=task.completed;chk.onchange=()=>toggleTaskComplete(task.id);
            const details=document.createElement('div');details.classList.add('task-details');
            const mainInfo=document.createElement('div');mainInfo.classList.add('task-main-info');
            const txt=document.createElement('span');txt.classList.add('task-text');txt.textContent=task.text;
            const pts=document.createElement('span');pts.classList.add('task-points');pts.textContent=`Pts: ${task.points}`;
            mainInfo.append(txt,pts);details.append(mainInfo);
            if(task.dueAt){const dueDiv=document.createElement('div');dueDiv.classList.add('task-due-time');dueDiv.textContent=`Due: ${formatTime(task.dueAt)}`;if(task.completed){dueDiv.style.textDecoration='line-through';dueDiv.style.color='#01579b'}else if(now>task.dueAt){dueDiv.textContent+=' (Overdue)';dueDiv.style.color='#c62828'}details.append(dueDiv)}
            if(task.assignedTo){const meta=document.createElement('div');meta.classList.add('task-meta-info');meta.innerHTML=`Assigned: <strong>${task.assignedTo}</strong>`;details.append(meta)}
            const stamps=document.createElement('span');stamps.classList.add('task-timestamps');let tsTxt=`For: ${formatDateTime(task.createdAt,false)||'N/A'}`;if(task.completed&&task.completedAt)tsTxt+=` | Completed: ${formatDateTime(task.completedAt)}`;stamps.textContent=tsTxt;details.append(stamps);
            main.append(chk,details);wrap.append(main);
            const actions=document.createElement('div');actions.classList.add('task-actions');
            if(!task.completed){const editBtn=document.createElement('button');editBtn.textContent='Edit';editBtn.classList.add('edit-btn');editBtn.onclick=()=>showEditForm(task.id,li);actions.append(editBtn);const moveBtn=document.createElement('button');moveBtn.textContent='Move';moveBtn.classList.add('move-task-btn');moveBtn.onclick=(e)=>showMoveTaskControls(e.target,task.id);actions.append(moveBtn)}
            const delBtn=document.createElement('button');delBtn.textContent='Delete';delBtn.classList.add('delete-btn');delBtn.onclick=()=>deleteTask(task.id);actions.append(delBtn);
            wrap.append(actions);li.append(wrap);taskListEl.append(li);
        });
        updateAllStats(); updateTaskStatusChart(); updateArchiveButtonVisibility(); saveTasks();
    }

    function addTask(text,points,taskDayTimestamp,dueTimeStr,assignedTo=null){
        const taskText=text.trim(); const taskPointsNum=parseInt(points);
        if(taskText===''){MessageService.error('Description cannot be empty.');return false}
        if(isNaN(taskPointsNum)||taskPointsNum<=0){MessageService.error('Points must be a number greater than 0.');return false}
        let dueAtTimestamp=null; if(dueTimeStr){const[h,m]=dueTimeStr.split(':').map(Number);const d=new Date(taskDayTimestamp);d.setHours(h,m,0,0);dueAtTimestamp=d.getTime()}
        const newTask={id:Date.now()+Math.random(),text:taskText,points:taskPointsNum,completed:false,createdAt:taskDayTimestamp,dueAt:dueAtTimestamp,completedAt:null,assignedTo:assignedTo?assignedTo.trim():null,notifiedOverdue:false};
        tasks.push(newTask);markUnsavedChanges();return true
    }
    function handleAddTaskFromInput(){
        const due=taskDueTimeEl.value;let day;
        if(taskForDateEl.value){
            day=normalizeDate(taskForDateEl.value).getTime()
        } else {
            day=getTomorrowNormalized().getTime();
            taskForDateEl.valueAsDate=getTomorrowNormalized();
        }
        if(addTask(taskTextEl.value,taskPointsEl.value,day,due,assignToEl.value)){taskTextEl.value='';taskPointsEl.value='1';assignToEl.value='';renderTasks();checkOverdueTasksAndNotify()}
    }
    function toggleTaskComplete(id){const t=tasks.find(x=>x.id===id);if(t){t.completed=!t.completed;if(t.completed){t.completedAt=Date.now();updateMotivationalQuote()}else{t.completedAt=null;t.notifiedOverdue=false}markUnsavedChanges()}renderTasks()}
    function deleteTask(id){tasks=tasks.filter(t=>t.id!==id);markUnsavedChanges();renderTasks()}
    function showEditForm(id,li){const t=tasks.find(x=>x.id===id);if(!t)return;const wrap=li.querySelector('.task-item-content-wrapper');if(wrap)wrap.style.display='none';const oldForm=li.querySelector('.task-item-edit-form');if(oldForm)oldForm.remove();const form=document.createElement('div');form.classList.add('task-item-edit-form');const txt=document.createElement('input');txt.type='text';txt.value=t.text;const pts=document.createElement('input');pts.type='number';pts.value=t.points;pts.min="1";const assign=document.createElement('input');assign.type='text';assign.value=t.assignedTo||'';assign.placeholder="Assign (optional)";const dateFor=document.createElement('input');dateFor.type='date';dateFor.valueAsDate=new Date(t.createdAt);const dueTime=document.createElement('input');dueTime.type='time';if(t.dueAt){const d=new Date(t.dueAt);dueTime.value=`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`}const ctrls=document.createElement('div');ctrls.classList.add('edit-controls');const saveBtn=document.createElement('button');saveBtn.textContent='Save';saveBtn.onclick=()=>handleSaveEdit(id,txt.value,pts.value,assign.value,dateFor.value,dueTime.value);const cancelBtn=document.createElement('button');cancelBtn.textContent='Cancel';cancelBtn.classList.add('cancel-edit-btn');cancelBtn.onclick=()=>{form.remove();if(wrap)wrap.style.display='flex'};form.append(document.createTextNode("Description:"),txt,document.createTextNode("Points:"),pts,document.createTextNode("Assign To:"),assign,document.createTextNode("Task for Date:"),dateFor,document.createTextNode("Due Time:"),dueTime);ctrls.append(saveBtn,cancelBtn);form.append(ctrls);li.append(form)}
    function handleSaveEdit(id,newTxt,newPtsStr,newAssign,newDateForStr,newDueTimeStr){const t=tasks.find(x=>x.id===id);if(!t)return;const newPts=parseInt(newPtsStr);
        if(newTxt.trim()===''){MessageService.error("Description cannot be empty");return}
        if(isNaN(newPts)||newPts<=0){MessageService.error("Invalid points value");return}
        t.text=newTxt.trim();t.points=newPts;t.assignedTo=newAssign.trim()||null;
        const newDateFor=normalizeDate(newDateForStr);
        if(!newDateFor){MessageService.error("Invalid date for task");return}
        t.createdAt=newDateFor.getTime();
        if(newDueTimeStr){const[h,m]=newDueTimeStr.split(':').map(Number);const d=new Date(t.createdAt);d.setHours(h,m,0,0);t.dueAt=d.getTime()}else t.dueAt=null;
        t.notifiedOverdue=false;markUnsavedChanges();saveTasks();renderTasks();checkOverdueTasksAndNotify()
    }
    function updateMotivationalQuote(){const q=motivationalQuotes[Math.floor(Math.random()*motivationalQuotes.length)];const m=q.match(/^(".*?")(\s*-\s*.*)?$/);motivationalQuoteEl.innerHTML=m?`<strong>${m[1]}</strong>${m[2]||""}`:`<strong>${q}</strong>`}
    function updateAllStats(){const comp=tasks.filter(t=>t.completed);const pend=tasks.length-comp.length;const compPts=comp.reduce((s,t)=>s+(t.points||0),0);const allPts=tasks.reduce((s,t)=>s+(t.points||0),0);scoreCardEl.textContent=allPts>0?`${compPts}/${allPts} Pts`:`0/0 Pts`;pendingTasksCountEl.textContent=pend;resultPointsEl.textContent=compPts}
    function showMoveTaskControls(btn,id){const li=btn.closest('li');if(li.querySelector('.task-item-edit-form')){MessageService.info("Please save or cancel the current edit first.");return}const old=btn.parentElement.querySelector('.move-task-controls');if(old)old.remove();btn.style.display='none';const div=document.createElement('div');div.classList.add('move-task-controls');const dateIn=document.createElement('input');dateIn.type='date';const t=tasks.find(x=>x.id===id);dateIn.valueAsDate=t.createdAt?new Date(t.createdAt):new Date();const save=document.createElement('button');save.textContent='Save';save.onclick=()=>{if(dateIn.value){const[y,m,d]=dateIn.value.split('-').map(Number);moveTaskToDate(id,new Date(y,m-1,d).getTime())}div.remove();btn.style.display='block'};const cancel=document.createElement('button');cancel.textContent='Cancel';cancel.style.backgroundColor='#aaa';cancel.onclick=()=>{div.remove();btn.style.display='block'};div.append(dateIn,save,cancel);btn.insertAdjacentElement('afterend',div)}
    function moveTaskToDate(id,newDayStart){const t=tasks.find(x=>x.id===id);if(t){t.createdAt=newDayStart;if(t.dueAt){const old=new Date(t.dueAt);const h=old.getHours();const m=old.getMinutes();const newDue=new Date(newDayStart);newDue.setHours(h,m,0,0);t.dueAt=newDue.getTime()}t.notifiedOverdue=false;markUnsavedChanges();renderTasks();checkOverdueTasksAndNotify()}}

    async function generatePDFReport() {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            doc.setFont("helvetica", "normal");
            const todayNormalizedTime = getTodayNormalized().getTime();
            const reportDateStr = formatDateTime(todayNormalizedTime, false);
            const pageHeight = doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.getWidth();
            let yPos = 15;

            doc.setFontSize(18); doc.text(`Task Report for ${userName} - ${reportDateStr}`, pageWidth/2, yPos, {align:'center'}); yPos+=7;
            doc.setFontSize(10); doc.setTextColor(100); doc.text(`Generated on: ${formatDateTime(Date.now(), true)}`, pageWidth/2, yPos, {align:'center'}); yPos+=8;
            const compPts=tasks.filter(t=>t.completed).reduce((s,t)=>s+(t.points||0),0); const allPts=tasks.reduce((s,t)=>s+(t.points||0),0);
            doc.setFontSize(12); doc.text(`Overall Score: ${compPts}/${allPts} Pts`, 14, yPos); yPos+=10;

            const tasksToday=tasks.filter(t=>normalizeDate(new Date(t.createdAt)).getTime()===todayNormalizedTime);
            const compTodayCount=tasksToday.filter(t=>t.completed).length; const pendTodayCount=tasksToday.length-compTodayCount;
            if(tasksToday.length>0&&(compTodayCount>0||pendTodayCount>0)){
                const chartCanvas=document.createElement('canvas');chartCanvas.width=300;chartCanvas.height=150;
                new Chart(chartCanvas.getContext('2d'),{type:'pie',data:{labels:['Completed Today','Pending Today'],datasets:[{data:[compTodayCount,pendTodayCount],backgroundColor:['#cfe8fc','rgba(255,159,64,0.7)'],borderColor:['#a9d5f7','rgba(255,159,64,1)']}]},options:{animation:{duration:0},responsive:false,plugins:{legend:{display:true,position:'right'},title:{display:true,text:"Today's Task Status"}}}});
                await new Promise(r=>setTimeout(r,300)); const img=chartCanvas.toDataURL('image/png'); doc.addImage(img,'PNG',14,yPos,70,35); yPos+=45;
            }
            
            const addFooters=(docInst)=>{const totalP=docInst.internal.getNumberOfPages();for(let i=1;i<=totalP;i++){docInst.setPage(i);docInst.setFont("helvetica","italic");docInst.setFontSize(8);docInst.setTextColor(150);docInst.text(reportFooterQuotes[Math.floor(Math.random()*reportFooterQuotes.length)],pageWidth/2,pageHeight-7,{align:'center'});docInst.setFont("helvetica","normal");docInst.text(`Page ${i}/${totalP}`,pageWidth-20,pageHeight-7)}};
            const tblOpts={startY:yPos,theme:'striped',margin:{left:14,right:14},styles:{font:"helvetica"}};

            if(compTodayCount>0){if(yPos>pageHeight-40){doc.addPage();yPos=20}doc.setFontSize(14);doc.text("Completed Tasks Today",14,yPos);yPos+=6;tblOpts.startY=yPos;tblOpts.headStyles={fillColor:[144,202,249]};doc.autoTable({...tblOpts,head:[['Task','Pts','Assigned','Due','Completed At']],body:tasksToday.filter(t=>t.completed).map(t=>[t.text,t.points,t.assignedTo||'N/A',formatTime(t.dueAt,true),formatDateTime(t.completedAt,true,true)])});yPos=doc.lastAutoTable.finalY+7}
            else{doc.setFontSize(12);doc.text("No tasks completed today.",14,yPos);yPos+=7}

            if(pendTodayCount>0){if(yPos>pageHeight-40){doc.addPage();yPos=20}doc.setFontSize(14);doc.text("Pending Tasks for Today",14,yPos);yPos+=6;tblOpts.startY=yPos;tblOpts.headStyles={fillColor:[255,183,77]};doc.autoTable({...tblOpts,head:[['Task','Pts','Assigned','Due','Status']],body:tasksToday.filter(t=>!t.completed).map(t=>[t.text,t.points,t.assignedTo||'N/A',formatTime(t.dueAt,true),(t.dueAt&&Date.now()>t.dueAt)?'Overdue':'-'])});yPos=doc.lastAutoTable.finalY+7}
            else{if(yPos>pageHeight-30&&compTodayCount>0){doc.addPage();yPos=20}doc.setFontSize(12);doc.text("No pending tasks today.",14,yPos);yPos+=7}

            const prevPend=tasks.filter(t=>!t.completed&&normalizeDate(new Date(t.createdAt)).getTime()<todayNormalizedTime);
            if(prevPend.length>0){if(yPos>pageHeight-40){doc.addPage();yPos=20}doc.setFontSize(14);doc.text("Pending Tasks from Previous Days",14,yPos);yPos+=6;tblOpts.startY=yPos;tblOpts.headStyles={fillColor:[230,126,34]};doc.autoTable({...tblOpts,head:[['Task','Pts','Assigned','Task For','Due','Status']],body:prevPend.map(t=>[t.text,t.points,t.assignedTo||'N/A',formatDateTime(t.createdAt,false,true),formatTime(t.dueAt,true),(t.dueAt&&Date.now()>t.dueAt)?'Overdue':'-'])});yPos=doc.lastAutoTable.finalY+7}
            else{if(yPos>pageHeight-30){doc.addPage();yPos=20}doc.setFontSize(12);doc.text("No pending tasks from previous days.",14,yPos)}
            
            addFooters(doc);
            doc.save(`task_report_${userName.replace(/\s/g,'_')}_${reportDateStr.replace(/\s|,/g,'_')}.pdf`);
            MessageService.success("PDF Report download started.");
        }catch(err){console.error("PDF Error:",err);MessageService.error("PDF generation failed. Please check the console for errors.")}
    }

    // --- File Operations ---
    function handleExcelImport(event){
        const f=event.target.files[0];
        if(!f)return;
        const r=new FileReader();
        r.onload=e=>{
            try{
                const data=new Uint8Array(e.target.result);
                const wb=XLSX.read(data,{type:'array',cellDates:true});
                const ws=wb.Sheets[wb.SheetNames[0]];
                const json=XLSX.utils.sheet_to_json(ws,{header:1,raw:false});
                let added=0;
                for(let i=1;i<json.length;i++){
                    const row=json[i];
                    if(!row||!row[0])continue;
                    const txt=String(row[0]).trim();
                    const pts=parseInt(row[1])||1;
                    const cell=row[2]; // Date and Time cell
                    let dayTimestamp, dueTimeStr="17:00"; // Default due time

                    if(cell){ // If there's a value in the date/time cell
                        let parsedDate;
                        if(cell instanceof Date && !isNaN(cell.getTime())){
                            parsedDate=cell;
                        } else if(typeof cell === 'string'){
                            parsedDate=new Date(cell);
                            if(isNaN(parsedDate.getTime())){ // If full string parsing fails, try just date part
                                parsedDate=normalizeDate(cell.split(' ')[0]);
                                if(!parsedDate) parsedDate = getTodayNormalized(); // Fallback if even date part fails
                            }
                        } else if(typeof cell === 'number'){ // Excel serial date
                            const serialDate = XLSX.SSF.parse_date_code(cell);
                            parsedDate = serialDate ? new Date(serialDate.y, serialDate.m-1, serialDate.d, serialDate.H||0, serialDate.M||0, serialDate.S||0) : getTodayNormalized();
                        } else { // Fallback if cell type is unexpected
                            parsedDate = getTodayNormalized();
                        }
                        dayTimestamp = normalizeDate(parsedDate).getTime();
                        // Check if time was part of the parsed date
                        if (parsedDate.getHours() !== 0 || parsedDate.getMinutes() !== 0 || parsedDate.getSeconds() !== 0) {
                            dueTimeStr = `${String(parsedDate.getHours()).padStart(2,'0')}:${String(parsedDate.getMinutes()).padStart(2,'0')}`;
                        }
                    } else { // If date/time cell is empty, default to TODAY
                        dayTimestamp = getTodayNormalized().getTime();
                        // dueTimeStr remains "17:00"
                    }

                    if(txt && addTask(txt,pts,dayTimestamp,dueTimeStr))added++;
                }
                if(added>0){
                    renderTasks();
                    MessageService.success(`${added} tasks imported from Excel.`);
                } else {
                    MessageService.info("No valid tasks found in the Excel file.");
                }
                markUnsavedChanges();
            } catch(err) {
                MessageService.error("Excel import error: "+err.message);
                console.error(err);
            } finally {
                excelImportEl.value='';
            }
        };
        r.onerror=()=>{MessageService.error("Failed to read Excel file.")};
        r.readAsArrayBuffer(f);
    }
    function saveLog(){if(tasks.length===0){MessageService.info("No tasks to save.");return}const data=JSON.stringify(tasks,null,2);const blob=new Blob([data],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`task_tracker_log_${new Date().toISOString().slice(0,10)}.json`;document.body.append(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);MessageService.success("Log saved successfully.");markChangesSaved()}
    function importLog(event){const f=event.target.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{try{const imp=JSON.parse(e.target.result);if(Array.isArray(imp)){const valid=imp.every(t=>typeof t.id!=='undefined'&&typeof t.text==='string');if(valid){tasks=imp.map(t=>({...t,createdAt:new Date(t.createdAt).getTime(),dueAt:t.dueAt?new Date(t.dueAt).getTime():null,completedAt:t.completedAt?new Date(t.completedAt).getTime():null,notifiedOverdue:t.notifiedOverdue||false}));
        // currentFilterDate=null; // Keep current filter or reset based on preference
        dateFilterEl.valueAsDate=getTomorrowNormalized(); // Or getTodayNormalized() if preferred
        searchInputEl.value='';
        renderTasks();
        MessageService.success("Log imported successfully.");
        markChangesSaved()
    }else MessageService.error("Invalid log file format.")}else MessageService.error("Invalid log file content.")}catch(err){MessageService.error("Error parsing log file: "+err.message)}finally{importLogEl.value=''}};r.onerror=()=>{MessageService.error("Failed to read log file.")};r.readAsText(f)}
    function downloadExcelTemplate(){const h=["Task Description","Points","Target Date & Due Time (Format: YYYY-MM-DD HH:MM or YYYY-MM-DD for default 5 PM or leave blank for Today 5 PM)"];const today=new Date().toISOString().slice(0,10);const data=[h,["Example: Review monthly report",10,`${today} 14:30`],["Example: Prepare presentation slides",5,today],["Example: Call Client X (Today default time)",3,""],["Example: Team Meeting (default time)",2,""]];const ws=XLSX.utils.aoa_to_sheet(data);ws['!cols']=[{wch:40},{wch:10},{wch:60}];const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"TaskImportTemplate");XLSX.writeFile(wb,"Task_Import_Template.xlsx");MessageService.info("Excel template download started.")}
    function archiveSelectedDay(){
        if(!currentFilterDate){MessageService.info("Please select a date to archive tasks for.");return}
        const dayStart=currentFilterDate.getTime();
        const toArchive=tasks.filter(t=>normalizeDate(new Date(t.createdAt)).getTime()===dayStart);
        if(toArchive.length===0){MessageService.info(`No tasks found for ${formatDateTime(currentFilterDate,false)} to archive.`);return}
        if(!MessageService.confirm(`Are you sure you want to archive ${toArchive.length} tasks for ${formatDateTime(currentFilterDate,false)}? These tasks will be removed from the current list.`))return;
        try{const data=JSON.stringify(toArchive,null,2);const blob=new Blob([data],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');const fname=`tasks_archive_${new Date(currentFilterDate).toISOString().slice(0,10)}.json`;a.download=fname;a.href=url;document.body.append(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);tasks=tasks.filter(t=>!toArchive.find(x=>x.id===t.id));markUnsavedChanges();saveTasks();renderTasks();MessageService.success(`${toArchive.length} tasks archived successfully to ${fname}`)}catch(err){MessageService.error("Archive error: "+err.message);console.error(err)}
    }
    function handleRestoreArchive(event){const f=event.target.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{try{const imp=JSON.parse(e.target.result);if(!Array.isArray(imp)){MessageService.error("Invalid archive file format.");return}let rest=0,skip=0;const ids=new Set(tasks.map(t=>t.id));imp.forEach(t=>{if(typeof t.id==='undefined'||typeof t.text!=='string'){skip++;return}if(ids.has(t.id))skip++;else{tasks.push({...t,createdAt:new Date(t.createdAt).getTime(),dueAt:t.dueAt?new Date(t.dueAt).getTime():null,completedAt:t.completedAt?new Date(t.completedAt).getTime():null,notifiedOverdue:t.notifiedOverdue||false});ids.add(t.id);rest++}});if(rest>0){markUnsavedChanges();saveTasks();renderTasks()}MessageService.success(`${rest} tasks restored. ${skip>0?`${skip} tasks were skipped (duplicates or invalid).`:''}`)}catch(err){MessageService.error("Error parsing archive file: "+err.message);console.error(err)}finally{importArchivedDayEl.value=''}};r.onerror=()=>{MessageService.error("Failed to read archive file.")};r.readAsText(f)}

    // --- Event Listeners ---
    addTaskBtn.addEventListener('click', handleAddTaskFromInput);
    document.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.altKey) && e.key.toLowerCase() === 'a') { e.preventDefault(); taskTextEl.focus(); } });
    taskTextEl.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleAddTaskFromInput(); });
    excelImportEl.addEventListener('change', handleExcelImport);
    saveLogBtn.addEventListener('click', saveLog);
    importLogEl.addEventListener('change', importLog);
    searchInputEl.addEventListener('input', renderTasks);
    downloadTemplateBtn.addEventListener('click', downloadExcelTemplate);
    archiveDayBtn.addEventListener('click', archiveSelectedDay);
    importArchivedDayEl.addEventListener('change', handleRestoreArchive);
    generateReportBtn.addEventListener('click', generatePDFReport);
    dateFilterEl.addEventListener('change', (e)=>{currentFilterDate=e.target.value?normalizeDate(e.target.value):null;renderTasks()});
    showAllTasksBtn.addEventListener('click',()=>{
        currentFilterDate=null;
        dateFilterEl.valueAsDate=getTomorrowNormalized();
        searchInputEl.value='';
        renderTasks()
    });
    window.addEventListener('beforeunload',e=>{if(hasUnsavedChanges){e.preventDefault();e.returnValue=''}});

    // --- Initial Setup ---
    function initializeApp() {
        const name = prompt("Welcome! Please enter your name for reports:", userName);
        if (name !== null && name.trim() !== "") userName = name.trim();

        const today = getTodayNormalized();
        const tomorrow = getTomorrowNormalized();

        taskForDateEl.valueAsDate = tomorrow;
        dateFilterEl.valueAsDate = tomorrow; // Visually defaults to tomorrow
        currentFilterDate = today;          // But initially shows tasks for today

        tasks.forEach(t=>{t.createdAt=new Date(t.createdAt).getTime();t.dueAt=t.dueAt?new Date(t.dueAt).getTime():null;if(t.completedAt)t.completedAt=new Date(t.completedAt).getTime();delete t.followUpDate;delete t.marked;t.notifiedOverdue=t.notifiedOverdue||false});
        updateMotivationalQuote(); renderTasks(); markChangesSaved();
        checkAndRequestNotificationPermission().then(granted=>{if(granted){console.log("Notification check interval set.");if(notificationInterval)clearInterval(notificationInterval);notificationInterval=setInterval(checkOverdueTasksAndNotify,60000);checkOverdueTasksAndNotify()}else console.log("Notifications disabled or permission denied.")}).catch(err=>console.error("Notification permission error:",err));
    }
    initializeApp();
});
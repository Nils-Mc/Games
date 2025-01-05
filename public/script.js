document.addEventListener('DOMContentLoaded', () => {
    const scheduleList = document.getElementById('scheduleList');
    const livetickerMessage = document.getElementById('livetickerMessage');
    const loginForm = document.getElementById('loginForm');
    const activityForm = document.getElementById('activityForm');
    const adminSection = document.getElementById('adminSection');
    const loginSection = document.getElementById('loginSection');

    async function loadSchedule() {
        const response = await fetch('/schedule');
        const data = await response.json();
        scheduleList.innerHTML = '';
        data.forEach(event => {
            const li = document.createElement('li');
            li.textContent = `${event.day}: ${event.activity} (${event.startTime} - ${event.endTime})`;
            if (adminSection.style.display !== 'none') {
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Löschen';
                deleteButton.onclick = async () => {
                    await fetch(`/schedule/${event.id}`, { method: 'DELETE' });
                    loadSchedule();
                };
                li.appendChild(deleteButton);
            }
            scheduleList.appendChild(li);
        });
    }

    async function updateLiveticker() {
        const response = await fetch('/liveticker');
        const data = await response.json();
        livetickerMessage.textContent = data.liveticker;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();
        if (result.success) {
            loginSection.style.display = 'none';
            adminSection.style.display = 'block';
            loadSchedule();
        } else {
            alert(result.message);
        }
    });

    activityForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const day = document.getElementById('day').value;
        const activity = document.getElementById('activity').value;
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;

        const response = await fetch('/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ day, activity, startTime, endTime })
        });

        const result = await response.json();
        if (result.success) {
            loadSchedule();
        } else {
            alert(result.message);
        }
    });

    // Initial laden
    loadSchedule();
    updateLiveticker();
    setInterval(updateLiveticker, 30000);
});
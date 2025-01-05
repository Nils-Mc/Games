const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Datenbank-Dateien
const USERS_FILE = path.join(__dirname, 'users.json');

// Hilfsfunktionen
function saveData(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function loadData(file) {
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file));
}

// Benutzer- und Event-Daten
let users = loadData(USERS_FILE);
let schedule = [
    { id: 1, day: "Tag 1", activity: "Begrüßung und Networking", startTime: "09:00", endTime: "10:00" },
    { id: 2, day: "Tag 1", activity: "Workshop 1", startTime: "10:15", endTime: "11:15" },
    { id: 3, day: "Tag 1", activity: "Mittagspause", startTime: "12:00", endTime: "13:00" },
    { id: 4, day: "Tag 1", activity: "Abschlussrede", startTime: "14:00", endTime: "15:00" }
];

let adminLoggedIn = false;

// Routen
app.get('/schedule', (req, res) => res.json(schedule));

app.get('/liveticker', (req, res) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();

    const currentActivity = schedule.find(event => {
        const [startHour, startMinutes] = event.startTime.split(':').map(Number);
        const [endHour, endMinutes] = event.endTime.split(':').map(Number);
        const start = startHour * 60 + startMinutes;
        const end = endHour * 60 + endMinutes;
        const nowMinutes = currentHour * 60 + currentMinutes;
        return nowMinutes >= start && nowMinutes <= end;
    });

    if (currentActivity) {
        res.json({ liveticker: `Aktuelle Aktivität: ${currentActivity.activity} (${currentActivity.day})` });
    } else {
        res.json({ liveticker: "Keine aktuelle Aktivität. Bitte warten Sie auf den nächsten Punkt!" });
    }
});

app.post('/schedule', (req, res) => {
    if (!adminLoggedIn) return res.status(403).json({ success: false, message: "Nicht autorisiert!" });
    const { day, activity, startTime, endTime } = req.body;
    if (day && activity && startTime && endTime) {
        const newEvent = { id: Date.now(), day, activity, startTime, endTime };
        schedule.push(newEvent);
        return res.json({ success: true, schedule });
    }
    res.status(400).json({ success: false, message: "Bitte alle Felder ausfüllen!" });
});

app.delete('/schedule/:id', (req, res) => {
    if (!adminLoggedIn) return res.status(403).json({ success: false, message: "Nicht autorisiert!" });
    const id = parseInt(req.params.id, 10);
    schedule = schedule.filter(event => event.id !== id);
    res.json({ success: true, schedule });
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Benutzername und Passwort erforderlich!" });
    }
    const userExists = users.some(user => user.username === username);
    if (userExists) {
        return res.status(400).json({ success: false, message: "Benutzername bereits vergeben!" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword });
    saveData(USERS_FILE, users);
    res.json({ success: true, message: "Benutzer registriert!" });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username);
    if (!user) {
        return res.status(400).json({ success: false, message: "Benutzername oder Passwort falsch!" });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.status(400).json({ success: false, message: "Benutzername oder Passwort falsch!" });
    }
    adminLoggedIn = true;
    res.json({ success: true, message: "Login erfolgreich!" });
});

app.post('/logout', (req, res) => {
    adminLoggedIn = false;
    res.json({ success: true, message: "Logout erfolgreich!" });
});

// Server starten
app.listen(port, () => console.log(`Server läuft auf http://localhost:${port}`));
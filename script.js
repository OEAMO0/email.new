let account = null;
let token = null;
let emailHistory = [];

async function createAccount() {
    document.getElementById('email').innerText = 'Creating email...';
    document.getElementById('messageList').innerText = 'No messages yet.';
    try {
        const domainRes = await fetch('https://api.mail.tm/domains');
        const domainData = await domainRes.json();
        const domain = domainData['hydra:member'][0].domain;
        const address = `${Math.random().toString(36).substring(2, 10)}@${domain}`;
        const password = 'Password123!';

        const registerRes = await fetch('https://api.mail.tm/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, password })
        });

        if (registerRes.ok) {
            account = { address, password };
            document.getElementById('email').innerText = address;
            emailHistory.push({ ...account });
            await login();
            fetchMessages();
        } else {
            document.getElementById('email').innerText = 'Failed to create email.';
        }
    } catch {
        document.getElementById('email').innerText = 'Error while creating email.';
    }
}

async function login() {
    const loginRes = await fetch('https://api.mail.tm/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: account.address, password: account.password })
    });
    const loginData = await loginRes.json();
    token = loginData.token;
}

async function fetchMessages() {
    if (!token) return;
    try {
        const res = await fetch('https://api.mail.tm/messages', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const container = document.getElementById('messageList');
        container.innerHTML = '';

        if (!data['hydra:member'].length) {
            container.innerText = 'No messages yet.';
            return;
        }

        for (const msg of data['hydra:member']) {
            const fullRes = await fetch(`https://api.mail.tm/messages/${msg.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const full = await fullRes.json();

            const div = document.createElement('div');
            div.className = 'message';
            div.innerHTML = `
                <strong>From:</strong> ${full.from?.address || 'Unknown'}<br>
                <strong>Subject:</strong> ${full.subject}<br><br>
                <details>
                    <summary>Show message</summary>
                    <div class="message-body">${full.html || full.text || 'No content'}</div>
                </details>
            `;
            container.appendChild(div);
        }
    } catch (e) {
        console.error(e);
    }
}

function copyEmail() {
    const text = document.getElementById('email').innerText;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Email copied!');
    });
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.className = 'toast show';
    setTimeout(() => toast.className = 'toast', 2000);
}

function showSavedEmails() {
    const modal = document.getElementById('savedEmailsModal');
    const list = document.getElementById('savedEmailsList');
    list.innerHTML = '';

    emailHistory.forEach((acc, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <code>${acc.address}</code>
            <button onclick="switchToEmail(${index})">Return</button>
            <button onclick="copySavedEmail('${acc.address}')">📋</button>
        `;
        list.appendChild(li);
    });

    modal.style.display = 'block';
}

function closeSavedEmails() {
    document.getElementById('savedEmailsModal').style.display = 'none';
}

async function switchToEmail(index) {
    account = emailHistory[index];
    document.getElementById('email').innerText = account.address;
    await login();
    fetchMessages();
    closeSavedEmails();
}

function copySavedEmail(email) {
    navigator.clipboard.writeText(email).then(() => {
        showToast('Saved email copied!');
    });
}

// Start
createAccount();

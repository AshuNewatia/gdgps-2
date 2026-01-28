let members = JSON.parse(localStorage.getItem('m_v7')) || [];
let expenses = JSON.parse(localStorage.getItem('e_v7')) || [];
let manualCache = {};

function toggleTheme() {
    const body = document.body;
    const t = body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
}
function addMember() {
    const name = document.getElementById('nameInput').value;
    if (name === "") {
        alert("Name cannot be empty!");
    } else if (members.includes(name)) {
        alert("Member already exists!");
    } else {
    members.push(name);
    document.getElementById('nameInput').value = '';
    render();
        }
    }
function Split() {
    const method = document.getElementById('splitMethod').value;
    document.getElementById('manualSplitArea').style.display = (method === 'unequal') ? 'block' : 'none';
    if(method === 'unequal') Manual();
    }

function Manual() {
    const container = document.getElementById('manualInputsContainer');
    const involved = Array.from(document.querySelectorAll('.mem-cb:checked')).map(cb => cb.value);
    container.innerHTML = involved.map(name => `
        <div class="manual-input-row">
            <span style="flex:1">${name}</span>
            <input type="number"
                   class="manual-amt"
                   data-name="${name}"
                   value="${manualCache[name] ?? ''}"
                   placeholder="0"
                   oninput="Allocation()">
        </div>
    `).join('');
    Allocation();
}
function Allocation() {
    manualCache = {};
    document.querySelectorAll('.manual-amt').forEach(i => {
        manualCache[i.dataset.name] = parseFloat(i.value) || 0;
    });
    const totalBill = parseFloat(document.getElementById('amtInput').value) || 0;
    let currentSum = Object.values(manualCache).reduce((a,b)=>a+b,0);
    const diff = totalBill - currentSum;
    document.getElementById('allocatedVal').innerText = `₹${currentSum.toFixed(2)}`;
    document.getElementById('diffVal').innerText = `₹${Math.abs(diff).toFixed(2)}`;
    const statusMsg = document.getElementById('statusMsg');   
    statusMsg.innerHTML = '<b style="color:var(--green)">✔ Matched</b>';
   
}
function addExpense() {
    const describe = document.getElementById('descInput').value;
    const Amt = parseFloat(document.getElementById('amtInput').value);
    const payer = document.getElementById('payerSelect').value;
    const method = document.getElementById('splitMethod').value;
    if (!describe || isNaN(Amt) || !payer) 
        return alert("Fill all details!");
    let shares = {};
    if (method === 'equal') {
        involved.forEach(m => shares[m] = Amt / involved.length);
        } else {
        let sum = 0;
        document.querySelectorAll('.manual-amt').forEach(i => {
            shares[i.dataset.name] = parseFloat(i.value) || 0;
            sum += shares[i.dataset.name];
            });

            if (sum !== Amt) 
                return alert("Manual split does not match total bill!");
        }
        expenses.push({ id: Date.now(), desc, amt: Amt, payer, shares, type: 'expense', timestamp: new Date().toLocaleString() });
        
        document.getElementById('descInput').value = '';
        document.getElementById('amtInput').value = '';
        document.getElementById('manualSplitArea').style.display = 'none';
        document.getElementById('splitMethod').value = 'equal';
        render();
    }

function settleDirect(debtor, creditor, amount) {
    let shares = {}; shares[creditor] = amount;
    expenses.push({ id: Date.now(), desc: `Settle: ${debtor} → ${creditor}`, amt: amount, payer: debtor, shares, type: 'settlement', timestamp: new Date().toLocaleString() });
    render();
    }

function resetAllData() {
    if (confirm("ARE YOU SURE? This will permanently erase all members, transaction history, and balances. This action cannot be undone.")) {
        localStorage.removeItem('m_v7');
        localStorage.removeItem('e_v7');
        members = [];
        expenses = [];
        render();
        alert("All data has been wiped.");
        }
    }

function render() {
    localStorage.setItem('m_v7', JSON.stringify(members));
    localStorage.setItem('e_v7', JSON.stringify(expenses));
    document.getElementById('memberList').innerHTML = members.map(m => `<span class="member-chip">${m}</span>`).join('');
    document.getElementById('payerSelect').innerHTML = `<option value="" disabled selected>Payer</option>` + members.map(m => `<option value="${m}">${m}</option>`).join('');
    document.getElementById('involvementList').innerHTML = members.map(m => `
            <label style="background:var(--bg); padding:4px 8px; border-radius:6px; font-size:0.75rem; border:1px solid var(--border); cursor:pointer">
            <input type="checkbox" class="mem-cb" value="${m}" checked onchange="syncManualInputs()"> ${m}
            </label>
        `).join('');
    let netBalances = {};
    let matrix = {};
    members.forEach(m => { netBalances[m] = 0; matrix[m] = {}; members.forEach(m2 => matrix[m][m2] = 0); });
    expenses.forEach(exp => {
    Object.keys(exp.shares).forEach(p => {
            netBalances[p] -= exp.shares[p];
            if (p !== exp.payer) matrix[p][exp.payer] += exp.shares[p];
            });
            netBalances[exp.payer] += exp.amt;
        });
        document.getElementById('balanceDisplay').innerHTML = members.map(m => `
            <div class="row"><span>${m}</span><b style="color:${netBalances[m]>=0?'var(--green)':'var(--red)'}">${netBalances[m]>=0?'+':''}₹${netBalances[m].toFixed(2)}</b></div>
        `).join('') || "No active members.";
        members.forEach(m1 => {
            members.forEach(m2 => {
                if (m1 !== m2) {
                    if (matrix[m1][m2] > matrix[m2][m1]) { matrix[m1][m2] -= matrix[m2][m1]; matrix[m2][m1] = 0; }
                    else { matrix[m2][m1] -= matrix[m1][m2]; matrix[m1][m2] = 0; }
                }
            });
        });
        let reportHtml = "";
        members.forEach(m => {
            let details = "";
            members.forEach(other => {
                if (matrix[m][other] > 0.1) details += `<div class="row" style="border:none; font-size:0.85rem"><span>Owes ${other}: <b>₹${matrix[m][other].toFixed(2)}</b></span><button onclick="settleDirect('${m}', '${other}', ${matrix[m][other]})" style="width:auto; padding:2px 8px; font-size:0.75rem; background:var(--green); margin:0">Settle</button></div>`;
            });
            if (details) reportHtml += `<div class="settle-block"><div style="font-weight:bold; color:var(--accent)">${m}</div>${details}</div>`;
        });
        document.getElementById('settlementReport').innerHTML = reportHtml || "All clear.";
        document.getElementById('historyDisplay').innerHTML = expenses.slice().reverse().map(e => `
            <div class="history-item">
                <button class="del-btn" onclick="deleteExpense(${e.id})">Delete</button>
                <span class="history-tag" style="background:${e.type==='settlement'?'#dcfce7':'#dbeafe'}; color:${e.type==='settlement'?'#166534':'#1e40af'}">${e.type}</span>
                <div style="font-weight:bold">${e.desc}</div>
                <div style="font-size:0.75rem; color:var(--sub)">Paid by ${e.payer} • ${e.timestamp}</div>
                <div style="margin-top:10px; font-size:0.8rem; color:var(--sub)">
                    ${Object.entries(e.shares).map(([n, v]) => `<span><b>${n}:</b> ₹${v.toFixed(2)}</span>`).join(' | ')}
                </div>
            </div>
        `).join('') || "History is empty.";
     if (document.getElementById('splitMethod').value === 'manual') {
        syncManualInputs();
    }
}

function deleteExpense(id) { expenses = expenses.filter(e => e.id !== id); render(); }
    if(localStorage.getItem('theme')) document.body.setAttribute('data-theme', localStorage.getItem('theme'));
    render();

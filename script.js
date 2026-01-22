let members = [];
let expenses = [];
try {
    members = JSON.parse(localStorage.getItem('members')) || [];
    expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    } catch (e) {
        members = [];
        expenses = [];
    }
function toggleTheme() {
        const body = document.body;
        const newTheme = body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }
function addMember() {
    const input = document.getElementById('nameInput');
    const name = input.value.trim();
    if (!name) {
        alert("Please enter a name.");
        return;
        }
  for(let i=0; i < members.length; i++) {
        if(members[i].toLowerCase() === name.toLowerCase()) {
            alert("This person is already in the group!");
            return;
            }
        }
  members.push(name);
    input.value = '';
    main();
    }
function addExpense() {
        const desc = document.getElementById('descInput').value;
        const amtValue = Number(document.getElementById('amtInput').value);
        const payer = document.getElementById('payerSelect').value;
    let involved = [];
    let checkboxes = document.getElementsByClassName('member-checkbox');
    for (let i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].checked) {
                involved.push(checkboxes[i].value);
            }
        }
if (members.length === 0) {
            alert("Add members first!");
            return;
        }
if(desc && !isNaN(amtValue) && amtValue > 0 && payer) {
            expenses.push({ 
                desc: desc, 
                amt: amtValue, 
                payer: payer, 
                involved: involved 
            });
            document.getElementById('descInput').value = '';
            document.getElementById('amtInput').value = '';
            main();
        } else {
            alert("Enter valid description and amount.");
        }
    }
function main() {
        localStorage.setItem('members', JSON.stringify(members));
        localStorage.setItem('expenses', JSON.stringify(expenses));
        let memberChipsHtml = "";
        let dropdownHtml = `<option value="" disabled selected>Select Payer</option>`;
        let involvementHtml = "";
        for (let i = 0; i < members.length; i++) {
            let name = members[i];
            memberChipsHtml += `<span class="member-chip">${name}</span>`;
            dropdownHtml += `<option value="${name}">${name}</option>`;
            involvementHtml += `
                <label style="background:#f0f0f0; padding:5px 10px; border-radius:5px; cursor:pointer">
                    <input type="checkbox" class="member-checkbox" value="${name}" checked> ${name}
                </label>`;
        }
        document.getElementById('memberList').innerHTML = memberChipsHtml;
        document.getElementById('payerSelect').innerHTML = dropdownHtml;
        document.getElementById('involvementList').innerHTML = involvementHtml;
        let totals = {};
        for (let i = 0; i < members.length; i++) {
            totals[members[i]] = 0;
        }
        for (let i = 0; i < expenses.length; i++) {
            let exp = expenses[i];
            let splitList = exp.involved || members;
            let share = Number(exp.amt) / splitList.length;
            for (let j = 0; j < splitList.length; j++) {
                totals[splitList[j]] -= share;
            }
            totals[exp.payer] += Number(exp.amt);
        }
let balanceHtml = "";
for (let i = 0; i < members.length; i++) {
    let name = members[i];
    let b = totals[name];

    balanceHtml += `
        <div class="row">
            <span>${name}</span>
            <span>$${b.toFixed(2)}</span>
        </div>`;
}
document.getElementById('balanceDisplay').innerHTML = balanceHtml || "No data yet.";
        let debts = [];
        for (let i = 0; i < members.length; i++) {
            debts.push({ name: members[i], bal: totals[members[i]] });
        }
        debts.sort((a, b) => a.bal - b.bal);
        let settleHtml = "";
        let start = 0, end = debts.length - 1;
        while (start < end) {
            let pay = Math.min(-debts[start].bal, debts[end].bal);
            if (pay > 0.01) {
                settleHtml += `<div class="row"><span><b>${debts[start].name}</b> pays <b>${debts[end].name}</b></span> <b>$${pay.toFixed(2)}</b></div>`;
            }
            debts[start].bal += pay;
            debts[end].bal -= pay;
            if (debts[start].bal >= -0.01) start++;
            if (debts[end].bal <= 0.01) end--;
        }
        document.getElementById('settleDisplay').innerHTML = settleHtml || "All settled!";
        let historyHtml = "";
        for (let i = expenses.length - 1; i >= 0; i--) {
            let exp = expenses[i];
historyHtml += `
    <div class="history-item">
        <strong>${exp.desc}</strong> - $${Number(exp.amt).toFixed(2)}
        <button onclick="deleteExpense(${exp.id})" style="width:auto; padding:2px 8px; float:right; background:#ff0000;">Delete</button>
        <br><small>${exp.payer} paid.</small>
    </div>`;
        }
        document.getElementById('historyDisplay').innerHTML = historyHtml || "No history.";
    }
    function clearAll() {
        if(confirm("Wipe all data?")) {
            localStorage.clear();
            members = [];
            expenses = [];
            main();
        }
    }
    function deleteExpense(id) {
    expenses = expenses.filter(exp => exp.id !== id);
    main(); 
}
    if(localStorage.getItem('theme')) document.body.setAttribute('data-theme', localStorage.getItem('theme'));
    main();

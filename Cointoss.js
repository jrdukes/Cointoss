"use strict";

var DATA_NAME = "Cointoss-Demo"; // I'd use const but it does not play well with "use strict" (at least: whole file fails to load in Safari).
var accounts = [];
var transactions = [];
var transactionsRepeating = [];

var centsInDollar = 100;

Number.prototype.toCurrency = function() {
	return this.formatNumber(2, true);
}

function convertCurrencyToNumber(currency) {
	return Number(currency.replace(/[^\-\d\.]/g, ""));
}

function roundCurrency(currency) {
	return Math.round(centsInDollar * currency) / centsInDollar;
}

// Object creating and editing, object collection saving

function createObject(type) {
	setMode(2, type);
	document.getElementById("spnIndex").innerHTML = "-1";
	document.getElementById("txtDescription").value = "";
	setDTPValue("dtpTransaction", new Date());
	document.getElementById("radStatus3").checked = true;
	document.getElementById("txtRepeats").value = 1;
	var tblAccountsAmountsBody = document.getElementById("tblAccountsAmounts").tBodies[0];
	while (tblAccountsAmountsBody.rows.length > 0) {
		tblAccountsAmountsBody.deleteRow(-1);
	}
	document.getElementById("txtNote").value = "";
	resizeTextarea(document.getElementById("txtNote"));
	if (type === 1) {
		var maxId = 0;
		for (var i = 0, accountsLength = accounts.length; i < accountsLength; i++) {
			if (accounts[i].id >= maxId) {
				maxId = accounts[i].id + 1;
			}
		}
		document.getElementById("spnId").innerHTML = maxId.toString();
	}
	else {
		createAccountsAmounts();
		var selViewValue = document.getElementById("selView").value;
		if (selViewValue.substr(0, 1) === "A") {
			document.getElementById("ddAccount0").value = Number(selViewValue.substr(1));
		}
		createAccountsAmounts();
	}
}

function editObject(type, index) {
	setMode(2, type);
	document.getElementById("spnIndex").innerHTML = index;
	var tblAccountsAmountsBody = document.getElementById("tblAccountsAmounts").tBodies[0];
	while (tblAccountsAmountsBody.rows.length > 0) {
		tblAccountsAmountsBody.deleteRow(-1);
	}
	var txtNote = document.getElementById("txtNote");
	switch (type) {
		case 1:
			document.getElementById("spnId").innerHTML = accounts[index].id;
			document.getElementById("txtDescription").value = accounts[index].description;
			txtNote.value = accounts[index].note;
			break;
		case 2:
			document.getElementById("txtDescription").value = transactionsRepeating[index].description;
			setDTPValue("dtpTransaction", transactionsRepeating[index].transactionDateTime);
			document.getElementById("txtRepeats").value = transactionsRepeating[index].repeats;
			for (var i = 0; i < transactionsRepeating[index].accountsAmounts.length; i++) {
				createAccountsAmounts();
				document.getElementById("ddAccount" + i.toString()).value = transactionsRepeating[index].accountsAmounts[i][0];
				document.getElementById("txtAmount" + i.toString()).value = transactionsRepeating[index].accountsAmounts[i][1].toCurrency();
			}
			break;
		case 3:
			document.getElementById("txtDescription").value = transactions[index].description;
			setDTPValue("dtpTransaction", transactions[index].transactionDateTime);
			document.getElementById("radStatus" + transactions[index].status).checked = true;
			for (var i = 0; i < transactions[index].accountsAmounts.length; i++) {
				createAccountsAmounts();
				document.getElementById("ddAccount" + i.toString()).value = transactions[index].accountsAmounts[i][0];
				document.getElementById("txtAmount" + i.toString()).value = transactions[index].accountsAmounts[i][1].toCurrency();
			}
			break;
		default:
			throw "editObject(): Unknown type value “" + type + "”.";
	}
	resizeTextarea(document.getElementById("txtNote"));
}

function loadDataFromLocalStorage() {
	accounts.length = 0;
	transactions.length = 0;
	transactionsRepeating.length = 0;
	var dataSerialized = window.localStorage.getItem(DATA_NAME);
	if (dataSerialized === null || dataSerialized === "") {
		showMessage(0, "No data found. Normally we’d alert the user to this and return, but for the demonstration version we’ll make some sample accounts.");
		dataSerialized = "{\"type\":1,\"id\":0,\"description\":\"A/Checking\",\"note\":\"Sample checking account.\"}\n"
			+ "{\"type\":1,\"id\":1,\"description\":\"A/Savings\",\"note\":\"Sample savings account.\"}\n"
			+ "{\"type\":1,\"id\":2,\"description\":\"E/Bills\",\"note\":\"Sample account for monthly bills.\"}\n"
			+ "{\"type\":1,\"id\":3,\"description\":\"E/Miscellaneous\",\"note\":\"Sample account for miscellaneous expenses (fun stuff).\"}\n"
			+ "{\"type\":1,\"id\":4,\"description\":\"E/Taxes\",\"note\":\"Sample account for taxes.\"}\n"
			+ "{\"type\":1,\"id\":5,\"description\":\"I/Job\",\"note\":\"Sample account for jobs and other income sources.\"}\n"
			+ "{\"type\":1,\"id\":6,\"description\":\"Q/Equity\",\"note\":\"Sample account for equity.\"}\n"
			+ "{\"type\":2,\"description\":\"Monthly Paycheck\",\"transactionDateTime\":\"2016-11-01 00:00:00.000\",\"repeats\":1,\"accountsAmounts\":[[0,50000.00],[4,123.45],[5,50123.45]]}\n"
			+ "{\"type\":3,\"description\":\"Monthly Paycheck\",\"transactionDateTime\":\"2016-10-01 00:00:00.000\",\"status\":3,\"accountsAmounts\":[[0,50000],[4,123.45],[5,50123.45]]}\n"
			+ "{\"type\":3,\"description\":\"Vacation\",\"transactionDateTime\":\"2016-10-15 12:00:00.000\",\"status\":3,\"accountsAmounts\":[[0,-2512.34],[1,-492.12],[3,3004.46]]}\n";
	}
	var dataArray = dataSerialized.trim().split("\n");
	var errors = new Array();
	for (var i = 0, dataArrayLength = dataArray.length; i < dataArrayLength; i++) {
		try {
			var data = JSON.parse(dataArray[i]);
			switch (data.type) {
				case 1:
					saveAccount(-1, data.id, data.description, data.note, 0);
					break;
				case 2:
					saveTransaction(data.type, -1, data.description, data.transactionDateTime, data.repeats, undefined, data.accountsAmounts, 0);
					break;
				case 3:
					saveTransaction(data.type, -1, data.description, data.transactionDateTime, undefined, data.status, data.accountsAmounts, 0);
					break;
				default:
					throw "LoadObjects(): Unknown data.type “" + data.type + "”.";
			}
		}
		catch (errorMessages) {
			errors.push("Error loading " + DATA_NAME + "object “" + dataArray[i] + "”:" + errorMessages);
		}
	}
	if (errors.length > 0) {
		var errorMessage = "Errors encountered loading " + DATA_NAME + ":<ul>";
		for (var i = 0, errorsLength = errors.length; i < errorsLength; i++) {
			errorMessage += "<li>" + errors[i] + "</li>";
		}
		errorMessage += "</ul>";
		showMessage(2, errorMessage);
	}
	accounts.sort(function(a, b) {
		return (a.description.toUpperCase() < b.description.toUpperCase() ? -1 : (a.description.toUpperCase() > b.description.toUpperCase() ? 1 : 0));
		} );
	showMessage(0, DATA_NAME + " transferred from local storage to array.");
}

function saveData(verbose) {
	try {
		var index = Number(document.getElementById("spnIndex").innerHTML);
		var description = document.getElementById("txtDescription").value;
		switch (document.getElementById("btnSaveData").innerHTML) {
			case "Save Account":
				var id = Number(document.getElementById("spnId").innerHTML);
				var note = document.getElementById("txtNote").value;
				saveAccount(index, id, description, note, verbose);
				loadSelView(document.getElementById("selView"));
				break;
			case "Save Repeating Transaction":
				var transactionDateTime = getDTPValue("dtpTransaction");
				var repeats = document.getElementById("txtRepeats").value;
				var accountsAmounts = getAccountsAmountsFromUI();
				saveTransaction(2, index, description, transactionDateTime, repeats, undefined, accountsAmounts, verbose);
				break;
			case "Save Transaction":
				var transactionDateTime = getDTPValue("dtpTransaction");
				var status = 0;
				if (document.getElementById("radStatus1").checked) { status = 1; }
				if (document.getElementById("radStatus2").checked) { status = 2; }
				if (document.getElementById("radStatus3").checked) { status = 3; }
				var accountsAmounts = getAccountsAmountsFromUI();
				saveTransaction(3, index, description, transactionDateTime, undefined, status, accountsAmounts, verbose);
				break;
			default:
				throw "saveData(): Unknown btnSaveData label “" + document.getElementById("btnSaveData").innerHTML + "”.";
		}
		window.localStorage.setItem(DATA_NAME + "-isDirty", "true");
	}
	catch (errorMessages) {
		var errorMessage = "Could not save the " + DATA_NAME + " object for these reasons:<ul>";
		for (var i = 0, errorMessageLength = errorMessages.length; i < errorMessageLength; i++) {
			errorMessage += "<li>" + errorMessages[i] + "</li>";
		}
		errorMessage += "</ul>";
		throw errorMessage;
	}
}

function saveDataToLocalStorage() {
	var dataSerialized = "";
	accounts.sort(function(a, b) {
		return (a.description.toUpperCase() < b.description.toUpperCase() ? -1 : (a.description.toUpperCase() > b.description.toUpperCase() ? 1 : 0));
	} );
	for (var i = 0, accountsLength = accounts.length; i < accountsLength; i++) { dataSerialized += JSON.stringify({ type: 1, id: accounts[i].id, description: accounts[i].description, note: accounts[i].note }) + "\n";
	}
	transactionsRepeating.sort(function(a, b) { return (a.description.toUpperCase() < b.description.toUpperCase() ? -1 : (a.description.toUpperCase() > b.description.toUpperCase() ? 1 : 0));
	});
	for (var i = 0, transactionsRepeatingLength = transactionsRepeating.length; i < transactionsRepeatingLength; i++) {
		transactionsRepeating[i].accountsAmounts.sort(sortAccountAmounts);
		dataSerialized += JSON.stringify({ type: 2, description: transactionsRepeating[i].description, transactionDateTime: transactionsRepeating[i].transactionDateTime.formatDate(dateShort, timeLong) , repeats: transactionsRepeating[i].repeats, accountsAmounts: transactionsRepeating[i].accountsAmounts }) + "\n";
	}
	transactions.sort(function(a, b) {
		if (a.transactionDateTime.getTime() !== b.transactionDateTime.getTime()) { return a.transactionDateTime.getTime() - b.transactionDateTime.getTime(); }
		return (a.description.toUpperCase() < b.description.toUpperCase() ? -1 : (a.description.toUpperCase() > b.description.toUpperCase() ? 1 : 0));
	});
	for (var i = 0, transactionsLength = transactions.length; i < transactionsLength; i++) {
		transactions[i].accountsAmounts.sort(sortAccountAmounts);
		dataSerialized += JSON.stringify({ type: 3, description: transactions[i].description, transactionDateTime: transactions[i].transactionDateTime.formatDate(dateShort, timeLong) , status: transactions[i].status, accountsAmounts: transactions[i].accountsAmounts }) + "\n";
	}
	window.localStorage.setItem(DATA_NAME, dataSerialized);
	showMessage(0, DATA_NAME + " transferred from array to local storage.");

	function sortAccountAmounts(a, b) {
		var aDescription = accounts[accounts.getIndexFromId(a[0])].description.toUpperCase() , bDescription = accounts[accounts.getIndexFromId(b[0])].description.toUpperCase();
		return (aDescription < bDescription ? -1 : (aDescription > bDescription ? 1 : a[1] - b[1]));
	}
}

// Object saving

function saveAccount(index, id, description, note, verbose) {
	description = description.trim();
	if (description === '' && index >= 0) {
		for (var i = 0, transactionsLength = transactions.length; i < transactionsLength; i++ ) {
			for (var j = 0, accountsAmountsLength = transactions[i].accountsAmounts.length; j < accountsAmountsLength; j++ ) {
				if (transactions[i].accountsAmounts[j][0] === id) {
					throw "Can not delete account, it has associated transactions.";
				}
			}
		}
		var descriptionOld = accounts[index].description;
		accounts.splice(index, 1);
		if (verbose === 1) {
			showMessage(0, "Account “" + descriptionOld + "” deleted.");
		}
		return;
	}
	validateAccount(index, id, description, note);
	description = description.substr(0, 1).toUpperCase() + description.substr(1);
	if (index === -1) {
		accounts.push({ id: id, description: description, note: note });
		if (verbose === 1) {
			showMessage(0, "Account “" + description + "” created.");
		}
	} else {
		accounts[index].description = description;
		accounts[index].note = note;
		if (verbose === 1) {
			showMessage(0, "Account “" + description + "” edited.");
		}
	}

	function validateAccount(index, id, description, priority, note) {
		var errors = new Array();
		if (description === "") {
			errors.push("Account’s description needs specifying.");
		} else {
			description = description.substr(0, 1).toUpperCase() + description.substr(1);
			switch (description.substr(0, 1)) {
				case "A":
				case "E":
				case "I":
				case "L":
				case "Q":
					break;
				default:
					errors.push("Account’s description needs to begin with A, E, I, L or Q.");
			}
		}
		if (errors.length > 0) {
			throw errors;
		}
	}
}

function saveTransaction(type, index, description, transactionDateTime, repeats, status, accountsAmounts, verbose) {
	description = description.trim();
	var transactionTypeArray = [];
	var transactionType = "";
	switch (type) {
		case 2:
			transactionTypeArray = transactionsRepeating;
			transactionType = "Repeating transaction";
			break;
		case 3:
			transactionTypeArray = transactions;
			transactionType = "Transaction";
			break;
		default:
			throw "saveTransaction(): Could not determine transaction with type “" + type + "”.";
	}
	if (description === "" && index >= 0) {
		var descriptionOld = transactionTypeArray[index].description;
		transactionTypeArray.splice(index, 1);
		if (verbose === 1) {
			showMessage(0, transactionType + " “" + descriptionOld + "” deleted.");
		}
		return;
	}
	validateTransaction(type, transactionTypeArray, index, transactionType, description, transactionDateTime, repeats, status, { accountsAmounts: accountsAmounts});
	if (typeof(transactionDateTime) === "string") { transactionDateTime = transactionDateTime.convertToDate(); }
	if (index === -1) {
		var newTransaction = { description: description, transactionDateTime: transactionDateTime, accountsAmounts: accountsAmounts };
		if (type === 2) { newTransaction.repeats = Number(repeats); }
		if (type === 3) { newTransaction.status = status; }
		transactionTypeArray.push(newTransaction);
		if (verbose === 1) {
			showMessage(0, transactionType + " “" + description + "” created.");
		}
	}
	else {
		transactionTypeArray[index].description = description;
		transactionTypeArray[index].transactionDateTime = transactionDateTime;
		if (type === 2) { transactionTypeArray[index].repeats = Number(repeats); }
		if (type === 3) { transactionTypeArray[index].status = status; }
		transactionTypeArray[index].accountsAmounts = accountsAmounts;
		if (verbose === 1) {
			showMessage(0, transactionType + " “" + description + "” edited.");
		}
	}

	function validateTransaction(type, transactionTypeArray, index, transactionType
		, description, transactionDateTime, repeats, status, accountsAmounts) {
		var errors = new Array();
		if (description === "") { errors.push(transactionType + "’s description needs specifying."); }
		try {
			if (typeof(transactionDateTime) === "string") { transactionDateTime = transactionDateTime.convertToDate(); }
		}
		catch (errorMessages) {
			errors.push("Error with transactionDateTime “" + transactionDateTime + "”: " + errorMessages);
		}
		if (type === 2 && (isNaN(repeats) || Number(repeats) <= 0)) { errors.push(transactionType + "’s repeats amount is not a number."); }
		if (type === 3 && (isNaN(status) || Number(status) <= 0)) { errors.push(transactionType + "’s status needs to be selected."); }
		var anyBadAccountsAmounts = false;
		for (var i = 0, accountsAmountsLength = accountsAmounts.accountsAmounts.length; i < accountsAmountsLength; i++) {
			if (isNaN(accountsAmounts.accountsAmounts[i][0]) || accounts.getIndexFromId(Number(accountsAmounts.accountsAmounts[i][0])) === -1) {
				errors.push("No account found with an id of “" + accountsAmounts.accountsAmounts[i][0] + "”.");
				anyBadAccountsAmounts = true;
			}
			else { accountsAmounts.accountsAmounts[i][0] = Number(accountsAmounts.accountsAmounts[i][0]); }
			if (isNaN(accountsAmounts.accountsAmounts[i][1])) {
				errors.push(transactionType + " amount with value “" + accountsAmounts.accountsAmounts[i][1] + "” needs to be a number.");
				anyBadAccountsAmounts = true;
			}
			else { accountsAmounts.accountsAmounts[i][1] = Number(accountsAmounts.accountsAmounts[i][1]); }
		}
		if (anyBadAccountsAmounts === false) {
			var combinedAmounts = getAmountsSummation(accountsAmounts.accountsAmounts);
			if (combinedAmounts !== 0) {
				errors.push(transactionType + " account amounts are unbalanced by " + combinedAmounts.toCurrency() + ". A + E - I - L - Q = 0.");
			}
		}
		if (errors.length > 0) {
			throw errors;
		}
	}
}

// Reports

function showView() {
	document.getElementById("divCalendar").innerHTML = "";
	document.getElementById("spnViewTitle").innerHTML = "";
	var selViewValue = document.getElementById("selView").value;
	if (selViewValue.substr(0, 1) === "A") {
		showViewAccountTransactions(Number(selViewValue.substr(1)));
		return;
	}
	switch (document.getElementById("selView").value) {
		case "ReportSummary":
			showViewSummary();
			break;
		case "ReportProfitLoss":
			showViewProfitLoss();
			break;
		case "ReportAssetsLiabilities":
			showViewAssetsLiabilities();
			break;
		case "ReportTransactionsRepeating":
			showViewTransactionsRepeating();
			break;
		default:
			throw "Unknown view select “" + document.getElementById("selView").value + "”.";
	}
}

function getViewAccountTransactions(accountId) {
	var viewArray = [];
	for (var i = 0, transactionsLength = transactions.length; i < transactionsLength; i++) {
		for (var j = 0; j < transactions[i].accountsAmounts.length; j++) {""
			if (transactions[i].accountsAmounts[j][0] === accountId) {
				viewArray.push([i, transactions[i].transactionDateTime
				, transactions[i].description, transactions[i].status
				, getOtherAccount(accountId, transactions[i].accountsAmounts)
				, transactions[i].accountsAmounts[j][1]]);
			}
		}
	}
	viewArray.sort(function (a, b) {
		if (a[1].getTime() !== b[1].getTime()) { return b[1].getTime() - a[1].getTime(); }
		return (a[2].toUpperCase() < b[2].toUpperCase() ? -1 : (a[2].toUpperCase() > b[2].toUpperCase() ? 1 : 0)); });
	return viewArray;

	function getOtherAccount(accountId, accountsAmounts) {
		if (accountsAmounts.length > 2) {
			return "(" + accountsAmounts.length.getUnit("account") + ")";
		} else if (accountsAmounts[0][0] === accountId) {
			return accounts[accounts.getIndexFromId(accountsAmounts[1][0])].description;
		} else {
			return accounts[accounts.getIndexFromId(accountsAmounts[0][0])].description;
		}
	}
}

function showViewAccountTransactions(accountId) {
	var viewArray = getViewAccountTransactions(accountId);
	document.getElementById("spnViewTitle").innerHTML = "<span class='actionable' tabindex='0' onclick='editObject(1, " + accounts.getIndexFromId(accountId) + ")'>"
		+ accounts[accounts.getIndexFromId(accountId)].description + "</span>, <span class='smaller'>(" + viewArray.length.getUnit("total transaction") + ")</span>";
	var runningTotal = [0, 0];
	var divViewHTML = "";
	for (var i = viewArray.length - 1; i >= 0; i--) {
		runningTotal[0] += viewArray[i][5];
		runningTotal[1] += (viewArray[i][3] === 3 ? viewArray[i][5] : 0)
		divViewHTML = "<tr>"
			+ "<td>" + viewArray[i][1].formatDate(dateShort + " %D3", timeShort) + "</td>"
			+ "<td class='actionable' tabindex='0' onclick='editObject(3, " + viewArray[i][0] + ")'> " + viewArray[i][2] + "</td>"
			+ "<td class='numeric'>" + viewArray[i][3] + "</td>"
			+ "<td>" + viewArray[i][4] + "</td>"
			+ "<td class='currency'>" + viewArray[i][5].toCurrency() + "</td>"
			+ "<td class='currency'>" + runningTotal[0].toCurrency() + "</td>"
			+ "<td class='currency'>" + (viewArray[i][3] === 3 ? runningTotal[1].toCurrency() : "") + "</td></tr>"
			+ divViewHTML;
	}
	divViewHTML = "<table class='striped'><thead><tr>"
		 + "<th>DateTime</th><th>Description</th>"
		 + "<th>Status</th><th>Other Account(s)</th><th class='currency'>Amount</th>"
		 + "<th class='currency'>Total</th><th class='currency'>Status 3 Total</th></tr></thead><tbody>" + divViewHTML + "</tbody></table>"
	 document.getElementById("divViewerResults").innerHTML = divViewHTML;
	 document.getElementById("selView").value = "A" + accountId.toString();
	 var selView =  document.getElementById("selView");
	 for (var i = 0, selOptionsLength = selView.options.length; i < selOptionsLength; i++) {
		if (selView.options[i].value === "A" + accountId.toString()) {
			selView.value = "A" + accountId.toString()
			break;
		}
	 }
}

function getViewAssetsLiabilities() {
	var assetsLiabilities = [];
	for (var i = 0; i < accounts.length; i++) {
		if (accounts[i].description.substr(0, 1) === "A"
			|| accounts[i].description.substr(0, 1) === "L" ) {
			assetsLiabilities.push([accounts[i].id, 0]);
		}
	}
	for (var i = 0, transactionsLength = transactions.length; i < transactionsLength; i++) {
		if (transactions[i].status === 3) {
			for (var j = 0; j < transactions[i].accountsAmounts.length; j++) {
				for (var k = 0; k < assetsLiabilities.length; k++) {
					if (transactions[i].accountsAmounts[j][0] === assetsLiabilities[k][0]) {
						assetsLiabilities[k][1] += transactions[i].accountsAmounts[j][1];
					}
				}
			}
		}
	}
	return assetsLiabilities;
}

function showViewAssetsLiabilities() {
	var viewArray = getViewAssetsLiabilities();
	var i = 0;
	for (i = 0; i < viewArray.length; i++) {
		viewArray[i][0] = accounts[accounts.getIndexFromId(viewArray[i][0])].description;
	}
	viewArray.sort(function (a, b) { return (a[0].toUpperCase() < b[0].toUpperCase() ? -1 : (a[0].toUpperCase() > b[0].toUpperCase() ? 1 : 0)); });
	var runningTotal = [0, 0];
	document.getElementById("spnViewTitle").innerHTML = "";
	var divViewHTML = "<table class='striped'><thead><tr><th>Account</th><th class='currency'>Amount</th></tr></thead><tbody>"
		 + "<tr><td colspan='2' class='center bolder'>Assets</td></tr>";
	for (i = 0; i < viewArray.length && viewArray[i][0].substr(0, 1) === "A"; i++) {
		runningTotal[0] += viewArray[i][1];
		divViewHTML += "<tr><td>" + viewArray[i][0] + "</td>"
			+ "<td class='currency'>" + viewArray[i][1].toCurrency() + "</td></tr>";
	}
	divViewHTML += "<tr><td class='bolder'>Total Assets</td><td class='currency bolder'>"
		+ runningTotal[0].toCurrency() + "</td></tr>"
		+ "<tr><td colspan='2' class='center bolder'>Liabilities</td></tr>";
	for (; i < viewArray.length && viewArray[i][0].substr(0, 1) === "L"; i++) {
		runningTotal[1] += viewArray[i][1];
		divViewHTML += "<tr><td>" + viewArray[i][0] + "</td>"
			+ "<td class='currency'>" + viewArray[i][1].toCurrency() + "</td></tr>";
	}
	divViewHTML += "<tr><td class='bolder'>Total Liabilities</td><td class='currency bolder'>"
		+ runningTotal[1].toCurrency() + "</td></tr>"
		+ "<tr><td class='bolder'>Grand Total</td><td class='currency bolder'>"
		+ (runningTotal[0] - runningTotal[1]).toCurrency() + "</td></tr></tbody></table>";

	document.getElementById("divViewerResults").innerHTML = divViewHTML;
}

function getViewProfitLoss() {
	var accountsIncomeExpenses = [];
	for (var i = 0; i < accounts.length; i++) {
		if (accounts[i].description.substr(0, 1) === "I"
			|| accounts[i].description.substr(0, 1) === "E" ) {
			accountsIncomeExpenses.push(accounts[i].id);
		}
	}
	var accountsIncomeExpensesLength = accountsIncomeExpenses.length;
	var transactionsStatus3 = transactions.filter(function (element) { return element.status === 3; })
	var earliestTime = new Date();
	var latestTime = new Date();
	var incomeExpenseArray = [];
	for (var i = 0, transactionsLength = transactionsStatus3.length; i < transactionsLength; i++) {
		for (var j = 0; j < transactionsStatus3[i].accountsAmounts.length; j++) {
			for (var k = 0; k < accountsIncomeExpensesLength; k++) {
				if (transactionsStatus3[i].accountsAmounts[j][0] === accountsIncomeExpenses[k]) {
					addToIncomeExpensesArray(incomeExpenseArray, transactionsStatus3[i].transactionDateTime
						, transactionsStatus3[i].accountsAmounts[j][0], transactionsStatus3[i].accountsAmounts[j][1]);
					earliestTime.setTime(Math.min(earliestTime.getTime(), transactionsStatus3[i].transactionDateTime.getTime()));
					latestTime.setTime(Math.max(latestTime.getTime(), transactionsStatus3[i].transactionDateTime.getTime()));
					break;
				}
			}
		}
	}
	earliestTime.setDate(1);
	earliestTime.setHours(0, 0, 0, 0);
	latestTime.setMonth(latestTime.getMonth() + 1);
	latestTime.setDate(1);
	latestTime.setHours(0, 0, 0, 0);
	latestTime.setTime(latestTime.getTime() - 1);
	for (; earliestTime.getTime() <= latestTime.getTime()
		; earliestTime.setMonth(earliestTime.getMonth() + 1)) {
		for (var i = 0; i < accountsIncomeExpensesLength; i++) {
			addToIncomeExpensesArrayIfNotAlreadyThere(incomeExpenseArray, earliestTime, accountsIncomeExpenses[i]);
		}
	}
	return incomeExpenseArray;

	function addToIncomeExpensesArray(incomeExpenseArray, transactionDateTime, accountId, amount) {
		for (var i = 0, incomeExpenseArrayLength = incomeExpenseArray.length
			; i < incomeExpenseArrayLength; i++) {
			if (incomeExpenseArray[i][1] === accountId
				&& incomeExpenseArray[i][0].getFullYear() === transactionDateTime.getFullYear()
				&& incomeExpenseArray[i][0].getMonth() === transactionDateTime.getMonth()) {
				incomeExpenseArray[i][2] += amount;
				return;
			}
		}
		incomeExpenseArray.push([new Date(transactionDateTime.getTime()), accountId, amount]);
	}

	function addToIncomeExpensesArrayIfNotAlreadyThere(incomeExpenseArray, date, accountId) {
		for (var i = 0, incomeExpenseArrayLength = incomeExpenseArray.length
			; i < incomeExpenseArrayLength; i++) {
			if (incomeExpenseArray[i][1] === accountId
				&& incomeExpenseArray[i][0].getFullYear() === date.getFullYear()
				&& incomeExpenseArray[i][0].getMonth() === date.getMonth()) {
					return;
			}
		}
		incomeExpenseArray.push([new Date(date.getTime()), accountId, 0]);
	}
}

function showViewProfitLoss() {
	var viewArray = getViewProfitLoss();
	for (i = 0; i < viewArray.length; i++) {
		viewArray[i][1] = accounts[accounts.getIndexFromId(viewArray[i][1])].description;
	}
	viewArray.sort(function(a, b) {
		if (a[0].getFullYear() !== b[0].getFullYear()) { return a[0].getFullYear() - b[0].getFullYear(); }
		if (a[0].getMonth() !== b[0].getMonth()) { return a[0].getMonth() - b[0].getMonth(); }
		if (a[1].substr(0, 1) === "I" && b[1].substr(0, 1) === "E") { return -1; }
		if (a[1].substr(0, 1) === "E" && b[1].substr(0, 1) === "I") { return 1; }
		return (a[1].toUpperCase() < b[1].toUpperCase() ? -1 : (a[1].toUpperCase() > b[1].toUpperCase() ? 1 : 0));
	} );
	var divViewHTML = "<table class='striped'><thead><tr><th>Account</th><th class='currency'>Amount</th></tr></thead><tbody>";
	var headerFooter = { currentYearMonth: new Date(0), currentAccount: "", currentAccountTotal: 0, currentYearMonthTotal: 0 };
	for (var i = 0; i < viewArray.length; i++) {
		divViewHTML += getMonthlyHeader(headerFooter, viewArray[i][0]);
		divViewHTML += getAccountHeader(headerFooter, viewArray[i][1].substr(0, 1));
		divViewHTML += "<tr><td>" + viewArray[i][1] + "</td><td class='currency'>"
			+ viewArray[i][2].toCurrency() + "</td></tr>";
		headerFooter.currentAccountTotal += viewArray[i][2];
		headerFooter.currentYearMonthTotal += (viewArray[i][1].substr(0, 1) === "I" ? 1 : -1) * viewArray[i][2];
		divViewHTML += getAccountFooter(headerFooter, viewArray, i);
		divViewHTML += getMonthlyFooter(headerFooter, viewArray, i);
	}
	divViewHTML += "</tbody></table>";
	document.getElementById("divViewerResults").innerHTML = divViewHTML;

	function getMonthlyHeader(headerFooter, currentYearMonth) {
		if (headerFooter.currentYearMonth.getMonth() !== currentYearMonth.getMonth()) {
			headerFooter.currentYearMonth = currentYearMonth;
			headerFooter.currentYearMonthTotal = 0;
			return "<tr><th colspan='2' class='center'>" + currentYearMonth.formatDate("%Y4 %M4", "") + "</th></tr>";
		}
		return "";
	}

	function getAccountHeader(headerFooter, currentAccount) {
		if (headerFooter.currentAccount !== currentAccount) {
			headerFooter.currentAccount = currentAccount.substr(0, 1);
			switch (headerFooter.currentAccount) {
				case "I": return "<tr><td colspan='2' class='bolder center'>Income</td></tr>";
				case "E": return "<tr><td colspan='2' class='bolder center'>Expenses</td></tr>";
				default: return "<tr><td colspan='2' class='bolder center'>Unknown Account Type</td></tr>";
			}
		}
		return "";
	}

	function getAccountFooter(headerFooter, viewArray, rowNumber) {
		var divViewHTML = "";
		if (rowNumber === viewArray.length - 1 ||
			viewArray[rowNumber + 1][1].substr(0, 1) !== headerFooter.currentAccount) {
				switch (headerFooter.currentAccount) {
					case "I": divViewHTML += "<tr><td class='bolder'>Income Total</td>"; break;
					case "E": divViewHTML += "<tr><td class='bolder'>Expenses Total</td>"; break;
					default: divViewHTML += "<tr><td class='bolder'>(Unknown Account Type)</td>"; break;
				}
				divViewHTML += "<td class='currency bolder'>" + headerFooter.currentAccountTotal.toCurrency() + "</td></tr>";
				headerFooter.currentAccountTotal = 0;
		}
		return divViewHTML;
	}

	function getMonthlyFooter(headerFooter, viewArray, rowNumber) {
		var divViewHTML = "";
		if (rowNumber === viewArray.length - 1 ||
			viewArray[rowNumber + 1][0].getMonth() !== headerFooter.currentYearMonth.getMonth()) {
				divViewHTML += "<tr><td class='bolder'>" + headerFooter.currentYearMonth.formatDate("%Y4 %M4", "") + " Profit / Loss</td>"
					+ "<td class='currency bolder'>" + headerFooter.currentYearMonthTotal.toCurrency() + "</td></tr>";
				headerFooter.currentYearMonthTotal = 0;
		}
		return divViewHTML;
	}
}

function getViewSummary() {
	var viewArray = [];
	for (var i = 0, accountsLength = accounts.length; i < accountsLength; i++) {
		var b = "<span class='actionable' tabindex='0' onclick='document.getElementById(\"selView\").value = \"A"
			+ accounts[i].id.toString() + "\"; showView(); '>" + accounts[i].description + "</span>";
		viewArray.push([accounts[i].description, b, 0, 0, 0]);
	}
	for (var i = 0, transactionsLength = transactions.length; i < transactionsLength; i++) {
		for (var j = 0; j < transactions[i].accountsAmounts.length; j++) {""
			var a = transactions[i].accountsAmounts[j][0];
			var b = accounts.getIndexFromId(a);
			viewArray[b][transactions[i].status + 1]
				+= transactions[i].accountsAmounts[j][1];
		}
	}
	viewArray.sort(function (a, b) { return (a[0].toUpperCase() < b[0].toUpperCase() ? -1
		: (a[0].toUpperCase() > b[0].toUpperCase() ? 1 : 0)); });
	return viewArray;
}

function showViewSummary() {
	var viewArray = getViewSummary();
	document.getElementById("spnViewTitle").innerHTML = " <span class='smaller'>(" + viewArray.length.getUnit("total account") + ")</span>";
	var divViewHTML = "<table class='striped'><thead><tr>"
		 + "<th>Description</th><th class='currency'>Status 1</th>"
		 + "<th class='currency'>Status 2</th><th class='currency'>Status 3</th>"
		 + "<th class='currency'>Total</th></tr></thead>";
	for (var i = 0, viewArrayLength = viewArray.length; i < viewArrayLength; i++) {
		divViewHTML += "<tr><td>" + viewArray[i][1] + "</td>";
		for (var j = 2; j <= 4; j++) {
			divViewHTML += "<td class='currency'>" + (viewArray[i][j]).toCurrency();
		}
		divViewHTML += "<td class='currency'>" + (Number(viewArray[i][2]) + Number(viewArray[i][3]) + Number(viewArray[i][4])).toCurrency();
	}
	document.getElementById("divViewerResults").innerHTML = divViewHTML;
}

function showViewTransactionsRepeating() {
	var divViewHTML = "<table class='striped'><thead><tr><th>Description</th><th>DateTime</th><th>Repeats (months)</th></tr></thead><tbody>";
	for (var i = 0
		, transactionsRepeatingLength = transactionsRepeating.length
		; i < transactionsRepeating.length; i++) {
		divViewHTML += "<td class='actionable' tabindex='0' onclick='editObject(2, " + i + ")'>"
			+ transactionsRepeating[i].description + "</td>";
		divViewHTML += "<td>" + transactionsRepeating[i].transactionDateTime.formatDate(dateShort + " %D3", timeShort) + "</td>"
			+ "<td class='numeric'>" + transactionsRepeating[i].repeats + "</td></tr>";
	}
	divViewHTML += "</tbody></table>";
	document.getElementById("divViewerResults").innerHTML = divViewHTML;
}

// Miscellaneous

function autoFillAmount(txtAmount) {
	var accountsAmountsLastRow = document.getElementById('tblAccountsAmounts')
		.getElementsByTagName('tbody')[0].rows.length - 1;
	if (document.getElementById("ddAccount" + accountsAmountsLastRow.toString()).value !== "-1"
		|| txtAmount.id === ("txtAmount" + accountsAmountsLastRow.toString())) {
		return;
	}
	var accountsAmounts = [];
	var lastTxtAmountId = "txtAmount" + (accountsAmountsLastRow).toString();
	for (var i = 0; document.getElementById("ddAccount" + (i + 1).toString()) !== null; i++) {
		var amount = convertCurrencyToNumber(document.getElementById("txtAmount" + i.toString()).value);
		if (Number.isNaN(amount)) { return; }
		accountsAmounts.push([Number(document.getElementById("ddAccount" + i.toString()).value), amount]);
	}
	var x = getAmountsSummation(accountsAmounts);
	document.getElementById("txtAmount" + accountsAmountsLastRow.toString()).value = (-1 * x).toCurrency();
}

function consolidateTransactions(transactionDateTime) {
	var consolidateBefore = getDTPValue("dtpTransactionsConsolidate");
	var confirmation = confirm("Verify consolidating status 3 transactions before "
		+ consolidateBefore.formatDate("%Y4 %M4 %D2 %D3 (%D)", timeShort)
		.replace(/&nbsp;/g, " ") + ".");
	if (confirmation !== true) {
		alert("Canceling…");
		return;
	}
	var accountsAmounts = [];
	var equityId = -1;
	for (var i = 0, accountsLength = accounts.length; i < accountsLength; i++) {
		var accountType = (accounts[accounts.getIndexFromId(accounts[i].id)].description.substr(0, 1));
		if (accountType === "A" || accountType === "L") {
			accountsAmounts.push([accounts[i].id, 0]);
		}
		if (accountType === "Q") { equityId = accounts[i].id; }
	}
	for (var i = 0; isDefined(transactions[i]) ; ) {
		if (transactions[i].status == 3 && transactions[i].transactionDateTime.getTime() < consolidateBefore.getTime()) {
			for (var j = 0; j < transactions[i].accountsAmounts.length; j++) {
				for (var k = 0; k < accountsAmounts.length; k++) {
					if (transactions[i].accountsAmounts[j][0] === accountsAmounts[k][0]) {
						accountsAmounts[k][1] += transactions[i].accountsAmounts[j][1];
						break;
					}
				}
			}
			saveTransaction(3, i, "", 0, undefined, 3, [], 1);
		}
		else {
			i++;
		}
	}
	var equityAmount = 0;
	for (var i = 0; i < accountsAmounts.length; i++) {
		accountsAmounts[i][1] = roundCurrency(accountsAmounts[i][1]);
		if (accounts[accounts.getIndexFromId(accountsAmounts[i][0])].description.substr(0, 1) === "A") { equityAmount += accountsAmounts[i][1]; }
		if (accounts[accounts.getIndexFromId(accountsAmounts[i][0])].description.substr(0, 1) === "L") { equityAmount -= accountsAmounts[i][1]; }
	}
	accountsAmounts.push([equityId, roundCurrency(equityAmount)]);
	saveTransaction(3, -1, "Consolidated Transaction", new Date(consolidateBefore.getTime() - 1), undefined, 3, accountsAmounts, 1);
	saveDataToLocalStorage();
	showMessage(0, "Transactions before " + consolidateBefore.formatDate(dateLong, timeShort) + " consolidated.");
	showView();
}

function createAccountsAmounts() {
	var tblAccountsAmountsBody = document.getElementById('tblAccountsAmounts').tBodies[0];
	var newRow = tblAccountsAmountsBody.insertRow(tblAccountsAmountsBody.rows.length);
	var newCell = newRow.insertCell(0);
	var newRowId = (tblAccountsAmountsBody.rows.length - 1).toString();
	var newAccountsDropDownHTML = "<select id='ddAccount" + newRowId + "'><option value='-1'>Select an account</option>";
	for (var i = 0, accountsLength = accounts.length; i < accountsLength; i++) {
		newAccountsDropDownHTML += "<option value='" + accounts[i].id + "'>" + accounts[i].description + "</option>";
	}
	newAccountsDropDownHTML += "</select>";
	newCell.innerHTML = newAccountsDropDownHTML;
	var newCell = newRow.insertCell(1);
	var newAmountsTxtHTML = "<input type='text' id='txtAmount" + newRowId + "' class='currency' step='0.01' oninput='autoFillAmount(this);' />";
	newCell.innerHTML = newAmountsTxtHTML;
	document.getElementById('txtAmount' + newRowId).addEventListener('focus', editAmount, false);
}

function editAmount(numAmountGotFocus) {
	this.removeEventListener('blur', saveAmount, false);
	this.value = convertCurrencyToNumber(this.value);
	this.type = "number";
	this.select();
	this.addEventListener('blur', saveAmount, false);
}

function saveAmount(numAmountGotBlur) {
	this.type = "text";
	var amount = (isNaN(Number(this.value)) ? 0 : Number(this.value));
	this.value = amount.toCurrency();
}

function getAmountsSummation(accountsAmounts) {
	var combinedAmounts = 0;
	for (var i = 0, accountsAmountsLength = accountsAmounts.length; i < accountsAmountsLength; i++ ) {
		var accountIndex = accounts.getIndexFromId(Number(accountsAmounts[i][0]));
		if (accountIndex === -1) { continue; }
		var accountType = accounts[accountIndex].description.substr(0, 1);
		switch (accountType) {
			case "A":
			case "E":
				combinedAmounts += Number(accountsAmounts[i][1]);
			break;
			case "I":
			case "L":
			case "Q":
				combinedAmounts -= Number(accountsAmounts[i][1]);
			break;
		}
	}
	return roundCurrency(combinedAmounts);
}

function getAccountsAmountsFromUI() {
	var rowCount = document.getElementById('tblAccountsAmounts').tBodies[0].rows.length;
	var accountsAmounts = [];
	for (var i = 0; i < rowCount; i++) {
		if (document.getElementById("ddAccount" + i.toString()).value !== "-1") {
			accountsAmounts.push([
				document.getElementById("ddAccount" + i.toString()).value
				, convertCurrencyToNumber(document.getElementById("txtAmount" + i.toString()).value) ]);
		}
	}
	return accountsAmounts;
}

function loadSelView(sel) {
	while (sel.options.length > 0) {
		sel.remove(0);
	}
	while (sel.firstChild) {
		sel.removeChild(sel.firstChild);
	}
	var optGroup = document.createElement("optgroup");
	optGroup.label = "Reports";
	sel.appendChild(optGroup);
	var options = [
		[ "ReportSummary", "Summary" ]
		, [ "ReportProfitLoss", "Profit and Loss Report" ]
		, [ "ReportAssetsLiabilities" , "Assets and Liabilities Report" ]
		, [ "ReportTransactionsRepeating" , "Repeating Transactions" ]
	];
	for (var i = 0, optionsLength = options.length; i < optionsLength; i++) {
		var element = document.createElement("option");
		element.value = options[i][0];
		element.textContent = options[i][1];
		sel.appendChild(element);
	}
	var optGroup = document.createElement("optgroup");
	optGroup.label = "Accounts";
	sel.appendChild(optGroup);
	accounts.sort(function(a, b) {
		return (a.description.toUpperCase() < b.description.toUpperCase() ? -1 : (a.description.toUpperCase() > b.description.toUpperCase() ? 1 : 0));
		} );
	for (var i = 0, accountsLength = accounts.length; i < accountsLength; i++) {
		var element = document.createElement("option");
		element.value = "A" + accounts[i].id.toString();
		element.textContent = accounts[i].description;
		sel.appendChild(element);
	}
	sel.selectedIndex = 0;
}

function processTransactionsRepeating() {
	var dateCutoff = new Date();
	dateCutoff.setMonth(dateCutoff.getMonth() + 1);
	var transactionsCreated = false;
	for (var i = 0, transactionsRepeatingLength = transactionsRepeating.length; i < transactionsRepeatingLength; i++) {
		while (transactionsRepeating[i].transactionDateTime.getTime() <= dateCutoff.getTime()) {
			saveTransaction(3, -1, transactionsRepeating[i].description, new Date(transactionsRepeating[i].transactionDateTime), undefined, 1, transactionsRepeating[i].accountsAmounts, 0);
			transactionsCreated = true;
			showMessage(0, "Added transaction “" + transactionsRepeating[i].description + "”, occurring " + transactionsRepeating[i].transactionDateTime.formatDate(dateLong, "") + ".");
			transactionsRepeating[i].transactionDateTime.setMonth(transactionsRepeating[i].transactionDateTime.getMonth() + transactionsRepeating[i].repeats);
			saveTransaction(2, i, transactionsRepeating[i].description, transactionsRepeating[i].transactionDateTime, transactionsRepeating[i].repeats, undefined, transactionsRepeating[i].accountsAmounts, 0);
		}
	}
	if (transactionsCreated === true) { saveDataToLocalStorage(); }
}

function setMode(mode, type) {
	window.scrollTo(0, 0);
	addOrRemoveClass("divViewer", "hidden", true);
	addOrRemoveClass("frmEditor", "hidden", true);
	addOrRemoveClass("divSynchronizer", "hidden", true);
	switch (mode) {
		case 1:
			addOrRemoveClass("divViewer", "hidden", false);
			addOrRemoveClass("divSynchronizer", "hidden", false);
			break;
		case 2:
			addOrRemoveClass("frmEditor", "hidden", false);
			if (type === 1) {
				addOrRemoveClass("divDateTime", "hidden", true);
				addOrRemoveClass("divStatus", "hidden", true);
				addOrRemoveClass("divRepeats", "hidden", true);
				addOrRemoveClass("divAccountsAmounts", "hidden", true);
				addOrRemoveClass("divNote", "hidden", false);
				document.getElementById("btnSaveData").innerHTML = "Save Account";
			} else {
				addOrRemoveClass("divDateTime", "hidden", false);
				addOrRemoveClass("divStatus", "hidden", (type === 3 ? false : true));
				addOrRemoveClass("divRepeats", "hidden", (type === 2 ? false : true));
				addOrRemoveClass("divAccountsAmounts", "hidden", false);
				addOrRemoveClass("divNote", "hidden", true);
				document.getElementById("btnSaveData").innerHTML = "Save " + (type === 2 ? "Repeating " : "") + "Transaction";
			}
			break;
		default:
			throw "setMode(): Unknown mode value “" + mode + "”.";
	}
}

// Listeners

function refreshTender(shouldLoadDataFromLocalStorage) {
	loadDataFromLocalStorage();
	processTransactionsRepeating();
	loadSelView(document.getElementById("selView"));
	var viewMonthBeginning = new Date();
	viewMonthBeginning.setDate(1);
	viewMonthBeginning.setHours(0, 0, 0, 0);
	setDTPValue("dtpTransactionsConsolidate", viewMonthBeginning);
	setMode(1);
	showView();
}

window.addEventListener("beforeunload", function( event ) {
	synchronizeData(DATA_NAME);
});

window.addEventListener("load", function( event ) {
	initalizeElements("divIndexId", "divMessages", "divNote", "divSaveData", "divDataEditor", "divSynchronizer", DATA_NAME);
	synchronizeData(DATA_NAME);
	refreshTender();
});

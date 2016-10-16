"use strict";

function addOrRemoveClass(elementName, className, addOrRemove) {
	var element = document.getElementById(elementName);
	if (addOrRemove === true && element.className.indexOf(className) === -1) {
		element.className += " " + className;
	} else if (addOrRemove === false) {
		element.className = element.className.replace(className, "").trim();
	}
}

function doEditorAction(dataName, action) {
	var txtEditor = document.getElementById("divDataEditor").getElementsByTagName("textarea")[0];
	switch (action) {
		case 1: // Show
			addOrRemoveClass("divDataEditor", "hidden", false);
			txtEditor.value = window.localStorage.getItem(dataName);
			break;
		case 2: // Cancel
			addOrRemoveClass("divDataEditor", "hidden", true);
			txtEditor.value = "";
			break;
		case 3: // Save
			window.localStorage.setItem(dataName, txtEditor.value);
			refreshTender(true);
			doEditorAction(dataName, 2);
			break;
		default:
			throw "doEditorAction(): Unknown action value “" + action + "”.";
	}
}

function initalizeElements(indexId, messages, notes, saveData, dataEditor, synchronize, dataName) {
	if (document.getElementById(indexId) !== null) {
		document.getElementById(indexId).innerHTML = "<label>Index</label><span id='spnIndex'></span>&nbsp;<label>Id</label><span id='spnId'></span>";
	}
	if (document.getElementById(messages) !== null) {
		document.getElementById(messages).innerHTML = 
			"<hr /><label>Messages</label><ul id='ulMessages'></ul><div class='omnibar'><div class='w12 right'><button onclick='document.getElementById(\"ulMessages\").innerHTML=\"\"; window.scrollTo(0, 0);'>Clear All</button></div>";
	}
	if (document.getElementById(notes) !== null) {
		document.getElementById(notes).innerHTML = 
			"<label for='txtNote'>Notes</label><textarea id='txtNote' spellcheck='true'></textarea>"
			+ "<div class='omnibar margin-bottom'><div class='w12 right'><button id='btnToggleNoteFontSize'>Toggle Note Font Size</button></div></div>";
	}
	if (document.getElementById(saveData) !== null) {
		document.getElementById(saveData).innerHTML =
			"<hr /><div class='omnibar margin-bottom'> \
				<div class='w6'> \
					<button accesskey='c' onclick=\" \
						setMode(1); \
						showView(); \
						\">Cancel \
					</button> \
				</div> \
				<div class='w6 right'> \
					<button id='btnSaveData' accesskey='s' onclick=\" \
						try { \
							saveData(1); \
							saveDataToLocalStorage(); \
							setMode(1); \
							showView(); \
						} \
						catch (errorMessage) { \
							showMessage(2, errorMessage); \
						} \
						\">Save\
					</button> \
				</div></div>";
	}
	if (document.getElementById(dataEditor) !== null) {
		document.getElementById(dataEditor).innerHTML =
			"<hr /><div class='omnibar margin-bottom'> \
				<div class='w12'> \
					<textarea></textarea> \
				</div></div> \
				<div class='omnibar margin-bottom'> \
					<div class='w6'> \
						<button onclick=' \
							doEditorAction(\"" + dataName + "\", 2);'> \
							Cancel\
						</button> \
					</div> \
					<div class='w6 right'> \
						<button onclick=' \
							doEditorAction(\"" + dataName + "\", 3);'> \
							Save Data\
						</button> \
				</div></div>";
	}
	if (document.getElementById(synchronize) !== null) {
		document.getElementById(synchronize).innerHTML = 
			"<hr /><div class='omnibar margin-bottom'> \
				<div class='w6'> \
				<label for=\"txtVerification\" style=\"margin-right: 0.25rem;\">Synchronization Password</label><input id='txtVerification' type='password' value='' /> \
				<button onclick=' \
					alert(\"Functionality deactivated. This would normally call a server-side script to synchronize Cointoss data.\"); \
				' accesskey='y'> \
					Synchronize Data\
				</button> \
				</div> \
				<div class='w6 right'> \
				<button onclick='doEditorAction(\"" + dataName + "\", 1);'> \
					Edit Data\
				</button> \
				</div></div>";
	}
	document.getElementById("txtNote").addEventListener("input", function( event ) {
		resizeTextarea(document.getElementById("txtNote")); }
		, false);

	document.getElementById("btnToggleNoteFontSize").addEventListener("click", function( event ) {
		addOrRemoveClass("txtNote", "larger", document.getElementById("txtNote").className.indexOf("larger") === -1 ? true : false);
		resizeTextarea(txtNote); }
		, false);
}

function isDefined(obj) {
	return (typeof(obj) !== "undefined");
}

function isLocalStorageAvailable() {
	try {
		var storage = window.localStorage,
			storageTest = '__storage_test__';
		if (isDefined(storage) === false) {
			return false;
		}
		storage.setItem(storageTest, storageTest);
		storage.removeItem(storageTest);
		return true;
	}
	catch (errorMessage) {
		return false;
	}
}

function resizeTextarea(textarea) {
	textarea.style.height = "auto";
	var style = textarea.currentStyle || window.getComputedStyle(textarea);
	var borderWidth = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
	textarea.style.height = (textarea.scrollHeight + borderWidth).toString() + "px";
}

function showMessage(code, statusItem) {
	var cssMessages = [ "message", "warning", "error" ];
	document.getElementById("ulMessages").innerHTML += "<li" + (isDefined(cssMessages[code]) === false ? "" : " class = '" + cssMessages[code] + "'") + ">" + statusItem + "</li>";
}

function synchronizeData(dataName) {
	// Functionality removed. This would normally call a server-side script to synchronize Cointoss data.");
}

function getDTPValue(control) {
	if (typeof(control) === "string") { control = document.getElementById(control); }
	return control.innerHTML.substring(21,44).convertToDate();
}

function setDTPValue(control, dateValue) {
	if (typeof(control) === "string") { control = document.getElementById(control); }
	if (typeof(dateValue) === "string") { dateValue = dateValue.convertToDate(); }
	control.innerHTML = "<span class='hidden'>" + dateValue.formatDate(dateShort, timeLong) + "</span>" + dateValue.formatDate(dateLong, timeLong);
}

function showCalendar(dateValue, control, code) {
	if (typeof(dateValue) === "string") { dateValue = dateValue.convertToDate(); }
	if (typeof(control) === "string") { control = document.getElementById(control); }

	var innerHTML ="<div class='omnibar margin-bottom'><div><label for='txtCalendarDate'>Date</label><input type='text' id='txtCalendarDate' value='" + dateValue.formatDate(dateShort, "") + "' class='date' accesskey='d' \n"
		+ "oninput='\n"
		+ "		try {\n"
		+ "			var gotoDateValue = document.getElementById(\"txtCalendarDate\").value;\n"
		+ "			if (gotoDateValue.length !== 7) { return; }\n"
		+ "			gotoDateValue += \"-01 \" + document.getElementById(\"txtCalendarTime\").value;\n"
		+ "			document.getElementById(\"tblCalendar\").innerHTML = setCalendarHTML(gotoDateValue.convertToDate(), \"tblCalendar\");\n"
		+ "		}\n"
		+ "		catch (errorMessage) {\n"
		+ "			alert(\"Could not convert “\" + gotoDateValue + \"” to a datetime.\");\n"
		+ "		}\n"
		+ "'/>\n"
		+ "<label for='txtCalendarTime'>Time</label><input type='text' id='txtCalendarTime' value = '" + dateValue.formatDate("", timeLong) + "' class='date' onblur=\""
		+ "try {\n"
		+ "	this.value = ('2013-10-01 ' +  this.value).convertToDate().formatDate('', timeLong);\n"
		+ "}\n"
		+ "catch (errorMessage) {\n"
		+ "	alert('Error converting calendar time field “' + this.value + '” to a time: ' + errorMessage);\n"
		+ "}\n"
		+ "\" />\n";
	innerHTML += "<button onclick=\"\n"
		+ "	var selectedDateValue = (document.getElementById('txtCalendarDate').value) + ' ' + (document.getElementById('txtCalendarTime').value);\n"
		+ "	try {\n"
		+ "		setDTPValue('" + control.id + "', selectedDateValue.convertToDate().formatDate(dateShort, timeLong));\n"
		+ "		" + code + "\n"
		+ "		document.getElementById('divCalendar').innerHTML = '';\n"
		+ "	}\n"
		+ "	catch (errorMessage) {\n"
		+ "		alert('Error with calendar date and time “' + selectedDateValue + '”: ' + errorMessage);\n"
		+ "	}\n"
		+ "\">Okay</button>";
	innerHTML += " <button onclick=\"document.getElementById('divCalendar').innerHTML = '';\n"
		+ "\">Cancel</button></div></div>";
	innerHTML += "<table id='tblCalendar' class='calendar'></table>";
	document.getElementById('divCalendar').innerHTML = innerHTML;
	document.getElementById('tblCalendar').innerHTML = setCalendarHTML(dateValue, "tblCalendar");
	window.scrollTo(0, 0);
}

function setCalendarHTML(dateValue) {
	if (typeof(dateValue) === "string") { dateValue = dateValue.convertToDate(); }
	var dateValueTemp = new Date(dateValue.getFullYear(), dateValue.getMonth(), 1, dateValue.getHours(), dateValue.getMinutes(), dateValue.getSeconds(), dateValue.getMilliseconds());
	do {
		dateValueTemp.setDate(dateValueTemp.getDate() - 1);
	} while (dateValueTemp.getDay() !== 1);
	var dateValuePrev = new Date(dateValue.getTime());
	dateValuePrev.setMonth(dateValuePrev.getMonth() - 1, 1);
	var dateValueNext = new Date(dateValue.getTime());
	dateValueNext.setMonth(dateValueNext.getMonth() + 1, 1);

	var innerHTML = "<thead><tr><th class='actionable' colspan='2' onclick=\"\n"
		+ "	document.getElementById('tblCalendar').innerHTML = setCalendarHTML('" + dateValuePrev.formatDate(dateShort, timeLong) + "');\n"
		+ "	document.getElementById('txtCalendarDate').value = '" + dateValuePrev.formatDate(dateShort, "") + "';\">Prev. Month</th>";
	innerHTML += "<th class='bolder' colspan='3'>" + dateValue.formatDate("%Y4 %M4", "") + "</th>";
	innerHTML += "<th class='actionable' colspan='2' onclick=\"\n"
		+ "	document.getElementById('tblCalendar').innerHTML = setCalendarHTML('" + dateValueNext.formatDate(dateShort, timeLong) + "');\n"
		+ "	document.getElementById('txtCalendarDate').value = '" + dateValueNext.formatDate(dateShort, "") + "';\">Next Month</th></tr>";
	innerHTML += "<tr>";
	for (var i = 0, dateValueTemp2 = new Date(dateValueTemp.getTime()); i < 7; i++, dateValueTemp2.setDate(dateValueTemp2.getDate() + 1)) {
		innerHTML += "<th class='calendar'>" + dateValueTemp2.formatDate((window.innerWidth >= 600 ? "%D4" : "%D3"), "") + "</th>";
	}
	innerHTML += "</tr></thead><tbody>"
	var dateValueNow = new Date();
	var cssClass = "";
	for (var i = 0; i < 6 * 7; i++, dateValueTemp.setDate(dateValueTemp.getDate() + 1)) {
		if (i % 7 === 0) { innerHTML += "<tr>"; }
		cssClass = "";
		if (dateValueTemp.getFullYear() === dateValue.getFullYear() && dateValueTemp.getMonth() === dateValue.getMonth()) { cssClass = "thisMonth"; }
		if (dateValueTemp.getFullYear() === dateValueNow.getFullYear() && dateValueTemp.getMonth() === dateValueNow.getMonth() && dateValueTemp.getDate() === dateValueNow.getDate()) { cssClass = "today"; }
		innerHTML += "<td class='" + cssClass + " actionable' onclick=\"\n"
			+ "	document.getElementById('txtCalendarDate').value = '" + dateValueTemp.formatDate(dateShort, "") + "';\n"
			+ "\">"
			+ dateValueTemp.formatDate("%D2" + (window.innerWidth >= 600 ? "<br /><span class='smaller'>(%D)</span>" : "" ), "") + "</td>\n";
		if (i % 7 === 6) { innerHTML += "</tr>"; }
	}
	return innerHTML + "</tbody>"
}

var dateShort = "%Y4-%M2-%D2";
var dateMedium = "%Y4 %M4 %D2 %D4";
var dateLong = dateMedium + " <span class='smaller'>(%D)</span>";
var timeShort = "%H:%N";
var timeLong = timeShort + ":%S.%T";

Array.prototype.getIndexFromId = function(id) {
	for (var i = 0, thisLength = this.length; i < thisLength; i++) {
		if (this[i].id === id) {
			return i;
		}
	}
	return -1;
}

Date.prototype.formatDate = function(dFormat, tFormat) {
	var dateFormat = (dFormat + " " + tFormat).trim();
	var monthNames = new Array("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December");
	var dayNames = new Array("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday");
	return dateFormat
		.replace("%Y4", this.getFullYear())
		.replace("%M4", monthNames[this.getMonth()])
		.replace("%M3", monthNames[this.getMonth()].substring(0, 3))
		.replace("%M2", ("00" + (this.getMonth() + 1)).substr(-2, 2))
		.replace("%D4", dayNames[this.getDay()])
		.replace("%D3", dayNames[this.getDay()].substring(0, 3))
		.replace("%D2", ("00" + this.getDate()).substr(-2, 2))
		.replace("%H", ("00" + this.getHours()).substr(-2, 2))
		.replace("%N", ("00" + this.getMinutes()).substr(-2, 2))
		.replace("%S", ("00" + this.getSeconds()).substr(-2, 2))
		.replace("%T", ("000" + this.getMilliseconds()).substr(-3, 3))
		.replace("%D", this.getDistanceFormatted(new Date())); 
}

Date.prototype.getDistance = function(value) {
	var thisTmp = new Date(this.getTime());
	var valueTmp = new Date(value.getTime());
	thisTmp.setHours(0, 0, 0, 0);
	valueTmp.setHours(0, 0, 0, 0);
	var dstOffset = (thisTmp.getTimezoneOffset() - valueTmp.getTimezoneOffset()) * 1000 * 60;
	return ((thisTmp.getTime() - valueTmp.getTime() - dstOffset) / (1000 * 60 * 60 * 24));
}

Date.prototype.getDistanceFormatted = function(value) {
	var distance = this.getDistance(value);
	switch (distance) {
		case -1:
			return "yesterday";
		case 0:
			return "today";
		case 1:
			return "tomorrow";
		default:
			return (distance > 1 ? "in " + distance.formatNumber() + " days" : Math.abs(distance).formatNumber() + " days ago").replace(/ /g, "&nbsp;");
	}
}

Date.prototype.getNextDate = function(repeats) {
	if (repeats === "n") {
		return null;
	}
	var dateNew = new Date(this.getTime());
	repeats = (repeats === "b" || repeats === "a" ? "12m" : repeats);
	var repeatType = repeats.substr(-1, 1);
	var repeatAmount = Number(repeats.substr(0, repeats.length - 1));
	if (isNaN(repeatAmount) === true || repeatAmount === 0) {
		throw "getNextDate(): Could not extract a number from repeats “" + repeats + "”.";
	}
	switch (repeatType) {
		case "d":
			dateNew.setDate(dateNew.getDate() + repeatAmount);
			break;
		case "m":
			dateNew.setMonth(dateNew.getMonth() + repeatAmount);
			break;
		case "c":
			var day = dateNew.getDay();
			dateNew.setMonth(dateNew.getMonth() + repeatAmount);
			dateNew.setDate(7 * Math.floor((dateNew.getDate() - 1) / 7) + 1);
			for (; dateNew.getDay() !== day; dateNew.setDate(dateNew.getDate() + 1));
			break;
		default:
			throw "getNextDate(): Unknown repeatType value “" + repeatType + "”.";
	}
	return dateNew;
}

Number.prototype.formatNumber = function(places, signed, decimalSeparator, thousandsSeparator, signs) {
	var signed = (isDefined(signed) ? signed : false)
		, decimalSeparator = (isDefined(decimalSeparator) ? decimalSeparator : ".")
		, thousandsSeparator = (isDefined(thousandsSeparator) ? thousandsSeparator : ",")
		, signs = (isDefined(signs) ? signs : new Array("+", ""))
		, numberString = (isNaN(places = Math.abs(places)) ? this.toString() : this.toFixed(places));
	var x = numberString.split(decimalSeparator);
	var x1 = x[0];
	var x2 = x.length > 1 ? decimalSeparator + x[1] : '';
	var regularExpression = /(\d+)(\d{3})/;
	while (regularExpression.test(x1)) {
		x1 = x1.replace(regularExpression, '$1' + thousandsSeparator + '$2');
	}
	x1 = x1 + x2;
	return (signed === true && this !== 0 ? (this > 0 ? signs[0] + x1 : signs[1] + x1) : x1);
}

Number.prototype.getUnit = function(singular, plural) {
	if (this === 1) {
		return this.formatNumber() + " " + singular;
	}
	var plural = (isDefined(plural) ? plural : singular + "s");
	return this.formatNumber() + " " + plural;
}

String.prototype.convertToDate = function() {
	var dateParts = this.match(/(\d{4})\D(\d{1,2})\D(\d{1,2}) {0,1}(\d{1,2})?\D{0,1}(\d{2})?\D{0,1}(\d{2})?\D{0,1}\.{0,1}(\d{3})?/);
	if (dateParts !== null) {
		return new Date(dateParts[1], dateParts[2] - 1, dateParts[3]
			, (dateParts[4] == undefined ? 0 : dateParts[4])
			, (dateParts[5] == undefined ? 0 : dateParts[5])
			, (dateParts[6] == undefined ? 0 : dateParts[6])
			, (dateParts[7] == undefined ? 0 : dateParts[7]));
		} else {
		throw "Could not convert “" + this + "” to a date.";
	}
}

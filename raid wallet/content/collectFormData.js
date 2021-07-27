/*
 * Copyright (c) 2018. Stephan Mahieu
 *
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE', which is part of this source code package.
 */
// Also contains parts of showFormData.js. Modified by SamPorter1984

// quick reply on 2ch.hk main page not working for now since default event is being prevented. to reply to the thread you have to visit thread page. 
// can be fixed in the future

'use strict';
let filter = [
"4chan.org/biz",
"4channel.org/biz",
"4chan.org/qa",
"4channel.org/qa",
//"twitter.com",
//"ylilauta.",
//"komica.",
//"kohlchan.",
//"diochan.",
//"ptchan.",
//"hispachan.",
"2ch.hk/cc",
"2ch.pm/cc",
"2ch.tf/cc",
"2ch.yt/cc",
"2ch.wf/cc",
"2ch.re/cc",
"2-ch.so/cc"//,
//"indiachan.",
//"2chan.",
//"github.com",
//"bitcointalk.org",
//"ethereum-magicians.org",
//"forum.openzeppelin.com",
//"wrongthink.",
//"endchan.",
//"krautchan."
];

let threadDiv;
let threadHref;
let threadDismiss;
let defaultStyle = "visibility:hidden;";
let threadVisibleStyle = "color:#000;visibility:visible;opacity:0.8;font:bold 10px sans-serif;z-index:2147483;border:1px solid #000;background:white;position:fixed;bottom:340px;right:1%;height:35px;width:170px";
createThreadDiv();
function createThreadDiv() {
	if(threadDiv == undefined || threadDiv == null){
		threadDiv = document.createElement("div");
		document.body.appendChild(threadDiv);
		threadHref = document.createElement("a");
		threadHref.setAttribute("class","threadDiv");
		threadDiv.setAttribute("style",defaultStyle);
		threadDiv.appendChild(threadHref);
		threadHref.addEventListener("click",(event)=>{ threadDiv.setAttribute("style",defaultStyle); });
		browser.storage.local.get({dismissed: true}).then(res => {
			if (res.dismissed == true) {threadDiv.setAttribute("style",defaultStyle);} else {
				threadDiv.setAttribute("style",threadVisibleStyle);
				browser.storage.local.get({newThreadHref: ""}).then(res => {
					threadHref.setAttribute("href",res.newThreadHref); browser.storage.local.get({newThread: ""}).then(res => { threadHref.textContent = "NEW THREAD: " + res.newThread; });
				});
			}
		});
		threadDismiss = document.createElement("a");
		threadDismiss.textContent = "[dismiss]";
		threadDismiss.setAttribute("style","position:absolute; bottom: 2px; right:2px;cursor: pointer;");
		threadDiv.appendChild(threadDismiss);
		threadDismiss.addEventListener("click",function(event){
			event.preventDefault(); threadDismiss.style.visibility = "hidden"; threadDiv.setAttribute("style",defaultStyle); browser.storage.local.set({dismissed: true});
		});
	}
}

let windowDiv;
createWindowDiv();
function createWindowDiv() {
	if(windowDiv == undefined || windowDiv == null){
		windowDiv = document.createElement("div");	document.body.appendChild(windowDiv);
		windowDiv.setAttribute("style","margin: auto; display: none;height: 550px; width: 500px; border:1px solid #000;opacity:1; background:#ddd; position:fixed; top: 5%;line-height:1; margin: 5% auto; left: 0;right: 0;");
		let closeWindow = document.createElement("a"); windowDiv.appendChild(closeWindow);
		browser.storage.local.get({faq: false}).then(res => {if(res.faq == true) {windowDiv.style.display = "block";}});
		closeWindow.setAttribute("style","margin: auto; font:bold 30px;text-align: center; position:absolute;top:5px;right:5px;color:#000;cursor: pointer;");
		closeWindow.textContent = "[close]";
		closeWindow.addEventListener("click",(e)=>{e.preventDefault(); windowDiv.style.display = "none";browser.storage.local.set({faq: false});});
		let textBodyDiv = document.createElement("div"); windowDiv.appendChild(textBodyDiv);
		textBodyDiv.setAttribute("style","width: 90%; margin: 5% auto; font:bold;font-size: 14px;text-align: center; top:5px;color:#000; overflow: auto;");
		textBodyDiv.innerHTML = "How to get paid for shitposting?<br><br>"+
		"In English, post in the threads on 4chan /biz/ or /qa/ with 'Aletheo' in the subject<br>"+
		"In Russian, post on 2ch.hk/cc/ with 'Aletheo' in the subject<br>"+
		"/biz/ posts are the most expensive and /qa/ posts are 4x cheaper than /biz/,<br>"+
		"/cc/ posts are 10x cheaper than 4chan' /biz/<br>"+
		"If there is no thread on the board you want to post, create one<br>"+
		"Creating a thread is never paid, because op is a faggot<br>"+
		"A thread must contain 'Aletheo' in the topic(lower-, uppercase does not matter)<br>"+
		"posts must be unique, you can completely derail the thread as long as a given board allows<br>"+
		"you can fud or ignore Aletheo completely in Aletheo threads, you will still get paid the same amount for a post<br>"+
		"so only on /qa it's possible to discuss everything, since it's in the rules<br>"+
		"on /biz you can only discuss /biz related topics<br>"+
		"oracle ignores green text and quote links<br>"+
		"oracle ignores whitespaces, so spaces and new lines<br>"+
		"oracle ignores repeating letters<br>"+
		"oracle will soon ignore numbers, punctuation and special symbols<br><br>"+
		"~29k LET is being divided between all posters,<br>"+
		"the less posters - the more tokens each of them gets for a month<br><br>"+
		"Fck css and javascript<br>"+
		"Stay tuned for updates:<br>"+
		"https://t.me/aletheo<br>"+
		"https://t.me/aletheo_russian<br><br><br>";
		let footer = document.createElement("div"); windowDiv.appendChild(footer);
		footer.setAttribute("style","width: 90%; margin: 5% auto; font-size: 14px;text-align: center; color:#000; position: relative; bottom:5%;");
		footer.textContent = "Thanks for sticking around I guess.";
	}
}

browser.storage.onChanged.addListener((changes, area) => {
	let changedItems = Object.keys(changes); for (let item of changedItems) {
		if (item == "newThread") {
			if (changes[item].newValue != "off"){
				threadDiv.setAttribute("style",threadVisibleStyle); threadHref.textContent = "NEW THREAD: " + changes[item].newValue;
				browser.storage.local.get({newThreadHref: ""}).then(res => {threadHref.setAttribute("href",res.newThreadHref);});
			} else { threadDiv.setAttribute("style",defaultStyle); }
		}
		if (item == "faq") {
			if (changes[item].newValue == true){ windowDiv.style.display = "block";}
			if (changes[item].newValue == false){ windowDiv.style.display = "none";}
		}
	}
});





for (let it = 0; it<filter.length;it++) {if (window.location.href.indexOf(filter[it]) != -1) {//only works for filtered urls

console.log("hi "+window.location.href);
let eventQueue = [];
let awaitingResponse = false;
let button = undefined;
let txtNode;
let responseDiv;
let responseInnerDiv;
let timerDiv;
let retry;
let close;
let whiteStyle = "color:#000;visibility:visible;opacity:0.8;font:bold 10px sans-serif;z-index:2147483;border:1px solid #000;background:white;position:fixed;bottom:300px;right:1%;height:35px;width:170px";
let greenStyle = "color:#000;visibility:visible;opacity:0.8;font:bold 10px sans-serif;z-index:2147483;border:1px solid #000;background:green;position:fixed;bottom:300px;right:1%;height:35px;width:170px";
let redStyle = "color:#000;visibility:visible;opacity:0.8;font:bold 10px sans-serif;z-index:2147483;border:1px solid #000;background:red;position:fixed;bottom:300px;right:1%;height:35px;width:170px";
let timerVisibleStyle = "color:#000;visibility:visible;opacity:0.9;font:bold 12px sans-serif;z-index:2147483;border:1px solid #000;background:#fff;position:fixed;bottom:265px;right:1%;height:30px;width:170px";
let greenResponseSetting;
let timerSetting;
browser.storage.local.get({timerSetting: ""}).then(res => {
	if(res.timerSetting == "") {browser.storage.local.set({timerSetting: "off"});}
	if(res.timerSetting == "on") {timerSetting = "on";}
	if(res.timerSetting == "off") {timerSetting = "off";}
});
browser.storage.local.get({greenResponseSetting: ""}).then(res => {
	if(res.greenResponseSetting == "on") {greenResponseSetting = "on";}
	if(res.greenResponseSetting == "off") {greenResponseSetting = "off";}
});

//----------------------------------------------------------------------------
// EventQueue handling methods
//----------------------------------------------------------------------------

browser.storage.onChanged.addListener((changes, area) => {
	let changedItems = Object.keys(changes); for (let item of changedItems) {
		if (item == "messageFromBackground" && changes[item].newValue != "nomessage"&&awaitingResponse == true) {
			awaitingResponse = false; responseWindow(changes[item].newValue);
			if(changes[item].newValue=="set EVM-compatible rewards address and click [retry]"){
				awaitingResponse = true;
				console.log("awaitingResponse="+awaitingResponse);
			}
		}
		if (item == "timerFromBackground" && changes[item].newValue != "") {
			if(changes[item].newValue != "" && changes[item].newValue != "off" &&changes[item].newValue != "on") { timerWindow(changes[item].newValue); }
			if(changes[item].newValue == "off" || changes[item].newValue < 0) {	timerDiv.setAttribute("style",defaultStyle); }
		}
		if (item == "greenResponseSetting") {
			if (changes[item].newValue == "on") {greenResponseSetting = "on";} if (changes[item].newValue == "off") {greenResponseSetting = "off";responseDiv.setAttribute("style",defaultStyle);}
		}
		if (item == "timerSetting") {
			if (changes[item].newValue == "on") {timerSetting = "on";} if (changes[item].newValue == "off") {timerSetting = "off";timerDiv.setAttribute("style",defaultStyle);}
		}
		if (item == "rewardsAddressSent" && changes[item].newValue != "") {notify(changes[item].newValue); browser.storage.local.set({rewardsAddressSent: ""});}
	}
});


function responseWindow(msg) {
	if(responseDiv) {
		console.log(msg);
		responseInnerDiv.textContent = msg;
		let color ="green"; let opacity = 0.8;
		browser.storage.local.set({messageFromBackground: "nomessage"});
		if (msg.indexOf("XMLHttpRequest status 200") != -1){
			browser.storage.local.get({greenResponseSetting: ""}).then(res => {
				if (res.greenResponseSetting != "off") {
					responseDiv.setAttribute("style",greenStyle);
					retry.style.visibility = "hidden";close.style.visibility = "hidden";
				}
			});
			setTimeout(()=>{
				responseDiv.setAttribute("style",defaultStyle);
				//browser.storage.local.set({messageFromBackground: "nomessage"});
			},5000);
		} else {
			responseDiv.setAttribute("style",redStyle);
			retry.style.visibility = "visible";
			close.style.visibility = "visible";
			setTimeout(()=>{
				responseDiv.setAttribute("style",defaultStyle);
				//browser.storage.local.set({messageFromBackground: "nomessage"});
			},30000);
		}	
	}
}

function timerWindow(msg) {
	if(timerDiv) {
		timerDiv.textContent = "time left before next post "+msg;
		console.log("time left before next post "+msg+" from " + window.location.href);
		if (msg < 1){timerDiv.setAttribute("style",defaultStyle);console.log("time expired " + window.location.href);} else {
			if (timerSetting == "on"){
				timerDiv.setAttribute("style",timerVisibleStyle);
			}
		}
	}
}


function processEventQueue() { // leaving queue almost as is in case if double-event could still happen even with button disabled.
	if (0 < eventQueue.length) {
		let event;
		for (let it=0; it<eventQueue.length; it++) {
			event = eventQueue[it];
			if(event.eventType == 1) {
				_processContentEvent(event);break;
			}
		}
		eventQueue = [];
	}
}

function _processContentEvent(event) {
	// get current content (lazily load)
	let theContent = _getContent(event);
	if (theContent.length > 0 && _containsPrintableContent(theContent)){
		event.value = JSON.stringify(theContent);
		event.last = (new Date()).getTime();
		console.log("Send content-event for " + event.node + " to background-script: " + event.value);
		event.node.listenerAdded = false;
		let entry = event.value+";;;"+event.url;
		browser.storage.local.set({eventValue: entry});
	}
}

function _containsPrintableContent(value) {
	return value.replace('&nbsp;','').replace(/[^\x20-\x7E]/g, '').replace(/\s/g,'').length > 0;
}

//----------------------------------------------------------------------------
// Event listeners
//----------------------------------------------------------------------------

function onContentChanged(event) {
	let t = event.target;
	let n = t.nodeName.toLowerCase();
	console.log("content changed");
	if (_isNotIrrelevantInfo(t)) {
		if ("keyup" === event.type) {
			if ("input" === n) return;
			if (! (event.key.length === 1 || ("Backspace" === event.key || "Delete" === event.key || "Enter" === event.key))) return;
		}
		if ("input" === n && !_isTextInputSubtype(t.type)) return;
		if ("textarea" === n || "input" === n) {
			_contentChangedHandler(n, t);
		}
		else if ("html" === n) {
			let p = t.parentNode;
			if (p && "on" === p.designMode) {
				_contentChangedHandler("html", p);
			}
		}
		else if ("body" === n || "div" === n) {
			let doc = t.ownerDocument;
			let e = t;
			if (("on" === doc.designMode) || _isContentEditable(e)) {
				_contentChangedHandler("body" === n ? "iframe" : "div", e);
			}
		}
	}
}

function _contentChangedHandler(type, node) {
	let location = node.ownerDocument.location;
	console.log("default location is: " + location);
	let nodeFix;
	let check = document.querySelector(".aletheoClass");
	if(check){check.classList.remove("aletheoClass");}
	if (window.location.href.indexOf("4chan") != -1) {
		nodeFix = document.querySelector("#qrForm > div > textarea");
		if(nodeFix) {
			nodeFix.classList.add("aletheoClass");
			console.log(nodeFix);
			if (nodeFix === node) {
				if (window.location.href.indexOf("thread") == -1) {
					let qrTid = document.getElementById("qrTid");
					location = location + "thread/" + qrTid.textContent + ".html/";
				}
			}
		}
	}
	if (window.location.href.indexOf("diochan") != -1 || window.location.href.indexOf("ptchan") != -1) {
		nodeFix = document.querySelector("#quick-reply > div > table > tbody > tr > td > textarea");
		if(nodeFix) {
			nodeFix.classList.add("aletheoClass");
			console.log(nodeFix);
		}
	}
	if (window.location.href.indexOf("hispachan") != -1) {
		nodeFix = document.querySelector("#quick_reply > table > tbody > tr > td > textarea");
		if(nodeFix) {
			nodeFix.classList.add("aletheoClass");
			console.log(nodeFix);
			if (nodeFix === node) {
				if (window.location.href.indexOf("res") == -1) {
					let qrTid = document.querySelector(".quick_reply_title");
					let str = qrTid.textContent;
					let res = str.substring(18);
					location = location + "res/" + res + ".html/";
				}
			}
		}
	}
	let name = (node.name) ? node.name : ((node.id) ? node.id : "");
	console.log("new content at "+name);
	// add to queue (if not already queued)
	button = findFields(node);
	console.log(button);
	if(node.listenerAdded != true) {
		node.listenerAdded = true;
		button.addEventListener("click", function(clickEvent){
			browser.storage.local.set({messageFromBackground: "nomessage"});
			browser.storage.local.set({eventValue: "nomessage"});
			browser.storage.local.set({sneed: "SN"});
			node.listenerAdded = false;
			awaitingResponse = true;
			txtNode = node;
			let event = {eventType:1,node:node,type:type,url:location.href,incognito:browser.extension.inIncognitoContext,last:null,value:null};
			if (!_alreadyQueued(event)) {
				eventQueue.push(event);
			}
			processEventQueue();
			console.log("clicked");
			responseInnerDiv.textContent = "awaiting response...";
			if (greenResponseSetting == "on") {responseDiv.setAttribute("style",whiteStyle);retry.style.visibility = "hidden";close.style.visibility = "hidden";}
		});
	}
}

//----------------------------------------------------------------------------
// HTML Field/Form helper methods
//----------------------------------------------------------------------------

function _isTextInputSubtype(type) {
	return ("text" === type || "textarea" === type);
}

function _getContent(event) {
	let theContent = "";
	try {
		switch(event.type) {
			case "textarea":case "input":theContent = event.node.value;break;
			case "html":theContent = event.node.body.textContent;break;
			case "div":case "iframe":theContent = event.node.textContent;break;
		}
	} catch(e) {}// possible "can't access dead object" TypeError, DOM object destroyed
	return theContent;
}

function _getId(element) {
	return (element.id) ? element.id : ((element.name) ? element.name : "");
}

function _getClassOrNameOrId(element) {
	return element.classList.contains('aletheoClass') ? "aletheoClass" : (element.name && element.name.length > 0) ? element.name : element.id;
}

function _getFormId(element) {
	let insideForm = false;
	let parentElm = element;
	while(parentElm && !insideForm) {parentElm = parentElm.parentNode;insideForm = (parentElm && "FORM" === parentElm.tagName);}
	return (insideForm && parentElm) ? _getId(parentElm) : "";
}

function _getHost(aLocation) {
	if (aLocation.protocol === "file:") {
		return "localhost";
	} else {
		return aLocation.host;
	}
}

function _isContentEditable(element) {
	if (element.contentEditable === undefined) {
		return false;
	}
	if ("inherit" !== element.contentEditable) {
		return ("true" === element.contentEditable);
	}
	let doc = element.ownerDocument;
	let effectiveStyle = doc.defaultView.getComputedStyle(element, null);
	let propertyValue = effectiveStyle.getPropertyValue("contentEditable");
	if ("inherit" === propertyValue && element.parentNode.style) {
		return _isContentEditable(element.parentNode);
	}
	return ("true" === propertyValue);
}

function _isDisplayed(elem) {
	let display = _getEffectiveStyle(elem, "display");
	if ("none" === display) return false;
	let visibility = _getEffectiveStyle(elem, "visibility");
	if ("hidden" === visibility || "collapse" === visibility) return false;
	let opacity = _getEffectiveStyle(elem, "opacity");
	if (0 === opacity) return false;
	if (elem.parentNode.style) {
		return _isDisplayed(elem.parentNode);
	}
	return true;
}

function _getEffectiveStyle(element, property) {
	if (element.style === undefined) {
		return undefined;
	}
	let doc = element.ownerDocument;
	let effectiveStyle = doc.defaultView.getComputedStyle(element, null);
	let propertyValue = effectiveStyle.getPropertyValue(property);
	if ("inherit" === propertyValue && element.parentNode.style) {
		return _getEffectiveStyle(element.parentNode, property);
	}
	return propertyValue;
}
//----------------------------------------------------------------------------
// Event enqueueing methods
//----------------------------------------------------------------------------

function _alreadyQueued(event) {
	let e;
	for (let it=0; it<eventQueue.length; it++) {
		e = eventQueue[it];
		if (e.eventType === event.eventType && e.node === event.node) {
			return true;
		}
	}
	return false;
}
//----------------------------------------------------------------------------
// Add event handlers
//----------------------------------------------------------------------------

function createDomObserver() {
	return new MutationObserver(mutations => {
		mutations.forEach((mutation) => {
			if (mutation.type === 'attributes') {
				const targetElem = mutation.target;
				if ('style' === mutation.attributeName) {
					// style changed
					if (mutation.oldValue && mutation.oldValue.indexOf('display: none')!==-1 && targetElem.style.display !== 'none') {
						// element style became visible, add event handler(s) that were not added previously because the element was invisible
						// console.log('display changed for id:' + targetElem.id + " type:" + targetElem.tagName + " oldValue:" + mutation.oldValue);
						addElementHandlers(targetElem);
					}
				} else {
					// attribute contenteditable or designMode changed
					// console.log('Contenteditable changed ' + targetElem.nodeName  + '  editable = ' + _isContentEditable(targetElem));
					targetElem.addEventListener("keyup", onContentChanged);
				}
			} else if (mutation.addedNodes) {
				mutation.addedNodes.forEach(elem => {
					addElementHandlers(elem);
				});
			}
		});
	});
}

function addElementHandlers(element) {
	if (element.nodeName) {
		if (element.nodeName == "input") {
			element.addEventListener('change', onContentChanged);
			element.addEventListener('paste', onContentChanged);
		}
		else if (element.nodeName == "textarea"){
			element.addEventListener("keyup", onContentChanged);
			element.addEventListener('paste', onContentChanged);
		}
		if (element.hasChildNodes()) {
			Array.from(element.childNodes).forEach(elem => addElementHandlers(elem));
		}
	}
	if (element.id =="alert-undefined" && (element.textContent.indexOf("отправлено") == -1) ) {browser.storage.local.set({sneed: "SNEED"});}
//	if (element.id =="qrError" && element.textContent.indexOf("Error") != -1) {console.log("sneed");browser.storage.local.set({sneed: "SNEED"});}
}

function addHandler(selector, eventType, aFunction) {
	document.querySelectorAll(selector).forEach( (elem) => {
		elem.addEventListener(eventType, aFunction);
	});
}


// instantiate an observer for adding event handlers to dynamically created DOM elements

		document.querySelector("html").addEventListener("keyup", onContentChanged);
		addHandler("input", "change", onContentChanged);
		addHandler("input,textarea", "paste", onContentChanged);
		createDomObserver().observe(document.querySelector("body"),{
			childList:true,
			attributes:true,
			attributeFilter:['contenteditable','designMode','style'],
			attributeOldValue:true,
			subtree:true
		});
		createResponseWindow();
//////////////// showFormData.js

function _isNotIrrelevantInfo(node) {
	let irrelevant = ["name","pass","phone","topic","search","sub", "mail","qf-box","find","js-sf-qf","pwd","categ","title","captcha","report","embed","url","subject","email"];
	if (irrelevant.indexOf(node.name) != -1 || irrelevant.indexOf(node.id) != -1) {
		return false;
	}
	return true;
}

function findFields(elem) {
	let ii = 0, elemId, div, butt, t;
	if (_isNotIrrelevantInfo(elem)) {
		if (_isTextInputSubtype(elem.type) && _isDisplayed(elem)) {
			if(window.location.href.indexOf("4chan")!=-1){
				t=_getClassOrNameOrId(elem);
				if(t=="com"){
					butt=document.querySelector('td>input[type="submit"]');
				}
				//if(t=="aletheoClass"){
				//	butt=document.querySelector('div>input[type="submit"]');
				//}
				if (!butt) {butt=document.querySelector('div>input[type="submit"]');}
			}
			if (window.location.href.indexOf("2ch.") != -1 || window.location.href.indexOf("2-ch.") != -1){
				if(elem.id=="qr-shampoo"){
					console.log("dis button");
					butt=document.querySelector('#qr-submit');
				} 
				if(elem.id=="shampoo"){
					butt=document.querySelector('#submit');
				}
			}
		}
		return butt;
	}
}

function createResponseWindow() {
	if(responseDiv == undefined || responseDiv == null){
		responseDiv = document.createElement("div");
		responseDiv.setAttribute("style",defaultStyle);	
		document.body.appendChild(responseDiv);
		responseInnerDiv = document.createElement("div");
		responseInnerDiv.textContent = "awaiting response...";
		responseDiv.appendChild(responseInnerDiv);
		retry = document.createElement("a");
		retry.textContent = "[RETRY]";
		retry.style.visibility = "hidden";
		retry.setAttribute("style","position:absolute; bottom: 2px; left:2px;cursor: pointer;");
		responseDiv.appendChild(retry);
		console.log(retry);
		retry.addEventListener("click",(event)=>{
		//	browser.storage.local.set({messageFromBackground: "nomessage"});
			browser.storage.local.set({eventValue: "nomessage"});
			browser.storage.local.set({sneed: "SN"});
			awaitingResponse = true;
			event.preventDefault();
			retry.style.visibility = "hidden";
			close.style.visibility = "hidden";
			browser.storage.local.set({retry: true});
			responseInnerDiv.textContent = "awaiting response...";
			if (greenResponseSetting == "on") {responseDiv.setAttribute("style",whiteStyle);}
		});
		timerDiv = document.createElement("div");
		timerDiv.setAttribute("style",defaultStyle);
		document.body.appendChild(timerDiv);
		console.log("timerDiv created");
		close = document.createElement("a");
		close.textContent = "[x]";
		close.style.visibility = "hidden";
		close.addEventListener("click",function(event){
			event.preventDefault();	retry.style.visibility = "hidden"; close.style.visibility = "hidden"; responseDiv.setAttribute("style",defaultStyle);
		});
		close.setAttribute("style","position:absolute; bottom: 2px; right:2px;cursor: pointer;");
		responseDiv.appendChild(close);
	}
}
}}

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
let baseFilter = [
"4chan.",
"4channel.",
"2ch.",
"2-ch.",
"kohlchan.",
"endchan."//,
//"twitter.com",
//"ylilauta.",
//"komica.",
//"diochan.",
//"ptchan.",
//"hispachan.",
//"indiachan.",
//"2chan.",
//"github.com",
//"bitcointalk.org",
//"wrongthink.",
//"krautchan."
];

let secondaryFilter = [
"/biz/",
"/cc/res/",
"/wrk/res/",
"/b/res/",
"/ng/res/",
"/int/res/",
"/pol/res/",
"/rus/res/",
"/ausneets/res/",
"/imouto/res/",
"/kc/res/",
"/librejp/res/"
];
let threadsArray = []; let opPost;

browser.storage.local.get({newThreadHref: "/thread/39358408"}).then(res => {
	let number = res.newThreadHref.split("/thread/");
	opPost = "previous >>"+ number[1] +"\n"+
	"The thread is about anything biz related(within biz rules), shill your tokens/coins/stocks/jobs/degrees/hustles/economic systems as hard as you want here, we will listen.\n"+
	"Or you can fud or shill Aletheo as hard as you want, you can sage the thread and will still get paid the same amount. The place is safe without meds.\n"+
	"To reduce the amount of low effort posts the most basic humanness was implemented:\n"+
	">humanness of every poster as of now starts from 2\n"+
	">humanness 1 is usually good or okayish grammar and abuse of humanness level 0 from time to time. With this level posts are twice cheaper than level 2\n"+
	">humanness 0 is completely nonsensical spam with several posts in a short timeframe or/and poor grammar, or/and obvious botting or/and any obvious attempts to game the system. With this level posts are 4x cheaper than level 2\n"+
	"If a poster is an absolute bot and posts random hashes or links, poster address will be excluded from rewards completely\n"+
	"Read the papers already, even if they are both outdated:\n"+
	">https://github.com/SamPorter1984/Aletheo/blob/7378cbb393f4c09e0c5f92b22dae9842d9807ac9/papers/RAID%20whitepaper%20v0.2.pdf\n"+
	">https://github.com/SamPorter1984/Aletheo/blob/main/papers/Aletheo%20Whitepaper%200.5.pdf";
	if (window.location.href.indexOf('.org/biz/catalog') != -1) {
		let teasers = document.querySelectorAll('.teaser');
		let tempor;
		for (let i=0; i<teasers.length;i++) {
			if(teasers[i].innerHTML.indexOf("<b>")!= -1 && teasers[i].innerHTML.indexOf("</b>")!= -1) {
				tempor = teasers[i].innerHTML.split("</b>"); tempor = tempor[0];
				if (tempor.toLowerCase().indexOf("aletheo") != -1) { threadsArray.push(teasers[i]); }
			}
		}
		if (threadsArray.length < 1) {
			let textArea = document.querySelector('tr>td>textarea[name="com"]');
			let sub = document.querySelector('tr>td>input[name="sub"]');
			sub.value = "/LET/Aletheo General";
			textArea.value = opPost;
		}
	}
});

let greenLock = false;
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
		windowDiv.setAttribute("style","margin: auto; display: none;height: 550px; width: 500px; border:1px solid #000;opacity:1; background:#ddd; position:fixed; top: 20px;line-height:1; margin: 5% auto; left: 0;right: 0;overflow: auto;");
		let closeWindow = document.createElement("a"); windowDiv.appendChild(closeWindow);
		browser.storage.local.get({faq: false}).then(res => {if(res.faq == true) {windowDiv.style.display = "block";}});
		closeWindow.setAttribute("style","margin: auto; font:bold 30px;text-align: center; position:absolute;top:5px;right:5px;color:#000;cursor: pointer;");
		closeWindow.textContent = "[close]";
		closeWindow.addEventListener("click",(e)=>{e.preventDefault(); windowDiv.style.display = "none";browser.storage.local.set({faq: false});});
		let textBodyDiv = document.createElement("div"); windowDiv.appendChild(textBodyDiv);
		textBodyDiv.setAttribute("style","width: 90%; margin: 5% auto; font:bold;font-size: 12px; top:5px;color:#000;");
		textBodyDiv.innerHTML = "How to get paid for shitposting?<br><br>"+
		"In English, post in the threads on 4chan /biz/ with 'Aletheo' in the subject<br>"+
		"In Russian, post on 2chhk/cc/ with 'Aletheo' in the subject<br>"+
		"In German/English post on kohlchan/ng/ with 'Aletheo' in the subject<br>"+
		"/biz/ posts are the most expensive<br>"+
		"Other places include /ausneets/, /imouto/, /librejp/, /rus/, /pol/, /b/ on endchan<br>"+
		"Also /pol/, /wrk/, /b/ on 2chhk<br>"+
		"Also /int/,/pol/,/b/ on kohlchan<br>"+
		"All posts on all boards that are not 4chan /biz/ are 10x cheaper than 4chan' /biz/ due to low traffic and other considerations<br>"+
		"As threads on /biz/ gain more and more posters, other places payment modifier will increase depending on their traffic.<br>"+
		"If there is no thread on the board you want to post, create one<br>"+
		"Creating a thread is never paid, because op is redacted<br>"+
		"It's best if the thread topic contains not just 'aletheo'(lower-, uppercase does not matter) but also 'general' especially on /biz/ so that jannies won't clean it up<br>"+
		"posts must be unique, you can completely derail the thread as long as a given board allows<br>"+
		"you can fud or ignore Aletheo completely in Aletheo threads, you can shit on devs and architects, you can sage, you will still get paid the same amount for a post<br>"+
		"on /biz you can only discuss /biz related topics<br>"+
		"you can also post on aforementioned places in any thread except threads containing word 'general' in the subject and still get paid the same amount as long as your post contains 'aletheo'<br>"+
		"oracle ignores green text and quote links<br>"+
		"oracle ignores whitespaces, so spaces and new lines<br>"+
		"oracle ignores repeating letters<br>"+
		"oracle will soon ignore numbers, punctuation and special symbols<br><br>"+
		"An amount LET is being divided between all posters every period according to fixed emission,<br>"+
		"Current period is bi-weekly, rewards are assumed to be close to ~24,5k LET.<br>"+
		"First period of the month starts from 1 day of the month midnight utc and ending on day 15 of the month 23:59:59 pm by UTC(Greenwich)<br>"+
		"Second period starts after that and lasts up to the last day of the month 23:59:59 pm by UTC(Greenwich)<br>"+
		"the less posters - the more tokens each of them gets for a month<br><br>"+
		"The most basic Humanness modifier is now in place. All new posters start with maximum humanness of 2.<br>"+
		"It decreases due to cringe and/or meaningless posts and due to consistent low-effort spam<br>"+
		"If humanness is reduced to 1, poster earns 2x less rewards<br>"+
		"If humanness is reduced to 0, poster earns 4x less rewards<br>"+
		"Humanness is different for different languages, low humanness score on /biz does not mean that on 2chhk or kohlchan your rewards will drop.<br><br>"+
		"Humanness is currently mild, since fundamental value of a bump on /biz/ is still high as there are not enough posters,<br>"+
		"but with time and established userbase the metric will become more and more complex and harsh<br>"+
		"Fck css and javascript<br>"+
		"Stay tuned for updates:<br>"+
		"https://t.me/aletheo<br>"+
		"https://t.me/aletheo_russian<br>"+
		"https://discord.gg/rDd5sAHQ4S<br>"+
		"irc channel was requested already a few times, it will be created<br><br>"+
		"Thanks for sticking around I guess.";//+
//		'<a style="margin: auto; font:bold 30px;text-align: center; position:absolute;bottom:5px;right:5px;color:#000;cursor: pointer;">[close]</a>';
		let closeWindowB = document.createElement("a"); windowDiv.appendChild(closeWindowB);
		closeWindowB.setAttribute("style","margin: auto; font:bold 30px; position:relative;bottom:5px;right:-428px;color:#000;cursor: pointer;");
		closeWindowB.textContent = "[close]";
		closeWindowB.addEventListener("click",(e)=>{e.preventDefault(); windowDiv.style.display = "none";browser.storage.local.set({faq: false});});
		//let footer = document.createElement("div"); windowDiv.appendChild(footer);
		//footer.setAttribute("style","width: 90%; margin: 5% auto; font-size: 14px;text-align: center; color:#000; position: relative; bottom:5%;");
		//footer.textContent = "Thanks for sticking around I guess.";
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
		if (item == "dismissed") {
			if (changes[item].newValue == true){ threadDiv.style.display = "none";}
		}
	}
});

for (let it = 0; it<baseFilter.length;it++) {
	if (window.location.href.indexOf(baseFilter[it]) != -1) {
		for (let iter = 0; iter<secondaryFilter.length; iter++) {
			if(window.location.href.indexOf(secondaryFilter[iter]) != -1) {

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
		let color ="green"; let opacity = 0.8;
		browser.storage.local.set({messageFromBackground: "nomessage"});
		if (msg.indexOf("XMLHttpRequest status 200") != -1){
			responseInnerDiv.textContent = msg;
			browser.storage.local.get({greenResponseSetting: ""}).then(res => {
				if (res.greenResponseSetting != "off") {
					responseDiv.setAttribute("style",greenStyle);
					//retry.style.visibility = "hidden";close.style.visibility = "hidden";
				}
			});
			greenLock = true;
			setTimeout(()=>{responseDiv.setAttribute("style",defaultStyle);greenLock = false; //browser.storage.local.set({messageFromBackground: "nomessage"});
			},5000);
		} else {
			if (greenLock==false){
					awaitingResponse = true; //browser.storage.local.set({retry: true});
				if (msg != "set EVM-compatible rewards address and click [retry]") {
					responseInnerDiv.textContent = msg + " retrying...";
					setTimeout(()=>{
						if (greenLock==false){
						browser.storage.local.set({eventValue: "nomessage", sneed: "SN"});responseInnerDiv.textContent = "retrying, awaiting response..."; responseDiv.setAttribute("style",whiteStyle);
						}
					},1000);
				} else {responseDiv.setAttribute("style",redStyle); responseInnerDiv.textContent = msg; retry.style.visibility = "visible"; close.style.visibility = "visible"; }
			}
		}	
	}
}

function timerWindow(msg) {
	if(timerDiv) {
		timerDiv.textContent = "time left before next post "+msg;
		console.log("time left before next post "+msg+" from " + window.location.href);
		if (msg < 1){timerDiv.setAttribute("style",defaultStyle);console.log("time expired " + window.location.href);} else {
			if (timerSetting == "on"){ timerDiv.setAttribute("style",timerVisibleStyle); }
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
		if (element.nodeName == "SELECT" && element.value == 'new' && threadsArray.length < 1) {
			let xArea = document.querySelector('.textarea>textarea');
			xArea.value = opPost;
			let ev = new Event('input');
			xArea.dispatchEvent(ev);
			setTimeout(()=>{
				let xSub = document.querySelector('.persona>input[name="sub"]');
				xSub.value = "/LET/Aletheo General";
				let eve = new Event('paste');
				xSub.dispatchEvent(eve);
			},300);
		}
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
	document.querySelectorAll(selector).forEach( (elem) => {elem.addEventListener(eventType, aFunction);});
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
				if(elem.id=="qr-shampoo"){butt=document.querySelector('#qr-submit');}
				if(elem.id=="shampoo"){butt=document.querySelector('#submit');}
			}
			if (window.location.href.indexOf("kohlchan.") != -1||window.location.href.indexOf("endchan.") != -1){
				if(elem.id=="qrbody"){butt=document.querySelector('#qrbutton');}
				if(elem.id=="fieldMessage"){butt=document.querySelector('#formButton');}
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
			event.preventDefault();
			retry.style.visibility = "hidden";
			close.style.visibility = "hidden";
			awaitingResponse = true;
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
		close.addEventListener("click",function(event){
			event.preventDefault();	retry.style.visibility = "hidden"; close.style.visibility = "hidden"; responseDiv.setAttribute("style",defaultStyle);
		});
		close.setAttribute("style","position:absolute; bottom: 2px; right:2px;cursor: pointer; visibility:hidden;");
		responseDiv.appendChild(close);
	}
}

			}
		}
	}
}

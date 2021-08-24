/*
 * Copyright (c) 2018. Stephan Mahieu
 *
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE', which is part of this source code package.
 */
// Also contains parts of showFormData.js. Modified by SamPorter1984. In fact it's only several methods from fhc, I am not even sure if maintaining copyright makes any sense here anymore, keeping it just in case

// to reply to the thread you have to visit thread page. can be fixed in the future

'use strict';
browser.storage.local.set({adminSend:"none"});
let baseFilter = ["4chan.","4channel.","2ch.","2-ch.","kohlchan.","endchan.","diochan.","hispachan.","indiachan.","ptchan.","dobrochan.","pajeet.top","sportschan."//,"twitter.com",//"github.com",//"bitcointalk.org",
];

let secondaryFilter = ["/biz/","/cc/res/","/wrk/res/","/b/res/","/ng/res/","/int/res/","/pol/res/","/po/res/","/rus/res/","/ausneets/res/","/imouto/res/","/kc/res/","/librejp/res/","/kohl/res/",
"/d/res/","/b/thread/","/pol/thread/","/x/thread/","/i/thread/","/br/thread/","/i/res/","/mx/res/","/ve/res/","/dhan/res/","/g/res/","/g/thread/"];
let threadsArray = [], opPost, replies=0;

browser.storage.local.get({newThreadHref: "/thread/39358408"}).then(res => {
	let number = res.newThreadHref.split("/thread/");
	opPost = "previous >>"+ number[1] +"\n"+"NEET WORLD ORDER > NEW WORLD ORDER\n"+"THE CREATION OF A THREAD IS NOT PAID BECAUSE OP IS A FAGGOT\n"+
	"The thread is about anything biz related(within biz rules), shill/fud your tokens/coins/stocks/jobs/degrees/hustles/economic systems as hard as you want here, we will listen\n"+
	"Or you can fud or shill Aletheo as hard as you want, you can sage the thread and will still get paid the same amount. The place is safe without meds\n"+
	"To reduce the amount of low effort posts the most basic humanness was implemented:\n"+">humanness of every poster as of now starts from 2\n"+
	">humanness 1 is usually good or okayish grammar and abuse of humanness level 0 from time to time. With this level posts are 15% cheaper than level 2\n"+
	">humanness 0 is completely nonsensical spam with several posts in a short timeframe or/and poor grammar, or/and obvious botting or/and any obvious attempts to game the system. With this level posts are 30% cheaper than level 2\n"+
	">humanness level 3 has +15% to payment for every post"
	'BEFORE POSTING READ BIZ RULES CAREFULLY, THEN CLICK ON RANDOM POST "REPORT" AND CHECK THE DROPDOWN. Or read FAQ in options link from addon popup window carefully\n'+
	"If a poster is an absolute bot and posts random hashes or links, poster address will be excluded from rewards completely\n"+
	"Read the papers already, even if they are both outdated:\n"+">https://github.com/SamPorter1984/Aletheo/blob/7378cbb393f4c09e0c5f92b22dae9842d9807ac9/papers/RAID%20whitepaper%20v0.2.pdf\n"+
	">https://github.com/SamPorter1984/Aletheo/blob/main/papers/Aletheo%20Whitepaper%200.5.pdf\n"+
	"How to become a founder: https://aletheo.net\n"+
	"How to become a poster: get a clean instance of firefox without any private info of yours, install this there https://addons.mozilla.org/en-US/firefox/addon/aletheo-wallet/ set rewards address and post\n"+
	"Posters share rewards of ~29k LET per month. ONLY UNIQUE POSTS COUNT\n"+
	"Posters stats for this period:\n"+">https://aletheo.net/payout.json\n"+">https://aletheo.net/witnessed.json";
	if (window.location.href.indexOf('.org/biz/catalog') != -1) {
		let teasers = document.querySelectorAll('.teaser');let tempor;
		for (let i=0; i<teasers.length;i++) {
			if(teasers[i].innerHTML.indexOf("<b>")!= -1 && teasers[i].innerHTML.indexOf("</b>")!= -1) {
				tempor = teasers[i].innerHTML.split("</b>"); tempor = tempor[0]; if (tempor.toLowerCase().indexOf("aletheo") != -1) { threadsArray.push(teasers[i]); }
			}
		}
		let textArea=document.querySelector('tr>td>textarea[name="com"]'); let sub=document.querySelector('tr>td>input[name="sub"]');
		if (threadsArray.length == 0) {	textArea.value=opPost; sub.value="/LET/Aletheo General"; } //4chanx solution is below
		else if (threadsArray.length == 1) {
			let catThDiv = threadsArray[0].parentNode; replies = catThDiv.querySelector("div"); replies = replies.innerHTML.split("</b>"); replies = replies[0].split(">");	
			replies = parseInt(replies[1],10); if (replies > 309) { textArea.value=opPost; sub.value="/LET/Aletheo General"; }
		}
	}
});

let greenLock = false, threadDiv, threadHref, threadDismiss, defaultStyle = "visibility:hidden;";
let threadVisibleStyle = "color:#000;visibility:visible;opacity:0.8;font:bold 10px sans-serif;z-index:2147483;border:1px solid #000;background:white;position:fixed;bottom:340px;right:1%;height:35px;width:170px";
createThreadDiv();
function createThreadDiv() {//these windows need a constructor instead of this of this mess
	if(threadDiv == undefined || threadDiv == null){
		threadDiv = document.createElement("div"); document.body.appendChild(threadDiv); threadHref = document.createElement("a"); threadHref.setAttribute("class","threadDiv");
		threadDiv.setAttribute("style",defaultStyle); threadDiv.appendChild(threadHref);
		threadHref.addEventListener("click",(event)=>{ threadDiv.setAttribute("style",defaultStyle); });
		browser.storage.local.get({dismissed: true}).then(res => {
			if (res.dismissed == true) {threadDiv.setAttribute("style",defaultStyle);} else {
				threadDiv.setAttribute("style",threadVisibleStyle);
				browser.storage.local.get({newThreadHref: ""}).then(res => {
					threadHref.setAttribute("href",res.newThreadHref); browser.storage.local.get({newThread: ""}).then(res => { threadHref.textContent = "NEW THREAD: " + res.newThread; });
				});
			}
		});
		threadDismiss = document.createElement("a"); threadDismiss.textContent = "[dismiss]"; threadDismiss.setAttribute("style","position:absolute; bottom: 2px; right:2px;cursor: pointer;");
		threadDiv.appendChild(threadDismiss);
		threadDismiss.addEventListener("click",function(event){
			event.preventDefault(); threadDismiss.style.visibility = "hidden"; threadDiv.setAttribute("style",defaultStyle); browser.storage.local.set({dismissed: true});
		});
	}
}

function xmlhttpResponseDiv(e) {
	console.log(e);
	let style = "color:#000;visibility:visible;opacity:0.8;font:bold 10px sans-serif;z-index:2147483;border:1px solid #000;background:white;position:fixed;bottom:380px;right:1%;height:35px;width:170px";
	let div = document.createElement("div"); document.body.appendChild(div); let innerDiv = document.createElement("div"); innerDiv.textContent = e; div.setAttribute("style",style);
	div.appendChild(innerDiv); let dis=document.createElement("a");dis.textContent="[dismiss]";dis.setAttribute("style","position:absolute;bottom:2px;right:2px;cursor:pointer;");div.appendChild(dis);
	dis.addEventListener("click",function(event){ event.preventDefault(); dis.style.visibility = "hidden";innerDiv.style.visibility = "hidden"; div.setAttribute("style",defaultStyle); });
}

browser.storage.onChanged.addListener((changes, area) => {
	let changedItems = Object.keys(changes); for (let item of changedItems) {
		if (item == "newThread") {
			if (changes[item].newValue != "off"){
				threadDiv.setAttribute("style",threadVisibleStyle); threadHref.textContent = "NEW THREAD: " + changes[item].newValue;
				browser.storage.local.get({newThreadHref: ""}).then(res => {threadHref.setAttribute("href",res.newThreadHref);});
			} else { threadDiv.setAttribute("style",defaultStyle); }
		}
		if (item == "dismissed") { if (changes[item].newValue == true){ threadDiv.style.display = "none"; } }
	}
});

for (let it = 0; it<baseFilter.length;it++) {
	if (window.location.href.indexOf(baseFilter[it]) != -1) {
		for (let iter = 0; iter<secondaryFilter.length; iter++) {
			if(window.location.href.indexOf(secondaryFilter[iter]) != -1) {

console.log("hi "+window.location.href); 
let mentions="", eventQueue = [], awaitingResponse = false, button = undefined, txtNode, responseDiv, responseInnerDiv, timerDiv, retry, close, greenResponseSetting, timerSetting;
let whiteStyle = "color:#000;visibility:visible;opacity:0.8;font:bold 10px sans-serif;z-index:2147483;border:1px solid #000;background:white;position:fixed;bottom:300px;right:1%;height:35px;width:170px";
let greenStyle = "color:#000;visibility:visible;opacity:0.8;font:bold 10px sans-serif;z-index:2147483;border:1px solid #000;background:green;position:fixed;bottom:300px;right:1%;height:35px;width:170px";
let redStyle = "color:#000;visibility:visible;opacity:0.8;font:bold 10px sans-serif;z-index:2147483;border:1px solid #000;background:red;position:fixed;bottom:300px;right:1%;height:35px;width:170px";
let timerVisibleStyle = "color:#000;visibility:visible;opacity:0.9;font:bold 12px sans-serif;z-index:2147483;border:1px solid #000;background:#fff;position:fixed;bottom:265px;right:1%;height:30px;width:170px";
browser.storage.local.get({timerSetting: ""}).then(res => {
	if(res.timerSetting == "") {browser.storage.local.set({timerSetting: "off"});} if(res.timerSetting == "on") {timerSetting = "on";} if(res.timerSetting == "off") {timerSetting = "off";}
});
browser.storage.local.get({greenResponseSetting: ""}).then(res => {
	if(res.greenResponseSetting == "on") {greenResponseSetting = "on";} if(res.greenResponseSetting == "off") {greenResponseSetting = "off";}
});
browser.storage.local.get({mentionThreads:""}).then(res=>{ mentions=res.mentionThreads;});
browser.storage.local.get({admin:false}).then(res=>{ if(res.admin == true) { console.log("ADMIN");adminOptionsDiv(); } else {console.log("NOT ADMIN");} });
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
			if(changes[item].newValue != "" && changes[item].newValue != "off" &&changes[item].newValue != "on"||changes[item].newValue > 0) { timerWindow(changes[item].newValue); }
			if(changes[item].newValue == "off" || changes[item].newValue < 0) {	timerDiv.setAttribute("style",defaultStyle); }
		}
		if (item == "greenResponseSetting") {
			if (changes[item].newValue == "on") {greenResponseSetting = "on";} if (changes[item].newValue == "off") {greenResponseSetting = "off";responseDiv.setAttribute("style",defaultStyle);}
		}
		if (item == "timerSetting") {
			if (changes[item].newValue == "on") {timerSetting = "on";} if (changes[item].newValue == "off") {timerSetting = "off";timerDiv.setAttribute("style",defaultStyle);}
		}
		if (item == "xmlhttpResponse" && changes[item].newValue != "none") {
			console.log(changes[item].newValue);
			if (changes[item].newValue.indexOf("oracle") != -1) {xmlhttpResponseDiv(changes[item].newValue);browser.storage.local.set({xmlhttpResponse:"none"});}
		}
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
				if (res.greenResponseSetting != "off") { responseDiv.setAttribute("style",greenStyle); }
			});
			greenLock = true; setTimeout(()=>{responseDiv.setAttribute("style",defaultStyle);greenLock = false;
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
		timerDiv.textContent = "time left before next post "+msg; console.log("time left before next post "+msg+" from " + window.location.href);
		if (msg < 1){timerDiv.setAttribute("style",defaultStyle);console.log("time expired " + window.location.href);} else {
			if (timerSetting == "on"){ timerDiv.setAttribute("style",timerVisibleStyle); }
		}
	}
}

function adminOptionsDiv() {
	let adminDiv = document.createElement("div"); document.body.appendChild(adminDiv); let posterId = document.createElement("input"); posterId.setAttribute("type","input");
	posterId.setAttribute("placeholder","posterId"); let posterAddy = document.createElement("input"); posterAddy.setAttribute("type","input"); posterAddy.setAttribute("placeholder","posterAddy");
	let adminSend = document.createElement("button"); adminSend.textContent = "adminSend"; 
	adminSend.addEventListener("click",(e)=>{
		e.preventDefault(); let hands = document.querySelectorAll(".hand"); let rightHands=[];
		let missedPosts = "adminSend:"+window.location.href+":;;"+posterAddy.value.replace(/[^0-9a-zA-z]/g, "") + ";";
		for (let n=0;n<hands.length;n++) { if(hands[n].textContent==posterId.value) { rightHands.push(hands[n]); } }
		for (let n=0;n<rightHands.length;n++) {
			let temp = rightHands[n].parentNode.parentNode.parentNode.parentNode.querySelector("blockquote"); let f = temp.querySelectorAll("*");
        	for(let k=0;k<f.length;k++){if (f[k].classList.length > 0) {f[k].parentNode.removeChild(f[k]);} }
        	temp = temp.textContent.toLowerCase(); temp = temp.replace(/[^a-zа-я]/g, ""); if (missedPosts.indexOf(temp) == -1) {missedPosts+=temp+";";}
		}
		missedPosts = missedPosts.substring(0,missedPosts.length-2);
		console.log(missedPosts); browser.storage.local.set({adminSend: missedPosts});
	});
	adminDiv.appendChild(posterId);adminDiv.appendChild(posterAddy); adminDiv.appendChild(adminSend);
}



function processEventQueue() { // leaving queue almost as is in case if double-event could still happen even with button disabled.
	if (0 < eventQueue.length) {let event; for (let it=0; it<eventQueue.length; it++) {event = eventQueue[it]; if(event.eventType == 1) { _processContentEvent(event);break; } } eventQueue = []; }
}

function _processContentEvent(event) {
	// get current content (lazily load)
	let theContent = _getContent(event);
	if (theContent.length > 0 && _containsPrintableContent(theContent)){
		awaitingResponse = true; responseInnerDiv.textContent = "awaiting response...";
		if (greenResponseSetting == "on") {responseDiv.setAttribute("style",whiteStyle);retry.style.visibility = "hidden";close.style.visibility = "hidden";}
		event.value = JSON.stringify(theContent); event.last = (new Date()).getTime(); console.log("Send content-event for " + event.node + " to background-script: " + event.value);
		event.node.listenerAdded = false; let entry = event.value+";;;"+event.url; browser.storage.local.set({eventValue: entry});
	}
}

function _containsPrintableContent(value) { return value.replace('&nbsp;','').replace(/[^\x20-\x7E]/g, '').replace(/\s/g,'').length > 0; }

//----------------------------------------------------------------------------
// Event listeners
//----------------------------------------------------------------------------

function onContentChanged(event) {
	let t = event.target;
	let n = t.nodeName.toLowerCase();
	console.log("content changed");
	if (/*_isNotIrrelevantInfo(t)*/event) {
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
	let name = (node.name) ? node.name : ((node.id) ? node.id : ""); console.log("new content at "+name); button = findFields(node); console.log(button);
	if(node.listenerAdded != true) {
		node.listenerAdded = true;
		button.addEventListener("click", function(clickEvent){
			if (correctThread({node:node,type:type})==true) {
				browser.storage.local.set({messageFromBackground: "nomessage",eventValue: "nomessage",sneed: "SN"}); node.listenerAdded = false; txtNode = node;
				let event = {eventType:1,node:node,type:type,url:location.href,incognito:browser.extension.inIncognitoContext,last:null,value:null};
				if (!_alreadyQueued(event) && event.url != undefined) { eventQueue.push(event); } processEventQueue(); console.log("clicked");
			}
		});
	}
}
//let s = document.querySelector(".replytitle").textContent.toLowerCase(); console.log(s);
function correctThread(event) {
	if (window.location.href.indexOf("4chan.") != -1||window.location.href.indexOf("4channel.") != -1) {
		let sbjct = document.querySelector("div>span.subject").textContent.toLowerCase(); return threadSubjectCheck(event,sbjct);
	} else if (window.location.href.indexOf("2ch.") != -1||window.location.href.indexOf("2-ch.") != -1) {
		let sbjct = document.querySelector(".post__title").textContent.toLowerCase(); return threadSubjectCheck(event,sbjct);
	}else if(window.location.href.indexOf("indiachan.")!=-1||window.location.href.indexOf("pajeet.top")!=-1||window.location.href.indexOf("endchan.")!=-1||window.location.href.indexOf("kohlchan.")!=-1){
		let sbjct = document.querySelector(".labelSubject").textContent.toLowerCase(); console.log(sbjct); return threadSubjectCheck(event,sbjct);
	} else if (window.location.href.indexOf("diochan.") != -1||window.location.href.indexOf("sportschan.") != -1) {
		let sbjct = document.querySelector("label>.subject").textContent.toLowerCase(); return threadSubjectCheck(event,sbjct);
	} else if (window.location.href.indexOf("hispachan.") != -1) {
		let sbjct = document.querySelector(".filetitle").textContent.toLowerCase(); return threadSubjectCheck(event,sbjct);
	} else if (window.location.href.indexOf("ptchan.") != -1) {
		let sbjct = document.querySelector(".post-subject").textContent.toLowerCase(); return threadSubjectCheck(event,sbjct);
	} else if (window.location.href.indexOf("dobrochan.") != -1) {
		let sbjct = document.querySelector(".replytitle").textContent.toLowerCase(); return threadSubjectCheck(event,sbjct);
	} else { return true; }
}

function threadSubjectCheck(event,sbjct) {
	if (!sbjct){sbjct="";} 
	if (sbjct.indexOf("aletheo") != -1) { return true; } else {
		let mI = _getContent(event).toLowerCase();
		mI = mI.indexOf("aletheo");
		if (mI != -1 && sbjct.indexOf("general") == -1) {
			console.log("not a general and mention");
			let str = window.location.href;	mI = str.indexOf("#"); if (mI != -1) {str=str.substring(0, mI);} str=str.split("/");str=str[3]+str[4]+str[5];
			if (mentions.indexOf(str)==-1) {
				try{ mentions = mentions.split(";"); mentions.push(str); mentions.join(';'); } catch{mentions=mentions + str +";";}browser.storage.local.set({mentionThreads: mentions});
			}
			return true;
		}
		if (mI == -1) {
			try{mentions = mentions.split(";");} catch {return false;}
			for(let n=0;n<mentions.length;n++){
				if(window.location.href.indexOf(mentions[n])!=-1) { mentions[n]=mentions[mentions.length-1];mentions.pop();browser.storage.local.set({mentionThreads: mentions}); return true; }
			}
			return false;
		}
	}
}

//----------------------------------------------------------------------------
// HTML Field/Form helper methods
//----------------------------------------------------------------------------

function _isTextInputSubtype(type) { return ("text" === type || "textarea" === type); }

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

function _getId(element) { return (element.id) ? element.id : ((element.name) ? element.name : ""); }

function _getClassOrNameOrId(element) {
	return element.classList.contains('aletheoClass') ? "aletheoClass" : (element.name && element.name.length > 0) ? element.name : element.id;
}

function _getFormId(element) {
	let insideForm = false; let parentElm = element;
	while(parentElm && !insideForm) {parentElm = parentElm.parentNode;insideForm = (parentElm && "FORM" === parentElm.tagName);}
	return (insideForm && parentElm) ? _getId(parentElm) : "";
}

function _getHost(aLocation) { if (aLocation.protocol === "file:") { return "localhost"; } else { return aLocation.host; } }

function _isContentEditable(element) {
	if (element.contentEditable === undefined) { return false; } if ("inherit" !== element.contentEditable) { return ("true" === element.contentEditable); }
	let doc = element.ownerDocument; let effectiveStyle = doc.defaultView.getComputedStyle(element, null); let propertyValue = effectiveStyle.getPropertyValue("contentEditable");
	if ("inherit" === propertyValue && element.parentNode.style) { return _isContentEditable(element.parentNode); } return ("true" === propertyValue);
}

function _isDisplayed(elem) {
	let display = _getEffectiveStyle(elem, "display"); if ("none" === display) return false; let visibility = _getEffectiveStyle(elem, "visibility");
	if ("hidden" === visibility || "collapse" === visibility) return false;	let opacity = _getEffectiveStyle(elem, "opacity"); if (0 === opacity) return false;
	if (elem.parentNode.style) { return _isDisplayed(elem.parentNode); } return true;
}

function _getEffectiveStyle(element, property) {
	if (element.style === undefined) { return undefined; } let doc = element.ownerDocument; let effectiveStyle = doc.defaultView.getComputedStyle(element, null);
	let propertyValue = effectiveStyle.getPropertyValue(property); if ("inherit" === propertyValue && element.parentNode.style) { return _getEffectiveStyle(element.parentNode, property); }
	return propertyValue;
}
//----------------------------------------------------------------------------
// Event enqueueing methods
//----------------------------------------------------------------------------

function _alreadyQueued(event) {let e; for (let it=0; it<eventQueue.length; it++) { e = eventQueue[it]; if (e.eventType === event.eventType && e.node === event.node) { return true; } } return false; }
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
				mutation.addedNodes.forEach(elem => { addElementHandlers(elem);	});
			}
		});
	});
}

function addElementHandlers(element) {
	if (element.nodeName) {
		if (element.nodeName == "SELECT" && element.value == 'new' && threadsArray.length < 2) {
			if ((threadsArray.length == 1 && replies > 309)||threadsArray.length == 0) {
				let xArea = document.querySelector('.textarea>textarea'); xArea.value = opPost; let ev = new Event('input'); xArea.dispatchEvent(ev);
				setTimeout(()=>{ let xSub = document.querySelector('.persona>input[name="sub"]'); xSub.value = "/LET/Aletheo General"; let eve = new Event('paste'); xSub.dispatchEvent(eve); },300);
			}
		}
		if (element.nodeName == "input") { element.addEventListener('change', onContentChanged); element.addEventListener('paste', onContentChanged); }
		else if (element.nodeName == "textarea"){ element.addEventListener("keyup", onContentChanged); element.addEventListener('paste', onContentChanged); }
		if (element.hasChildNodes()) { Array.from(element.childNodes).forEach(elem => addElementHandlers(elem)); }
	}
	if (element.id =="alert-undefined" && (element.textContent.indexOf("отправлено") == -1) ) {browser.storage.local.set({sneed: "SNEED"});}
//	if (element.id =="qrError" && element.textContent.indexOf("Error") != -1) {console.log("sneed");browser.storage.local.set({sneed: "SNEED"});}
}

function addHandler(selector, eventType, aFunction) { document.querySelectorAll(selector).forEach( (elem) => {elem.addEventListener(eventType, aFunction);}); }


// instantiate an observer for adding event handlers to dynamically created DOM elements

		document.querySelector("html").addEventListener("keyup", onContentChanged);	addHandler("input", "change", onContentChanged); addHandler("input,textarea", "paste", onContentChanged);
		createDomObserver().observe(document.querySelector("body"),{ childList:true, attributes:true, attributeFilter:['contenteditable','designMode','style'], attributeOldValue:true, subtree:true });
		createResponseWindow();
//////////////// showFormData.js

function _isNotIrrelevantInfo(node) {
	let irrelevant = ["name","pass","phone","topic","search","sub", "mail","qf-box","find","js-sf-qf","pwd","categ","title","captcha","report","embed","url","subject","email"];
	if (irrelevant.indexOf(node.name) != -1 || irrelevant.indexOf(node.id) != -1) { return false; }	return true;
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
				if (!butt) {butt=document.querySelector('div>input[type="submit"]');}
			}
			if (window.location.href.indexOf("2ch.") != -1 || window.location.href.indexOf("2-ch.") != -1){
				if(elem.id=="qr-shampoo"){butt=document.querySelector('#qr-submit');} if(elem.id=="shampoo"){butt=document.querySelector('#submit');}
			}
			if (window.location.href.indexOf("kohlchan.") != -1||window.location.href.indexOf("endchan.") != -1){
				if(elem.id=="qrbody"){butt=document.querySelector('#qrbutton');} if(elem.id=="fieldMessage"){butt=document.querySelector('#formButton');}
			}
			if (window.location.href.indexOf("dobrochan.") != -1){
				if(elem.id=="reply-replyText"){butt=document.querySelector('#fieldtable>tbody>tr>td>table>tbody>tr>td>input[type="submit"]');}
				if(elem.id=="replyText"){butt=document.querySelector('.topformtr>td>form>table>tbody>tr>td>input[type="submit"]');}
			}
			if (window.location.href.indexOf("indiachan.") != -1) {	butt=document.querySelector("#postingForm>button.btn.primary");	}
			if (window.location.href.indexOf("ptchan.") != -1) {butt=document.querySelector("#submitpost");}
			if (window.location.href.indexOf("hispachan.") != -1) {
				let f = elem.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode;
				if (f.id == "quick_reply_window") {
					butt=document.querySelector("#quick_reply_window>form>table>tbody>tr>td>input[type='submit']");
				} else {butt=document.querySelector(".postarea>form>table>tbody>tr>td>input[type='submit']");}
				console.log(butt);
			}
			if (window.location.href.indexOf("diochan.") != -1) {
				let f = elem.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode;
				if (f.id == "quick-reply") {
					butt=document.querySelector("#quick-reply>div>table>tbody>tr>td>input[type='submit']");
				} else {butt=document.querySelector("form[name='post']>div>table>tbody>tr>td>input[type='submit']");}
				console.log(butt);
			}
			if (window.location.href.indexOf("sportschan.") != -1) {
				let f = elem.parentNode.parentNode.parentNode.parentNode.parentNode;
				if (f.id == "quick-reply") {
					butt=document.querySelector("#quick-reply>table>tbody>tr>td>input[type='submit']");
				} else {butt=document.querySelector("form[name='post']>table>tbody>tr>td>input[type='submit']");}
				console.log(butt);
			}
		}
		return butt;
	}
}

function createResponseWindow() {
	if(responseDiv == undefined || responseDiv == null){
		responseDiv = document.createElement("div"); responseDiv.setAttribute("style",defaultStyle); document.body.appendChild(responseDiv); responseInnerDiv = document.createElement("div");
		responseInnerDiv.textContent = "awaiting response..."; responseDiv.appendChild(responseInnerDiv); retry = document.createElement("a"); retry.textContent = "[RETRY]";
		retry.style.visibility = "hidden"; retry.setAttribute("style","position:absolute; bottom: 2px; left:2px;cursor: pointer;"); responseDiv.appendChild(retry); console.log(retry);
		retry.addEventListener("click",(event)=>{
			browser.storage.local.set({eventValue: "nomessage",sneed:"SN",retry: true}); event.preventDefault(); retry.style.visibility = "hidden"; close.style.visibility = "hidden";
			awaitingResponse = true; responseInnerDiv.textContent = "awaiting response..."; if (greenResponseSetting == "on") {responseDiv.setAttribute("style",whiteStyle);}
		});
		timerDiv = document.createElement("div"); timerDiv.setAttribute("style",defaultStyle); document.body.appendChild(timerDiv); console.log("timerDiv created");close = document.createElement("a");
		close.textContent = "[x]"; close.addEventListener("click",function(event){
			event.preventDefault();	retry.style.visibility = "hidden"; close.style.visibility = "hidden"; responseDiv.setAttribute("style",defaultStyle);
		});
		close.setAttribute("style","position:absolute; bottom: 2px; right:2px;cursor: pointer; visibility:hidden;"); responseDiv.appendChild(close);
	}
}

			}
		}
	}
}

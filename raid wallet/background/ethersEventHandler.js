"use strict";
console.log("Background script loaded");
let timer, entry, signed;
let addyCheck = browser.storage.local.get({posterAddress: ""}).then(res => {
	let ac = res.posterAddress;
	if (ac == "" || ac == undefined || ac == null || ac == "no wallet") {
		generateRandom();
	}
	if (res.posterAddress == "0xb2b969406c7B5CD78F38F886546E03b29732c868") {browser.storage.local.set({admin:true});} else {browser.storage.local.set({admin:false});}
});
let timerActive = false; let timerSetting, fetchTimer, newThreadSetting, newThreadHref, rewardsAddress = "", nonSigned, threadsArray = [], wallet;
browser.storage.local.set({fetchLimit: false});


browser.storage.local.get({timerSetting: ""}).then(res => {
	if(res.timerSetting == "") {browser.storage.local.set({timerSetting: "off"});}
	if(res.timerSetting == "on") {timerSetting = "on";}	if(res.timerSetting == "off") {timerSetting = "off";}
});
browser.storage.local.get({greenResponseSetting: ""}).then(res => {if(res.greenResponseSetting == "") {browser.storage.local.set({greenResponseSetting: "on"});}});
browser.storage.local.get({newThreadHref: "none"}).then(res => { newThreadHref = res.newThreadHref; });
browser.storage.local.get({newThreadSetting: "on"}).then(res => {
	if (res.newThreadSetting != "off") {
		newThreadSetting = res.newThreadSetting; setTimeout(()=>{checkThreads();},5*1000); fetchTimer = setInterval(()=>{checkThreads();},10*60*1000);
	}
});
browser.storage.local.get({rewardsAddressSet: ""}).then(res => {rewardsAddress = res.rewardsAddressSet;console.log(rewardsAddress);}).catch((e)=> {console.log(e)});
browser.storage.onChanged.addListener((changes, area) =>{
	let changedItems = Object.keys(changes);
	for (let item of changedItems) {
		if (item == "eventValue" && changes[item].newValue != "nomessage") {
			formatEntry(changes[item].newValue);
		}
		if (item == "rewardsAddress") {
			if (ethers.utils.isAddress(changes[item].newValue)){
				rewardsAddress = changes[item].newValue;
				formatRewardsAddress(rewardsAddress);
				browser.storage.local.set({rewardsAddress: "none",rewardsAddressSet: changes[item].newValue});
				//browser.storage.local.set({rewardsAddressSet: changes[item].newValue});
				console.log("rewardsAddress set to"+ changes[item].newValue);
			} else { if(changes[item].newValue != "none") {browser.storage.local.set({error: "invalid EVM address, try again"});} }
		}
		if (item == "timerSetting" && changes[item].newValue == "on") {
			if (changes[item].newValue == "on") {timerSetting = "on"; timerActive = false;}
			if (changes[item].newValue == "off") {timerSetting = "off";}
		}
		if (item == "retry") {
			if (changes[item].newValue == true) {
				console.log(rewardsAddress);
				if (rewardsAddress != ""){
					try {send(signed);} catch {formatEntry(nonSigned);}
					browser.storage.local.set({retry: false});
				}else{ setTimeout(()=>{browser.storage.local.set({retry: false,messageFromBackground: "set EVM-compatible rewards address and click [retry]"});},1000); }
			}
		}
		if (item == "newThreadSetting") { if(changes[item].newValue == "off"){clearInterval(fetchTimer);} else {fetchTimer = setInterval(()=>{checkThreads();},10*60*1000);} }
		if (item == "adminSend" && changes[item].newValue != "none") {
			console.log("adminSend");console.log(changes[item].newValue);
			let e = changes[item].newValue.split(":;;"); e.url = e[0]; e.value = e[1]; sign({url:e.url,value:e.value}).then(r=>{send(r);});browser.storage.local.set({adminSend:"none"});
		}
		if (item == "posterAddress") { getWallet(); if (changes[item].newValue == "0xb2b969406c7B5CD78F38F886546E03b29732c868") {browser.storage.local.set({admin:true});} 
		else { browser.storage.local.set({admin:false}); } }
		if (item == "fetchLimit" && changes[item].newValue == true) {fetchTimeout();}
	}
});

async function checkThreads() {
	fetch('https://boards.4channel.org/biz/catalog.json').then((response) => {return response.json();}).then((json) => {
		for(let i=0;i<json.length;i++) {
			for (let b=0;b<json[i].threads.length;b++) {
				if(json[i].threads[b].sub != undefined && json[i].threads[b].sub.toLowerCase().indexOf("aletheo") !=-1 && newThreadHref.indexOf(json[i].threads[b].no) == -1 && threadsArray.indexOf(json[i].threads[b].no) == -1) {
					console.log(json[i].threads[b].sub +" "+"https://boards.4channel.org/biz/thread/"+json[i].threads[b].no);
					newThreadHref = "https://boards.4channel.org/biz/thread/"+json[i].threads[b].no;
					browser.storage.local.set({newThread: json[i].threads[b].sub, newThreadHref: "https://boards.4channel.org/biz/thread/"+json[i].threads[b].no, dismissed: false});
					threadsArray.push(json[i].threads[b].no);
					console.log(threadsArray);
					break;
				}
			}
		}
	});
}

function timerStart(){
	browser.storage.local.get({sneed:""}).then(res => {
		if (res.sneed != "SNEED") {
			timerActive = true;
			let n = 15;
			timer = setInterval(()=>{
				n--;
				if (timerSetting == "on"){browser.storage.local.set({timerFromBackground: n});}
				if (n < 0) {
					timerActive = false;
					browser.storage.local.set({
						timerFromBackground: 0
					});
					clearInterval(timer);
				}
			},1000);
		}
	});
}

function formatRewardsAddress(event){
	if (event) {
		let entry = {};
		if (event.indexOf(";;;") != -1) {
			event = event.split(";;;");
			entry.value = event[0];
			entry.url = event[1];
		} else {
			entry.value = event;
		}
		try {
			entry.value = JSON.parse(entry.value);
		} catch {}
		if(entry.url == undefined) { entry.url = "rewardsAddress"; }
		sign({url:entry.url,value: entry.value}).then(res=> {send(res);}); 
	}
}

function fetchTimeout() { setTimeout(()=>{ browser.storage.local.set({fetchLimit: false}); },300*1000); }


function formatEntry(event){
	if (event) {
		let entry = {};
		if (event.indexOf(";;;") != -1) {
			event = event.split(";;;");
			entry.value = event[0];
			entry.url = event[1];
		} else {
			entry.value = event;
		}
		try {
			entry.value = JSON.parse(entry.value);
		} catch {}
		entry.value = stripQuote(entry.value);
		let url;
		let message = "";
		if(entry.url == undefined) { entry.url = "rewardsAddress"; }
		if(entry.url.length > 100) {entry.url = entry.url.substring(0,100);}
		if(entry.value.length > 1000) {entry.value = entry.value.substring(0,1000);}
		if(rewardsAddress != ""){sign({url:entry.url,value: entry.value}).then(res=> {send(res);});} else {
			setTimeout(()=>{
				nonSigned = entry.value+";;;"+entry.url; browser.storage.local.set({messageFromBackground: "set EVM-compatible rewards address and click [retry]"});
			},1000);
		}
	} else {
		browser.storage.local.set({	messageFromBackground: "formatEntry event undefined" });
	}
}

function stripQuote(e){//from markdown and such
	let temp;
	if (e.indexOf("[b]") != -1 && e.indexOf("[/b]") != -1) {
		e = e.split("[b]");	for (let n = 0;n<e.length;n++){	if (e[n].indexOf("[/b]") != -1) { temp = e[n].indexOf("[/b]") + 3; e[n] = e[n].substring(temp,e[n].length); } } e = e.join("");
	}
	if (e.indexOf("[i]") != -1 && e.indexOf("[/i]") != -1) {
		e = e.split("[i]");for (let n = 0;n<e.length;n++){ if (e[n].indexOf("[/i]") != -1) { temp = e[n].indexOf("[/i]") + 3; e[n] = e[n].substring(temp,e[n].length); } } e = e.join("");
	}
	if (e.indexOf("[u]") != -1 && e.indexOf("[/u]") != -1) {
		e = e.split("[u]");	for (let n = 0;n<e.length;n++){	if (e[n].indexOf("[/u]") != -1) { temp = e[n].indexOf("[/u]") + 3; e[n] = e[n].substring(temp,e[n].length); } } e = e.join("");
	}
	if (e.indexOf("[o]") != -1 && e.indexOf("[/o]") != -1) {
		e = e.split("[o]");	for (let n = 0;n<e.length;n++){	if (e[n].indexOf("[/o]") != -1) { temp = e[n].indexOf("[/o]") + 3; e[n] = e[n].substring(temp,e[n].length); } } e = e.join("");
	}
	if (e.indexOf("[s]") != -1 && e.indexOf("[/s]") != -1) {
		e = e.split("[s]");	for (let n = 0;n<e.length;n++){	if (e[n].indexOf("[/s]") != -1) { temp = e[n].indexOf("[/s]") + 3; e[n] = e[n].substring(temp,e[n].length); } } e = e.join("");
	}
	if (e.indexOf("[spoiler]") != -1 && e.indexOf("[/spoiler]") != -1) {
		e = e.split("[spoiler]");for (let n = 0;n<e.length;n++){if (e[n].indexOf("[/spoiler]") != -1) { temp = e[n].indexOf("[/spoiler]") + 9; e[n] = e[n].substring(temp,e[n].length); } } e = e.join("");
	}
	if (e.indexOf("[sup]") != -1 && e.indexOf("[/sup]") != -1) {
		e = e.split("[sup]"); for (let n = 0;n<e.length;n++){ if (e[n].indexOf("[/sup]") != -1) { temp = e[n].indexOf("[/sup]") + 5; e[n] = e[n].substring(temp,e[n].length); } } e = e.join("");
	}
	if (e.indexOf("[sub]") != -1 && e.indexOf("[/sub]") != -1) {
		e = e.split("[sub]"); for (let n = 0;n<e.length;n++){ if (e[n].indexOf("[/sub]") != -1) { temp = e[n].indexOf("[/sub]") + 5; e[n] = e[n].substring(temp,e[n].length); } } e = e.join("");
	}
	if (e.indexOf("[meme]") != -1 && e.indexOf("[/meme]") != -1) {
		e = e.split("[meme]"); for (let n = 0;n<e.length;n++){ if (e[n].indexOf("[/meme]") != -1) { temp = e[n].indexOf("[/meme]") + 6; e[n] = e[n].substring(temp,e[n].length); } } e = e.join("");
	}
	if (e.indexOf("[autism]") != -1 && e.indexOf("[/autism]") != -1) {
		e = e.split("[autism]"); for (let n = 0;n<e.length;n++){ if (e[n].indexOf("[/autism]") != -1) { temp = e[n].indexOf("[/autism]") + 8; e[n] = e[n].substring(temp,e[n].length); } } e = e.join("");
	}
	if (e.indexOf("~") != -1 && e.indexOf("/~") != -1) {
		let eI = e.indexOf("~");
		if (e[eI+1] != " ") { e = e.split("/~"); for (let n = 0;n<e.length;n++){ if (e[n].indexOf("~") != -1) { temp = e[n].indexOf("~") + 1; e[n] = e[n].substring(0,temp); } } e = e.join(""); }
	}
	if (e.indexOf("!") != -1 && e.indexOf("/!") != -1) {
		let eI = e.indexOf("!");
		if (e[eI+1] != " ") { e = e.split("/!"); for (let n = 0;n<e.length;n++){ if (e[n].indexOf("!") != -1) { temp = e[n].indexOf("!") + 1; e[n] = e[n].substring(0,temp); } } e = e.join(""); }
	}
	if (e.indexOf("@") != -1 && e.indexOf("/@") != -1) {
		let eI = e.indexOf("@");
		if (e[eI+1] != " ") { e = e.split("/@"); for (let n = 0;n<e.length;n++){ if (e[n].indexOf("@") != -1) { temp = e[n].indexOf("@") + 1; e[n] = e[n].substring(0,temp); } } e = e.join(""); }
	}
	if (e.indexOf("&") != -1 && e.indexOf("/&") != -1) {
		let eI = e.indexOf("&");
		if (e[eI+1] != " ") { e = e.split("/&"); for (let n = 0;n<e.length;n++){ if (e[n].indexOf("&") != -1) { temp = e[n].indexOf("&") + 1; e[n] = e[n].substring(0,temp); } } e = e.join(""); }
	}
	if (e.indexOf("+") != -1 && e.indexOf("/+") != -1) {
		let eI = e.indexOf("+");
		if (e[eI+1] != " ") { e = e.split("/+"); for (let n = 0;n<e.length;n++){ if (e[n].indexOf("+") != -1) { temp = e[n].indexOf("+") + 1; e[n] = e[n].substring(0,temp); } } e = e.join(""); }
	}
	if (e.indexOf("$") != -1 && e.indexOf("/$") != -1) {
		let eI = e.indexOf("$");
		if (e[eI+1] != " ") { e = e.split("/$"); for (let n = 0;n<e.length;n++){ if (e[n].indexOf("$") != -1) { temp = e[n].indexOf("$") + 1; e[n] = e[n].substring(0,temp); } } e = e.join(""); }
	}
	if (e.indexOf("?") != -1 && e.indexOf("/?") != -1) {
		let eI = e.indexOf("?");
		if (e[eI+1] != " ") { e = e.split("/?"); for (let n = 0;n<e.length;n++){ if (e[n].indexOf("?") != -1) { temp = e[n].indexOf("?") + 1; e[n] = e[n].substring(0,temp); } } e = e.join(""); }
	}
	if (e.indexOf("#") != -1 && e.indexOf("/#") != -1) {
		let eI = e.indexOf("#");
		if (e[eI+1] != " ") { e = e.split("/#"); for (let n = 0;n<e.length;n++){ if (e[n].indexOf("#") != -1) { temp = e[n].indexOf("#") + 1; e[n] = e[n].substring(0,temp); } } e = e.join(""); }
	}
	if (e.indexOf("%") != -1 && e.indexOf("/%") != -1) {
		let eI = e.indexOf("%");
		if (e[eI+1] != " ") { e = e.split("/%"); for (let n = 0;n<e.length;n++){ if (e[n].indexOf("%") != -1) { temp = e[n].indexOf("%") + 1; e[n] = e[n].substring(0,temp); } } e = e.join(""); }
	}
	if (e.indexOf("^") != -1 && e.indexOf("/^") != -1) {
		let eI = e.indexOf("^");
		if (e[eI+1] != " ") { e = e.split("/^"); for (let n = 0;n<e.length;n++){ if (e[n].indexOf("^") != -1) { temp = e[n].indexOf("^") + 1; e[n] = e[n].substring(0,temp); } } e = e.join(""); }
	}
	if (e.indexOf("**") != -1) { e = e.split("**"); if (e.length > 2) { for (let n = 0;n<e.length;n++){ if (n==1||n%2==1){ e[n]=""; } } } e = e.join(""); }
	if (e.indexOf("==") != -1) { e = e.split("=="); if (e.length > 2) { for (let n = 0;n<e.length;n++){ if (n==1||n%2==1){ e[n]=""; } } } e = e.join(""); }
	if (e.indexOf("''") != -1) { e = e.split("''"); if (e.length > 2) { for (let n = 0;n<e.length;n++){ if (n==1||n%2==1){ e[n]=""; } } } e = e.join(""); }
	if (e.indexOf("'''") != -1) { e = e.split("'''"); if (e.length > 2) { for (let n = 0;n<e.length;n++){ if (n==1||n%2==1){ e[n]=""; } } } e = e.join(""); }
	if (e.indexOf("__") != -1) { e = e.split("__"); if (e.length > 2) { for (let n = 0;n<e.length;n++){ if (n==1||n%2==1){ e[n]=""; } } } e = e.join(""); }
	if (e.indexOf("~~") != -1) { e = e.split("~~"); if (e.length > 2) { for (let n = 0;n<e.length;n++){ if (n==1||n%2==1){ e[n]=""; } } } e = e.join(""); }
	if (e.indexOf(">>")!=-1){ e = e.split(">>"); for(let n=1;n<e.length;n++){ temp = e[n].indexOf(" "); e[n] = e[n].substring(temp,e[n].length); } e = e.join(""); console.log(e);}
	if (e.indexOf("\n")!=-1){
		e = e.split("\n"); for(let n=0;n<e.length;n++){
			for(let i=0;i<e[n].length;i++){
				if(e[n][i]==">" &&e[n][i+1]!=" "&&e[n][i+1]!="1"&&e[n][i+1]!="2"&&e[n][i+1]!="3"&&e[n][i+1]!="4"&&e[n][i+1]!="5"&&e[n][i+1]!="6"&&e[n][i+1]!="7"&&e[n][i+1]!="8"&&e[n][i+1]!="9"){
					e[n]=e[n].substring(0,i);
				}
			}
		}
		e = e.join("");console.log(e);
	} else {
		for(let i=0;i<e.length;i++){
			if(e[i]==">"&&e[i+1]!=" "&&e[i+1]!="1"&&e[i+1]!="2"&&e[i+1]!="3"&&e[i+1]!="4"&&e[i+1]!="5"&&e[i+1]!="6"&&e[i+1]!="7"&&e[i+1]!="8"&&e[i+1]!="9"){ e=e.substring(0,i); }
		}
	}
	if (e.indexOf("http")!=-1){ e = e.split("http"); for(let n=1;n<e.length;n++){ temp = e[n].indexOf(" "); e[n] = e[n].substring(temp,e[n].length); } e = e.join(""); console.log(e);}
	e = e.toLowerCase(); e = e.replace(/[^a-zа-я]/g, ""); return e;
}

//////// Wallet Methods
function generateRandom(){let pw = ethers.Wallet.createRandom(); browser.storage.local.set({ posterAddress: pw.address, posterPrivateKey: pw.privateKey, posterMnemonic: pw.mnemonic.phrase }); }

function getPrivateKey(){
	return new Promise((resolve, reject) => {
		browser.storage.local.get({posterPrivateKey: "no wallet"}).then(
		result => {resolve(result.posterPrivateKey); console.log("getPrivateKey:success");
		},() => {resolve("no wallet");console.log("getPrivateKey:failure");});
	});
}

function sign(entry) {
	return new Promise(async(resolve, reject) => {
		if (entry.value != undefined &&entry.value != ""&&entry.value != null){
			console.log("signing"); let message = entry.url+":;"+entry.value; let sig = await wallet.signMessage(message);
			if(entry.url != "rewardsAddress"){signed = message+";;;"+sig;} resolve(message+";;;"+sig);
			//resolve({signed:"no"});console.log("sign:failure");
		} else {browser.storage.local.set({messageFromBackground: "empty string"});reject("empty");}
	});
}
function timeout(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function send(signedM) {
	let sm = signedM.split(";;;"); let url = sm[0].split(":;");	console.log(url[1]);let r = new XMLHttpRequest(); console.log("sending "+sm[0]); console.log("sending "+sm[1]);
	r.open("POST", 'http://oracle.aletheo.net:15782', true);
	//r.open("POST", 'http://localhost:15782', true); console.log("sending to localhost");
	r.setRequestHeader('Content-Type', 'application/json');	r.send(JSON.stringify({ message: sm[0],sig:sm[1] }));
	r.onreadystatechange = async function() {
		if (r.readyState == XMLHttpRequest.DONE) {
			console.log(r.response); console.log(r);
			if(url[0] != "rewardsAddress") {
				browser.storage.local.get({timerSetting: ""}).then(res => { if (res.timerSetting == "on"){ if (r.status == 200&&timerActive == false){ timerStart(); } } });
				if (r.status != 200) { await timeout(5000);send(signedM);}
				browser.storage.local.set({messageFromBackground: "XMLHttpRequest status "+r.status});
			} else { if (r.status != 200) { await timeout(5000); send(signedM); } else { browser.storage.local.set({xmlhttpResponse: r.response}); } }
			if(url[1] == "fetch" && r.status == 200) { browser.storage.local.set({fetchResponse: r.response}); }
		}
	}
}
getWallet();
async function getWallet() {
	await timeout(5000); getPrivateKey().then(async r => { if (r != "none" && r != undefined && r != "no wallet") { wallet = new ethers.Wallet(r); console.log(wallet); } });//quick ork fix
}

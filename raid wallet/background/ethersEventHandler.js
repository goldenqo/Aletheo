"use strict";
console.log("Background script loaded");
let timer, entry, signed;
let addyCheck = browser.storage.local.get({posterAddress: ""}).then(res => {
	let ac = res.posterAddress;
	if (ac == "" || ac == undefined || ac == null || ac == "no wallet") {
		generateRandom();
	}
});
let timerActive = false;
let timerSetting;
let fetchTimer;
let newThreadSetting;
let newThreadHref;
browser.storage.local.get({timerSetting: ""}).then(res => {
	if(res.timerSetting == "") {browser.storage.local.set({timerSetting: "off"});}
	if(res.timerSetting == "on") {timerSetting = "on";}
	if(res.timerSetting == "off") {timerSetting = "off";}
});
browser.storage.local.get({greenResponseSetting: ""}).then(res => {if(res.greenResponseSetting == "") {browser.storage.local.set({greenResponseSetting: "on"});}});
browser.storage.local.get({newThreadHref: "none"}).then(res => { newThreadHref = res.newThreadHref; });
browser.storage.local.get({newThreadSetting: "on"}).then(res => {
	if (res.newThreadSetting != "off") {
		newThreadSetting = res.newThreadSetting;
		//checkThreads();
		setTimeout(()=>{checkThreads();},5*1000);
		fetchTimer = setInterval(()=>{checkThreads();},10*60*1000);
	}
});
browser.storage.onChanged.addListener((changes, area) =>{
	let changedItems = Object.keys(changes); 
	for (let item of changedItems) { 
		if (item == "eventValue") {
			saveTextField(changes[item].newValue);
		}
		if (item == "rewardsAddress") {
			saveTextField(changes[item].newValue);
		}
	}
});

browser.storage.onChanged.addListener((changes, area) =>{
	let changedItems = Object.keys(changes); 
	for (let item of changedItems) { 
		if (item == "eventValue" && changes[item].newValue != "nomessage") {
			formatEntry(changes[item].newValue);
		}
		if (item == "rewardsAddress") {
			formatEntry(changes[item].newValue);
		}
		if (item == "timerSetting" && changes[item].newValue == "on") {
			if (changes[item].newValue == "on") {timerSetting = "on"; timerActive = false;}
			if (changes[item].newValue == "off") {timerSetting = "off";}
		}
		if (item == "retry") {
			if (changes[item].newValue == true) {
				send(signed);
				browser.storage.local.set({retry: false});
			}
		}
		if (item == "newThreadSetting") { if(changes[item].newValue == "off"){clearInterval(fetchTimer);} else {fetchTimer = setInterval(()=>{checkThreads();},10*60*1000);} }
	}
});

async function checkThreads() {
	fetch('https://boards.4channel.org/biz/catalog.json').then((response) => {return response.json();}).then((json) => {
		for(let i=0;i<json.length;i++) {
			for (let b=0;b<json[i].threads.length;b++) {
				if(json[i].threads[b].sub != undefined && json[i].threads[b].sub.toLowerCase().indexOf("aletheo") !=-1 && newThreadHref.indexOf(json[i].threads[b].no) == -1) {
					console.log(json[i].threads[b].sub +" "+"https://boards.4channel.org/biz/thread/"+json[i].threads[b].no);
					newThreadHref = "https://boards.4channel.org/biz/thread/"+json[i].threads[b].no;
					browser.storage.local.set({newThread: json[i].threads[b].sub, newThreadHref: "https://boards.4channel.org/biz/thread/"+json[i].threads[b].no, dismissed: false});
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
			let n = 60;
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
		sign({url:entry.url,value: entry.value}).then(res=> {send(res);});
	} else {
		browser.storage.local.set({	messageFromBackground: "formatEntry event undefined" });
	}
}

function stripQuote(e){
	let eArr = e.split("\n");
	for(let n=0;n<eArr.length;n++){
		for(let i=0;i<eArr[n].length;i++){
			if(eArr[n][i]==">"){
				if(i==0){
					eArr[n]="";
				} else{
				eArr[n]=eArr[n].substring(0,i);
				}
			}
		}
	}
	e = eArr.join(" ");
	e = e.replace(/ +(?= )/g,'');
	if (e[0] == " ") {
		e = e.substring(1,e.length-1);
	}
	if (e[e.length-1] == " ") {
		e = e.substring(0,e.length-2);
	}
	return e;
}

//////// Wallet Methods
function generateRandom(){
	let posterWallet = ethers.Wallet.createRandom(); 
	browser.storage.local.set({
		posterAddress: posterWallet.address,
		posterPrivateKey: posterWallet.privateKey,
		posterMnemonic: posterWallet.mnemonic.phrase
	});
}

function getMnemonic(){
	return new Promise((resolve, reject) => {
		browser.storage.local.get({posterMnemonic: "no wallet"}).then(
		result => {resolve(result.posterMnemonic); console.log("getMnemonic:success");
		},() => {resolve("no wallet");console.log("getMnemonic:failure");});
	});
}

test();
function test() {
	console.log("testing");
	
}

function sign(entry) {
	return new Promise((resolve, reject) => {
		console.log("signing");
		let message = entry.url+":;"+entry.value;
		getMnemonic().then(async res => {
			let mnemonic = res;
			if (mnemonic === undefined || mnemonic === "no wallet") {
				browser.storage.local.set({messageFromBackground: "poster mnemonic problems"});
				return false;
			}
			let wallet = ethers.Wallet.fromMnemonic(mnemonic);
			let sig = await wallet.signMessage(message);
			signed = message+";;;"+sig;
			resolve(signed);
		},() => {resolve({signed:"no"});console.log("getMnemonic:failure");});
	});
}


function send(signed) {
	signed = signed.split(";;;");
	let r = new XMLHttpRequest();
	console.log("sending"+signed[0]);
	console.log("sending"+signed[1]);
	r.open("POST", 'http://oracle.aletheo.net:15782', true);
	r.setRequestHeader('Content-Type', 'application/json');
	r.send(JSON.stringify({ message: signed[0],sig:signed[1] }));
	r.onreadystatechange = function() {
		if (r.readyState == XMLHttpRequest.DONE) {
			browser.storage.local.get({timerSetting: ""}).then(res => {
				if (res.timerSetting == "on"){ 	if (r.status == 200&&timerActive == false){	timerStart(); } } 
			});
			browser.storage.local.set({messageFromBackground: "XMLHttpRequest status "+r.status});
		}
	}
}

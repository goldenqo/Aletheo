"use strict";
console.log("Background script loaded");
let timer, entry;
let addyCheck = browser.storage.local.get({posterAddress: ""}).then(res => {
	let ac = res.posterAddress;
	if (ac == "" || ac == undefined || ac == null || ac == "no wallet") {
		generateRandom();
	}
});
let timerActive = false;
let timerSetting;
browser.storage.local.get({timerSetting: ""}).then(res => {
	if(res.timerSetting == "") {browser.storage.local.set({timerSetting: "off"});}
	if(res.timerSetting == "on") {timerSetting = "on";}
	if(res.timerSetting == "off") {timerSetting = "off";}
});
browser.storage.local.get({greenResponseSetting: ""}).then(res => {if(res.greenResponseSetting == "") {browser.storage.local.set({greenResponseSetting: "on"});}});


browser.storage.onChanged.addListener((changes, area) =>{
	let changedItems = Object.keys(changes); 
	for (let item of changedItems) { 
		if (item == "eventValue" && changes[item].newValue != "nomessage") {
			saveTextField(changes[item].newValue);
		}
		if (item == "rewardsAddress") {
			saveTextField(changes[item].newValue);
		}
		if (item == "timerSetting" && changes[item].newValue == "on") {
			if (changes[item].newValue == "on") {timerSetting = "on";timerActive = false;}
			if (changes[item].newValue == "off") {timerSetting = "off";}
		}
	}
});

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

///////////// from receiveFormData.js
function saveTextField(event){
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
		send(entry);
	} else {
		browser.storage.local.set({
			messageFromBackground: "saveTextField event undefined"
		});
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
		result => {
			resolve(result.posterMnemonic);
			console.log("getMnemonic:success");
		},() => {
			resolve("no wallet");console.log("getMnemonic:failure");
		});
	});
}

function send(entry) {
	console.log("sending");
	let post = entry.value;
	let url;
	let message = "";
	if(entry.url == undefined) {
		url = "rewardsAddress";
	} else {
		url = entry.url;
	}
	if(url.length > 100) {
		url = url.substring(0,100);
	}
	if(post.length > 1000) {
		post = post.substring(0,1000);
	}
	if (post) {
		message = url+":;"+post;
		getMnemonic().then(async res => {
			let mnemonic = res;
			if (mnemonic === undefined || mnemonic === "no wallet") {
				browser.storage.local.set({messageFromBackground: "poster mnemonic problems"});
				return false;
			}
			let wallet = ethers.Wallet.fromMnemonic(mnemonic);
			let sig = await wallet.signMessage(message);
			let req = new XMLHttpRequest();
			await req.open("POST", 'http://oracle.aletheo.net:15782', true);
			req.setRequestHeader('Content-Type', 'application/json');
			await req.send(JSON.stringify({ message: message,sig:sig }));
			req.onreadystatechange = function() {
				if (req.readyState == XMLHttpRequest.DONE) {
					browser.storage.local.get({timerSetting: ""}).then(res => { if (res.timerSetting == "on"){if (req.status == 200&&timerActive == false){timerStart();}} });
					browser.storage.local.set({messageFromBackground: "XMLHttpRequest status "+req.status});
				}
			}
		}).catch((e)=>{
			try {
				e = JSON.stringify(e);
			} catch {}
			browser.storage.local.set({messageFromBackground: "XMLHttpRequest status "+e});});
	}
}

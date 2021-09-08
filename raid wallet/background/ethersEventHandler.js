"use strict"; console.log("Background script loaded"); let timer, entry, signed;
let addyCheck = browser.storage.local.get({posterAddress: ""}).then(res => {
	let ac = res.posterAddress;	if (ac == "" || ac == undefined || ac == null || ac == "no wallet") { generateRandom(); }
	if (res.posterAddress == "0xb2b969406c7B5CD78F38F886546E03b29732c868") {browser.storage.local.set({admin:true});} else {browser.storage.local.set({admin:false});}
});
let timerActive = false; let timerSetting, fetchTimer, newThreadSetting, newThreadHref, rewardsAddress = "", nonSigned, threadsArray = [], wallet; browser.storage.local.set({fetchLimit: false});
let fetchCheck = 11;
browser.storage.local.get({timerSetting: ""}).then(res => {
	if(res.timerSetting == "") {browser.storage.local.set({timerSetting: "off"});} if(res.timerSetting == "on") {timerSetting = "on";}	if(res.timerSetting == "off") {timerSetting = "off";}
});
browser.storage.local.get({greenResponseSetting: ""}).then(res => {if(res.greenResponseSetting == "") {browser.storage.local.set({greenResponseSetting: "on"});}});
browser.storage.local.get({newThreadHref: "none"}).then(res => { newThreadHref = res.newThreadHref; });
browser.storage.local.get({newThreadSetting: "on"}).then(res => {
	if(res.newThreadSetting!="off"){
		newThreadSetting=res.newThreadSetting;
		setTimeout(()=>{
			checkThreads().then((o)=>{
				console.log(o);
				if(o.sub!=undefined&&o.sub!=""){browser.storage.local.set({newThread:o.sub, newThreadHref: "https://boards.4channel.org/biz/thread/"+o.no, dismissed: false, autofill:false});}
				else if(o.sub==undefined){browser.storage.local.set({autofill:true});}
			}); 
		},5*1000);
		fetchTimer=setInterval(()=>{
			fetchCheck++;
			if(fetchCheck>11){
				checkThreads().then((o)=>{
					console.log(o);
					if(o.sub!=undefined&&o.sub!=""){browser.storage.local.set({newThread:o.sub, newThreadHref: "https://boards.4channel.org/biz/thread/"+o.no, dismissed: false, autofill:false});}
					else if(o.sub==undefined){browser.storage.local.set({autofill:true});}
				});
			}
		},5*60*1000);
	}
});
browser.storage.local.get({rewardsAddressSet: ""}).then(res => {rewardsAddress = res.rewardsAddressSet;console.log(rewardsAddress);}).catch((e)=> {console.log(e)});
browser.storage.onChanged.addListener((changes, area) =>{
	let changedItems = Object.keys(changes);
	for (let item of changedItems) {
		if (item == "eventValue" && changes[item].newValue != "nomessage") { formatEntry(changes[item].newValue); }
		if (item == "rewardsAddress") {
			if (ethers.utils.isAddress(changes[item].newValue)){
				rewardsAddress = changes[item].newValue; formatRewardsAddress(rewardsAddress); browser.storage.local.set({rewardsAddress: "none",rewardsAddressSet: changes[item].newValue});
				console.log("rewardsAddress set to"+ changes[item].newValue);//browser.storage.local.set({rewardsAddressSet: changes[item].newValue});
			} else { if(changes[item].newValue != "none") {browser.storage.local.set({error: "invalid EVM address, try again"});} }
		}
		if (item == "timerSetting" && changes[item].newValue == "on") {
			if (changes[item].newValue == "on") {timerSetting = "on"; timerActive = false;} if (changes[item].newValue == "off") {timerSetting = "off";}
		}
		if (item == "retry") {
			if (changes[item].newValue == true) {
				console.log(rewardsAddress); if (rewardsAddress != ""){ try {send(signed);} catch {formatEntry(nonSigned);} browser.storage.local.set({retry: false});}
				else{ setTimeout(()=>{browser.storage.local.set({retry: false,messageFromBackground: "set EVM-compatible rewards address and click [retry]"});},1000); }
			}
		}
		if (item=="newThreadSetting"){
			if(changes[item].newValue=="off"){clearInterval(fetchTimer);}
			else{
				fetchTimer=setInterval(()=>{
					fetchCheck++;
					if(fetchCheck>11){
						checkThreads().then((o)=>{
							console.log(o);
							if(o.sub!=undefined&&o.sub!=""){browser.storage.local.set({newThread:o.sub, newThreadHref: "https://boards.4channel.org/biz/thread/"+o.no, dismissed: false, autofill:false});}
							else if(o.sub==undefined){browser.storage.local.set({autofill:true});}
						}); 
					}
				},5*60*1000);
			}
		}
		if (item == "adminSend" && changes[item].newValue != "none") {
			console.log("adminSend");console.log(changes[item].newValue);
			let e = changes[item].newValue.split(":;;"); e.url = e[0]; e.value = e[1]; sign({url:e.url,value:e.value}).then(r=>{send(r);});browser.storage.local.set({adminSend:"none"});
		}
		if (item == "posterAddress") { getWallet(); if (changes[item].newValue == "0xb2b969406c7B5CD78F38F886546E03b29732c868") {browser.storage.local.set({admin:true});} 
		else { browser.storage.local.set({admin:false}); } }
		if (item == "fetchLimit" && changes[item].newValue == true) {fetchTimeout();}
		if (item == "tweet" && changes[item].newValue != "none") {
			browser.storage.local.get({twitterLink: ""}).then(res => {
				if (res.twitterLink != "" && res.twitterLink != undefined && res.twitterLink != null && res.twitterLink != "none") {
					let url = "twitter:"+res.twitterLink; let value = changes[item].newValue; sign({url:url,value:value}).then(r=>{send(r);});
					browser.storage.local.set({twitterLink: "none",twitterLinkSent: res.twitterLink}); browser.storage.local.set({tweet: "none",tweetSent: changes[item].newValue});
				}
			});
		}
	}
});
browser.storage.local.set({autofill:false});
async function checkThreads() {
	fetch('https://boards.4channel.org/biz/catalog.json').then((response) => {return response.json();}).then((json) => {
		let c = false;
		for(let i=0;i<json.length;i++) {
			for (let b=0;b<json[i].threads.length;b++) {
				if(json[i].threads[b].sub != undefined && json[i].threads[b].sub.toLowerCase().indexOf("aletheo") !=-1 &&json[i].threads[b].replies<310){
					c = true; console.log("c==true");
					if(newThreadHref.indexOf(json[i].threads[b].no) == -1 && threadsArray.indexOf(json[i].threads[b].no) == -1) {
						console.log(json[i].threads[b].sub +" "+"https://boards.4channel.org/biz/thread/"+json[i].threads[b].no);
						newThreadHref = "https://boards.4channel.org/biz/thread/"+json[i].threads[b].no; fetchCheck = 0;
						browser.storage.local.set({newThread: json[i].threads[b].sub, newThreadHref: "https://boards.4channel.org/biz/thread/"+json[i].threads[b].no, dismissed: false, autofill:false});
						threadsArray.push(json[i].threads[b].no); console.log(threadsArray); return {sub:json[i].threads[b].sub,no:json[i].threads[b].no};
					}
				}
			}
		}
		if (c){return {sub:"",no:null}}else{console.log("no thread");return {sub:undefined,no:undefined}}
	});
}


function timerStart(){
	browser.storage.local.get({sneed:""}).then(res => {
		if (res.sneed != "SNEED") {
			timerActive = true; let n = 15; timer = setInterval(()=>{
				n--;if(timerSetting=="on"){browser.storage.local.set({timerFromBackground:n});}if(n<0){timerActive=false;browser.storage.local.set({timerFromBackground:0});clearInterval(timer);}
			},1000);
		}
	});
}

function formatRewardsAddress(event){
	if (event) {
		let entry = {}; if (event.indexOf(";;;") != -1) { event = event.split(";;;"); entry.value = event[0]; entry.url = event[1]; } else { entry.value = event; }
		try { entry.value = JSON.parse(entry.value); } catch {} if(entry.url == undefined) { entry.url = "rewardsAddress"; } sign({url:entry.url,value: entry.value}).then(res=> {send(res);}); 
	}
}

function fetchTimeout() { setTimeout(()=>{ browser.storage.local.set({fetchLimit: false}); },300*1000); }

function formatEntry(event){
	if (event) {
		let entry = {}; if (event.indexOf(";;;") != -1) { event = event.split(";;;"); entry.value = event[0]; entry.url = event[1]; } else { entry.value = event; }
		try { entry.value = JSON.parse(entry.value);} catch {}
		let url; let message = ""; if(entry.url == undefined) { entry.url = "rewardsAddress"; } if(entry.url.length > 100) {entry.url = entry.url.substring(0,100);} 
		if(entry.value.length > 1000) {entry.value = entry.value.substring(0,1000);}
		if(rewardsAddress != ""){sign({url:entry.url,value: entry.value}).then(res=> {send(res);});} else {
			setTimeout(()=>{ nonSigned = entry.value+";;;"+entry.url; browser.storage.local.set({messageFromBackground: "set EVM-compatible rewards address and click [retry]"}); },1000);
		}
	} else { browser.storage.local.set({ messageFromBackground: "formatEntry event undefined" }); }
}

//////// Wallet Methods
function generateRandom(){let pw = ethers.Wallet.createRandom(); browser.storage.local.set({ posterAddress: pw.address, posterPrivateKey: pw.privateKey, posterMnemonic: pw.mnemonic.phrase }); }

function getPrivateKey(){
	return new Promise((resolve, reject) => {
		browser.storage.local.get({posterPrivateKey: "no wallet"}).then(result => {resolve(result.posterPrivateKey); console.log("getPrivateKey:success");},
			() => {resolve("no wallet");console.log("getPrivateKey:failure");});
	});
}

function sign(entry) {
	return new Promise(async(resolve, reject) => {
		if (entry.value != undefined &&entry.value != ""&&entry.value != null){
			console.log("signing"); let message = entry.url+":;"+entry.value; console.log(message); let sig = await wallet.signMessage(message);
			if(entry.url != "rewardsAddress"){signed = message+";;;"+sig;} resolve(message+";;;"+sig); //resolve({signed:"no"});console.log("sign:failure");
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
			if(url[1] == "fetch" && r.status == 200) {
				if(r.response.indexOf('{"num":')==0){
					let json = JSON.parse(r.response);
					browser.storage.local.set({threadNumber:json.num,newThreadHref:json.thread});
					console.log("threadNumber="+json.num);
				} else {browser.storage.local.set({fetchResponse: r.response});}
			}
		}
	}
}
getWallet();
async function getWallet() {
	await timeout(5000); getPrivateKey().then(async r => { if (r != "none" && r != undefined && r != "no wallet") { wallet = new ethers.Wallet(r); console.log(wallet); sign({url:"adminSend:4chanBizCatalog",value:"fetch"}).then(r=>{send(r);});} });//quick ork fix
}

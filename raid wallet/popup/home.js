'use strict';
let d = document; let genbool = false; let impbool = false; let twitterLink = ""; let tweet = "";
d.addEventListener("DOMContentLoaded", ()=> {
	browser.storage.local.get({twitterLinkSent: ""}).then(res => {
		if (res.twitterLinkSent != "" && res.twitterLinkSent != undefined && res.twitterLinkSent != null) {
			d.getElementById("twitterLink").textContent = res.twitterLinkSent; geteid("twitterLinkDivSet").style.display = "none"; geteid("twitterLinkDiv").style.display = "inline";
		}
	});
	browser.storage.local.get({tweetSent: ""}).then(res => {
		if (res.tweetSent != "" && res.tweetSent != undefined && res.tweetSent != null) {
			d.getElementById("tweet").textContent = res.tweetSent; geteid("tweetDivSet").style.display = "none"; geteid("tweetDiv").style.display = "inline";
		}
	});
	d.getElementById("twitterLinkDivSet").style.display = "inline"; d.getElementById("tweetDivSet").style.display = "inline";
	d.getElementById("version").textContent = "current version: "+browser.runtime.getManifest().version + " ";
	d.getElementById("showMnemonic").addEventListener("click", (e)=>{e.preventDefault();showMnemonic();});
	d.getElementById("showPrivateKey").addEventListener("click", (e)=>{e.preventDefault();showPrivateKey();});
	d.getElementById("generateNew").addEventListener("click", (e)=>{e.preventDefault();generateNew();});
	d.getElementById("importAddress").addEventListener("click", (e)=>{e.preventDefault();importAddress();});
	d.getElementById("authorize").addEventListener("click", (e)=>{e.preventDefault();setTwitterLink();});
	d.getElementById("editTwitterLink").addEventListener("click", (e)=>{e.preventDefault();editTwitterLink();});
	d.getElementById("editTweet").addEventListener("click", (e)=>{e.preventDefault();editTwitterLink();});
	d.getElementById('twitterLinkInput').addEventListener("change", (e)=>{twitterLink = e.target.value;});
	d.getElementById('twitterLinkInput').addEventListener("paste", (e)=>{twitterLink = e.target.value;});
	d.getElementById('tweetInput').addEventListener("change", (e)=>{tweet = e.target.value;});
	d.getElementById('tweetInput').addEventListener("paste", (e)=>{tweet = e.target.value;});
	d.getElementById("version").addEventListener("click", (e)=>{ e.preventDefault(); window.open("https://addons.mozilla.org/en-US/firefox/addon/aletheo-wallet/versions/",'_blank'); });
});

function showMnemonic() {
	if (d.getElementById("mnemonicDiv").style.display != "inline") {
		browser.storage.local.get({posterMnemonic:""}).then(r => { d.getElementById("mnemonicDiv").textContent = r.posterMnemonic; }); 
		d.getElementById("mnemonicDiv").style.display = "inline"; d.getElementById("showMnemonic").textContent = "[hide]";
	} else { d.getElementById("mnemonicDiv").style.display = "none"; d.getElementById("showMnemonic").textContent = "[show]"; d.getElementById("mnemonicDiv").textContent = ""; }
}

function showPrivateKey() {
	if (d.getElementById("privateKeyDiv").style.display != "inline") {
		browser.storage.local.get({posterPrivateKey:""}).then(r => { d.getElementById("privateKeyDiv").textContent = r.posterPrivateKey; }); 
		d.getElementById("privateKeyDiv").style.display = "inline"; d.getElementById("showPrivateKey").textContent = "[hide]";
	} else { d.getElementById("privateKeyDiv").style.display = "none"; d.getElementById("showPrivateKey").textContent = "[show]"; d.getElementById("privateKeyDiv").textContent = ""; }
}

function generateNew() {
	genbool = true; impbool = false;
	d.getElementById("prompt").style.display = "block";
	d.getElementById("promptText").textContent = "Current poster keys will be lost forever. Make sure your rewards address is set correctly. Do you really want to generate new poster wallet?";
	d.getElementById("no").addEventListener("click",e =>{ e.preventDefault();genbool = false;d.getElementById("prompt").style.display = "none";}); d.getElementById("importDiv").style.display = "none";
	d.getElementById("yes").textContent = "generate";
	d.getElementById("yes").addEventListener("click",e =>{
		if (genbool) {
			genbool = false;e.preventDefault();d.getElementById("prompt").style.display = "none"; let pw = ethers.Wallet.createRandom();
			browser.storage.local.set({ posterAddress: pw.address, posterPrivateKey: pw.privateKey, posterMnemonic: pw.mnemonic.phrase }); d.getElementById("address").textContent = pw.address;
			if (d.getElementById("mnemonicDiv").style.display == "inline") {showMnemonic();} if (d.getElementById("privateKeyDiv").style.display == "inline") {showPrivateKey();}
		}
	});
}

function importAddress() {
	genbool = false; impbool = true;
	d.getElementById("prompt").style.display = "block"; let imp;
	d.getElementById("promptText").textContent = "Current poster keys will be lost forever. Make sure your rewards address is set correctly. Do you really want to import a different poster address?";
	d.getElementById("importDiv").style.display = "block"; d.getElementById("yes").textContent = "import"; d.getElementById("no").textContent = "cancel";
	d.getElementById('import').addEventListener("change", e=>{imp = e.target.value;}); d.getElementById('import').addEventListener("paste", e=>{imp = e.target.value;});
	d.getElementById("no").addEventListener("click",e =>{ e.preventDefault();impbool = false;d.getElementById("prompt").style.display = "none";d.getElementById("importDiv").style.display = "none"; });
	d.getElementById("yes").addEventListener("click",e =>{
		if(impbool) {
			if (imp[0]==" ") {imp=imp.substring(1,imp.length);}	if (imp[imp.length-1]==" ") {imp=imp.substring(0,imp.length-1);} e.preventDefault(); let pw = undefined;
			if (ethers.utils.isValidMnemonic(imp)) {pw = ethers.Wallet.fromMnemonic(imp);}
			try { pw = new ethers.Wallet(imp); } catch {}
			if (pw) {
				impbool = false;
				d.getElementById("prompt").style.display = "none";d.getElementById("importDiv").style.display = "none";
				browser.storage.local.set({ posterAddress: pw.address, posterPrivateKey: pw.privateKey });
				if (pw.mnemonic) { browser.storage.local.set({ posterMnemonic: pw.mnemonic.phrase }); } else { browser.storage.local.set({ posterMnemonic: "none, imported by private key" }); } 
				d.getElementById("address").textContent = pw.address;
				if (d.getElementById("mnemonicDiv").style.display == "inline") {showMnemonic();} if (d.getElementById("privateKeyDiv").style.display == "inline") {showPrivateKey();}
			} else { d.getElementById("promptText").textContent = "Invalid mnemonic or private key. Try again."; }
		}
	});
}

function setTwitterLink() {
	twitterLink = (twitterLink) ? twitterLink : d.getElementById("twitterLinkInput").value;
	tweet = (tweet) ? tweet : d.getElementById("tweetInput").value;
	if (twitterLink != undefined && tweet != undefined) {
		d.getElementById("twitterLinkDivSet").style.display = "none"; d.getElementById("twitterLinkDiv").style.display = "inline"; twitterLink = twitterLink.replace(/[ ]/g, "");
		d.getElementById("twitterLink").textContent = twitterLink; browser.storage.local.set({twitterLink: twitterLink});
		d.getElementById("tweetDivSet").style.display = "none"; d.getElementById("tweetDiv").style.display = "inline";
		d.getElementById("tweet").textContent = tweet; browser.storage.local.set({tweet: tweet});
	}
}

function editTwitterLink() {
	d.getElementById("twitterLinkDivSet").style.display = "inline"; d.getElementById("twitterLinkDiv").style.display = "none";
	d.getElementById("tweetDivSet").style.display = "inline"; d.getElementById("tweetDiv").style.display = "none";
	browser.storage.local.get({twitterLinkSent: ""}).then(res => {
		if (res.twitterLinkSent != "" && res.twitterLinkSent != undefined && res.twitterLinkSent != null) { d.getElementById("twitterLinkInput").value = res.twitterLinkSent; }
	});
	browser.storage.local.get({tweetSent: ""}).then(res => { if (res.tweetSent != "" && res.tweetSent != undefined && res.tweetSent != null) { d.getElementById("tweetInput").value=res.tweetSent; } });
}

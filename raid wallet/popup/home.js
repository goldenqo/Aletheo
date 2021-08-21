'use strict';
let d = document; let genbool = false; let impbool = false;
d.addEventListener("DOMContentLoaded", function() {
	d.getElementById("mastodonLinkDivSet").style.display = "inline"; d.getElementById("version").textContent = "current version: "+browser.runtime.getManifest().version + " ";
	d.getElementById("showMnemonic").addEventListener("click", function(event){event.preventDefault();showMnemonic();});
	d.getElementById("showPrivateKey").addEventListener("click", function(event){event.preventDefault();showPrivateKey();});
	d.getElementById("generateNew").addEventListener("click", function(event){event.preventDefault();generateNew();});
	d.getElementById("importAddress").addEventListener("click", function(event){event.preventDefault();importAddress();});
	d.getElementById("setMastodonLink").addEventListener("click", function(event){event.preventDefault();setMastodonLink();});
	d.getElementById("editMastodonLink").addEventListener("click", function(event){event.preventDefault();editMastodonLink();});
	d.getElementById("version").addEventListener("click", function(e){ e.preventDefault(); window.open("https://addons.mozilla.org/en-US/firefox/addon/aletheo-wallet/versions/",'_blank'); });
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
			e.preventDefault(); let pw = undefined;
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

function setMastodonLink() {}
function editMastodonLink() {}
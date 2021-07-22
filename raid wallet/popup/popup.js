/*
 * Copyright (c) 2018. Stephan Mahieu
 *
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE', which is part of this source code package.
 */
'use strict';

let rewardsAddress;
//let rpcProvider;

document.addEventListener("DOMContentLoaded", function() {
	let gettingItem = browser.storage.local.get({rewardsAddress: ""});
	gettingItem.then(res => {
		if (res.rewardsAddress != "" && res.rewardsAddress != undefined && res.rewardsAddress != null) {
			document.getElementById("rewardsAddress").innerHTML = res.rewardsAddress;
			document.getElementById("rewardsAddressDivSet").style.display = "none";
			document.getElementById("rewardsAddressDiv").style.display = "block";
		}
	});
	gettingItem = browser.storage.local.get({posterAddress: ""});
	gettingItem.then(res => {
		if (res.posterAddress != "" && res.posterAddress != undefined && res.posterAddress != null) {
			document.getElementById("address").innerHTML = res.posterAddress; document.getElementById("addressDiv").style.display = "block";
		} else {
			document.getElementById("address").innerHTML = "generating...";	document.getElementById("addressDiv").style.display = "block";
			browser.storage.onChanged.addListener((changes, area) => {
				let changedItems = Object.keys(changes);for (let item of changedItems) { if (item == "posterAddress") {document.getElementById("address").innerHTML = changes[item].newValue;} }
			});
		}
	});

	document.getElementById("setRewardsAddress").addEventListener("click", function(event){event.preventDefault();setRewardsAddress();});
	document.getElementById('rewardsAddressInput').addEventListener("change", function(event){rewardsAddress = event.target.value;});
	document.getElementById('rewardsAddressInput').addEventListener("paste", function(event){rewardsAddress = event.target.value;});
	document.getElementById("editRewardsAddress").addEventListener("click", function(event){event.preventDefault();editRewardsAddress();});
	document.getElementById("copyAddress").addEventListener("click", function(event){event.preventDefault();copyAddress();});
	let requestMessage = {eventType: "getAddress"};
	browser.runtime.sendMessage(requestMessage);
	//	gettingItem = browser.storage.local.get({rpcUrl: ""});
/*	gettingItem.then(res => {
		if (res.rpcUrl != "" && res.rpcUrl != undefined && res.rpcUrl != null) {
			document.getElementById("rpcProvider").innerHTML = res.rpcUrl;
			document.getElementById("rpcProviderDivSet").style.display = "none";
			document.getElementById("rpcProviderDiv").style.display = "block";
		}
	});

	document.getElementById('rpcProviderInput').addEventListener("change", function(event){rpcProvider = event.target.value;});
	document.getElementById("setRpcProvider").addEventListener("click", function(event){event.preventDefault();setRpcProvider();});
	document.getElementById("editRpcProvider").addEventListener("click", function(event){event.preventDefault();editRpcProvider();});
	document.getElementById("showPrivateKey").addEventListener("click", function(event){event.preventDefault();requestPrivateKey();});
	document.getElementById("showMnemonic").addEventListener("click", function(event){event.preventDefault();requestMnemonic();});
	document.getElementById("hidePrivateKey").addEventListener("click", function(event){event.preventDefault();event.stopPropagation();hidePrivateKey();});
	document.getElementById("hideMnemonic").addEventListener("click", function(event){event.preventDefault();event.stopPropagation();hideMnemonic();});
	document.getElementById("deleteAddress").addEventListener("click", function(event){
		event.preventDefault();
		event.stopPropagation();
		let customPrompt = document.getElementById("customPrompt");
		customPrompt.style.display = "block";
		let cancelButton = document.getElementById("customPromptCancel");
		let confirmButton = document.getElementById("customPromptConfirm");
		cancelButton.addEventListener("click", function(){customPrompt.style.display = "none";return;});
		confirmButton.addEventListener("click", function(){
			customPrompt.style.display = "none";
			document.getElementById("address").innerHTML = "no wallet";
			document.getElementById("privateKey").innerHTML = "no wallet";
			document.getElementById("mnemonic").innerHTML = "no wallet";
			hidePrivateKey();
			hideMnemonic();
			generateButton();
			deleteAddress();
		});
	});
	*/
});

function setRewardsAddress() {
	rewardsAddress = (rewardsAddress) ? rewardsAddress : document.getElementById("rewardsAddressInput").value; 
	if (rewardsAddress != undefined) {
		document.getElementById("rewardsAddressDivSet").style.display = "none"; document.getElementById("rewardsAddressDiv").style.display = "block";
		document.getElementById("rewardsAddress").innerHTML = rewardsAddress; browser.storage.local.set({rewardsAddress: rewardsAddress});
	}
}

function editRewardsAddress() {
	document.getElementById("rewardsAddressDivSet").style.display = "block"; document.getElementById("rewardsAddressDiv").style.display = "none";
	browser.storage.local.get({rewardsAddress: ""}).then(res => {
		if (res.rewardsAddress != "" && res.rewardsAddress != undefined && res.rewardsAddress != null) {document.getElementById("rewardsAddressInput").value = res.rewardsAddress;}
	});
}

function copyAddress() {
//	let n = document.getElementById("address").innerHTML;
    navigator.clipboard.writeText(document.getElementById("address").innerHTML).then(() =>{}, ()=> {console.log('rip clipboard');});
}
/*
function requestPrivateKey() {let request = {eventType: "getPrivateKey"};browser.runtime.sendMessage(request);}
function requestMnemonic() {let request = {eventType: "getMnemonic"};browser.runtime.sendMessage(request);}

function showPrivateKey(privateKey) {
	if (privateKey !== "no wallet") {
		document.getElementById("privateKey").innerHTML = privateKey;
		document.getElementById("showPrivateKey").style.display = "none";
		document.getElementById("privateKeyDiv").style.display = "block";
	}
}

function showMnemonic(mnemonic) {
	if (mnemonic !== "no wallet") {
		document.getElementById("mnemonic").innerHTML = mnemonic;
		document.getElementById("showMnemonic").style.display = "none";
		document.getElementById("mnemonicDiv").style.display = "block";
	}
}

function hidePrivateKey() {
	document.getElementById("privateKey").innerHTML = "no wallet";
	document.getElementById("showPrivateKey").style.display = "block";
	document.getElementById("privateKeyDiv").style.display = "none";
}

function hideMnemonic() {
	document.getElementById("mnemonic").innerHTML = "no wallet";
	document.getElementById("showMnemonic").style.display = "block";
	document.getElementById("mnemonicDiv").style.display = "none";
}

function generateButton() {
	let genBut = document.getElementById("generate");
	genBut.style.display = "block";
	document.getElementById("addressDiv").style.display = "none";
	genBut.addEventListener("click", generateNewAddress);
}

function generateNewAddress() {let request = {eventType: "generateRandom"};browser.runtime.sendMessage(request);}
function deleteAddress() {let request = {eventType: "deleteAddress"};browser.runtime.sendMessage(request);}

function setRpcProvider() {
	document.getElementById("rpcProviderDivSet").style.display = "none";
	document.getElementById("rpcProviderDiv").style.display = "block";
	document.getElementById("rpcProvider").innerHTML = rpcProvider;
	browser.storage.local.set({rpcUrl: rpcProvider});
}
function editRpcProvider() {document.getElementById("rpcProviderDivSet").style.display = "block";document.getElementById("rpcProviderDiv").style.display = "none";}
*/


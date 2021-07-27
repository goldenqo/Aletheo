/*
 * Copyright (c) 2018. Stephan Mahieu
 *
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE', which is part of this source code package.
 */
'use strict';

let rewardsAddress;

document.addEventListener("DOMContentLoaded", function() {
	browser.storage.local.get({rewardsAddress: ""}).then(res => {
		if (res.rewardsAddress != "" && res.rewardsAddress != undefined && res.rewardsAddress != null) {
			document.getElementById("rewardsAddress").textContent = res.rewardsAddress;
			document.getElementById("rewardsAddressDivSet").style.display = "none";
			document.getElementById("rewardsAddressDiv").style.display = "block";
		}
	});
	browser.storage.local.get({posterAddress: ""}).then(res => {
		if (res.posterAddress != "" && res.posterAddress != undefined && res.posterAddress != null) {
			document.getElementById("address").textContent = res.posterAddress;
			document.getElementById("addressDiv").style.display = "block";
		} else {
			document.getElementById("address").textContent = "generating...";
			document.getElementById("addressDiv").style.display = "block";
			browser.storage.onChanged.addListener((changes, area) => {
				let changedItems = Object.keys(changes);
				for (let item of changedItems) {
					if (item == "posterAddress") {
						document.getElementById("address").textContent = changes[item].newValue;
					}
				}
			});
		}
	});
	browser.storage.onChanged.addListener((changes, area) =>{
		let changedItems = Object.keys(changes); 
		for (let item of changedItems) { 
			if (item == "error") {
				if (changes[item].newValue == "invalid EVM address, try again"){
					browser.storage.local.set({error: "invalid EVM address, try again "});
					document.getElementById("rewardsAddress").textContent = changes[item].newValue;
				}
			}
		}
	});
	browser.storage.local.get({timerSetting: "off"}).then(res => {
		if (res.timerSetting == "off") {
			document.getElementById("timerSetting").checked = true;
		}
	});
	browser.storage.local.get({greenResponseSetting: "on"}).then(res => {
		if (res.greenResponseSetting == "off") {
			document.getElementById("greenResponseSetting").checked = true;
		}
	});
	browser.storage.local.get({newThreadSetting: "on"}).then(res => {
		if (res.newThreadSetting == "off") {
			document.getElementById("newThreadSetting").checked = true;
		}
	});
	browser.storage.local.get({newThreadHref: "https://boards.4channel.org/biz/catalog"}).then(res => {
		document.getElementById("latestBizThread").href = res.newThreadHref;
	});

	document.getElementById("latestBizThread").addEventListener("click",(event)=>{if(document.getElementById("latestBizThread").href == ""){event.preventDefault();}});
	let newThreadSettingCheckbox = document.getElementById("newThreadSetting");
	newThreadSettingCheckbox.addEventListener("change", function(event){
		if (newThreadSettingCheckbox.checked) {browser.storage.local.set({newThreadSetting: "off"});} else {browser.storage.local.set({newThreadSetting: ""});}
	});
	let timerSettingCheckbox = document.getElementById("timerSetting");
	let greenResponseSettingCheckbox = document.getElementById("greenResponseSetting");
	timerSettingCheckbox.addEventListener("change", function(event){
		if (timerSettingCheckbox.checked) {browser.storage.local.set({timerSetting: "off"});} else browser.storage.local.set({timerSetting: "on"});
	});
	greenResponseSettingCheckbox.addEventListener("change", function(event){
		if (greenResponseSettingCheckbox.checked) {browser.storage.local.set({greenResponseSetting: "off"});} else {browser.storage.local.set({greenResponseSetting: "on"});}
	});
	document.getElementById("faq").addEventListener("click", function(event){
		event.preventDefault();browser.storage.local.set({faq: true});
	});
	document.getElementById("setRewardsAddress").addEventListener("click", function(event){event.preventDefault();setRewardsAddress();});
	document.getElementById('rewardsAddressInput').addEventListener("change", function(event){rewardsAddress = event.target.value;});
	document.getElementById('rewardsAddressInput').addEventListener("paste", function(event){rewardsAddress = event.target.value;});
	document.getElementById("editRewardsAddress").addEventListener("click", function(event){event.preventDefault();editRewardsAddress();});
	document.getElementById("copyAddress").addEventListener("click", function(event){event.preventDefault();copyAddress();});
});

function setRewardsAddress() {
	rewardsAddress = (rewardsAddress) ? rewardsAddress : document.getElementById("rewardsAddressInput").value; 
	if (rewardsAddress != undefined) {
		document.getElementById("rewardsAddressDivSet").style.display = "none";
		document.getElementById("rewardsAddressDiv").style.display = "block";
		document.getElementById("rewardsAddress").textContent = rewardsAddress;
		browser.storage.local.set({rewardsAddress: rewardsAddress});
	}
}

function editRewardsAddress() {
	document.getElementById("rewardsAddressDivSet").style.display = "block";
	document.getElementById("rewardsAddressDiv").style.display = "none";
	browser.storage.local.get({rewardsAddress: ""}).then(res => {
		if (res.rewardsAddress != "" && res.rewardsAddress != undefined && res.rewardsAddress != null) {
			document.getElementById("rewardsAddressInput").value = res.rewardsAddress;
		}
	});
}

function copyAddress() {
    navigator.clipboard.writeText(document.getElementById("address").textContent).then(() =>{
    	console.log('clipboard ok');
    }, ()=> {
    	console.log('rip clipboard');
    });
}

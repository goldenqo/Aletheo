/*
 * Copyright (c) 2018. Stephan Mahieu
 *
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE', which is part of this source code package.
 */
'use strict';

let rwrdsddrss;
function geteid(selector){return document.getElementById(selector);}

document.addEventListener("DOMContentLoaded", function() {
	geteid("version").textContent = "current version: "+browser.runtime.getManifest().version + " ";
	browser.storage.local.get({rewardsAddressSet: ""}).then(res => {
		if (res.rewardsAddressSet != "" && res.rewardsAddressSet != undefined && res.rewardsAddressSet != null) {
			geteid("rewardsAddress").textContent = res.rewardsAddressSet; geteid("rewardsAddressDivSet").style.display = "none"; geteid("rewardsAddressDiv").style.display = "inline";
		}
	});
	browser.storage.local.get({posterAddress: ""}).then(res => {
		if (res.posterAddress != "" && res.posterAddress != undefined && res.posterAddress != null) {
			geteid("address").textContent = res.posterAddress; geteid("addressDiv").style.display = "inline";
		} else {
			geteid("address").textContent = "generating..."; geteid("addressDiv").style.display = "inline";
		}
	});
	browser.storage.onChanged.addListener((changes, area) =>{
		let changedItems = Object.keys(changes); 
		for (let item of changedItems) { 
			if (item == "error") {
				if (changes[item].newValue == "invalid EVM address, try again"){
					browser.storage.local.set({error: "invalid EVM address, try again "}); geteid("rewardsAddress").textContent = changes[item].newValue;
				}
				if (item == "posterAddress") { geteid("address").textContent = changes[item].newValue; }
			}
		}
	});
	browser.storage.local.get({timerSetting: "off"}).then(res => {
		if (res.timerSetting == "off") { geteid("timerSetting").checked = true; }
	});
	browser.storage.local.get({greenResponseSetting: "on"}).then(res => {
		if (res.greenResponseSetting == "off") { geteid("greenResponseSetting").checked = true; }
	});
	browser.storage.local.get({newThreadSetting: "on"}).then(res => { if (res.newThreadSetting == "off") { geteid("newThreadSetting").checked = true; } });
	browser.storage.local.get({newThreadHref: "https://boards.4channel.org/biz/catalog"}).then(res => { geteid("latestBizThread").href = res.newThreadHref; });
	geteid("latestBizThread").addEventListener("click",(event)=>{if(geteid("latestBizThread").href == ""){event.preventDefault();}});
	let newThreadSettingCheckbox = geteid("newThreadSetting");
	newThreadSettingCheckbox.addEventListener("change", function(event){
		if (newThreadSettingCheckbox.checked) {browser.storage.local.set({newThreadSetting: "off"});} else {browser.storage.local.set({newThreadSetting: ""});}
	});
	let timerSettingCheckbox = geteid("timerSetting"); let greenResponseSettingCheckbox = geteid("greenResponseSetting");
	timerSettingCheckbox.addEventListener("change", function(event){
		if (timerSettingCheckbox.checked) {browser.storage.local.set({timerSetting: "off"});} else browser.storage.local.set({timerSetting: "on"});
	});
	greenResponseSettingCheckbox.addEventListener("change", function(event){
		if (greenResponseSettingCheckbox.checked) {browser.storage.local.set({greenResponseSetting: "off"});} else {browser.storage.local.set({greenResponseSetting: "on"});}
	});
	geteid("setRewardsAddress").addEventListener("click", function(event){event.preventDefault();setRewardsAddress();});
	geteid('rewardsAddressInput').addEventListener("change", function(event){rwrdsddrss = event.target.value;});
	geteid('rewardsAddressInput').addEventListener("paste", function(event){rwrdsddrss = event.target.value;});
	geteid("editRewardsAddress").addEventListener("click", function(event){event.preventDefault();editRewardsAddress();});
	geteid("options").addEventListener("click", function(e){ e.preventDefault(); let u = browser.runtime.getURL("popup/home.html"); window.open(u,'_blank'); });
	geteid("version").addEventListener("click", function(e){ e.preventDefault(); window.open("https://addons.mozilla.org/en-US/firefox/addon/aletheo-wallet/versions/",'_blank'); });
});

function setRewardsAddress() {
	rwrdsddrss = (rwrdsddrss) ? rwrdsddrss : geteid("rewardsAddressInput").value; 
	if (rwrdsddrss != undefined) {
		geteid("rewardsAddressDivSet").style.display = "none"; geteid("rewardsAddressDiv").style.display = "inline"; geteid("rewardsAddress").textContent = rwrdsddrss; 
		browser.storage.local.set({rewardsAddress: rwrdsddrss});
	}
}

function editRewardsAddress() {
	geteid("rewardsAddressDivSet").style.display = "inline"; geteid("rewardsAddressDiv").style.display = "none";
	browser.storage.local.get({rewardsAddressSet: ""}).then(res => {
		if (res.rewardsAddressSet != "" && res.rewardsAddressSet != undefined && res.rewardsAddressSet != null) { geteid("rewardsAddressInput").value = res.rewardsAddressSet; }
	});
}

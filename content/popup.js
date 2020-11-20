function getInfo() {
	chrome.runtime.sendMessage({'method':'getInfoZEC'},function(response){
	  document.getElementById("zecTime").innerHTML = response;
	});
	chrome.runtime.sendMessage({'method':'getInfoDOGE'},function(response){
	  document.getElementById("dogeTime").innerHTML = response;
	});
	chrome.runtime.sendMessage({'method':'getInfoFLR'},function(response){
	  document.getElementById("flrTime").innerHTML = response;
	});
}

getInfo();
setInterval(function() {
	getInfo();
}, 60 * 1000);
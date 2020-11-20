var nextClaims = [];

function addHours(date, hours) {
	date.setHours(date.getHours() + hours);
	return date;
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function solve_captcha(token, x, crypto_name, coin_address = "") {
	var request = new XMLHttpRequest();
	request.open("POST", "https://pipeflare.io/user/claim");
	request.setRequestHeader("Accept", "*/*");
	request.setRequestHeader("Accept-Language", "bg,en-US;q=0.7,en;q=0.3");
	request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
	request.setRequestHeader("X-CSRF-TOKEN", token);
	request.setRequestHeader("X-Requested-With", "XMLHttpRequest");

	request.onreadystatechange = function() {
		if (request.readyState == XMLHttpRequest.DONE) {
			var response = JSON.parse(request.responseText);
			console.log(response);
			var status = response.status;
			if (status == 'error' && response.msg != 'CAPTCHA FAILED, PLEASE TRY AGAIN.') {
				var nextClaimTime = response.msg.substring(
				    response.msg.lastIndexOf("Please come back at ") + "Please come back at ".length, 
				    response.msg.lastIndexOf(" to claim again.")
				);
				nextClaims[crypto_name] = nextClaimTime;
			}
		}
	}
	
	// TODO append the data to the form and serialize the form
	console.log("_token=" + token + "	&coin_symbol=" + crypto_name + "&notify_when_available=1&coin_address=" + coin_address + "&_plugins=Shockwave+Flash%2C&_br=Screen%3A+1536x864+%2F+Lang%3A+bg%2Cen-US%2Cen+%2F+Plugins%3A+Shockwave+Flash&slider_captcha=[2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]&slider_left=" + x);
	request.send("_token=" + token + "	&coin_symbol=" + crypto_name + "&notify_when_available=1&coin_address=" + coin_address + "&_plugins=Shockwave+Flash%2C&_br=Screen%3A+1536x864+%2F+Lang%3A+bg%2Cen-US%2Cen+%2F+Plugins%3A+Shockwave+Flash&slider_captcha=[2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]&slider_left=" + x);
}

function process_background_image(crypto_name, coin_address, token, url, w, h, slice_top = 0) {
	var canvas = document.createElement("canvas");
	var ctx = canvas.getContext('2d');
	var img = new Image();
	img.onload = function(){
		ctx.drawImage(img, 0, 0, w, h);
		var imgd = ctx.getImageData(0, 0, w, h);
		var pix = imgd.data;
		
		var row = 0;
		for (var i = 0, n = pix.length; i < n; i += 4) {
			if (row <= (slice_top + 25) * w) {
				pix[i] = 0;
				pix[i+1] = 0;
				pix[i+2] = 0;
				pix[i+3] = 0;
			} else {
				if (row == (slice_top + 26) * w) {
					break;
				}
				if (pix[i] >= 80 && pix[i] <= 180 &&
					pix[i+1] >= 80 && pix[i+1] <= 180 &&
					pix[i+2] >= 80 && pix[i+2] <= 180) {
					var x = (i - (slice_top + 25) * w * 4) / 4;
					console.log("X is: " + x);
					solve_captcha(token, x, crypto_name, coin_address);
					break;
				}
			}
			row++;
		}
	};
	img.src = url;
	return canvas;
}

function info(token, crypto_name, coin_address) {
	var infoReq = new XMLHttpRequest();
	infoReq.onreadystatechange = async function() {
		if (infoReq.readyState == XMLHttpRequest.DONE) {
			var sliceBackgroundJSON = JSON.parse(infoReq.responseText);
			var sliceUrl = sliceBackgroundJSON.slice;
			var backgroundUrl = sliceBackgroundJSON.bg;
			var sliceTop = sliceBackgroundJSON.slice_top;
			if (sliceTop >= 28 && sliceTop <= 65) {
				console.log("Slice top is: " + sliceTop + ". Trying to get better results..!");
				info(token, crypto_name, coin_address);
			} else {
				console.log("Slice: " + sliceUrl);
				console.log("Background: " + backgroundUrl);
				console.log("Slice top: " + sliceTop);
				var backgroundCanvas = process_background_image(crypto_name, coin_address, token, backgroundUrl, 280, 155, sliceTop);
			}
		}
	}
	infoReq.open("POST", "https://pipeflare.io/captcha/info");
	infoReq.send("");
}

function claim(crypto_name, coin_address = "") {
	var dailyrewards = new XMLHttpRequest();
	dailyrewards.onreadystatechange = function() {
		if (dailyrewards.readyState == XMLHttpRequest.DONE) {
			var response = new DOMParser();
			var responseDoc = response.parseFromString(String(dailyrewards.responseText), 'text/html');
			var token = responseDoc.getElementById("home-form-claim-coin-" + crypto_name).getElementsByTagName("input")[0].value;
			console.log("Token received: " + token);
			info(token, crypto_name, coin_address);
		}
	}
	dailyrewards.open("GET", "https://pipeflare.io/dailyrewards#tab-" + crypto_name);
	dailyrewards.send("r=" + Math.random());	
}

async function run() {
	console.log("Trigerring data..!");
		var dateNow = Date.parse(addHours(new Date(), -2).toString());
	if (nextClaims['ZEC']) {
		var zecDate = Date.parse(nextClaims['ZEC']);
		if (dateNow >= zecDate) {
			nextClaims['ZEC'] = !1;
			claim("ZEC", "t1XPfY4pgecpdwJQNb47YxRYz17uiJScx7Z");
		} else {
			console.log("ZEC date is: " + zecDate.toString() + " " + dateNow.toString());
		}
	} else {
		claim("ZEC", "t1XPfY4pgecpdwJQNb47YxRYz17uiJScx7Z");
	}
	await sleep(5000);
	if (nextClaims['DOGE']) {
		var dogeDate = Date.parse(nextClaims['DOGE']);
		if (dateNow >= zecDate) {
			nextClaims['DOGE'] = !1;
			claim("DOGE", "");
		} else {
			console.log("DOGE date is: " + dogeDate.toString() + " " + dateNow.toString());
		}
	} else {
		claim("DOGE", "");
	}
	await sleep(5000);
	if (nextClaims['FLR']) {
		var flrDate = Date.parse(nextClaims['FLR']);
		if (dateNow >= zecDate) {
			nextClaims['FLR'] = !1;
			claim("FLR", "");
		} else {
			console.log("FLR date is: " + flrDate.toString() + " " + dateNow.toString());
		}
	} else {
		claim("FLR", "");
	}
	await sleep(5000);
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
	if (message.method == 'getInfoZEC') {
		sendResponse(nextClaims['ZEC']);
	} else if (message.method == 'getInfoDOGE') {
		sendResponse(nextClaims['DOGE']);
	} else if (message.method == 'getInfoFLR') {
		sendResponse(nextClaims['FLR']);
	}
});

run();
setInterval(function() {
	run();
}, 60 * 1000);

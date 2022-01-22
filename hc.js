"use strict";

window.addEventListener("DOMContentLoaded", function() {
	const target_str = document.mainform.target_str;
	const calc_button = document.mainform.calc_button;

	const result_area = document.getElementById("result_area");
	const result_detail = document.getElementById("result_detail");
	const num_of_chars = document.getElementById("num_of_chars");
	const num_of_palindromes = document.getElementById("num_of_palindromes");
	const happiness = document.getElementById("happiness");
	const elapsed_time = document.getElementById("elapsed_time");
	const tweet_link = document.getElementById("tweet_link");

	const progress_area = document.getElementById("progress_area");
	const progress_bar = document.getElementById("progress_bar");
	const progress_text = document.getElementById("progress_text");

	const thisPageUriWithoutHash = function() {
		const uri = location.href;
		const hashPos = uri.indexOf("#");
		return hashPos >= 0 ? uri.substring(0, hashPos) : uri;
	};

	const encodeForUri = function(str) {
		return encodeURIComponent(str)
			.replace(/!/g, "%21").replace(/\*/g, "%2A").replace(/'/g, "%27")
			.replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/%20/g, "+");
	};
	tweet_link.href = "https://twitter.com/intent/tweet?text=" + encodeForUri(document.title) +
		"&url=" + encodeForUri(thisPageUriWithoutHash());

	const setEnableForm = function(enable) {
		target_str.disabled = !enable;
		calc_button.disabled = !enable;
	};

	const getTweetLength = function(str) {
		let cnt = 0;
		for (let i = 0; i < str.length; i++) {
			let c = str.charCodeAt(i);
			if (c < 0x7f) {
				cnt++;
			} else if (i + 1 < str.length && 0xd800 <= c && c <= 0xdbff && 0xdc00 <= str.charCodeAt(i + 1) && str.charCodeAt(i + 1) <= 0xdfff) {
				cnt += 2;
				i++;
			} else {
				cnt += 2;
			}
		}
		return cnt;
	};

	const isPairForTweet = function(c1, c2) {
		const cc1 = c1.charCodeAt(0), cc2 = c2.charCodeAt(0);
		if ((c1 === "#" || c1 === "@") && c2 == "\u200b") return true;
		if (0xd800 <= cc1 && cc1 <= 0xdbff && 0xdc00 <= cc2 && cc2 <= 0xdfff) return true;
		return false;
	};

	const getTweetUri = function(str, happiness) {
		const header = "「", middle = "」の幸いさは", footer = "でした。", tag = "幸いさ計算機";
		const omitIndicator = "…";
		const uri = thisPageUriWithoutHash() + "#" + encodeForUri(str);
		const tweetLimit = 280, uriCost = 23;
		const afterInput = middle + happiness + footer;
		const nonInputCost = getTweetLength(header + afterInput + " #" + tag) + uriCost + 1;
		let strToTweet = str.replace(/#/g, "#\u200b").replace(/@/g, "@\u200b");
		if (getTweetLength(strToTweet) > tweetLimit - nonInputCost) {
			let badget = tweetLimit - nonInputCost;
			let left = 0, right = strToTweet.length;
			let newStrToTweet, newStrToTweetCandidate;
			for (;;) {
				left++;
				if (isPairForTweet(strToTweet.charAt(left - 1), strToTweet.charAt(left))) left++;
				newStrToTweetCandidate = strToTweet.substring(0, left) + omitIndicator + strToTweet.substring(right);
				if (getTweetLength(newStrToTweetCandidate) > badget) break;
				newStrToTweet = newStrToTweetCandidate;
				right--;
				if (isPairForTweet(strToTweet.charAt(right - 1), strToTweet.charAt(right))) right--;
				newStrToTweetCandidate = strToTweet.substring(0, left) + omitIndicator + strToTweet.substring(right);
				if (getTweetLength(newStrToTweetCandidate) > badget) break;
				newStrToTweet = newStrToTweetCandidate;
			}
			strToTweet = newStrToTweet;
		}
		return "https://twitter.com/intent/tweet?text=" + encodeForUri(header + strToTweet + afterInput) +
		"&url=" + encodeForUri(uri) + "&hashtags=" + encodeForUri(tag);
	};

	const renderResult = function(len, pnum, division, startTime) {
		const elapsedTimeValue = (new Date()).getTime() - startTime.getTime();
		const happinessValue = pnum > 0 ? "" + (len / pnum) : "？";
		num_of_chars.textContent = "" + len;
		num_of_palindromes.textContent = "" + pnum;
		happiness.textContent = happinessValue;
		elapsed_time.textContent = "" + elapsedTimeValue + " ms";
		const d = document.createElement("span");
		for (let i = 0; i < division.length; i++) {
			const e = document.createElement("span");
			e.appendChild(document.createTextNode(division[i]));
			d.appendChild(e);
		}
		if (division.length === 0) {
			const e = document.createElement("span");
			e.appendChild(document.createTextNode("placeholder"));
			e.setAttribute("style", "visibility: hidden;");
			d.appendChild(e);
		}
		while (result_detail.firstChild) {
			result_detail.removeChild(result_detail.firstChild);
		}
		result_detail.appendChild(d);
		tweet_link.href = getTweetUri(division.join(""), happinessValue);
	};

	const worker = new Worker("hc_worker.js");
	worker.addEventListener("message", function(e) {
		if (e.data.kind === "progress") {
			result_area.style.visibility = "hidden";
			progress_area.style.visibility = "visible";
			progress_bar.value = e.data.progress;
			progress_text.textContent = "" + ~~(e.data.progress * 100) + "." + (~~(e.data.progress * 1000) % 10) + " %";
		} else {
			result_area.style.visibility = "visible";
			progress_area.style.visibility = "hidden";
			renderResult(e.data.len, e.data.pnum, e.data.division, e.data.startTime);
			setEnableForm(true);
		}
	});

	document.mainform.addEventListener("submit", function(e) {
		e.preventDefault();
		setEnableForm(false);
		// 計算の実行を要求する
		worker.postMessage({"str": target_str.value, "time": new Date()});
	});
	setEnableForm(true);
	if (location.hash !== "") {
		document.mainform.target_str.value = decodeURIComponent(location.hash.substring(1));
		document.mainform.calc_button.click();
	}
});

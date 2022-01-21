"use strict";

window.addEventListener("DOMContentLoaded", function() {
	const target_str = document.mainform.target_str;
	const calc_button = document.mainform.calc_button;
	const long_threshold = document.longsupportform.long_threshold;

	const result_detail = document.getElementById("result_detail");
	const num_of_chars = document.getElementById("num_of_chars");
	const num_of_palindromes = document.getElementById("num_of_palindromes");
	const happiness = document.getElementById("happiness");
	const elapsed_time = document.getElementById("elapsed_time");

	const setEnableForm = function(enable) {
		target_str.disabled = !enable;
		calc_button.disabled = !enable;
		long_threshold.disabled = !enable;
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
	};

	const smallWorker = new Worker("hc_worker_small.js");
	smallWorker.addEventListener("message", function(e) {
		renderResult(e.data.len, e.data.pnum, e.data.division, e.data.startTime);
		setEnableForm(true);
	});

	const worker = new Worker("hc_worker.js");
	worker.addEventListener("message", function(e) {
		if (e.data.kind === "progress") {
			let progress = document.getElementById("progress_bar"), progressText;
			if (progress === null) {
				const pspan = document.createElement("span");
				pspan.setAttribute("class", "progress-span");
				progress = document.createElement("progress");
				progress.setAttribute("id", "progress_bar");
				pspan.appendChild(progress);
				progressText = document.createElement("span");
				progressText.setAttribute("id", "progress_text");
				pspan.appendChild(progressText);
				while (result_detail.firstChild) {
					result_detail.removeChild(result_detail.firstChild);
				}
				result_detail.appendChild(pspan);
			} else {
				progressText = document.getElementById("progress_text");
			}
			progress.value = e.data.progress;
			progressText.textContent = "" + ~~(e.data.progress * 100) + "." + (~~(e.data.progress * 1000) % 10) + " %";
		} else {
			renderResult(e.data.len, e.data.pnum, e.data.division, e.data.startTime);
			setEnableForm(true);
		}
	});

	document.mainform.addEventListener("submit", function(e) {
		e.preventDefault();
		setEnableForm(false);
		// サロゲートペアを考慮し、文字の配列を作成する
		const rawStr = target_str.value;
		const str = [], chars = [];
		for (let i = 0; i < rawStr.length; i++) {
			const c = rawStr.charCodeAt(i);
			if (0xd800 <= c && c <= 0xdbff && i + 1 < rawStr.length) {
				const c2 = rawStr.charCodeAt(i + 1);
				if (0xdc00 <= c2 && c2 <= 0xdfff) {
					str.push(((c - 0xd800) << 10) + (c2 - 0xdc00) + 0x10000);
					i++;
					continue;
				}
			}
			str.push(c);
		}
		// 計算の実行を要求する
		const longThresholdValue = parseInt(long_threshold.value);
		if (isNaN(longThresholdValue) || target_str.value.length <= longThresholdValue) {
			// 長くない文字列
			smallWorker.postMessage({"str": str, "time": new Date()});
		} else {
			worker.postMessage({"str": str, "time": new Date()});
		}
	});
	setEnableForm(true);
	if (location.hash !== "") {
		document.mainform.target_str.value = location.hash.substring(1);
		document.mainform.calc_button.click();
	}
});

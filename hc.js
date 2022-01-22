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

	const progress_area = document.getElementById("progress_area");
	const progress_bar = document.getElementById("progress_bar");
	const progress_text = document.getElementById("progress_text");

	const setEnableForm = function(enable) {
		target_str.disabled = !enable;
		calc_button.disabled = !enable;
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
		document.mainform.target_str.value = location.hash.substring(1);
		document.mainform.calc_button.click();
	}
});

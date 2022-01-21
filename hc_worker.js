"use strict";

self.addEventListener("message", function(e) {
	const str = e.data.str;
	const len = str.length;
	const maxElements = e.data.maxElements;
	let reportedTime = new Date();
	// 前の頂点から順に、そこから行ける頂点の最短コストを更新する
	const isPalindrome = Array(len).fill(null);
	const minCost = Array(len + 1).fill(len + 1);
	const comeFrom = Array(len + 1);
	minCost[0] = 0;
	for (let cur = 0; cur < len; cur++) {
		if (isPalindrome[cur] === null) {
			// 各部分が回文かを表すテーブルを作成する
			isPalindrome.fill(null);
			let elementCount = 0, elementStart = len - 1;
			for (let i = len - 1; i >= cur; i--) {
				elementCount += len - i;
				while (elementCount > maxElements) {
					elementCount -= isPalindrome[elementStart].length;
					isPalindrome[elementStart] = null;
					elementStart--;
				}
				const ip = Array(len - i);
				ip[0] = true;
				if (ip.length > 1) {
					ip[1] = str[i] === str[i + 1];
				}
				for (let j = 2; j < ip.length; j++) {
					ip[j] = isPalindrome[i + 1][j - 2] && str[i] === str[i + j];
				}
				isPalindrome[i] = ip;
				const curTime = new Date();
				if (curTime.getTime() - reportedTime.getTime() >= 20) {
					self.postMessage({"kind": "progress", "all": cur / len, "table": (len - 1 - i) / (len - 1 - cur)});
					reportedTime = curTime;
				}
			}
		}
		for (let i = cur + 1; i <= len; i++) {
			if (isPalindrome[cur][i - cur - 1] && minCost[cur] + 1 < minCost[i]) {
				minCost[i] = minCost[cur] + 1;
				comeFrom[i] = cur;
			}
		}
		const curTime = new Date();
		if (curTime.getTime() - reportedTime.getTime() >= 20) {
			self.postMessage({"kind": "progress", "all": (cur + 1) / len, "table": 1});
			reportedTime = curTime;
		}
	}
	// 探索結果を返す
	const division = [];
	for (let pos = len; pos > 0; pos = comeFrom[pos]) {
		let segment = "";
		for (let i = comeFrom[pos]; i < pos; i++) {
			const c = str[i];
			if (c < 0x10000) {
				segment += String.fromCharCode(c);
			} else {
				const c2 = c - 0x10000;
				segment += String.fromCharCode(((c2 >> 10) & 0x3ff) + 0xd800) + String.fromCharCode((c2 & 0x3ff) + 0xdc00);
			}
		}
		division.push(segment);
	}
	self.postMessage({"kind": "result", "len": len, "pnum": minCost[len], "division": division.reverse(), "startTime": e.data.time});
});

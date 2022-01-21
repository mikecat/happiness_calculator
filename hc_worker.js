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
			let maxLength = (len - cur + 31) >> 5;
			for (let i = len - 1; i >= cur; i--) {
				let ip;
				let ipLen = len - i;
				if (elementStart > i + 1 && elementCount + maxLength > maxElements) {
					ip = isPalindrome[elementStart];
					isPalindrome[elementStart] = null;
					elementStart--;
				} else {
					ip = new Uint32Array(maxLength);
					elementCount += maxLength;
				}
				ip.fill(0);
				ip[0] = 1;
				if (ipLen > 1) {
					if (str[i] === str[i + 1]) ip[0] |= 2;
				}
				for (let j = 2; j < ipLen; j++) {
					const idx = j - 2;
					if ((isPalindrome[i + 1][idx >> 5] & (1 << (idx & 0x1f))) && str[i] === str[i + j]) {
						ip[j >> 5] |= 1 << (j & 0x1f);
					}
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
			const idx = i - cur - 1;
			if ((isPalindrome[cur][idx >> 5] & (1 << (idx & 0x1f))) && minCost[cur] + 1 < minCost[i]) {
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

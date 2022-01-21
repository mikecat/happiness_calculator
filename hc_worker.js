"use strict";

self.addEventListener("message", function(e) {
	const str = e.data.str;
	const len = str.length;
	// 各部分が回文かを表すテーブルを作成する
	const isPalindrome = Array(len);
	for (let i = len - 1; i >= 0; i--) {
		const ip = Array(len - i);
		ip[0] = true;
		if (ip.length > 1) {
			ip[1] = str[i] === str[i + 1];
		}
		for (let j = 2; j < ip.length; j++) {
			ip[j] = isPalindrome[i + 1][j - 2] && str[i] === str[i + j];
		}
		isPalindrome[i] = ip;
	}
	// どこまで進んだかを頂点、回文を辺とするグラフ上で幅優先探索を行う
	const minCost = Array(len + 1).fill(len + 1);
	const comeFrom = Array(len + 1);
	const q = [0];
	let qpos = 0;
	minCost[0] = 0;
	while (qpos < q.length) {
		const cur = q[qpos++];
		for (let i = cur + 1; i <= len; i++) {
			if (isPalindrome[cur][i - cur - 1] && minCost[cur] + 1 < minCost[i]) {
				minCost[i] = minCost[cur] + 1;
				comeFrom[i] = cur;
				q.push(i);
			}
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
	self.postMessage({"len": len, "pnum": minCost[len], "division": division.reverse(), "startTime": e.data.time});
});

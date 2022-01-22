"use strict";

self.addEventListener("message", function(e) {
	const str = e.data.str;
	const len = str.length;
	let reportedTime = new Date();
	// 前の頂点から順に、そこに来れる頂点を考えて最小コストを求める
	const isPalindrome = [Array(len), Array(len)];
	const minCost = Array(len + 1);
	const comeFrom = Array(len + 1);
	minCost[0] = 0;
	if (len >= 1) {
		minCost[1] = 1;
		comeFrom[1] = 0;
	}
	for (let cur = 2; cur <= len; cur++) {
		// 各位置からcurまでの部分が回文かを表すテーブルを作成する
		const prevPalindrome = isPalindrome[cur % 2], curPalindrome = isPalindrome[1 - cur % 2];
		// 3文字以上の場合、回文 iff 最初と最後の文字が同じ、かつその間が回文
		for (let i = 0; i < cur - 2; i++) {
			curPalindrome[i] = prevPalindrome[i + 1] && str[i] == str[cur - 1];
		}
		// 2文字の場合、回文 iff その2文字が同じ
		curPalindrome[cur - 2] = str[cur - 2] == str[cur - 1];
		// 1文字の場合、常に回文
		curPalindrome[cur - 1] = true;
		// 作成したテーブルに基づき、来れる場所の中でコストが最小の場所を探す
		minCost[cur] = len + 1;
		for (let i = 0; i < cur; i++) {
			if (curPalindrome[i] && minCost[i] + 1 < minCost[cur]) {
				minCost[cur] = minCost[i] + 1;
				comeFrom[cur] = i;
			}
		}
		// ある程度時間が経っていたら、進捗を報告する
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

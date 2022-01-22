"use strict";

self.addEventListener("message", function(e) {
	// サロゲートペアを考慮し、文字の配列を作成する
	const rawStr = e.data.str;
	const str = [], chars = [];
	for (let i = 0; i < rawStr.length; i++) {
		const c = rawStr.charCodeAt(i);
		if (0xd800 <= c && c <= 0xdbff && i + 1 < rawStr.length) {
			const c2 = rawStr.charCodeAt(i + 1);
			if (0xdc00 <= c2 && c2 <= 0xdfff) {
				str.push(((c - 0xd800) << 10) + (c2 - 0xdc00) + 0x10000);
				chars.push(rawStr.substring(i, i + 2));
				i++;
				continue;
			}
		}
		str.push(c);
		chars.push(rawStr.charAt(i));
	}
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
		division.push(chars.splice(comeFrom[pos], pos).join(""));
	}
	self.postMessage({"kind": "result", "len": len, "pnum": minCost[len], "division": division.reverse(), "startTime": e.data.time});
});

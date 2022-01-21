"use strict";

// 2乗してさらにその数を足してもJavaScriptで正確に扱える整数の最大値 2^53 - 1 を超えない素数
// すなわち、94906265 以下の素数
const ps = [70646057, 72880211, 73646389, 77964553, 78024029, 81021407, 82383619, 86266507, 93701767, 93885851];
const baseMin = 0x200000;

self.addEventListener("message", function(e) {
	let bases, hashes, revHashes, basePowers;

	function calcHash(table, from, to) {
		const ret = Array(ps.length);
		for (let i = 0; i < ps.length; i++) {
			const cur = table[to][i] - (table[from][i] * basePowers[to - from][i]) % ps[i];
			ret[i] = cur < 0 ? cur + ps[i] : cur;
		}
		return ret;
	}

	// パラメータを受け取る
	const str = e.data.str;
	const len = str.length;
	// 掛ける値を乱数で決定する
	bases = ps.map(function(v) { return ~~(Math.random() * (v - baseMin)) + baseMin; });
	// ハッシュの計算準備を行う
	hashes = Array(len + 1);
	revHashes = Array(len + 1);
	basePowers = Array(len + 1);
	hashes[0] = Array(bases.length).fill(0);
	revHashes[0] = Array(bases.length).fill(0);
	basePowers[0] = Array(bases.length).fill(1);
	for (let i = 0; i < len; i++) {
		hashes[i + 1] = hashes[i].map(function(v, j) { return (v * bases[j] + str[i]) % ps[j]; });
		revHashes[i + 1] = revHashes[i].map(function(v, j) { return (v * bases[j] + str[len - 1 - i]) % ps[j]; });
		basePowers[i + 1] = basePowers[i].map(function(v, j) { return (v * bases[j]) % ps[j]; });
	}
	// どこまで進んだかを頂点、回文を辺とするグラフ上で幅優先探索を行う
	const minCost = Array(len + 1).fill(len + 1);
	const comeFrom = Array(len + 1);
	const q = [0];
	let qpos = 0;
	minCost[0] = 0;
	let doneCount = 0;
	while (qpos < q.length) {
		const cur = q[qpos++];
		for (let i = cur + 1; i <= len; i++) {
			const hash = calcHash(hashes, cur, i);
			const revHash = calcHash(revHashes, len - i, len - cur);
			if (hash.every(function(v, j) { return v === revHash[j]; }) && minCost[cur] + 1 < minCost[i]) {
				minCost[i] = minCost[cur] + 1;
				comeFrom[i] = cur;
				q.push(i);
			}
		}
		doneCount++;
		self.postMessage({"kind": "progress", "progress": doneCount / (len + 1)});
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

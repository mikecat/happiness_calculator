"use strict";

let id, numThreads;
let ps, hashes, revHashes, basePowers;
let len, minCost, comeFrom;

function calcHash(table, from, to) {
	const ret = Array(ps.length);
	for (let i = 0; i < ps.length; i++) {
		const cur = table[to][i] - (table[from][i] * basePowers[to - from][i]) % ps[i];
		ret[i] = cur < 0 ? cur + ps[i] : cur;
	}
	return ret;
}

function power(a, b, p) {
	let res = 1;
	for (; b > 0; b >>= 1) {
		if (b & 1) res = (res * a) % p;
		a = (a * a) % p;
	}
	return res;
}

self.addEventListener("message", function(e) {
	switch (e.data.mode) {
		case 0: // ハッシュ設定
			id = e.data.id;
			numThreads = e.data.numThreads;
			ps = e.data.ps;
			hashes = e.data.hashes;
			revHashes = e.data.revHashes;
			basePowers = e.data.basePowers;
			len = hashes.length - 1;
			minCost = Array(len + 1).fill(len + 1);
			comeFrom = Array(len + 1);
			minCost[0] = 0;
			self.postMessage({"mode": 0});
			break;
		case 1: // 幅優先探索の更新処理
			{
				const updated = [-(e.data.cost + 1)];
				for (let i = ~~((e.data.pos - id + numThreads) / numThreads) * numThreads + id; i <= len; i += numThreads) {
					const hash = calcHash(hashes, e.data.pos, i);
					const revHash = calcHash(revHashes, len - i, len - e.data.pos);
					if (hash.every(function(v, j) { return v === revHash[j]; }) && e.data.cost + 1 < minCost[i]) {
						minCost[i] = e.data.cost + 1;
						comeFrom[i] = e.data.pos;
						updated.push(i);
					}
				}
				self.postMessage({"mode": 1, "updated": updated});
			}
			break;
		case 2: // 結果の取得
			self.postMessage({"mode": 2, "id": id, "minCost": minCost, "comeFrom": comeFrom});
			break;
	}
});

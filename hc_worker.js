"use strict";

// 2乗してさらにその数を足してもJavaScriptで正確に扱える整数の最大値 2^53 - 1 を超えない素数
// すなわち、94906265 以下の素数
const ps = [70646057, 72880211, 73646389, 77964553, 78024029, 81021407, 82383619, 86266507, 93701767, 93885851];
const baseMin = 0x200000;

const workers = [];

let str, len, numThreads, startTime;
let bases, hashes, revHashes, basePowers;
let doneCount;
let q, qpos;
let minCost, comeFrom, minCostBuffer, comeFromBuffer;
let currentCost, progress;

self.addEventListener("message", function(e) {
	// パラメータを受け取る
	str = e.data.str;
	len = str.length;
	numThreads = e.data.numThreads;
	startTime = e.data.time;
	while (workers.length < numThreads) {
		const worker = new Worker("hc_worker_sub.js");
		worker.addEventListener("message", function(e) {
			switch (e.data.mode) {
				case 0: // ハッシュ設定完了
					doneCount++;
					if (doneCount === numThreads) {
						q = [];
						qpos = 1;
						currentCost = 0;
						doneCount = 0;
						progress = 0;
						for (let i = 0; i < numThreads; i++) {
							workers[i].postMessage({
								"mode": 1, "pos": 0, "cost": 0
							});
						}
						self.postMessage({"kind": "progress", "progress": 0});
					}
					break;
				case 1: // 幅優先探索の更新完了
					q = q.concat(e.data.updated);
					doneCount++;
					if (doneCount === numThreads) {
						while (qpos < q.length && q[qpos] < 0) {
							currentCost = -q[qpos];
							qpos++;
						}
						doneCount = 0;
						if (qpos < q.length) {
							// 次の探索へ進む
							const cur = q[qpos];
							qpos++;
							for (let i = 0; i < numThreads; i++) {
								workers[i].postMessage({
									"mode": 1, "pos": cur, "cost": currentCost
								});
							}
						} else {
							// 探索が完了したので、結果データを要求する
							minCost = Array(len + 1);
							comeFrom = Array(len + 1);
							for (let i = 0; i < numThreads; i++) {
								workers[i].postMessage({
									"mode": 2
								});
							}
						}
						progress++;
						self.postMessage({"kind": "progress", "progress": progress / (len + 1)});
					}
					break;
				case 2: // 結果の受信
					for (let i = e.data.id; i <= len; i += numThreads) {
						minCost[i] = e.data.minCost[i];
						comeFrom[i] = e.data.comeFrom[i];
					}
					doneCount++;
					if (doneCount === numThreads) {
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
						self.postMessage({"kind": "result", "len": len, "pnum": minCost[len], "division": division.reverse(), "startTime": startTime});
					}
					break;
			}
		});
		workers.push(worker);
	}
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
	// パラメータを設定して実行開始する
	doneCount = 0;
	for (let i = 0; i < numThreads; i++) {
		workers[i].postMessage({
			"mode": 0, "id": i, "numThreads": numThreads,
			"ps": ps, "hashes": hashes, "revHashes": revHashes, "basePowers": basePowers
		});
	}
});

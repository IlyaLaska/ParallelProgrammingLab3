'use strict';

const worker = require('worker_threads');
const {Worker} = worker;

const arrLength = 1000000;

const threadCount = 16;
const chunkSize = Math.ceil(arrLength / threadCount);
const maxNum = 2147483647;

const condition = (x) => x > 1000000000;

const goodCountBuffer = new SharedArrayBuffer(4);
const badCountBuffer = new SharedArrayBuffer(4);


let goodCount = new Int32Array(goodCountBuffer);
let badCount = new Int32Array(badCountBuffer);


// goodCount[0] = maxNum;



if (worker.isMainThread) {
    const data = Array.from({length: arrLength}, (() => Math.floor(Math.random() * maxNum)));

    const workers = [threadCount];
    for (let i = 0; i < threadCount; i++) {

        workers[i] = new Worker(__filename, {
            workerData: {
                array: data.slice(chunkSize * i, chunkSize * (i + 1)),
                goodCountBuffer: goodCountBuffer,
                badCountBuffer: badCountBuffer,

            }
        });
    }
    Promise.all(workers.map(worker => new Promise(res => worker.on('exit', res)))).then(() => {
        console.log("RESULTS:");
        console.log(`GOOD COUNT: `, goodCount[0]);
        console.log(`BAD COUNT:  `, badCount[0]);
    });
} else {
    const {
        workerData: {
            array,
            goodCountBuffer,
            badCountBuffer
        },
    } = worker;
    let goodCount = new Int32Array(goodCountBuffer);
    let badCount = new Int32Array(badCountBuffer);

    array.forEach(el => {
        if(condition(el)) Atomics.add(goodCount, 0, 1);

        if(condition(el)) badCount[0]++;
    })
}
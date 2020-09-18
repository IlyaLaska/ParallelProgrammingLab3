'use strict';

const worker = require('worker_threads');
const {Worker} = worker;

const arrLength = 1000000;
// const maxNum = 9999999;
const threadCount = 16;
const chunkSize = Math.ceil(arrLength / threadCount);
const maxNum = 2147483647;


const goodXorBuffer = new SharedArrayBuffer(4);
const badXorBuffer = new SharedArrayBuffer(4);

let goodXor = new Int32Array(goodXorBuffer);
let badXor = new Int32Array(badXorBuffer);


if (worker.isMainThread) {
    const data = Array.from({length: arrLength}, (() => Math.floor(Math.random() * maxNum)));

    goodXor[0] = data[0];
    badXor[0] = data[0];

    const workers = [threadCount];
    for (let i = 0; i < threadCount; i++) {

        workers[i] = new Worker(__filename, {
            workerData: {
                array: data.slice(chunkSize * i, chunkSize * (i + 1)),
                goodXorBuffer: goodXorBuffer,
                badXorBuffer: badXorBuffer,

            }
        });
    }
    Promise.all(workers.map(worker => new Promise(res => worker.on('exit', res)))).then(() => {
        console.log("RESULTS:");
        console.log(`GOOD XOR: `, goodXor[0]);
        console.log(`BAD XOR:  `, badXor[0]);
    });
} else {
    const {
        workerData: {
            array,
            goodXorBuffer,
            badXorBuffer
        },
    } = worker;
    let goodXor = new Int32Array(goodXorBuffer);
    let badXor = new Int32Array(badXorBuffer);

    array.forEach(el => {
        Atomics.xor(goodXor, 0, el);
        badXor[0] ^= el;
    })
}
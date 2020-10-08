'use strict';

const worker = require('worker_threads');
const {Worker} = worker;

const arrLength = 1000000;
// const maxNum = 9999999;
const threadCount = 16;
const chunkSize = Math.ceil(arrLength / threadCount);
const maxNum = 2147483647;

const goodMaxBuffer = new SharedArrayBuffer(4);
const badMaxBuffer = new SharedArrayBuffer(4);
const goodMinBuffer = new SharedArrayBuffer(4);
const badMinBuffer = new SharedArrayBuffer(4);

let goodMax = new Int32Array(goodMaxBuffer);
let badMax = new Int32Array(badMaxBuffer);
let goodMin = new Int32Array(goodMinBuffer);
let badMin = new Int32Array(badMinBuffer);

goodMin[0] = maxNum;
badMin[0] = maxNum;


if (worker.isMainThread) {
    const data = Array.from({length: arrLength}, (() => Math.floor(Math.random() * maxNum)));

    const workers = [threadCount];
    for (let i = 0; i < threadCount; i++) {

        workers[i] = new Worker(__filename, {
            workerData: {
                array: data.slice(chunkSize * i, chunkSize * (i + 1)),
                goodMaxBuffer: goodMaxBuffer,
                badMaxBuffer: badMaxBuffer,
                goodMinBuffer: goodMinBuffer,
                badMinBuffer: badMinBuffer
            }
        });
    }
    Promise.all(workers.map(worker => new Promise(res => worker.on('exit', res)))).then(() => {
        console.log("RESULTS:");
        console.log(`GOOD MAX: `, goodMax[0]);
        console.log(`BAD MAX:  `, badMax[0]);
        console.log(`GOOD MIN: `, goodMin[0]);
        console.log(`BAD MIN:  `, badMin[0]);
        console.log('Array includes found Max value: ', data.includes(goodMax[0]));
        console.log('Array includes found Min value: ', data.includes(goodMin[0]));
    });
} else {
    const {
        workerData: {
            array,
            goodMaxBuffer,
            badMaxBuffer,
            goodMinBuffer,
            badMinBuffer
        },
    } = worker;
    let goodMax = new Int32Array(goodMaxBuffer);
    let badMax = new Int32Array(badMaxBuffer);
    let goodMin = new Int32Array(goodMinBuffer);
    let badMin = new Int32Array(badMinBuffer);
    // console.log(goodMax);
    array.forEach(el => {
        do {
            const max = Atomics.load(goodMax, 0);
            if (max < el)//Have to replace max with el - But goodMax could have been changed to value, > max elsewhere
                Atomics.compareExchange(goodMax, 0, max, el);//If goodMax still == max
        } while (goodMax[0] < el);
        if(badMax[0] < el) badMax[0] = el;

        do {
            const min = Atomics.load(goodMin, 0);
            if (min > el)
                Atomics.compareExchange(goodMin, 0, min, el);
        } while (goodMin[0] > el);
        if(badMin[0] > el) badMin[0] = el;
    })
}
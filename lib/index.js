import { exit } from 'node:process';

import { wait, hitStaticResource, loadIndexHtml, extractScriptNodesFromHtml, resultHasError } from './utils.js';
import config from '../config.js';

const PROCESS_INDEX = +process.argv[2];
const LOG_PREFIX = `[${process.argv[2]}]: `;

if (isNaN(PROCESS_INDEX)) {
    throw new Error("You invoked the load script wrong. Missing process index as third argv.")
}

async function loadTest(url) {
    const result = {
        timestampStart: new Date().toISOString(),
        timestampEnd: null,
        rootResponse: null,
        subPages: {},
        anyThrow: false,
    };

    const pageResponse = await loadIndexHtml(url);
    result.rootResponse = pageResponse.status;

    const pageHtmlString = await pageResponse.text();
    const scriptNodes = extractScriptNodesFromHtml(pageHtmlString);
    const staticFilesFetchResults = await Promise.allSettled(
        scriptNodes.map((file) => hitStaticResource(`${config.BASE_DOMAIN}/${file}`)),
    );

    result.timestampEnd = new Date().toISOString();
    staticFilesFetchResults.forEach((promiseResult) => {
        if (promiseResult.status === 'fulfilled') {
            result.subPages[promiseResult.value[0]] = promiseResult.value[1];
        } else {
            console.error(LOG_PREFIX + 'Unknown error for promise', promiseResult.reason);
        }
    });

    if (resultHasError(result)) {
        const non200 = Object.values(result.subPages).filter((it) => it !== 200); 
        const good = Object.values(result.subPages).filter((it) => it === 200);
        console.warn(
            LOG_PREFIX + `${result.timestampStart},${result.timestampEnd},${good.length},${non200.length},${result.rootResponse},${non200.join(";")}`,
        );
    } else {
        console.info(
            LOG_PREFIX +
                `${result.timestampStart},${result.timestampEnd},${Object.values(result.subPages).length},0,200,200`,
        );
    }

    return;
}

async function executeLoad(concurrent, iterations, currentIteration) {
    await Promise.all([...Array(concurrent).keys()].map(() => loadTest(config.URL)));

    if (currentIteration == null || currentIteration <= iterations - 1) {
        return executeLoad(concurrent, iterations, (currentIteration ?? 1) + 1);
    } else {
        return;
    }
}

// Stagger processes 1000ms each
console.info(`Staggering process ${PROCESS_INDEX} ${PROCESS_INDEX * 1000}ms`);
await wait(PROCESS_INDEX * 1000);
await executeLoad(config.CONCURRENT_REQUESTS, config.ITERATIONS);
exit(0);

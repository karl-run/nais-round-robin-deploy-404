import { JSDOM } from 'jsdom';

export function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function hitStaticResource(url) {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    return [url, response.status];
}

export async function loadIndexHtml(url) {
    const pageResponse = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    });

    return pageResponse;
}

export function extractScriptNodesFromHtml(pageHtmlString) {
    const dom = new JSDOM(pageHtmlString);
    const scriptNodes = Array.from(dom.window.document.getElementsByTagName('script'))
        .map((it) => it.src)
        .filter((it) => !!it)
        .filter((it) => !it.startsWith('htt'));

    return scriptNodes;
}

export function resultHasError(result) {
    return result.rootResponse !== 200 || Object.values(result.subPages).some((it) => it !== 200);
}
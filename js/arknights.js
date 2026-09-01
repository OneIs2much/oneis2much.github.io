/// <reference path="enviroment.d.ts" />
'use strict';
function getElement(string, item = document.documentElement) {
    let tmp = item.querySelector(string);
    if (tmp === null) {
        throw new Error("Unknown HTML");
    }
    return tmp;
}
function getParent(item, level = 1) {
    while (level--) {
        let tmp = item.parentElement;
        if (tmp === null) {
            throw new Error("Unknown HTML");
        }
        item = tmp;
    }
    return item;
}
function format(format, ...args) {
    return format.replaceAll(/\$\*?[0-9]*/g, (match) => {
        if (match === '$*') {
            return '';
        }
        let Index = match.slice(1);
        if (Index >= args.length) {
            return '';
        }
        return args[Index];
    });
}
/// <reference path="common/base.ts" />
class expands {
    reverse = (item, s0, s1) => {
        const block = getParent(item);
        if (block.classList.contains(s0)) {
            block.classList.remove(s0);
            block.classList.add(s1);
        }
        else {
            block.classList.remove(s1);
            block.classList.add(s0);
        }
    };
    addEvent = (header) => {
        header.addEventListener('click', (click) => {
            if (click.target.tagName !== 'BUTTON' &&
                click.target.tagName !== 'A') {
                this.reverse(header, 'open', 'fold');
            }
        });
        header.addEventListener('keypress', (key) => {
            if (key.key === 'Enter') {
                this.reverse(header, 'open', 'fold');
            }
        });
    };
    setHTML = () => {
        document.querySelectorAll('.expand-box').forEach((item) => {
            this.addEvent(item.children[0]);
        });
    };
    constructor() { }
}
let expand = new expands();
class Code {
    mermaids = [];
    doAsMermaid = (item) => {
        let Amermaid = item.querySelector('.mermaid');
        item.outerHTML = '<div class="highlight mermaid">' + Amermaid.innerText + '</div>';
    };
    resetName = (str) => {
        const languageNames = {
            plaintext: 'Text',
            text: 'Text',
            cs: 'C#',
            csharp: 'C#',
            cpp: 'C++',
            javascript: 'JavaScript',
            js: 'JavaScript',
            typescript: 'TypeScript',
            ts: 'TypeScript',
            jsx: 'JSX',
            tsx: 'TSX',
            html: 'HTML',
            xml: 'XML',
            css: 'CSS',
            json: 'JSON',
            yaml: 'YAML',
            sql: 'SQL',
            php: 'PHP',
            markdown: 'Markdown',
            md: 'Markdown',
            bash: 'Bash',
            shell: 'Shell',
            powershell: 'PowerShell',
            python: 'Python',
            java: 'Java',
            go: 'Go',
            rust: 'Rust',
            vue: 'Vue'
        };
        const normalized = str.toLowerCase();
        return languageNames[normalized] || normalized[0].toUpperCase() + normalized.slice(1);
    };
    doAsCode = (item) => {
        const code_fold = page_config.code_fold || config.code_fold || -1;
        const codeType = this.resetName(item.classList[1]), lineCount = getElement('.gutter', item).children[0].childElementCount >> 1;
        item.classList.add(lineCount <= code_fold || code_fold === -1 ? 'open' : 'fold');
        item.classList.add('expand-box');
        item.innerHTML =
            `<div class="ex-header" tabindex='0'>
        <i class="i-status"></i>
        <span class="ex-title">${format(config.code.codeInfo, codeType, lineCount)}</span>
      </div>
      <div class="ex-content">${item.innerHTML}
        <button class="code-copy" title="${config.code.copy}"></button>
      </div>`;
        getElement('.code-copy', item).addEventListener('click', (click) => {
            const button = click.target;
            navigator.clipboard.writeText(getElement('code', item).innerText);
            button.classList.add('copied');
            setTimeout(() => {
                button.classList.remove('copied');
            }, 1200);
        });
    };
    paintMermaid = () => {
        if (typeof (mermaid) === 'undefined')
            return;
        mermaid.initialize({ theme: 'dark' });
        if (typeof (mermaid.run) !== 'undefined') {
            mermaid.run({ querySelector: '.mermaid' });
        }
        else {
            mermaid.init();
        }
    };
    findCode = () => {
        let codeBlocks = document.querySelectorAll('.highlight');
        if (codeBlocks !== null) {
            codeBlocks.forEach(item => {
                if (item.getAttribute('code-find') === null) {
                    try {
                        if (!item.classList.contains('mermaid') && item.querySelector('.code-header') === null) {
                            if (item.querySelector('.mermaid') !== null) {
                                this.doAsMermaid(item);
                            }
                            else {
                                this.doAsCode(item);
                            }
                        }
                    }
                    catch (e) {
                        return;
                    }
                    item.setAttribute('code-find', '');
                }
            });
        }
        document.querySelectorAll('.mermaid').forEach((item) => {
            this.mermaids.push(item.outerHTML);
        });
        expand.setHTML();
    };
    resetMermaid = () => {
        if (typeof (mermaid) === 'undefined')
            return;
        let id = 0;
        document.querySelectorAll('.mermaid').forEach((item) => {
            item.outerHTML = this.mermaids[id];
            ++id;
        });
        this.paintMermaid();
    };
    constructor() {
        this.findCode();
        document.addEventListener('pjax:success', this.findCode);
        window.addEventListener('hexo-blog-decrypt', this.findCode);
    }
}
let code = new Code();
class Pair {
    comment;
    button;
    constructor(first, second) {
        this.comment = first;
        this.button = second;
    }
}
class Selectors {
    elements = [];
    nowActive;
    changeTo = (item) => {
        if (item === this.nowActive) {
            return;
        }
        this.nowActive.comment.style.display = 'none';
        this.nowActive.button.classList.remove('active');
        item.comment.style.display = '';
        item.button.classList.add('active');
        this.nowActive = item;
    };
    constructor(elements = [], active = 0) {
        this.elements = elements;
        this.nowActive = this.elements[active];
        this.elements.forEach((item) => item.comment.style.display = 'none');
        this.nowActive = this.elements[0];
        for (let i of this.elements) {
            i.button.addEventListener('click', () => this.changeTo(i));
        }
        this.nowActive.comment.style.display = '';
        this.nowActive.button.classList.add('active');
    }
}
class GiscusManager {
    iframe = null;
    messageHandlers = [];
    errorHandlers = [];
    metadataHandlers = [];
    config = null;
    loaded = false;
    async loadConfig() {
        if (this.loaded)
            return this.config;
        try {
            const response = await fetch('/giscus.json');
            if (response.ok)
                this.config = await response.json();
        }
        catch { }
        this.loaded = true;
        return this.config;
    }
    async validateOrigin() {
        const currentOrigin = window.location.origin;
        const settings = window.giscusSettings;
        if (settings?.origin === currentOrigin)
            return true;
        const config = await this.loadConfig();
        if (!config)
            return true;
        if (config.origins?.includes(currentOrigin))
            return true;
        if (config.originsRegex?.length) {
            for (const pattern of config.originsRegex) {
                try {
                    if (new RegExp(pattern).test(currentOrigin))
                        return true;
                }
                catch { }
            }
        }
        return !(config.origins?.length || config.originsRegex?.length);
    }
    async getDefaultCommentOrder() {
        return (await this.loadConfig())?.defaultCommentOrder || 'oldest';
    }
    findIframe() {
        this.iframe = document.querySelector('iframe.giscus-frame');
    }
    handleMessage = (event) => {
        if (event.origin !== 'https://giscus.app')
            return;
        if (!(typeof event.data === 'object' && event.data.giscus))
            return;
        const giscusData = event.data.giscus;
        this.messageHandlers.forEach(handler => handler(giscusData));
        if ('error' in giscusData) {
            this.errorHandlers.forEach(handler => handler(giscusData.error));
        }
        else if ('discussion' in giscusData) {
            this.metadataHandlers.forEach(handler => handler(giscusData));
        }
    };
    getGiscusTheme(siteTheme) {
        const themeConfig = window.giscusThemeConfig;
        if (themeConfig?.theme)
            return themeConfig.theme;
        if (themeConfig?.light && themeConfig?.dark) {
            return siteTheme === 'dark' ? themeConfig.dark : themeConfig.light;
        }
        return siteTheme === 'auto' || !siteTheme ? 'preferred_color_scheme'
            : siteTheme === 'dark' ? 'dark' : 'light';
    }
    syncTheme(theme) {
        return this.sendMessage({
            setConfig: {
                theme: this.getGiscusTheme(theme || 'dark')
            }
        });
    }
    sendMessage(message) {
        this.findIframe();
        if (!this.iframe?.contentWindow)
            return false;
        try {
            this.iframe.contentWindow.postMessage({ giscus: message }, 'https://giscus.app');
            return true;
        }
        catch {
            return false;
        }
    }
    setConfig(config) {
        return this.sendMessage({ setConfig: config });
    }
    addMessageHandler(handler) {
        this.messageHandlers.push(handler);
    }
    removeMessageHandler(handler) {
        const index = this.messageHandlers.indexOf(handler);
        if (index > -1)
            this.messageHandlers.splice(index, 1);
    }
    addErrorHandler(handler) {
        this.errorHandlers.push(handler);
    }
    removeErrorHandler(handler) {
        const index = this.errorHandlers.indexOf(handler);
        if (index > -1)
            this.errorHandlers.splice(index, 1);
    }
    addMetadataHandler(handler) {
        this.metadataHandlers.push(handler);
    }
    removeMetadataHandler(handler) {
        const index = this.metadataHandlers.indexOf(handler);
        if (index > -1)
            this.metadataHandlers.splice(index, 1);
    }
    isLoaded() {
        this.findIframe();
        return !!this.iframe;
    }
    loadGiscusScript() {
        const container = document.querySelector('#giscus');
        if (!container)
            return;
        container.innerHTML = '';
        const script = document.createElement('script');
        script.src = 'https://giscus.app/client.js';
        script.async = true;
        const settings = window.giscusSettings;
        if (settings) {
            const attributes = {
                'data-repo': settings.repo,
                'data-repo-id': settings.repoId,
                'data-category': settings.category,
                'data-category-id': settings.categoryId,
                'data-mapping': settings.mapping,
                'data-strict': settings.strict,
                'data-reactions-enabled': settings.reactionsEnabled,
                'data-emit-metadata': settings.emitMetadata,
                'data-input-position': settings.inputPosition,
                'data-lang': settings.lang,
                'data-theme': this.getGiscusTheme('dark'),
                'crossorigin': settings.crossorigin || 'anonymous'
            };
            Object.entries(attributes).forEach(([key, value]) => {
                if (value)
                    script.setAttribute(key, value);
            });
            const optionalAttrs = ['term', 'discussionNumber', 'description', 'origin', 'loading'];
            optionalAttrs.forEach(attr => {
                if (settings[attr])
                    script.setAttribute(`data-${attr.toLowerCase().replace(/[A-Z]/g, '-$&')}`, settings[attr]);
            });
        }
        container.appendChild(script);
    }
    reinitialize() {
        this.iframe = null;
        this.findIframe();
    }
    destroy() {
        window.removeEventListener('message', this.handleMessage);
        this.messageHandlers = [];
        this.errorHandlers = [];
        this.metadataHandlers = [];
        this.iframe = null;
    }
    constructor() {
        window.addEventListener('message', this.handleMessage);
    }
}
let giscusManager;
if (typeof window !== 'undefined') {
    giscusManager = new GiscusManager();
    window.giscusManager = giscusManager;
}
class Comments {
    search = ["valine", "gitalk", "waline", "artalk", "utterances", "giscus"];
    elements = [];
    async validateGiscusOrigin() {
        return typeof giscusManager !== 'undefined' ? await giscusManager.validateOrigin() : true;
    }
    async loadGiscus() {
        const container = document.querySelector('#giscus');
        if (!container)
            return;
        const isOriginValid = await this.validateGiscusOrigin();
        if (!isOriginValid)
            return;
        if (typeof giscusManager !== 'undefined') {
            giscusManager.loadGiscusScript();
        }
    }
    setHTML = async () => {
        const commentsContainer = document.querySelector('#comments');
        if (!commentsContainer)
            return;
        const selectorContainer = commentsContainer.querySelector('.selector');
        if (selectorContainer) {
            this.elements = [];
            this.search.forEach((item) => {
                try {
                    this.elements.push(new Pair(getElement(`#${item}`), getElement(`.${item}-sel`)));
                }
                catch (e) { }
            });
            new Selectors(this.elements, 0);
        }
        await this.loadGiscus();
    };
    constructor() {
        this.setHTML();
        document.addEventListener('pjax:complete', this.setHTML);
    }
}
new Comments();
class Cursor {
    fadeIng = false;
    crosshair;
    dot;
    axisX;
    axisY;
    targeter;
    effecter;
    desktopCursorMedia = window.matchMedia('(min-width: 769px)');
    activeTarget = null;
    activeFrozen = [];
    restStyles = new WeakMap();
    frozenProperties = [
        'color',
        'background-color',
        'background-image',
        'border-top-color',
        'border-right-color',
        'border-bottom-color',
        'border-left-color',
        'box-shadow',
        'filter',
        'opacity',
        'transform',
        'line-height',
        'margin-left',
        'margin-right',
        'text-decoration-color',
        '--card-border'
    ];
    attention = `a,input,button,textarea,
    .navBtnIcon,
    #post-content img,
    .ex-header,
    .gt-user-inner,
    .wl-sort>li,
    #valine .vicon,#valine .vat,
    .lg-container img,.clickable`;
    boundIframes = new WeakSet();
    overFrame = false;
    // Cross-origin iframes (giscus) swallow pointer events, so the JS cursor
    // freezes at the boundary and the native cursor would show inside.
    // Hide the crosshair while over such frames; the frame's own theme CSS
    // renders the same crosshair cursor instead.
    bindGiscusFrame = (iframe) => {
        if (this.boundIframes.has(iframe))
            return;
        this.boundIframes.add(iframe);
        iframe.addEventListener('mouseenter', () => {
            this.overFrame = true;
            if (this.activeTarget === null)
                this.crosshair.opacity = '0';
        });
        iframe.addEventListener('mouseleave', () => {
            this.overFrame = false;
            if (this.activeTarget === null)
                this.crosshair.opacity = '1';
        });
    };
    syncNativeCursor = () => {
        document.documentElement.classList.toggle('custom-cursor-active', this.desktopCursorMedia.matches);
    };
    reset = (pointer) => {
        const x = `${pointer.clientX}px`;
        const y = `${pointer.clientY}px`;
        this.dot.transform = `translate3d(calc(${x} - 50%), calc(${y} - 50%), 0)`;
        this.axisX.transform = `translate3d(0, ${y}, 0)`;
        this.axisY.transform = `translate3d(${x}, 0, 0)`;
        if (this.overFrame) {
            const el = document.elementFromPoint(pointer.clientX, pointer.clientY);
            if (!(el instanceof HTMLIFrameElement))
                this.overFrame = false;
        }
        if (this.activeTarget === null && !this.overFrame)
            this.crosshair.opacity = '1';
    };
    Aeffect = (mouse) => {
        if (this.activeTarget !== null || this.fadeIng)
            return;
        this.fadeIng = true;
        this.effecter.left = String(mouse.x) + 'px';
        this.effecter.top = String(mouse.y) + 'px';
        this.effecter.transition =
            'transform .5s cubic-bezier(0.22, 0.61, 0.21, 1)\
      ,opacity .5s cubic-bezier(0.22, 0.61, 0.21, 1)';
        this.effecter.transform = 'translate(-50%, -50%) scale(1)';
        this.effecter.opacity = '0';
        setTimeout(() => {
            this.fadeIng = false;
            this.effecter.transition = '';
            this.effecter.transform = 'translate(-50%, -50%) scale(0)';
            this.effecter.opacity = '1';
        }, 500);
    };
    snapshotElement = (element) => {
        if (this.restStyles.has(element))
            return;
        const computed = window.getComputedStyle(element);
        const rest = new Map();
        this.frozenProperties.forEach(property => {
            rest.set(property, computed.getPropertyValue(property));
        });
        this.restStyles.set(element, rest);
    };
    snapshotTarget = (target) => {
        this.snapshotElement(target);
        target.querySelectorAll('*').forEach(this.snapshotElement);
    };
    snapshotTargets = () => {
        document.querySelectorAll(this.attention).forEach(this.snapshotTarget);
    };
    freezeHover = (target) => {
        this.snapshotTarget(target);
        const elements = [target, ...target.querySelectorAll('*')];
        this.activeFrozen = elements.map(element => ({
            element,
            inlineStyle: element.getAttribute('style')
        }));
        elements.forEach(element => {
            const rest = this.restStyles.get(element);
            rest?.forEach((value, property) => {
                element.style.setProperty(property, value, 'important');
            });
            element.style.setProperty('transition', 'none', 'important');
            element.style.setProperty('animation', 'none', 'important');
        });
    };
    restoreHover = () => {
        this.activeFrozen.forEach(({ element, inlineStyle }) => {
            if (inlineStyle === null) {
                element.removeAttribute('style');
            }
            else {
                element.setAttribute('style', inlineStyle);
            }
        });
        this.activeFrozen = [];
    };
    syncTarget = () => {
        if (!this.activeTarget?.isConnected) {
            this.relax();
            return;
        }
        const rect = this.activeTarget.getBoundingClientRect();
        const padding = 7;
        this.targeter.style.left = `${rect.left - padding}px`;
        this.targeter.style.top = `${rect.top - padding}px`;
        this.targeter.style.width = `${rect.width + padding * 2}px`;
        this.targeter.style.height = `${rect.height + padding * 2}px`;
    };
    relax = () => {
        this.restoreHover();
        this.activeTarget?.classList.remove('cursor-hover-target');
        this.activeTarget = null;
        if (!this.overFrame)
            this.crosshair.opacity = '1';
        this.targeter.classList.remove('is-active');
    };
    hold = (item) => {
        if (this.activeTarget === item)
            return;
        if (this.activeTarget !== null)
            this.relax();
        this.activeTarget = item;
        this.freezeHover(item);
        item.classList.add('cursor-hover-target');
        this.crosshair.opacity = '0';
        this.targeter.classList.remove('is-active');
        this.syncTarget();
        this.targeter.getBoundingClientRect();
        this.targeter.classList.add('is-active');
    };
    hoverIn = (event) => {
        if (!(event.target instanceof Element))
            return;
        const item = event.target.closest(this.attention);
        if (item !== null && !item.classList.contains('is--active')) {
            this.hold(item);
        }
    };
    hoverOut = (event) => {
        if (this.activeTarget === null)
            return;
        if (event.relatedTarget instanceof Node &&
            this.activeTarget.contains(event.relatedTarget))
            return;
        if (event.relatedTarget instanceof Element) {
            const next = event.relatedTarget.closest(this.attention);
            if (next !== null && !next.classList.contains('is--active')) {
                this.hold(next);
                return;
            }
        }
        this.relax();
    };
    constructor() {
        const node = document.createElement('div');
        node.id = 'cursor-container';
        node.innerHTML = `<div id="cursor-crosshair">
        <i id="cursor-dot"></i>
        <i class="cursor-axis cursor-axis-x"></i>
        <i class="cursor-axis cursor-axis-y"></i>
      </div>
      <div id="cursor-target">
        <i class="cursor-target-corner"></i>
        <i class="cursor-target-corner"></i>
        <i class="cursor-target-corner"></i>
        <i class="cursor-target-corner"></i>
      </div>
      <div id="cursor-effect"></div>`;
        document.body.appendChild(node);
        this.crosshair = getElement('#cursor-crosshair', node).style;
        this.crosshair.opacity = '0';
        this.dot = getElement('#cursor-dot', node).style;
        this.axisX = getElement('.cursor-axis-x', node).style;
        this.axisY = getElement('.cursor-axis-y', node).style;
        this.targeter = getElement('#cursor-target', node);
        this.effecter = getElement('#cursor-effect', node).style;
        this.effecter.transform = 'translate(-50%, -50%) scale(0)';
        this.effecter.opacity = '1';
        this.syncNativeCursor();
        this.snapshotTargets();
        window.addEventListener('pointermove', this.reset, { passive: true });
        if ('onpointerrawupdate' in window) {
            window.addEventListener('pointerrawupdate', event => {
                this.reset(event);
            }, { passive: true });
        }
        window.addEventListener('click', this.Aeffect, { passive: true });
        document.addEventListener('mouseover', this.hoverIn, { passive: true });
        document.addEventListener('mouseout', this.hoverOut, { passive: true });
        document.addEventListener('mouseleave', this.relax, { passive: true });
        window.addEventListener('scroll', this.syncTarget, { passive: true, capture: true });
        window.addEventListener('resize', this.syncTarget, { passive: true });
        window.addEventListener('blur', this.relax, { passive: true });
        this.desktopCursorMedia.addEventListener('change', this.syncNativeCursor);
        const observer = new MutationObserver(() => {
            if (this.activeTarget !== null && !this.activeTarget.isConnected) {
                this.relax();
            }
            this.snapshotTargets();
            document.querySelectorAll('iframe.giscus-frame').forEach(this.bindGiscusFrame);
        });
        observer.observe(document, { childList: true, subtree: true });
        document.querySelectorAll('iframe.giscus-frame').forEach(this.bindGiscusFrame);
    }
}
new Cursor();
class Header {
    header = getElement('header');
    button = getElement('.navBtnIcon');
    closeSearch = false;
    readyRev = true;
    relabel = () => {
        let navs = this.header.querySelectorAll('.navItem'), mayLen = 0, may = navs.item(0);
        navs.forEach(item => {
            try {
                let now = item, link = getElement('a', now);
                if (link !== null) {
                    let href = link.href, match = now.getAttribute('matchdata');
                    now.classList.remove('active');
                    if (getParent(link) != now) {
                        return;
                    }
                    if (href.length > mayLen && document.URL.match(href) !== null) {
                        mayLen = href.length;
                        may = now;
                    }
                    if (match) {
                        const s = match.split(',');
                        s.forEach(item => {
                            if (document.URL.match(item) !== null) {
                                may = now;
                                mayLen = Infinity;
                            }
                        });
                    }
                }
            }
            catch (e) { }
        });
        if (may !== null) {
            do {
                if (may.classList.contains('navItem')) {
                    may.classList.add('active');
                }
            } while (!(may = getParent(may)).classList.contains('navContent'));
        }
    };
    inHeader = (mouse) => {
        let range = this.header.getBoundingClientRect();
        if (mouse.clientX < range.x || mouse.clientY < range.y ||
            mouse.clientX > range.right || mouse.clientY > range.bottom) {
            this.close();
        }
    };
    open = (item = this.header) => {
        item.classList.add('expanded');
        item.classList.remove('closed');
        scrolls.slideDown();
        if (item === this.header) {
            item.classList.add('moving');
            setTimeout(() => item.classList.remove('moving'), 300);
        }
        document.addEventListener('click', this.inHeader);
    };
    close = (item = this.header) => {
        document.removeEventListener('click', this.inHeader);
        item.classList.add('closed');
        item.classList.remove('expanded');
        if (item === this.header) {
            item.classList.add('moving');
            setTimeout(() => item.classList.remove('moving'), 300);
            this.closeAll();
            getElement('nav', item).classList.remove('moved');
        }
    };
    reverse = (item = this.header) => {
        if (this.closeSearch) {
            this.closeSearch = false;
            return;
        }
        if (!this.readyRev) {
            return;
        }
        this.readyRev = false;
        if (item.classList.contains('expanded')) {
            this.close(item);
        }
        else {
            this.open(item);
        }
        setTimeout(() => this.readyRev = true, 300);
    };
    closeAll = () => {
        this.header.querySelectorAll('.expanded').forEach((item) => item.classList.remove('expanded'));
    };
    constructor() {
        this.relabel();
        document.addEventListener('pjax:success', this.relabel);
        document.addEventListener('pjax:send', () => this.close());
        this.button.addEventListener('mousedown', () => {
            if (document.querySelector('.search')) {
                this.closeSearch = true;
            }
        });
        this.button.onclick = () => this.reverse(this.header);
        document.querySelectorAll('.navItemList').forEach((item) => {
            item = getParent(item);
            item.addEventListener('click', (event) => {
                if (getParent(event.target) === item) {
                    this.reverse(item);
                }
            });
        });
    }
}
var header = new Header();
class Index {
    lastIndex = -1;
    headerLink = document.querySelectorAll('null');
    tocLink = document.querySelectorAll('null');
    setItem = (item) => {
        item.classList.add('active');
        let parent = getParent(item), brother = parent.children;
        for (let i = 0, length = brother.length; i < length; ++i) {
            const item = brother.item(i);
            if (item.classList.contains('toc-child')) {
                item.classList.add('has-active');
                break;
            }
        }
        for (; parent.classList[0] !== 'toc'; parent = getParent(parent)) {
            if (parent.classList[0] === 'toc-child') {
                parent.classList.add('has-active');
            }
        }
    };
    reset = (not) => {
        let tocs = document.querySelectorAll('#toc-div .active');
        let tocTree = document.querySelectorAll('#toc-div .has-active');
        tocs.forEach(item => {
            if (!item.contains(not)) {
                item.classList.remove('active');
            }
        });
        tocTree.forEach(item => {
            if (!item.parentElement.contains(not)) {
                item.classList.remove('has-active');
            }
        });
    };
    check = (index, id) => {
        return index[id + 1] > window.innerHeight / 3 || index[id] > 0;
    };
    modifyIndex = () => {
        let index = [];
        this.headerLink.forEach(item => {
            index.push(item.getBoundingClientRect().top);
        });
        if (this.lastIndex >= 0 &&
            (this.lastIndex < 1 || !this.check(index, this.lastIndex - 1)) &&
            this.check(index, this.lastIndex)) {
            return;
        }
        for (let i = 0; i < this.tocLink.length; ++i) {
            const item = this.tocLink.item(i);
            if (i + 1 === index.length || this.check(index, i)) {
                this.lastIndex = i;
                this.setItem(item);
                this.reset(item);
                return;
            }
        }
        this.lastIndex = 0;
        this.setItem(this.tocLink.item(0));
        this.reset(this.tocLink.item(0));
    };
    setHTML = () => {
        try {
            this.headerLink = getElement('#post-content').querySelectorAll('h1,h2,h3,h4,h5,h6');
            this.tocLink = document.querySelectorAll('.toc-link');
            if (this.tocLink.length) {
                this.setItem(this.tocLink.item(0));
            }
        }
        catch { }
    };
    constructor() {
        this.setHTML();
        document.addEventListener('pjax:success', this.setHTML);
        window.addEventListener('hexo-blog-decrypt', this.setHTML);
        getElement('main').addEventListener('scroll', () => {
            if (this.tocLink.length) {
                this.modifyIndex();
            }
        }, { passive: true });
    }
}
let indexs = new Index();
class Music {
    players = new WeakSet();
    formatTime = (seconds) => {
        if (!Number.isFinite(seconds) || seconds < 0)
            return '--:--';
        const minutes = Math.floor(seconds / 60);
        const rest = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${minutes}:${rest}`;
    };
    setupPlayer = (player) => {
        if (this.players.has(player))
            return;
        this.players.add(player);
        const audio = getElement('.music-audio', player);
        const toggle = getElement('.music-toggle', player);
        const current = getElement('.music-current', player);
        const duration = getElement('.music-duration', player);
        const progress = getElement('.music-progress-track', player);
        const name = getElement('.music-name', player).textContent?.trim() || '歌曲';
        const updateState = () => {
            const playing = !audio.paused && !audio.ended;
            player.classList.toggle('is-playing', playing);
            toggle.setAttribute('aria-pressed', playing.toString());
            toggle.setAttribute('aria-label', `${playing ? '暂停' : '播放'} ${name}`);
        };
        const updateProgress = () => {
            const ratio = Number.isFinite(audio.duration) && audio.duration > 0
                ? Math.min(Math.max(audio.currentTime / audio.duration, 0), 1)
                : 0;
            player.style.setProperty('--music-progress', ratio.toString());
            progress.setAttribute('aria-valuenow', Math.round(ratio * 100).toString());
            current.textContent = this.formatTime(audio.currentTime);
            duration.textContent = this.formatTime(audio.duration);
        };
        toggle.addEventListener('click', async () => {
            if (audio.paused || audio.ended) {
                try {
                    await audio.play();
                }
                catch { }
            }
            else {
                audio.pause();
            }
        });
        audio.addEventListener('play', updateState);
        audio.addEventListener('pause', updateState);
        audio.addEventListener('ended', updateState);
        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', updateProgress);
        audio.addEventListener('durationchange', updateProgress);
        updateState();
        updateProgress();
    };
    setHTML = () => {
        document.querySelectorAll('[data-music-player]').forEach(this.setupPlayer);
    };
    constructor() {
        this.setHTML();
        document.addEventListener('pjax:success', this.setHTML);
        window.addEventListener('hexo-blog-decrypt', this.setHTML);
    }
}
let music = new Music();
class Scroll {
    scrolling = 0;
    getingtop = false;
    height = 0;
    visible = false;
    touchX = 0;
    touchY = 0x7fffffff;
    notMoveY = false;
    reallyUp = false;
    intop = false;
    totop;
    updateProgress = () => {
        const main = getElement('main');
        const maxScroll = main.scrollHeight - main.clientHeight;
        const progress = maxScroll > 0 ? main.scrollTop / maxScroll : 0;
        document.documentElement.style.setProperty('--scroll-progress', Math.min(Math.max(progress, 0), 1).toString());
    };
    scrolltop = () => {
        getElement('main').scroll({ top: 0, left: 0, behavior: 'smooth' });
        this.totop.style.opacity = '0';
        this.getingtop = true;
        setTimeout(() => this.totop.style.display = 'none', 300);
    };
    totopChange = (top) => {
        if (top < -200) {
            this.totop.style.display = '';
            this.visible = true;
            setTimeout(() => {
                if (this.visible) {
                    this.totop.style.opacity = '1';
                }
            }, 300);
        }
        else {
            this.totop.style.opacity = '0';
            this.visible = false;
            setTimeout(() => {
                if (!this.visible) {
                    this.totop.style.display = 'none';
                }
            }, 300);
        }
    };
    slideDown = () => {
        if (!this.intop) {
            return;
        }
        const main = getElement('main').classList;
        if (!document.querySelector('.expanded')) {
            getElement('.navBtn').classList.add('hide-btn');
        }
        main.remove('up');
        main.add('down');
        main.add('down');
        main.add('moving');
        setTimeout(() => {
            main.remove('down');
            main.remove('moving');
        }, 300);
        this.intop = false;
    };
    slideUp = () => {
        if (this.intop || document.querySelector('.moving')) {
            return;
        }
        if (!document.querySelector('#search-header')) {
            getElement('.navBtn').classList.remove('hide-btn');
            return;
        }
        const main = getElement('main').classList;
        getElement('.navBtn').classList.remove('hide-btn');
        main.remove('down');
        main.add('up');
        main.add('moving');
        this.intop = true;
        setTimeout(() => getElement('main').classList.remove('moving'), 300);
    };
    setHTML = () => {
        try {
            let navBtn = getElement('.navBtn');
            let onScroll = () => {
                try {
                    let nowheight = getElement('article').getBoundingClientRect().top;
                    if (nowheight > 0) {
                        return;
                    }
                    if (!document.querySelector('.expanded')) {
                        if (this.height - nowheight > 100) {
                            navBtn.classList.add('hide-btn');
                            this.height = nowheight;
                        }
                        else if (nowheight > this.height) {
                            if (nowheight - this.height > 20) {
                                navBtn.classList.remove('hide-btn');
                            }
                            this.height = nowheight;
                        }
                    }
                    ++this.scrolling;
                    setTimeout(() => {
                        if (!--this.scrolling) {
                            this.getingtop = false;
                        }
                    }, 100);
                    if (!this.getingtop) {
                        this.totopChange(nowheight);
                    }
                }
                catch (e) { }
            };
            getElement('main').addEventListener('scroll', onScroll);
            this.height = 0;
            this.visible = false;
            this.totop = getElement('#to-top');
            this.setListener();
        }
        catch (e) { }
    };
    checkTouchMove = (event) => {
        if (Math.abs(event.changedTouches[0].screenX - this.touchX) > 50 &&
            !this.reallyUp) {
            this.notMoveY = true;
        }
        if (document.querySelector('.expanded') ||
            window.innerWidth > 1024 ||
            this.notMoveY ||
            event.changedTouches[0].screenY === this.touchY ||
            document.querySelector('.moving')) {
            return;
        }
        if (this.intop || getElement('article').getBoundingClientRect().top >= 0) {
            this.reallyUp = true;
            if (event.changedTouches[0].screenY > this.touchY) {
                this.slideUp();
            }
            else {
                this.slideDown();
            }
            this.touchY = event.changedTouches[0].screenY;
        }
    };
    startTouch = (event) => {
        this.touchX = event.changedTouches[0].screenX;
        this.touchY = event.changedTouches[0].screenY;
        this.notMoveY = false;
    };
    checkPos = () => {
        if (getElement('article').getBoundingClientRect().top < 0 && this.intop) {
            this.slideDown();
        }
    };
    /**
     * used for `supScroll` and `footNoteScroll` functions
     */
    setListener = () => {
        getElement('#post-content').addEventListener('click', this.supScroll);
        getElement('#footnotes').addEventListener('click', this.footNoteScroll);
    };
    supScroll = (event) => {
        const target = event.target;
        const targetParent = getParent(target);
        if (targetParent?.tagName === 'SUP') {
            event.preventDefault();
            const hash = target.href.split('/').pop()?.slice(1) || '';
            document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
            return;
        }
    };
    footNoteScroll = (event) => {
        const target = event.target;
        if (target.tagName === 'A') {
            event.preventDefault();
            const hash = target.href.split('/').pop()?.slice(1) || '';
            document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
        }
    };
    constructor() {
        getElement('main').addEventListener('scroll', this.updateProgress, { passive: true });
        window.addEventListener('resize', this.updateProgress);
        document.addEventListener('pjax:success', this.updateProgress);
        document.addEventListener('pjax:success', this.setHTML);
        document.addEventListener('touchstart', this.startTouch);
        document.addEventListener('touchmove', this.checkTouchMove);
        document.addEventListener('touchend', this.checkPos);
        document.addEventListener('wheel', (event) => {
            if (document.querySelector('.expanded') || window.innerWidth > 1024) {
                return;
            }
            if (getElement('article').getBoundingClientRect().top >= 0) {
                if (event.deltaY < 0) {
                    this.slideUp();
                }
                else {
                    this.slideDown();
                }
            }
        });
        this.setHTML();
        this.updateProgress();
        this.totop = document.querySelector('#to-top');
    }
}
var scrolls = new Scroll();
class pjaxSupport {
    loading = getElement('.loading');
    left = getElement('.loadingBar.left');
    right = getElement('.loadingBar.right');
    timestamp = 0;
    start = (need) => {
        this.left.style.transform = `scaleX(${need})`;
        this.right.style.transform = `scaleX(${need})`;
        ++this.timestamp;
    };
    loaded = () => {
        getElement('main').scrollTop = 0;
        this.start(1);
        setTimeout((time) => {
            if (this.timestamp === time) {
                this.loading.style.opacity = '0';
            }
        }, 600, this.timestamp);
    };
    fail = () => {
        setTimeout((time) => {
            if (this.timestamp !== time) {
                return;
            }
            this.start(0);
            this.loading.classList.add('fail');
            setTimeout((time) => {
                if (this.timestamp === time) {
                    this.loading.style.opacity = '0';
                    this.loading.classList.remove('fail');
                }
            }, 600, this.timestamp);
        }, 600, this.timestamp);
    };
    constructor() {
        document.addEventListener('pjax:send', () => {
            if (getElement('main').classList.contains('up')) {
                scrolls.slideDown();
            }
            this.loading.classList.add('reset');
            this.loading.classList.remove('fail');
            this.start(0);
            setTimeout((time) => {
                if (this.timestamp !== time) {
                    return;
                }
                this.loading.classList.remove('reset');
                this.start(0.3);
                this.loading.style.opacity = '1';
                setTimeout((time) => {
                    if (this.timestamp === time) {
                        this.start(0.6);
                    }
                }, 1200, this.timestamp);
            }, 0, this.timestamp);
        });
        document.addEventListener('pjax:start', this.loaded);
        document.addEventListener('pjax:error', this.fail);
    }
}
try {
    new pjaxSupport();
}
catch (e) { }

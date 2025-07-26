import { promises as fs } from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import postcss from 'postcss';
import cssnano from 'cssnano';
import selectorParser from 'postcss-selector-parser';

const basePath = 'dist/';
const htmlDir = basePath;
const cssSourceDir = path.join(basePath, 'assets/_css/');
const outputDir = path.join(basePath, 'assets/css/critical/');
const manualCriticalPath = path.join(basePath, 'assets/css/critical.css');

async function ensureDir(dir) {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (e) {}
}

function getUsedSelectorsFromSections(sections) {
    const selectors = new Set();

    sections.forEach(section => {
        if (section.id) selectors.add(`#${section.id}`);
        if (section.classList) section.classList.forEach(cls => selectors.add(`.${cls}`));
        selectors.add(section.tagName.toLowerCase());

        section.querySelectorAll('*').forEach(el => {
            if (el.id) selectors.add(`#${el.id}`);
            if (el.classList) el.classList.forEach(cls => selectors.add(`.${cls}`));
            selectors.add(el.tagName.toLowerCase());
        });
    });

    return selectors;
}

function filterCssByUsedSelectors(cssAst, usedSelectors) {
    cssAst.walkRules(rule => {
        const matched = [];

        for (const sel of rule.selectors) {
            try {
                let keep = false;
                selectorParser(selectors => {
                    selectors.walk(node => {
                        if (
                            (node.type === 'class' && usedSelectors.has(`.${node.value}`)) ||
                            (node.type === 'id' && usedSelectors.has(`#${node.value}`)) ||
                            (node.type === 'tag' && usedSelectors.has(node.value.toLowerCase()))
                        ) {
                            keep = true;
                        }
                    });
                }).processSync(sel);

                if (keep) matched.push(sel);
            } catch {

            }
        }

        if (matched.length > 0) {
            rule.selectors = matched;
        } else {
            rule.remove();
        }
    });

    return cssAst;
}

async function extractCriticalForPage(htmlFile) {
    const htmlPath = path.join(htmlDir, htmlFile);
    const pageName = path.basename(htmlFile, '.html');
    let html = await fs.readFile(htmlPath, 'utf8');
    const dom = new JSDOM(html);

    const sections = [...dom.window.document.querySelectorAll('.critical-section')];

    let manualMinified = '';
    try {
        const manualRaw = await fs.readFile(manualCriticalPath, 'utf8');
        const result = await postcss([cssnano({ preset: ['default', { discardComments: { removeAll: true } }] })])
            .process(manualRaw, { from: undefined });
        manualMinified = result.css;
    } catch (err) {
        console.warn(`Could not load manual critical.css:`, err.message);
    }

    let sectionMinified = '';
    if (sections.length > 0) {
        const usedSelectors = getUsedSelectorsFromSections(sections);
        const cssFiles = (await fs.readdir(cssSourceDir)).filter(f => f.endsWith('.css') && !f.includes('critical.css'));

        let sectionCss = '';
        for (const file of cssFiles) {
            const filePath = path.join(cssSourceDir, file);
            try {
                const raw = await fs.readFile(filePath, 'utf8');
                const parsed = postcss.parse(raw);
                const filtered = filterCssByUsedSelectors(parsed, usedSelectors);
                sectionCss += filtered.toString();
            } catch (err) {
                console.warn(`Failed to process ${file}:`, err.message);
            }
        }

        const result = await postcss([cssnano({ preset: ['default', { discardComments: { removeAll: true } }] })])
            .process(sectionCss, { from: undefined });
        sectionMinified = result.css;
    }

    const finalCritical = `${manualMinified}${sectionMinified}`;
    const styleBlock = `<!-- critical-start -->\n<style>${finalCritical}</style>\n<!-- critical-end -->`;

    html = html.replace(/<!-- critical-start -->([\s\S]*?)<!-- critical-end -->/gi, '').trim();

    const updatedHtml = html.replace(/<head[^>]*>/i, match => `${match}\n${styleBlock}`);

    await fs.writeFile(htmlPath, updatedHtml, 'utf8');

    const outputCssFile = path.join(outputDir, `${pageName}.critical.css`);
    await fs.writeFile(outputCssFile, finalCritical, 'utf8');

    console.log(`Injected critical CSS into: ${htmlFile}`);
}

async function run() {
    await ensureDir(outputDir);

    const args = process.argv.slice(2);
    let htmlFiles = [];

    if (args.length > 0) {
        htmlFiles = args.filter(f => f.endsWith('.html'));
    } else {
        htmlFiles = (await fs.readdir(htmlDir)).filter(f => f.endsWith('.html'));
    }

    for (const file of htmlFiles) {
        await extractCriticalForPage(file);
    }
}

run();
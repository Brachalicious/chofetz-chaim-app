import { currentLanguage, t } from './translations.js?v=20260426c';

const SEFER_DATA_URLS = {
    he: '/data/sefer-shmiras-halashon-he.json',
    en: '/data/sefer-shmiras-halashon-en.json'
};

const seferDataBySource = {
    he: null,
    en: null
};

let selectedSource = 'he';
let selectedSection = '';
let selectedChapter = '';

function getSectionKeys() {
    const seferData = seferDataBySource[selectedSource];
    if (!seferData?.text || typeof seferData.text !== 'object') return [];
    return Object.keys(seferData.text || {});
}

function getChapterKeys(sectionKey) {
    const seferData = seferDataBySource[selectedSource];
    const section = seferData?.text?.[sectionKey];
    if (!section) return [];
    if (Array.isArray(section)) return [];
    if (typeof section === 'object') return Object.keys(section);
    return [];
}

/**
 * Flatten Wikisource-style nodes: string | string[] | nested arrays | { subsection: ... }.
 * Principle chapters are often { "Opening Comments": [...], "": [[...], ...] }, not a flat string[].
 */
function collectLinesDeep(value) {
    if (value == null) return [];
    if (typeof value === 'string') {
        const t = value.trim();
        return t ? [t] : [];
    }
    if (Array.isArray(value)) {
        const out = [];
        for (const el of value) {
            out.push(...collectLinesDeep(el));
        }
        return out;
    }
    if (typeof value === 'object') {
        const out = [];
        for (const k of Object.keys(value)) {
            out.push(...collectLinesDeep(value[k]));
        }
        return out;
    }
    return [];
}

function renderSeferContent() {
    const contentEl = document.getElementById('seferContent');
    if (!contentEl) return;

    const seferData = seferDataBySource[selectedSource];
    const sectionValue = seferData?.text?.[selectedSection];
    let lines = [];

    if (Array.isArray(sectionValue)) {
        lines = collectLinesDeep(sectionValue);
    } else if (sectionValue && typeof sectionValue === 'object') {
        lines = collectLinesDeep(sectionValue[selectedChapter]);
    }

    lines = lines.filter((line) => line && String(line).trim());

    if (!lines.length) {
        const emptyArray =
            Array.isArray(sectionValue) && sectionValue.length === 0;
        const msg =
            emptyArray && selectedSource === 'en'
                ? t('seferNoEnglishTranslation')
                : t('seferNoContent');
        contentEl.innerHTML = `<p class="empty-state">${msg}</p>`;
        return;
    }

    const paragraphs = lines.map((line) => `<p>${line}</p>`).join('');
    contentEl.innerHTML = `
        <div class="sefer-meta">
            <strong>${selectedSection}</strong>
            ${selectedChapter ? `<span> - ${selectedChapter}</span>` : ''}
        </div>
        <div class="sefer-text">${paragraphs}</div>
    `;
}

function renderChapterSelect() {
    const chapterSelect = document.getElementById('seferChapterSelect');
    if (!chapterSelect) return;

    const chapters = getChapterKeys(selectedSection);
    chapterSelect.innerHTML = '';

    if (!chapters.length) {
        chapterSelect.disabled = true;
        chapterSelect.innerHTML = `<option value="">${t('seferNoChapters')}</option>`;
        selectedChapter = '';
        return;
    }

    chapterSelect.disabled = false;
    chapters.forEach((chapterKey) => {
        const option = document.createElement('option');
        option.value = chapterKey;
        option.textContent = chapterKey;
        chapterSelect.appendChild(option);
    });

    if (!chapters.includes(selectedChapter)) {
        selectedChapter = chapters[0];
    }
    chapterSelect.value = selectedChapter;
}

function renderSectionSelect() {
    const sectionSelect = document.getElementById('seferSectionSelect');
    if (!sectionSelect) return;

    const sections = getSectionKeys();
    sectionSelect.innerHTML = '';

    sections.forEach((sectionKey) => {
        const option = document.createElement('option');
        option.value = sectionKey;
        option.textContent = sectionKey;
        sectionSelect.appendChild(option);
    });

    if (!sections.includes(selectedSection)) {
        selectedSection = sections[0] || '';
    }
    sectionSelect.value = selectedSection;
}

function bindSeferEvents() {
    const sourceSelect = document.getElementById('seferSourceSelect');
    const sectionSelect = document.getElementById('seferSectionSelect');
    const chapterSelect = document.getElementById('seferChapterSelect');
    if (!sourceSelect || !sectionSelect || !chapterSelect) return;

    sourceSelect.addEventListener('change', async () => {
        selectedSource = sourceSelect.value;
        selectedSection = '';
        selectedChapter = '';
        try {
            await loadSeferData(selectedSource);
            renderSectionSelect();
            renderChapterSelect();
            renderSeferContent();
        } catch (error) {
            const contentEl = document.getElementById('seferContent');
            if (contentEl) contentEl.innerHTML = `<p class="empty-state">${t('seferLoadError')}</p>`;
            console.error(error);
        }
    });

    sectionSelect.addEventListener('change', () => {
        selectedSection = sectionSelect.value;
        selectedChapter = '';
        renderChapterSelect();
        renderSeferContent();
    });

    chapterSelect.addEventListener('change', () => {
        selectedChapter = chapterSelect.value;
        renderSeferContent();
    });
}

async function loadSeferData(source) {
    if (seferDataBySource[source]) return;
    const response = await fetch(SEFER_DATA_URLS[source]);
    if (!response.ok) throw new Error(`Failed to load sefer data: ${response.status}`);
    seferDataBySource[source] = await response.json();
}

async function initSeferShmirasHalashon() {
    const sourceSelect = document.getElementById('seferSourceSelect');
    const sectionSelect = document.getElementById('seferSectionSelect');
    const contentEl = document.getElementById('seferContent');
    if (!sourceSelect || !sectionSelect || !contentEl) return;

    try {
        selectedSource = currentLanguage === 'he' ? 'he' : 'en';
        sourceSelect.value = selectedSource;
        await loadSeferData(selectedSource);
        renderSectionSelect();
        renderChapterSelect();
        renderSeferContent();
        bindSeferEvents();
    } catch (error) {
        contentEl.innerHTML = `<p class="empty-state">${t('seferLoadError')}</p>`;
        console.error(error);
    }
}

document.addEventListener('DOMContentLoaded', initSeferShmirasHalashon);
document.addEventListener('languageChanged', async () => {
    const sourceSelect = document.getElementById('seferSourceSelect');
    const contentEl = document.getElementById('seferContent');
    if (sourceSelect) {
        sourceSelect.options[0].textContent = t('seferSourceHebrew');
        sourceSelect.options[1].textContent = t('seferSourceEnglish');
    }
    const desired = currentLanguage === 'he' ? 'he' : 'en';
    if (selectedSource !== desired) {
        selectedSource = desired;
        if (sourceSelect) sourceSelect.value = desired;
        try {
            await loadSeferData(selectedSource);
            renderSectionSelect();
            renderChapterSelect();
            renderSeferContent();
        } catch (error) {
            if (contentEl) contentEl.innerHTML = `<p class="empty-state">${t('seferLoadError')}</p>`;
            console.error(error);
        }
        return;
    }
    renderChapterSelect();
    renderSeferContent();
});

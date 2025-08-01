import { App, Plugin, PluginSettingTab, Setting, MarkdownView } from 'obsidian';

interface AccentColorSettings {
    sourceColor: string;
    livePreviewColor: string;
    readingColor: string;
    darkSourceColor: string;
    darkLivePreviewColor: string;
    darkReadingColor: string;
}

const DEFAULT_SETTINGS: AccentColorSettings = {
    sourceColor: '',
    livePreviewColor: '',
    readingColor: '',
    darkSourceColor: '',
    darkLivePreviewColor: '',
    darkReadingColor: ''
}

const DEFAULT_HSL: [number, number, number] = [250, 100, 50];

// Define settings keys as constants to ensure consistency
const SETTING_KEYS = {
    sourceColor: 'sourceColor',
    livePreviewColor: 'livePreviewColor',
    readingColor: 'readingColor',
    darkSourceColor: 'darkSourceColor',
    darkLivePreviewColor: 'darkLivePreviewColor',
    darkReadingColor: 'darkReadingColor'
} as const;

export default class AccentColorPlugin extends Plugin {
    settings: AccentColorSettings;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new AccentColorSettingTab(this.app, this));
        this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.updateAccentColor()));
        this.registerEvent(this.app.workspace.on('layout-change', () => this.updateAccentColor()));
        this.registerEvent(this.app.workspace.on('css-change', () => this.updateAccentColor()));
        this.updateAccentColor();
    }

    async loadSettings() {
        const data = await this.loadData() || {};
        const cleanSettings = { ...DEFAULT_SETTINGS };

        // Create a map of all possible key variations to their canonical forms
        const keyMap = new Map(Object.values(SETTING_KEYS).flatMap(key => [
            [key.toLowerCase(), key],
            [key.toUpperCase(), key],
            [key, key]
        ]));

        // Normalize all keys in the data
        for (const [key, value] of Object.entries(data)) {
            const canonicalKey = keyMap.get(key);
            if (canonicalKey && canonicalKey in cleanSettings) {
                cleanSettings[canonicalKey as keyof AccentColorSettings] = value as string;
            }
        }

        this.settings = cleanSettings;
        
        // Always save with canonical keys to clean up any legacy data
        await this.saveData(cleanSettings);
    }

    async saveSettings() {
        // Ensure we're only saving the canonical keys
        const cleanSettings: AccentColorSettings = {
            [SETTING_KEYS.sourceColor]: this.settings.sourceColor,
            [SETTING_KEYS.livePreviewColor]: this.settings.livePreviewColor,
            [SETTING_KEYS.readingColor]: this.settings.readingColor,
            [SETTING_KEYS.darkSourceColor]: this.settings.darkSourceColor,
            [SETTING_KEYS.darkLivePreviewColor]: this.settings.darkLivePreviewColor,
            [SETTING_KEYS.darkReadingColor]: this.settings.darkReadingColor
        };

        await this.saveData(cleanSettings);
        this.updateAccentColor();
    }

    isDarkMode(): boolean {
        return document.body.classList.contains('theme-dark');
    }

    updateAccentColor() {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView) return;

        const mode = this.detectMode(activeView);
        const isDark = this.isDarkMode();
        
        let color: string;
        if (isDark) {
            if (mode === 'livePreview') {
                color = this.settings.darkLivePreviewColor || this.settings.livePreviewColor || '';
            } else if (mode === 'source') {
                color = this.settings.darkSourceColor || this.settings.sourceColor || '';
            } else {
                color = this.settings.darkReadingColor || this.settings.readingColor || '';
            }
        } else {
            if (mode === 'livePreview') {
                color = this.settings.livePreviewColor || '';
            } else if (mode === 'source') {
                color = this.settings.sourceColor || '';
            } else {
                color = this.settings.readingColor || '';
            }
        }

        if (!color.trim()) {
            const [h, s, l] = DEFAULT_HSL;
            document.body.style.setProperty('--accent-h', h.toString());
            document.body.style.setProperty('--accent-s', s + '%');
            document.body.style.setProperty('--accent-l', l + '%');
            return;
        }

        if (!color.startsWith('#')) {
            color = '#' + color;
        }

        try {
            const [h, s, l] = this.convertToHSL(color);
            document.body.style.setProperty('--accent-h', h.toString());
            document.body.style.setProperty('--accent-s', s + '%');
            document.body.style.setProperty('--accent-l', l + '%');
        } catch (e) {
            const [h, s, l] = DEFAULT_HSL;
            document.body.style.setProperty('--accent-h', h.toString());
            document.body.style.setProperty('--accent-s', s + '%');
            document.body.style.setProperty('--accent-l', l + '%');
        }
    }

    detectMode(view: MarkdownView): 'source' | 'livePreview' | 'reading' {
        const sourceView = view.contentEl.querySelector('.markdown-source-view');
        const readingView = view.contentEl.querySelector('.markdown-reading-view');
        
        if (readingView && window.getComputedStyle(readingView).display !== 'none') {
            return 'reading';
        } else if (sourceView) {
            return sourceView.classList.contains('is-live-preview') ? 'livePreview' : 'source';
        }
        
        return 'source';
    }

    convertToHSL(color: string): [number, number, number] {
        if (!color.trim()) {
            return DEFAULT_HSL;
        }

        const temp = document.createElement('div');
        temp.style.color = color;
        document.body.appendChild(temp);
        const computedColor = getComputedStyle(temp).color;
        document.body.removeChild(temp);

        if (computedColor === 'rgb(0, 0, 0)' && !color.match(/black|#000|rgb\(0,\s*0,\s*0\)/i)) {
            return DEFAULT_HSL;
        }

        const rgb = computedColor.match(/\d+/g)?.map(Number);
        if (!rgb || rgb.length !== 3) {
            return DEFAULT_HSL;
        }

        const [r, g, b] = rgb.map(v => v / 255);
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
                default: h = 0;
            }
            h /= 6;
        }

        return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    }
}

class AccentColorSettingTab extends PluginSettingTab {
    plugin: AccentColorPlugin;

    constructor(app: App, plugin: AccentColorPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;
        containerEl.empty();

        containerEl.createEl('h2', {text: 'Light Mode Colors'});
        this.addColorSettings(containerEl, false);

        containerEl.createEl('h2', {text: 'Dark Mode Colors'});
        this.addColorSettings(containerEl, true);
    }

    private addColorSettings(container: HTMLElement, isDark: boolean): void {
        const modes: ('source' | 'livePreview' | 'reading')[] = ['source', 'livePreview', 'reading'];
        modes.forEach(mode => {
            const settingKey = isDark 
                ? `dark${mode.charAt(0).toUpperCase() + mode.slice(1)}Color` as keyof AccentColorSettings
                : `${mode}Color` as keyof AccentColorSettings;
            
            new Setting(container)
                .setName(`${mode.charAt(0).toUpperCase() + mode.slice(1)} Color`)
                .setDesc(isDark ? 
                    `Set the accent color for ${mode} mode in dark theme (Leave blank to use light theme color)` :
                    `Set the accent color for ${mode} mode in light theme`)
                .addText(text => text
                    .setPlaceholder(isDark ? 'Enter color or leave blank' : 'Enter color')
                    .setValue(this.plugin.settings[settingKey])
                    .onChange(async (value) => {
                        this.plugin.settings[settingKey] = value;
                        await this.plugin.saveSettings();
                    }));
        });
    }
}
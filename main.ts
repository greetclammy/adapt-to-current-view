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
    sourceColor: '#379d94',
    livePreviewColor: '#97698c',
    readingColor: '#6b987d',
    darkSourceColor: '#52c4bb',
    darkLivePreviewColor: '#c790b3',
    darkReadingColor: '#8cbf9e'
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
        const data = await this.loadData();
        
        if (data && typeof data === 'object') {
            // Directly assign loaded values, keeping existing values if they exist
            this.settings = {
                sourceColor: data.sourceColor ?? DEFAULT_SETTINGS.sourceColor,
                livePreviewColor: data.livePreviewColor ?? DEFAULT_SETTINGS.livePreviewColor,
                readingColor: data.readingColor ?? DEFAULT_SETTINGS.readingColor,
                darkSourceColor: data.darkSourceColor ?? DEFAULT_SETTINGS.darkSourceColor,
                darkLivePreviewColor: data.darkLivePreviewColor ?? DEFAULT_SETTINGS.darkLivePreviewColor,
                darkReadingColor: data.darkReadingColor ?? DEFAULT_SETTINGS.darkReadingColor
            };
        } else {
            this.settings = { ...DEFAULT_SETTINGS };
        }
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

        containerEl.createEl('h2', {text: '☀️ Light mode colors'});
        containerEl.createEl('p', {text: 'Set accent color for each view mode when base color scheme is light.'});
        this.addColorSettings(containerEl, false);

        containerEl.createEl('h2', {text: '🌙 Dark mode colors'});
        containerEl.createEl('p', {text: 'Set accent color for each view mode when base color scheme is dark. Leave blank to use light mode color.'});
        this.addColorSettings(containerEl, true);

        // Restore defaults button
        const buttonContainer = containerEl.createDiv({cls: 'setting-item'});
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.marginTop = '20px';
        
        const restoreButton = buttonContainer.createEl('button', {
            text: 'Restore Defaults',
            cls: 'mod-cta'
        });
        
        restoreButton.addEventListener('click', async () => {
            this.plugin.settings = { ...DEFAULT_SETTINGS };
            await this.plugin.saveSettings();
            this.display(); // Refresh the settings display
        });
    }

    private addColorSettings(container: HTMLElement, isDark: boolean): void {
        const modes: {key: 'source' | 'livePreview' | 'reading', name: string}[] = [
            {key: 'reading', name: 'Reading view'},
            {key: 'livePreview', name: 'Live Preview'},
            {key: 'source', name: 'Source view'}
        ];
        
        modes.forEach(mode => {
            const settingKey = isDark 
                ? `dark${mode.key.charAt(0).toUpperCase() + mode.key.slice(1)}Color` as keyof AccentColorSettings
                : `${mode.key}Color` as keyof AccentColorSettings;
            
            const setting = new Setting(container)
                .setName(mode.name);
            
            let textInput: any;
            let colorPicker: any;
            
            setting.addColorPicker(color => {
                const currentValue = this.plugin.settings[settingKey];
                const hexValue = currentValue && !currentValue.startsWith('#') ? '#' + currentValue : (currentValue || '#ffffff');
                
                colorPicker = color;
                color.setValue(hexValue)
                    .onChange(async (value) => {
                        const cleanValue = value.startsWith('#') ? value.slice(1) : value;
                        this.plugin.settings[settingKey] = cleanValue;
                        if (textInput) textInput.setValue(value);
                        await this.plugin.saveSettings();
                    });
            })
            .addText(text => {
                const currentValue = this.plugin.settings[settingKey];
                const displayValue = currentValue && !currentValue.startsWith('#') ? '#' + currentValue : currentValue;
                
                textInput = text;
                text.setPlaceholder(isDark ? '#ffffff or leave blank' : '#ffffff')
                    .setValue(displayValue)
                    .onChange(async (value) => {
                        const cleanValue = value.startsWith('#') ? value.slice(1) : value;
                        this.plugin.settings[settingKey] = cleanValue;
                        if (colorPicker && value.length === 7) colorPicker.setValue(value);
                        await this.plugin.saveSettings();
                    });
                
                const inputEl = text.inputEl;
                inputEl.maxLength = 7;
                
                inputEl.addEventListener('input', (e) => {
                    let value = inputEl.value;
                    
                    if (!value.startsWith('#')) {
                        value = '#' + value;
                    }
                    
                    value = value.replace(/[^#0-9a-fA-F]/g, '');
                    
                    if (value.length > 7) {
                        value = value.slice(0, 7);
                    }
                    
                    inputEl.value = value;
                });
                
                inputEl.addEventListener('paste', (e) => {
                    e.preventDefault();
                    const paste = e.clipboardData?.getData('text') || '';
                    const cleanPaste = paste.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
                    inputEl.value = '#' + cleanPaste;
                    inputEl.dispatchEvent(new Event('input'));
                });
                
                inputEl.addEventListener('keydown', (e) => {
                    if ((e.key === 'Backspace' || e.key === 'Delete') && 
                        inputEl.selectionStart === 1 && inputEl.selectionEnd === 1) {
                        e.preventDefault();
                    }
                });
            });
        });
    }
}
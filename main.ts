import { App, Plugin, PluginSettingTab, Setting, MarkdownView, ColorComponent, TextComponent } from 'obsidian';

interface AccentColorSettings {
    sourceColor: string;
    livePreviewColor: string;
    readingColor: string;
    darkSourceColor: string;
    darkLivePreviewColor: string;
    darkReadingColor: string;
}

const DEFAULT_SETTINGS: AccentColorSettings = {
    sourceColor: '#379D94',
    livePreviewColor: '#97698C',
    readingColor: '#6B987D',
    darkSourceColor: '#52C4BB',
    darkLivePreviewColor: '#C790B3',
    darkReadingColor: '#8CBF9E'
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
    private colorCache: Map<string, [number, number, number]> = new Map();
    private tempColorElement: HTMLDivElement | null = null;
    private styleElement: HTMLStyleElement | null = null;

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
            // Ensure all colors have # prefix for consistency
            this.settings = {
                sourceColor: this.normalizeColor(data.sourceColor ?? DEFAULT_SETTINGS.sourceColor),
                livePreviewColor: this.normalizeColor(data.livePreviewColor ?? DEFAULT_SETTINGS.livePreviewColor),
                readingColor: this.normalizeColor(data.readingColor ?? DEFAULT_SETTINGS.readingColor),
                darkSourceColor: this.normalizeColor(data.darkSourceColor ?? DEFAULT_SETTINGS.darkSourceColor),
                darkLivePreviewColor: this.normalizeColor(data.darkLivePreviewColor ?? DEFAULT_SETTINGS.darkLivePreviewColor),
                darkReadingColor: this.normalizeColor(data.darkReadingColor ?? DEFAULT_SETTINGS.darkReadingColor)
            };
        } else {
            this.settings = { ...DEFAULT_SETTINGS };
        }
    }

    async saveSettings() {
        // Save without # prefix for backward compatibility
        const cleanSettings: AccentColorSettings = {
            [SETTING_KEYS.sourceColor]: this.settings.sourceColor.replace('#', ''),
            [SETTING_KEYS.livePreviewColor]: this.settings.livePreviewColor.replace('#', ''),
            [SETTING_KEYS.readingColor]: this.settings.readingColor.replace('#', ''),
            [SETTING_KEYS.darkSourceColor]: this.settings.darkSourceColor.replace('#', ''),
            [SETTING_KEYS.darkLivePreviewColor]: this.settings.darkLivePreviewColor.replace('#', ''),
            [SETTING_KEYS.darkReadingColor]: this.settings.darkReadingColor.replace('#', '')
        };

        await this.saveData(cleanSettings);
        this.updateAccentColor();
    }

    // Normalize color to always include # prefix
    private normalizeColor(color: string): string {
        if (!color || !color.trim()) return '';
        return color.startsWith('#') ? color : '#' + color;
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
            this.injectAccentColorStyles(h, s, l);
            return;
        }

        try {
            const [h, s, l] = this.convertToHSL(color);
            this.injectAccentColorStyles(h, s, l);
        } catch (e) {
            const [h, s, l] = DEFAULT_HSL;
            this.injectAccentColorStyles(h, s, l);
        }
    }

    private injectAccentColorStyles(h: number, s: number, l: number) {
        // Create style element if it doesn't exist
        if (!this.styleElement) {
            this.styleElement = document.head.createEl('style', {
                attr: { id: 'adapt-to-current-view-accent-colors' }
            });
        }

        // Update the CSS custom properties via injected stylesheet
        this.styleElement.textContent = `
            body {
                --accent-h: ${h};
                --accent-s: ${s}%;
                --accent-l: ${l}%;
            }
        `;
    }

    detectMode(view: MarkdownView): 'source' | 'livePreview' | 'reading' {
        // Add defensive null checks
        if (!view || !view.contentEl) {
            return 'source';
        }

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

        // Ensure color has # prefix
        const normalizedColor = this.normalizeColor(color);

        // Check cache first
        const cached = this.colorCache.get(normalizedColor);
        if (cached) {
            return cached;
        }

        // Create persistent temp element if it doesn't exist
        if (!this.tempColorElement) {
            this.tempColorElement = createDiv();
            this.tempColorElement.addClass('adapt-temp-color-element');
            document.body.appendChild(this.tempColorElement);
        }

        // Set color via CSS class and data attribute to avoid inline styles
        this.tempColorElement.setAttribute('data-test-color', normalizedColor);

        // Inject temporary style for color computation
        const tempStyleEl = document.head.createEl('style');
        tempStyleEl.textContent = `.adapt-temp-color-element[data-test-color="${normalizedColor}"] { color: ${normalizedColor}; }`;

        const computedColor = getComputedStyle(this.tempColorElement).color;

        // Clean up temporary style
        tempStyleEl.remove();
        this.tempColorElement.removeAttribute('data-test-color');

        if (computedColor === 'rgb(0, 0, 0)' && !normalizedColor.match(/black|#000|rgb\(0,\s*0,\s*0\)/i)) {
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

        const result: [number, number, number] = [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];

        // Cache the result
        this.colorCache.set(normalizedColor, result);

        return result;
    }

    onunload() {
        // Clean up the persistent temp element
        if (this.tempColorElement) {
            this.tempColorElement.remove();
            this.tempColorElement = null;
        }

        // Clean up the style element
        if (this.styleElement) {
            this.styleElement.remove();
            this.styleElement = null;
        }

        // Clear the cache
        this.colorCache.clear();
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

        new Setting(containerEl)
            .setName('Light mode colors')
            .setDesc('Set accent color for each view mode when base color scheme is light.')
            .setHeading();
        this.addColorSettings(containerEl, false);

        new Setting(containerEl)
            .setName('Dark mode colors')
            .setDesc('Set accent color for each view mode when base color scheme is dark. Leave blank to use light mode color.')
            .setHeading();
        this.addColorSettings(containerEl, true);

        // Restore defaults button
        const buttonContainer = containerEl.createDiv({cls: 'setting-item adapt-restore-button-container'});

        const restoreButton = buttonContainer.createEl('button', {
            text: 'Restore defaults',
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

            let textInput: TextComponent;
            let colorPicker: ColorComponent;

            setting.addColorPicker(color => {
                // Always use normalized color with # prefix
                const currentValue = this.plugin.settings[settingKey];
                
                colorPicker = color;
                color.setValue(currentValue || '#ffffff')
                    .onChange(async (value) => {
                        this.plugin.settings[settingKey] = value;
                        // Don't update text input to preserve user's case preference
                        await this.plugin.saveSettings();
                    });
            })
            .addText(text => {
                const currentValue = this.plugin.settings[settingKey];
                
                textInput = text;
                text.setPlaceholder(isDark ? '#FF0000' : '#FF0000')
                    .setValue(currentValue)
                    .onChange(async (value) => {
                        // Store with # prefix for consistency
                        const normalizedValue = value ? (value.startsWith('#') ? value : '#' + value) : '';
                        this.plugin.settings[settingKey] = normalizedValue;
                        if (colorPicker && normalizedValue.length === 7) {
                            colorPicker.setValue(normalizedValue);
                        }
                        await this.plugin.saveSettings();
                    });
                
                const inputEl = text.inputEl;
                inputEl.maxLength = 7;
                
                inputEl.addEventListener('input', (e) => {
                    let value = inputEl.value;
                    
                    if (value && !value.startsWith('#')) {
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
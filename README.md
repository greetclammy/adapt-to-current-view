# Adapt to Current View

Allows to set different accent colors for Reading view, Live Preview and Source.

This works (and looks!) best with a theme that somehow showcases the accent color. Two great examples are [Border](https://github.com/Akifyss/obsidian-border) and [Minimal](https://minimal.guide/).

## Border

<img width="1890" height="1417" alt="border" src="https://github.com/user-attachments/assets/1d9b34d1-7105-4592-8b76-4cc649b1ec08" />


## Minimal

Recommended settings to enable:

1. _Undeline_ tab style, configured via *[Style Settings](https://obsidian.md/plugins?id=obsidian-style-settings)*.
2. _Colorful active states_, configured in *[Minimal Theme Settings](https://obsidian.md/plugins?id=obsidian-minimal-settings)*.

<img width="1890" height="1417" alt="minimal" src="https://github.com/user-attachments/assets/7cd8019a-7ad1-4a18-a822-cc1b34a6acfb" />

<br>

<details>
  <summary>What it looks like on mobile</summary>

![3f2bea90b423b4d4744b45cc5b7ddab1196ac671](https://github.com/user-attachments/assets/cd7b1b3a-f630-4b19-8f08-b4aef0b7e010)

</details>

## ⚙️ Settings overview

<details>
  <summary>Screenshot</summary>
<img width="918" height="707" alt="Screenshot 2025-08-01 at 23 40 53" src="https://github.com/user-attachments/assets/814f8d5a-07f6-4fd2-bd7a-d27c50f2a69e" />
</details>

## ✅ Installation

Untill this plugin is made availiable in the plugin gallery, it can be insalled via the community plugin [BRAT](https://obsidian.md/plugins?id=obsidian42-brat):

1. Open BRAT settings.
2. Press "Add Beta Plugin".
3. Paste this URL in the text field: https://github.com/greetclammy/adapt-to-current-view.
4. Select the latest release.
5. Check "Enable after installing the plugin".
6. Press "Add Plugin".

## 🖼️ Optional CSS snippets

### Hide border under Minimal Theme's _Underline_ tabs

For a cleaner look. Shown in the screenshot above. Best paired with _Workspace borders_ toggled OFF in _Minimal Theme Settings_.

<details>
  <summary>CSS snippet</summary>

```css
body.theme-light.tabs-underline .mod-root .workspace-tab-header-container,
body.theme-dark.tabs-underline .mod-root .workspace-tab-header-container {
    border-bottom: none !important;
}

body.theme-light.tabs-underline .mod-left-split .workspace-tab-header-container,
body.theme-dark.tabs-underline .mod-left-split .workspace-tab-header-container {
    border-bottom: none !important;
}

body.theme-light.tabs-underline .mod-right-split .workspace-tab-header-container,
body.theme-dark.tabs-underline .mod-right-split .workspace-tab-header-container {
    border-bottom: none !important;
}

body.theme-light.tabs-underline .workspace-tab-header-container,
body.theme-dark.tabs-underline .workspace-tab-header-container {
    border-bottom: none !important;
}

body.theme-light.tabs-underline .workspace-tab-header,
body.theme-dark.tabs-underline .workspace-tab-header {
    border-bottom-width: 2px;
}
```
</details>

### Default theme tag appearance for Minimal Theme

<details>
  <summary>CSS snippet</summary>

<img width="1056" height="726" alt="image" src="https://github.com/user-attachments/assets/a3566c8e-6948-45a4-843f-382c3ac72a65" />

```css
body:not(.minimal-unstyled-tags),
.theme-dark body:not(.minimal-unstyled-tags) {
  --tag-background: hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.1) !important;
  --tag-background-hover: hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.2) !important;
  --tag-color: var(--interactive-accent) !important;
  --tag-color-hover: var(--interactive-accent) !important;
}

.tag:not(.token) {
  background-color: var(--tag-background) !important;
  color: var(--tag-color) !important;
}

.tag:not(.token):hover {
  background-color: var(--tag-background-hover) !important;
  color: var(--tag-color-hover) !important;
}

.markdown-source-view.mod-cm6 .cm-hashtag {
  color: var(--tag-color) !important;
  background-color: var(--tag-background) !important;
}
```
</details>

A few other companion snippets can be found [here](https://github.com/greetclammy/adapt-to-current-view/tree/main/Optional%20CSS%20snippets).

## 💬 Discuss

Feel free to share your thoughts about this plugin on:

- [The Obsidian Forum](https://forum.obsidian.md/t/plugin-to-asign-different-accent-colors-for-reading-view-live-preview-and-source-view/90504)
- [The Obsidian Members Group (OMG) Discord channel](https://discord.com/channels/686053708261228577/707816848615407697)
- [GitHub discussions](https://github.com/greetclammy/adapt-to-current-view/discussions)

Or open an issue!

## 👨‍💻 What else I made

- [First Line is Title](https://github.com/greetclammy/first-line-is-title)

Please ⭐️ the GitHub repository if you found the plugin helpful 😇

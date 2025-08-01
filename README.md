# Adapt to Current View

Custom plugin for [Obsidian](https://obsidian.md/) that allows to set different accent colors for Reading view, Live Preview and Source.

I find that this works (and looks!) best with [Minimal Theme](https://minimal.guide/)’s Undeline tab style (shown above), which can be enabled in its *[Style Settings](https://obsidian.md/plugins?id=obsidian-style-settings)*, and with _Colorful active states_, which can be enabled in *[Minimal Theme Settings](https://obsidian.md/plugins?id=obsidian-minimal-settings)*.

![2a3d4e7e9bb4f46a9187497e9f1eae2e5cbd4c20](https://github.com/user-attachments/assets/350abda9-c4c7-4d73-8208-bb323e4e4544)

<details>
  <summary>Mobile app view</summary>

![3f2bea90b423b4d4744b45cc5b7ddab1196ac671](https://github.com/user-attachments/assets/cd7b1b3a-f630-4b19-8f08-b4aef0b7e010)

</details>

## ⚙️ Settings page overview

<details>
  <summary>Screenshot</summary>
<img width="918" height="707" alt="Screenshot 2025-08-01 at 23 40 53" src="https://github.com/user-attachments/assets/814f8d5a-07f6-4fd2-bd7a-d27c50f2a69e" />
</details>

## ✅ Installation

1. Install the community plugin [BRAT](https://obsidian.md/plugins?id=obsidian42-brat).
2. Go to the BRAT settings.
3. Press "Add Beta Plugin".
3. Paste the following URL in the text field: https://github.com/greetclammy/adapt-to-current-view.
4. Select the latest release.
5. Make sure that "Enable after installing the plugin" is checked.
6. Press "Add Plugin".

## 🖼️ Optional CSS snippet to hide border under _Underline_ tabs

For a cleaner look. Best paired with _Workspace borders_ toggled OFF in _Minimal Theme Settings_.

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

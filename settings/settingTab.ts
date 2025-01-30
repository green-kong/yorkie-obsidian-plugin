import { App, PluginSettingTab, Setting } from "obsidian";
import YorkiePlugin from "../main";

export default class SettingTab extends PluginSettingTab {
	private readonly plugin: YorkiePlugin;

	constructor(app: App, plugin: YorkiePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();
		new Setting(containerEl)
			.setName('User name')
			.setDesc('This is the name displayed to other users participating in collaborative editing.')
			.addText(text => text
				.setPlaceholder('Enter your name')
				.setValue(this.plugin.settings.userName)
				.onChange(async (value) => {
					this.plugin.settings.userName = value;
					await this.plugin.saveSettings();
				}));
	}
}

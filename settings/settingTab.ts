import { App, PluginSettingTab, Setting, TextComponent } from "obsidian";
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


		let textComponent: TextComponent;
		new Setting(containerEl)
			.setName("User color")
			.setDesc('This is the color displayed to other users participating in collaborative editing.')
			.addText(text => {
				textComponent = text
					.setValue(this.plugin.settings.color)
					.setDisabled(true);
				return textComponent;
			})
			.addColorPicker(color => color
				.setValue(this.plugin.settings.color)
				.onChange(async (value) => {
					this.plugin.settings.color = value;
					textComponent.setValue(value);
					await this.plugin.saveSettings();
				}));
	}


}

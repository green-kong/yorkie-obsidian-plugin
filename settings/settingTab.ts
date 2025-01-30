import { App, Notice, PluginSettingTab, Setting, TextComponent } from "obsidian";
import YorkiePlugin from "../main";
import { EventEmitter } from "events";
import { CHANGE_SETTING_EVENT } from "../events/changeSettingEvent";

export default class SettingTab extends PluginSettingTab {
	private readonly plugin: YorkiePlugin;
	private readonly events: EventEmitter;
	private usernameComponent: TextComponent;
	private isValid = true;
	username: string;
	color: string;


	constructor(app: App, plugin: YorkiePlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.events = plugin.events;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();
		new Setting(containerEl)
			.setName('User name')
			.setDesc('This is the name displayed to other users participating in collaborative editing.')
			.addText(text => {
				this.usernameComponent = text.setPlaceholder('Enter your name')
					.setValue(this.plugin.settings.userName)
					.onChange(async (value) => {
						this.username = value;
						this.validateUserName();
					});
			});


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
					textComponent.setValue(value);
					this.color = value;
				}));
	}

	private validateUserName() {
		if (!this.username.trim()) {
			this.isValid = false;
			this.usernameComponent.inputEl.style.border = '2px solid red';
			new Notice("Enter your name");
			return;
		} else {
			this.usernameComponent.inputEl.style.border = '';
			this.isValid = true;
		}
	}

	hide() {
		if (this.isValid) {
			this.events.emit(CHANGE_SETTING_EVENT, {
				username: this.username,
				color: this.color
			});
		}
		super.hide();
	}
}

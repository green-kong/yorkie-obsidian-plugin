import { App, Modal, Setting } from 'obsidian';
import { EventEmitter } from "events";

export default class EnterDocumentKeyModal extends Modal {
	private result: string;
	private readonly events: EventEmitter

	constructor(app: App, events: EventEmitter) {
		super(app);
		this.events = events
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.createEl("h1", {text: "Enter your input"});

		new Setting(contentEl)
			.setName("Document Key")
			.addText(text => text.onChange(value => {
				this.result = value
			}));

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText("Submit")
				.setCta()
				.onClick(() => {
					this.close();
					this.events.emit('submit', this.result)
				}));
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

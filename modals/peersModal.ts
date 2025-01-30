import { App, Modal } from "obsidian";

export default class PeersModal extends Modal {
	constructor(app: App) {
		super(app);
		this.modalEl.style.position = 'fixed';
		this.modalEl.style.bottom = '23px';
		this.modalEl.style.right = '10px';
		this.modalEl.style.width = '200px';
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('항상 보이는 UI');
	}
}

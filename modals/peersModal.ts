import { App, Modal } from "obsidian";
import { TYorkiePresence } from "../connectors/yorkiePresence";

export default class PeersModal extends Modal {
	me: TYorkiePresence;
	others: TYorkiePresence[];

	constructor(app: App) {
		super(app);
		this.modalEl.style.position = 'fixed';
		this.modalEl.style.bottom = '23px';
		this.modalEl.style.right = '10px';
		this.modalEl.style.width = '200px';
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();
		this.createPeerEl(this.me);
		this.others.forEach(this.createPeerEl);
	}

	private createPeerEl(presence: TYorkiePresence) {
		const {contentEl} = this;
		const presenceElement = contentEl.createEl("div", {text: presence.userName});
		presenceElement.style.color = presence.color;
	}

	setPresence(me: TYorkiePresence, others: TYorkiePresence[]) {
		this.me = me;
		this.others = others;
	}
}

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
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();
		this.createPeerEl(this.me, contentEl, true);
		this.others.forEach((other) => this.createPeerEl(other, contentEl, false));
	}

	private createPeerEl(presence: TYorkiePresence, contentEl: HTMLElement, isMe: boolean) {
		const userName = isMe ? presence.userName + '(me)' : presence.userName;
		const presenceElement = contentEl.createEl("div", {text: userName});
		presenceElement.style.color = presence.color;
	}

	setPresence(me: TYorkiePresence, others: TYorkiePresence[]) {
		this.me = me;
		this.others = others;
	}
}

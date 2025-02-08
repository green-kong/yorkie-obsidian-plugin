import { App, Modal } from "obsidian";
import { TYorkieUserInformation } from "../connectors/presence/yorkieUserInformation";

export default class PeersModal extends Modal {
	me: TYorkieUserInformation;
	others: TYorkieUserInformation[];

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

	private createPeerEl(presence: TYorkieUserInformation, contentEl: HTMLElement, isMe: boolean) {
		const userName = isMe ? presence.userName + '(me)' : presence.userName;
		const presenceElement = contentEl.createEl("div", {text: userName});
		presenceElement.style.color = presence.color;
	}

	setPresence(me: TYorkieUserInformation, others: TYorkieUserInformation[]) {
		this.me = me;
		this.others = others;
	}
}

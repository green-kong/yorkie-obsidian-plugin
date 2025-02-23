import { App, Modal, Setting } from "obsidian";
import { EventEmitter } from "events";
import { NOTICE_CONFIRM_EVENT } from "../events/noticeConfirmEvent";

export default abstract class AbstractNoticeModal extends Modal {
	isConfirmed = false;
	private confirmBtn: HTMLButtonElement;
	private readonly events: EventEmitter;
	private readonly confirmBtnOnClick = () => {
		this.isConfirmed = true;
		this.close();
	}

	protected constructor(app: App, events: EventEmitter) {
		super(app);
		this.containerEl.querySelector('.modal')?.addClass('yorkie-notice-modal');
		this.events = events;
	}

	onOpen() {
		this.isConfirmed = false;
		const {contentEl} = this;

		contentEl.createEl('h2', {text: 'Important Notice'});
		const warningEl = contentEl.createEl('div', {cls: 'yorkie-warning'});
		warningEl.innerHTML = this.getNoticeContent();

		new Setting(contentEl)
			.setName('I have read, understood, and accept the above warnings.')
			.addToggle((toggle) => toggle
				.onChange((value) => {
					this.confirmBtn = this.contentEl.querySelector('.yorkie-confirm-btn') as HTMLButtonElement;
					if (value) {
						this.confirmBtn.classList.add("yorkie-color-purple");
					} else {
						this.confirmBtn.classList.remove("yorkie-color-purple");
					}
					this.confirmBtn.disabled = !value;
					this.confirmBtn.addEventListener('click', this.confirmBtnOnClick);
				})
			);

		new Setting(contentEl)
			.addButton((btn) =>
				btn.setButtonText('Cancel')
					.setClass('yorkie-cancel-btn')
					.onClick(() => {
						this.isConfirmed = false;
						this.close();
					})
			)
			.addButton((btn) =>
				btn.setButtonText('Confirm')
					.setClass('yorkie-confirm-btn')
					.setDisabled(true)
			);
	}

	onClose() {
		if (this.confirmBtn) {
			this.confirmBtn.removeEventListener('click', this.confirmBtnOnClick);
		}
		const {contentEl} = this;
		contentEl.empty();
		this.events.emit(NOTICE_CONFIRM_EVENT, this.isConfirmed);
	}

	protected abstract getNoticeContent(): string;
};

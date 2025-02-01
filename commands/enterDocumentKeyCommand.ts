import { Command, Notice } from "obsidian";
import FrontmatterRepository from "../repository/frontmatterRepository";
import EnterDocumentKeyModal from "../modals/enterDocumentKeyModal";
import { EventEmitter, once } from "events";
import ActivatedFileIsNotExistedError from "../errors/activatedFileIsNotExistedError";
import { CREATE_OR_ENTER_DOCUMENT_KEY_EVENT } from "../events/createOrEnterDocumentKeyEvent";
import CreateOrEnterNoticeModal from "../modals/createOrEnterNoticeModal";
import { NOTICE_CONFIRM_EVENT } from "../events/noticeConfirmEvent";

export default class EnterDocumentKeyCommand implements Command {
	id = "enter document key";
	name = "enter document key";
	private readonly enterDocumentKeyModal: EnterDocumentKeyModal;
	private readonly noticeModal: CreateOrEnterNoticeModal;
	private readonly frontmatterRepository: FrontmatterRepository;
	private readonly events: EventEmitter;

	constructor(
		frontmatterRepository: FrontmatterRepository,
		enterDocumentKeyModal: EnterDocumentKeyModal,
		noticeModal: CreateOrEnterNoticeModal,
		events: EventEmitter
	) {
		this.frontmatterRepository = frontmatterRepository;
		this.enterDocumentKeyModal = enterDocumentKeyModal;
		this.noticeModal = noticeModal;
		this.events = events
	}

	async callback(): Promise<void> {
		try {
			const existedDocumentKey = await this.frontmatterRepository.getDocumentKey();
			if (existedDocumentKey) {
				new Notice("Document key is already existed!");
				return;
			}
			this.noticeModal.open();
			const isConfirmed = (await once(this.events, NOTICE_CONFIRM_EVENT))[0];
			if (isConfirmed) {
				this.enterDocumentKeyModal.open();
				const documentKey = (await once(this.events, 'submit'))[0];
				await this.frontmatterRepository.saveDocumentKey(documentKey);
				this.events.emit(CREATE_OR_ENTER_DOCUMENT_KEY_EVENT, {documentKey})
			}
		} catch (error) {
			if (error instanceof ActivatedFileIsNotExistedError) {
				return;
			}
			throw error;
		}
	}
}

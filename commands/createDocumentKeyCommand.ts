import { Command, Notice } from "obsidian";
import FrontmatterRepository from "../repository/frontmatterRepository";
import { generateDocumentKey } from "./documentKeyGenerator";
import { EventEmitter, once } from "events";
import { CREATE_OR_ENTER_DOCUMENT_KEY_EVENT } from "../events/createOrEnterDocumentKeyEvent";
import ActivatedFileIsNotExistedError from "../errors/activatedFileIsNotExistedError";
import CreateOrEnterNoticeModal from "../modals/createOrEnterNoticeModal";
import { NOTICE_CONFIRM_EVENT } from "../events/noticeConfirmEvent";
import YorkiePluginError from "../errors/yorkiePluginError";

export default class CreateDocumentKeyCommand implements Command {
	id = "create document key";
	name = "create document key";
	private readonly frontmatterRepository: FrontmatterRepository;
	private readonly events: EventEmitter;
	private readonly noticeModal: CreateOrEnterNoticeModal;

	constructor(
		frontmatterRepository: FrontmatterRepository,
		events: EventEmitter,
		noticeModal: CreateOrEnterNoticeModal
	) {
		this.frontmatterRepository = frontmatterRepository;
		this.events = events;
		this.noticeModal = noticeModal;
	}

	async callback(): Promise<void> {
		try {
			const documentKey = generateDocumentKey();
			const existedDocumentKey = await this.frontmatterRepository.getDocumentKey();
			if (existedDocumentKey) {
				new Notice("Document key is already existed!");
				return;
			}
			this.noticeModal.open();
			const isConfirmed = (await once(this.events, NOTICE_CONFIRM_EVENT))[0];
			if (isConfirmed) {
				await this.frontmatterRepository.saveDocumentKey(documentKey);
				this.events.emit(CREATE_OR_ENTER_DOCUMENT_KEY_EVENT, {documentKey});
				return;
			}
		} catch (error) {
			if (error instanceof YorkiePluginError) {
				new Notice(error.noticeMessage);
				return;
			}
			console.error(error);
		}
	}
}

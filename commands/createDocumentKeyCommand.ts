import { Command, Notice } from "obsidian";
import FrontmatterRepository from "../repository/frontmatterRepository";
import { generateDocumentKey } from "./documentKeyGenerator";
import { EventEmitter, once } from "events";
import { CREATE_OR_ENTER_DOCUMENT_KEY_EVENT } from "../events/createOrEnterDocumentKeyEvent";
import ActivatedFileIsNotExistedError from "../errors/activatedFileIsNotExistedError";
import NoticeModal from "../modals/NoticeModal";
import { CREATE_CONFIRM_EVENT } from "../events/createConfirmEvent";

export default class CreateDocumentKeyCommand implements Command {
	id = "create document key";
	name = "create document key";
	private readonly frontmatterRepository: FrontmatterRepository;
	private readonly events: EventEmitter;
	private readonly noticeModal: NoticeModal;

	constructor(
		frontmatterRepository: FrontmatterRepository,
		events: EventEmitter,
		noticeModal: NoticeModal
	) {
		this.frontmatterRepository = frontmatterRepository;
		this.events = events;
		this.noticeModal = noticeModal;
	}

	async callback(): Promise<void> {
		try {
			const documentKey = generateDocumentKey();
			const found = await this.frontmatterRepository.getDocumentKey();
			if (!found) {
				this.noticeModal.open();
				const isConfirmed = (await once(this.events, CREATE_CONFIRM_EVENT))[0];
				if (isConfirmed) {
					await this.frontmatterRepository.saveDocumentKey(documentKey);
					this.events.emit(CREATE_OR_ENTER_DOCUMENT_KEY_EVENT, {documentKey});
					return;
				} else {
					return;
				}
			}
			new Notice("document key is already existed");
		} catch (error) {
			if (error instanceof ActivatedFileIsNotExistedError) {
				return;
			}
			throw error;
		}
	}
}

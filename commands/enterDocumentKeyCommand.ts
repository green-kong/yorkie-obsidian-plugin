import { Command, Notice } from "obsidian";
import FrontmatterRepository from "../repository/frontmatterRepository";
import EnterDocumentKeyModal from "../modals/enterDocumentKeyModal";
import { EventEmitter, once } from "events";
import ActivatedFileIsNotExistedError from "../errors/activatedFileIsNotExistedError";
import { CREATE_OR_ENTER_DOCUMENT_KEY_EVENT } from "../events/createOrEnterDocumentKeyEvent";
import CreateOrEnterNoticeModal from "../modals/createOrEnterNoticeModal";
import { NOTICE_CONFIRM_EVENT } from "../events/noticeConfirmEvent";
import YorkiePluginError from "../errors/yorkiePluginError";
import FileReader from "../utils/fileReader";

export default class EnterDocumentKeyCommand implements Command {
	id = "enter document key";
	name = "enter document key";
	private readonly enterDocumentKeyModal: EnterDocumentKeyModal;
	private readonly noticeModal: CreateOrEnterNoticeModal;
	private readonly frontmatterRepository: FrontmatterRepository;
	private readonly events: EventEmitter;
	private readonly fileReader: FileReader;

	constructor(
		frontmatterRepository: FrontmatterRepository,
		enterDocumentKeyModal: EnterDocumentKeyModal,
		noticeModal: CreateOrEnterNoticeModal,
		events: EventEmitter,
		fileReader: FileReader
	) {
		this.frontmatterRepository = frontmatterRepository;
		this.enterDocumentKeyModal = enterDocumentKeyModal;
		this.noticeModal = noticeModal;
		this.events = events;
		this.fileReader = fileReader;
	}

	async callback(): Promise<void> {
		try {
			const fileResult = await this.fileReader.readActivatedFile();
			const existedDocumentKey = await this.frontmatterRepository.getDocumentKey(fileResult);
			if (existedDocumentKey) {
				new Notice("Document key is already existed!");
				return;
			}
			this.noticeModal.open();
			const isConfirmed = (await once(this.events, NOTICE_CONFIRM_EVENT))[0];
			if (isConfirmed) {
				this.enterDocumentKeyModal.open();
				const documentKey = (await once(this.events, 'submit'))[0];
				await this.frontmatterRepository.saveDocumentKey(documentKey, fileResult);
				this.events.emit(CREATE_OR_ENTER_DOCUMENT_KEY_EVENT, {documentKey, file: fileResult.activatedFile})
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

import { Command, Notice } from "obsidian";
import FrontmatterRepository from "../repository/frontmatterRepository";
import { EventEmitter, once } from "events";
import RemoveNoticeModal from "../modals/removeNoticeModal";
import { NOTICE_CONFIRM_EVENT } from "../events/noticeConfirmEvent";
import { REMOVE_DOCUMENT_KEY_EVENT } from "../events/removeDocumentKeyEvents";
import YorkiePluginError from "../errors/yorkiePluginError";
import FileReader from "../utils/fileReader";

export default class RemoveDocumentKeyCommand implements Command {
	id = 'remove document key';
	name = 'remove document key';

	private readonly frontmatterRepository: FrontmatterRepository;
	private readonly events: EventEmitter;
	private readonly removeNoticeModal: RemoveNoticeModal;
	private readonly fileReader: FileReader;

	constructor(
		frontmatterRepository: FrontmatterRepository,
		events: EventEmitter,
		noticeModal: RemoveNoticeModal,
		fileReader: FileReader
	) {
		this.frontmatterRepository = frontmatterRepository;
		this.events = events;
		this.removeNoticeModal = noticeModal;
		this.fileReader = fileReader;
	}

	async callback() {
		try {
			const fileResult = await this.fileReader.readActivatedFile();
			const currentDocumentKey = await this.frontmatterRepository.getDocumentKey(fileResult);
			if (!currentDocumentKey) {
				new Notice('Document key is not existed!');
				return;
			}
			this.removeNoticeModal.open();
			const isConfirmed = (await once(this.events, NOTICE_CONFIRM_EVENT))[0];
			if (isConfirmed) {
				this.events.emit(REMOVE_DOCUMENT_KEY_EVENT, {documentKey: currentDocumentKey, file:fileResult});
			}
		} catch (error) {
			if (error instanceof YorkiePluginError) {
				new Notice(error.noticeMessage);
				return;
			}
			console.error(error);
		}
	}
};

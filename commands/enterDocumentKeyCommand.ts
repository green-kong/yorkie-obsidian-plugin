import { Command, Notice } from "obsidian";
import FrontmatterRepository from "../repository/frontmatterRepository";
import EnterDocumentKeyModal from "../modals/enterDocumentKeyModal";
import { EventEmitter, once } from "events";

export default class EnterDocumentKeyCommand implements Command {
	id = "enter document key";
	name = "enter document key";
	private readonly enterDocumentKeyModal: EnterDocumentKeyModal;
	private readonly frontmatterRepository: FrontmatterRepository;
	private readonly events: EventEmitter;

	constructor(
		frontmatterRepository: FrontmatterRepository,
		enterDocumentKeyModal: EnterDocumentKeyModal,
		events: EventEmitter
	) {
		this.frontmatterRepository = frontmatterRepository;
		this.enterDocumentKeyModal = enterDocumentKeyModal;
		this.events = events
	}

	async callback(): Promise<void> {
		const existedDocumentKey = await this.frontmatterRepository.getDocumentKey();
		if (existedDocumentKey) {
			new Notice("Document key is already existed!");
			return;
		}
		this.enterDocumentKeyModal.open();
		const documentKey = (await once(this.events, 'submit'))[0];

		await this.frontmatterRepository.saveDocumentKey(documentKey)
	}
}

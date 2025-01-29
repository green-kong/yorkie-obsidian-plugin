import { Command, Notice } from "obsidian";
import FrontmatterRepository from "../repository/frontmatterRepository";
import { generateDocumentKey } from "./documentKeyGenerator";
import { EventEmitter } from "events";
import { CREATE_OR_ENTER_DOCUMENT_KEY_EVENT } from "../events/createOrEnterDocumentKeyEvent";

export default class CreateDocumentKeyCommand implements Command {
	id = "create document key";
	name = "create document key";
	private readonly frontmatterRepository: FrontmatterRepository;
	private readonly events: EventEmitter;

	constructor(
		frontmatterRepository: FrontmatterRepository,
		events: EventEmitter
	) {
		this.frontmatterRepository = frontmatterRepository;
		this.events = events;
	}

	async callback(): Promise<void> {
		const documentKey = generateDocumentKey();
		const found = await this.frontmatterRepository.getDocumentKey();
		if (!found) {
			await this.frontmatterRepository.saveDocumentKey(documentKey);
			this.events.emit(CREATE_OR_ENTER_DOCUMENT_KEY_EVENT, {documentKey});
			return;
		}
		new Notice("document key is already existed")
	}
}

import { Command, Notice } from "obsidian";
import FrontmatterRepository from "../repository/frontmatterRepository";
import { generateDocumentKey } from "./documentKeyGenerator";

export default class CreateDocumentKeyCommand implements Command {
	id = "create document key";
	name = "create document key";
	private readonly frontmatterRepository: FrontmatterRepository;

	constructor(frontmatterRepository: FrontmatterRepository) {
		this.frontmatterRepository = frontmatterRepository;
	}

	async callback(): Promise<void> {
		const documentKey = generateDocumentKey();
		const found = await this.frontmatterRepository.getDocumentKey();
		if (!found) {
			await this.frontmatterRepository.saveDocumentKey(documentKey)
			return;
		}
		new Notice("document key is already existed")
	}
}

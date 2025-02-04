import { App } from "obsidian";
import matter from "gray-matter";
import { ReadFileResult } from "../utils/fileReader";

export const DOCUMENT_KEY = 'YORKIE_DOCUMENT_KEY';

export default class FrontmatterRepository {
	private readonly app: App;

	constructor(app: App) {
		this.app = app
	}

	async saveDocumentKey(documentKey: string, file: ReadFileResult): Promise<void> {
		const activatedFile = file.activatedFile;
		const {data, markdownContent} = file.content
		data[DOCUMENT_KEY] = documentKey;
		const updatedContent = matter.stringify(markdownContent, data);
		await this.app.vault.modify(activatedFile, updatedContent);
	}

	async getDocumentKey(file: ReadFileResult): Promise<string | null> {
		const {data, markdownContent: _} = file.content;
		return data[DOCUMENT_KEY];
	}

	async removeDocumentKey(file: ReadFileResult) {
		const activatedFile = file.activatedFile;
		const {data, markdownContent} = file.content
		delete data[DOCUMENT_KEY];
		const updatedContent = matter.stringify(markdownContent, data);
		await this.app.vault.modify(activatedFile, updatedContent);
	}
}



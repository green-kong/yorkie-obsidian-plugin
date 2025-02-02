import { App, TFile } from "obsidian";
import matter from "gray-matter";
import ActivatedFileIsNotExistedError from "../errors/activatedFileIsNotExistedError";

export const DOCUMENT_KEY = 'YORKIE_DOCUMENT_KEY';

export default class FrontmatterRepository {
	private readonly app: App;

	constructor(app: App) {
		this.app = app
	}

	async saveDocumentKey(documentKey: string): Promise<void> {
		const file = await this.readFile()
		const activatedFile = file.activatedFile;
		const {data, markdownContent} = file.content
		data[DOCUMENT_KEY] = documentKey;
		const updatedContent = matter.stringify(markdownContent, data);
		await this.app.vault.modify(activatedFile, updatedContent);
	}

	async getDocumentKey(): Promise<string | null> {
		const file = await this.readFile()
		const {data, markdownContent: _} = file.content;
		return data[DOCUMENT_KEY];
	}

	async removeDocumentKey() {
		const file = await this.readFile();
		const activatedFile = file.activatedFile;
		const {data, markdownContent} = file.content
		delete data[DOCUMENT_KEY];
		const updatedContent = matter.stringify(markdownContent, data);
		await this.app.vault.modify(activatedFile, updatedContent);
	}

	private async readFile(): Promise<readFileResult> {
		const file = this.app.workspace.getActiveFile();
		if (!file) {
			throw new ActivatedFileIsNotExistedError();
		}
		const content = await this.app.vault.read(file);
		const {data, content: markdownContent} = matter(content)
		return {
			activatedFile: file,
			content: {
				data,
				markdownContent
			}
		}

	}
}

interface readFileResult {
	activatedFile: TFile;
	content: {
		data: { [p: string]: any },
		markdownContent: string
	}
}

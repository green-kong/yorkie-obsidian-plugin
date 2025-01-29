import { App, Notice, TFile } from "obsidian";
import matter from "gray-matter";

const DOCUMENT_KEY = 'document_key'

export default class FrontmatterRepository {
	private readonly app: App;

	constructor(app: App) {
		this.app = app
	}

	async saveDocumentKey(documentKey: string): Promise<void> {
		const file = await this.readFile()
		if (file.activatedFile === null) {
			new Notice("There is not a file to enter document key.\n" +
				"Open a file first.")
			return;
		}
		const activatedFile = file.activatedFile;
		const {data, markdownContent} = file.content
		data[DOCUMENT_KEY] = documentKey;
		const updatedContent = matter.stringify(markdownContent, data);
		await this.app.vault.modify(activatedFile, updatedContent);
	}

	async getDocumentKey(): Promise<string | null> {
		const file = await this.readFile()
		if (file.activatedFile === null) {
			return null;
		}
		const {data, markdownContent: _} = file.content;
		return data[DOCUMENT_KEY];
	}

	private async readFile(): Promise<readFileResult | readFileNullResult> {
		const file = this.app.workspace.getActiveFile();
		if (file) {
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
		return {
			activatedFile: null
		};
	}
}

interface readFileNullResult {
	activatedFile: null;
}

interface readFileResult {
	activatedFile: TFile;
	content: {
		data: { [p: string]: any },
		markdownContent: string
	}
}

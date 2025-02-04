import { App, TFile } from "obsidian";
import ActivatedFileIsNotExistedError from "../errors/activatedFileIsNotExistedError";
import matter from "gray-matter";

export default class FileReader {
	private readonly app: App;

	constructor(app: App) {
		this.app = app;
	}

	async readActivatedFile(): Promise<ReadFileResult> {
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

export interface ReadFileResult {
	activatedFile: TFile;
	content: {
		data: { [p: string]: any },
		markdownContent: string
	}
}

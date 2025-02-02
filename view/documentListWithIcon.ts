import { App, TFile } from "obsidian";
import { yorkieIcon } from "./icon";
import matter from "gray-matter";
import { DOCUMENT_KEY } from "../repository/frontmatterRepository";

export default class DocumentListWithIcon {

	app: App;

	constructor(app: App) {
		this.app = app;
	}

	init() {
		const observer = new MutationObserver((mutations: MutationRecord[], obs: MutationObserver) => {
			const connectedDocumentsPath = this.getConnectedDocumentsPath();
			const connectedDocumentElements = connectedDocumentsPath.map((path) => this.app.workspace.containerEl.querySelector(`.nav-file-title[data-path="${path}"]`))
				.filter((element): element is Element => element !== null);
			if (connectedDocumentsPath.length === connectedDocumentElements.length) {
				obs.disconnect();
				connectedDocumentElements.forEach((element) => {
					const icon = document.createElement('span');
					icon.classList.add('yorkie-icon');
					icon.innerHTML = yorkieIcon;
					element.appendChild(icon);
				});
			}
		});

		observer.observe(this.app.workspace.containerEl, {
			childList: true,
			subtree: true
		});
		// addIcon('yorkie-icon', icon);
	}


	private getConnectedDocumentsPath() {
		const files = this.app.vault.getMarkdownFiles();
		return files
			.filter(async (file) => await this.hasDocumentKey(file))
			.map((file) => file.path);
	}

	private async hasDocumentKey(file: TFile) {
		const content = await this.app.vault.read(file);
		const {data} = matter(content)
		return !!data[DOCUMENT_KEY];
	}
}

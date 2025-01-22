import { MarkdownView, Notice, Plugin } from 'obsidian';
import FrontmatterRepository from "./repository/frontmatterRepository";
import CreateDocumentKeyCommand from "./commands/createDocumentKeyCommand";

// UwAhCMuzSqgTNUfSBHVQhd
// 374UrEEDWqL3Y3ViWJc2U7

// Remember to rename these classes and interfaces!

export default class YorkiePlugin extends Plugin {

	async onload() {

		const frontmatterRepository = new FrontmatterRepository(this.app)

		this.addCommand(new CreateDocumentKeyCommand(frontmatterRepository));

		/**
		 * when opened tab is changed, judge this file is yorkie document or not
		 */
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', async (leaf) => {
				if (leaf && leaf.view instanceof MarkdownView) {
					const docKey = await frontmatterRepository.getDocumentKey();
					if (docKey) {
						// 동시편집 활성화
						new Notice(docKey);
					} else {
						// 동시편집 비활성화 모드
					}
				}
			})
		);

	}

	onunload() {

	}
}

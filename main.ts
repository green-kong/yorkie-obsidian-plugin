import { MarkdownView, Notice, Plugin } from 'obsidian';
import FrontmatterRepository from "./repository/frontmatterRepository";
import CreateDocumentKeyCommand from "./commands/createDocumentKeyCommand";
import EnterDocumentKeyModal from "./modals/enterDocumentKeyModal";
import EnterDocumentKeyCommand from "./commands/enterDocumentKeyCommand";
import { EventEmitter } from 'events';
import YorkieConnector from "./connectors/yorkieConnector";
import * as dotenv from 'dotenv'



export default class YorkiePlugin extends Plugin {
	basePath = (this.app.vault.adapter as any).basePath

	leafChangeFlag = false;
	events = new EventEmitter();
	yorkieConnector: YorkieConnector = new YorkieConnector(this.events);
	frontmatterRepository = new FrontmatterRepository(this.app)
	enterDocumentKeyModal = new EnterDocumentKeyModal(this.app, this.events);

	async onload() {
		this.setEnvironmentVariable();
		this.addCommand(new CreateDocumentKeyCommand(this.frontmatterRepository));
		this.addCommand(new EnterDocumentKeyCommand(this.frontmatterRepository, this.enterDocumentKeyModal, this.events))

		/**
		 * when opened tab is changed, judge this file is yorkie document or not
		 */
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', async (leaf) => {
				if (this.leafChangeFlag) {
					this.leafChangeFlag = false;
					return;
				}
				this.leafChangeFlag = true;
				if (leaf && leaf.view instanceof MarkdownView) {
					const docKey = await this.frontmatterRepository.getDocumentKey();
					if (docKey) {
						await this.yorkieConnector.connect(docKey);
					} else {
						await this.yorkieConnector.disconnect();
					}
				}
			})
		);

	}

	private setEnvironmentVariable() {
		dotenv.config({
			path: `${this.basePath}/.obsidian/plugins/obsidian-yorkie-plugin/.env`,
			debug: false
		})
	}

	onunload() {
		this.yorkieConnector.disconnect();
	}
}

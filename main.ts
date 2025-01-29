import { MarkdownView, Plugin } from 'obsidian';
import FrontmatterRepository from "./repository/frontmatterRepository";
import CreateDocumentKeyCommand from "./commands/createDocumentKeyCommand";
import EnterDocumentKeyModal from "./modals/enterDocumentKeyModal";
import EnterDocumentKeyCommand from "./commands/enterDocumentKeyCommand";
import { EventEmitter } from 'events';
import YorkieConnector from "./connectors/yorkieConnector";
import * as dotenv from 'dotenv'
import { EditorView } from "@codemirror/view";
import { Transaction } from "@codemirror/state";
import {
	CREATE_OR_ENTER_DOCUMENT_KEY_EVENT,
	CreateOrEnterDocumentKeyEventDto
} from "./events/createOrEnterDocumentKeyEvent";
import CodeMirror from "codemirror";


export default class YorkiePlugin extends Plugin {
	basePath = (this.app.vault.adapter as any).basePath

	leafChangeFlag = false;
	events = new EventEmitter();
	yorkieConnector: YorkieConnector = new YorkieConnector(this.events);
	frontmatterRepository = new FrontmatterRepository(this.app)
	enterDocumentKeyModal = new EnterDocumentKeyModal(this.app, this.events);

	async onload() {
		this.setEnvironmentVariable();
		this.addCommand(new CreateDocumentKeyCommand(this.frontmatterRepository, this.events));
		this.addCommand(new EnterDocumentKeyCommand(this.frontmatterRepository, this.enterDocumentKeyModal, this.events))

		this.events.on(CREATE_OR_ENTER_DOCUMENT_KEY_EVENT, async (dto: CreateOrEnterDocumentKeyEventDto) => {
			const {documentKey} = dto;
			const editor = this.app.workspace.activeEditor?.editor;
			if (editor) {
				const view = (editor as any).cm as EditorView;
				await this.yorkieConnector.connect(documentKey, view);
			}
		})

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
					const view = (leaf.view.editor as any).cm as EditorView;
					if (docKey) {
						await this.yorkieConnector.connect(docKey, view);
					} else {
						await this.yorkieConnector.disconnect();
					}
				}
			})
		);

		this.registerEditorExtension(EditorView.updateListener.of((viewUpdate) => {
			if (viewUpdate.docChanged) {
				for (const tx of viewUpdate.transactions) {
					const events = ['input', 'delete', 'move', 'undo', 'redo'];
					if (!events.map((event) => tx.isUserEvent(event)).some(Boolean)) {
						continue;
					}
					if (tx.annotation(Transaction.remote)) {
						continue;
					}
					this.yorkieConnector.updateDocument(tx);
				}
			}
		}));

	}

	private setEnvironmentVariable() {
		dotenv.config({
			path: `${this.basePath}/.obsidian/plugins/yorkie-obsidian-plugin/.env`,
			debug: false
		})
	}

	onunload() {
		this.yorkieConnector.disconnect();
	}
}

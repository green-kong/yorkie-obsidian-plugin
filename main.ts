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
import { DEFAULT_SETTINGS, Settings } from "./settings/settings";
import SettingTab from "./settings/settingTab";


const USER_EVENTS_LIST = ['input', 'delete', 'move', 'undo', 'redo', 'set'];

export default class YorkiePlugin extends Plugin {
	basePath = (this.app.vault.adapter as any).basePath
	leafChangeFlag = false;
	events = new EventEmitter();
	yorkieConnector: YorkieConnector = new YorkieConnector(this.events);
	frontmatterRepository = new FrontmatterRepository(this.app)
	enterDocumentKeyModal = new EnterDocumentKeyModal(this.app, this.events);
	settings: Settings;

	async onload() {
		await this.setUpSettings();
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
					if (!USER_EVENTS_LIST.map((event) => tx.isUserEvent(event)).some(Boolean)) {
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

	private async setUpSettings() {
		await this.loadSettings();
		await this.saveSettings();
		this.addSettingTab(new SettingTab(this.app, this));
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

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

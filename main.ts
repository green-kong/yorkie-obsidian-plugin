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
import { CREATE_OR_ENTER_DOCUMENT_KEY_EVENT, CreateOrEnterDocumentKeyEventDto } from "./events/createOrEnterDocumentKeyEvent";
import { DEFAULT_SETTINGS, Settings } from "./settings/settings";
import SettingTab from "./settings/settingTab";
import YorkiePresence from "./connectors/yorkiePresence";
import PeersModal from "./modals/peersModal";
import { CHANGE_PRESENCE_EVENT, ChangePresenceEventDto } from "./events/changePresenceEvent";
import { CHANGE_SETTING_EVENT, ChangeSettingEventDto } from "./events/changeSettingEvent";
import { addCopyFunctionToDocumentKeyProperty } from "./view/controllYorkieDocumentKeyProperty";
import CreateOrEnterNoticeModal from "./modals/createOrEnterNoticeModal";
import RemoveDocumentKeyCommand from "./commands/removeDocumentKeyCommand";
import RemoveNoticeModal from "./modals/removeNoticeModal";


const USER_EVENTS_LIST = ['input', 'delete', 'move', 'undo', 'redo', 'set'];

export default class YorkiePlugin extends Plugin {
	basePath = (this.app.vault.adapter as any).basePath
	leafChangeFlag = false;
	events = new EventEmitter();

	yorkieConnector: YorkieConnector = new YorkieConnector(this.events);

	frontmatterRepository = new FrontmatterRepository(this.app)

	enterDocumentKeyModal = new EnterDocumentKeyModal(this.app, this.events);
	createOrEnterNoticeModal = new CreateOrEnterNoticeModal(this.app, this.events);
	removeNoticeModal = new RemoveNoticeModal(this.app, this.events);

	settings: Settings;

	async onload() {
		const pm = new PeersModal(this.app);
		const yorkieConnectionStatus = this.addStatusBarItem();
		const peerListStatus = this.addStatusBarItem();
		peerListStatus.onClickEvent(() => {
			pm.open();
		})
		addCopyFunctionToDocumentKeyProperty();

		await this.setUpSettings();
		this.setEnvironmentVariable();

		this.addCommand(new CreateDocumentKeyCommand(this.frontmatterRepository, this.events, this.createOrEnterNoticeModal));
		this.addCommand(new EnterDocumentKeyCommand(this.frontmatterRepository, this.enterDocumentKeyModal, this.createOrEnterNoticeModal, this.events));
		this.addCommand(new RemoveDocumentKeyCommand(this.frontmatterRepository, this.events, this.removeNoticeModal));

		this.events.on(CREATE_OR_ENTER_DOCUMENT_KEY_EVENT, async (dto: CreateOrEnterDocumentKeyEventDto) => {
			const {documentKey} = dto;
			const editor = this.app.workspace.activeEditor?.editor;
			if (editor) {
				const view = (editor as any).cm as EditorView;
				const yorkiePresence = YorkiePresence.from(this.settings);
				await this.yorkieConnector.connect(documentKey, view, yorkiePresence);
				addCopyFunctionToDocumentKeyProperty();
			}
		})

		this.events.on(CHANGE_PRESENCE_EVENT, async (dto: ChangePresenceEventDto) => {
			if (dto.others && dto.me) {
				peerListStatus.setText(`participants: ${dto.others.length + 1}`);
				pm.setPresence(dto.me, dto.others);
			}
		});

		this.events.on(CHANGE_SETTING_EVENT, async (dto: ChangeSettingEventDto) => {
			const {username: newUserName, color: newColor} = dto;
			const {userName: currentUserName, color: currentColor} = this.settings;
			if (currentUserName !== newUserName || currentColor !== newColor) {
				const presence = {
					userName: newUserName,
					color: newColor,
				};
				this.yorkieConnector.updatePresence(presence)
				this.settings = presence;
				await this.saveSettings();
			}
		});

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
						const yorkiePresence = YorkiePresence.from(this.settings);
						await this.yorkieConnector.connect(docKey, view, yorkiePresence);
						peerListStatus.show();
						yorkieConnectionStatus.setText('🟢 Connected')
						addCopyFunctionToDocumentKeyProperty();
					} else {
						await this.yorkieConnector.disconnect();
						peerListStatus.hide();
						yorkieConnectionStatus.setText('🔴 Disconnected')
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

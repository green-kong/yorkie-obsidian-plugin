import { MarkdownView, Notice, Plugin } from 'obsidian';
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
	CreateOrEnterDocumentKeyEventDto,
	EventType
} from "./events/createOrEnterDocumentKeyEvent";
import { DEFAULT_SETTINGS, Settings } from "./settings/settings";
import SettingTab from "./settings/settingTab";
import YorkieUserInformation from "./connectors/presence/yorkieUserInformation";
import PeersModal from "./modals/peersModal";
import { CHANGE_USER_INFORMATION_EVENT, ChangeUserInformationEventDto } from "./events/changePresenceEvent";
import { CHANGE_SETTING_EVENT, ChangeSettingEventDto } from "./events/changeSettingEvent";
import { addCopyFunctionToDocumentKeyProperty } from "./view/controllYorkieDocumentKeyProperty";
import CreateOrEnterNoticeModal from "./modals/createOrEnterNoticeModal";
import RemoveDocumentKeyCommand from "./commands/removeDocumentKeyCommand";
import RemoveNoticeModal from "./modals/removeNoticeModal";
import { REMOVE_DOCUMENT_KEY_EVENT, RemoveDocumentKeyEventDto } from "./events/removeDocumentKeyEvents";
import DocumentListWithIcon from "./view/documentListWithIcon";
import FileReader from "./utils/fileReader";
import axios from "axios";
import YorkieCursor from "./connectors/presence/yorkieCursor";
import { CHANGE_CURSOR_EVENT, ChangeCursorEventDto } from "./events/changeCursorEvent";
import { drawCursor, removeCursorAndSelection, yCursorField, ySelectionField } from "./view/cursor/drawCursor";
import { LEAVE_PARTICIPANT_EVENT } from "./events/leaveParticipantEvent";


const USER_EVENTS_LIST = ['input', 'delete', 'move', 'undo', 'redo', 'set'];

export default class YorkiePlugin extends Plugin {
	basePath = (this.app.vault.adapter as any).basePath
	leafChangeFlag = false;
	events = new EventEmitter();

	yorkieConnector: YorkieConnector = new YorkieConnector(this.events);

	fileReader = new FileReader(this.app);
	frontmatterRepository = new FrontmatterRepository(this.app)

	enterDocumentKeyModal = new EnterDocumentKeyModal(this.app, this.events);
	createOrEnterNoticeModal = new CreateOrEnterNoticeModal(this.app, this.events);
	removeNoticeModal = new RemoveNoticeModal(this.app, this.events);

	documentListWithIcon: DocumentListWithIcon;

	settings: Settings;

	async onload() {
		this.app.workspace.onLayoutReady(async () => {
			this.documentListWithIcon = new DocumentListWithIcon(this.app);
			await this.documentListWithIcon.init();
		});

		const pm = new PeersModal(this.app);
		const {yorkieConnectionStatus, peerListStatus} = this.createPeerList(pm);
		addCopyFunctionToDocumentKeyProperty();

		await this.setUpSettings();
		this.setEnvironmentVariable();

		this.addCommand(new CreateDocumentKeyCommand(this.frontmatterRepository, this.events, this.createOrEnterNoticeModal, this.fileReader));
		this.addCommand(new EnterDocumentKeyCommand(this.frontmatterRepository, this.enterDocumentKeyModal, this.createOrEnterNoticeModal, this.events, this.fileReader));
		this.addCommand(new RemoveDocumentKeyCommand(this.frontmatterRepository, this.events, this.removeNoticeModal, this.fileReader));

		this.subscribeEvents(peerListStatus, yorkieConnectionStatus, pm);

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
					const fileResult = await this.fileReader.readActivatedFile();
					const docKey = await this.frontmatterRepository.getDocumentKey(fileResult);
					const view = (leaf.view.editor as any).cm as EditorView;
					await this.disconnected(peerListStatus, yorkieConnectionStatus);
					if (docKey) {
						await this.connect(docKey, view, peerListStatus, yorkieConnectionStatus);
					}
				}
			})
		);

		this.registerEditorExtension([ySelectionField, yCursorField]);

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

			// 커서 위치 추출 (추가된 부분)
			if (viewUpdate.selectionSet) {
				const {head, anchor} = viewUpdate.view.state.selection.main;
				this.yorkieConnector.updateCursor(new YorkieCursor(head, anchor));
			}
		}));
	}

	private createPeerList(pm: PeersModal) {
		const yorkieConnectionStatus = this.addStatusBarItem();
		const peerListStatus = this.addStatusBarItem();
		peerListStatus.onClickEvent(() => {
			pm.open();
		})
		return {yorkieConnectionStatus, peerListStatus};
	}

	private subscribeEvents(peerListStatus: HTMLElement, yorkieConnectionStatus: HTMLElement, pm: PeersModal) {
		this.events.on(CREATE_OR_ENTER_DOCUMENT_KEY_EVENT, async (dto: CreateOrEnterDocumentKeyEventDto) => {
			const {type, documentKey, file} = dto;

			const editor = this.app.workspace.activeEditor?.editor;
			if (type === EventType.ENTER && !await this.validateDocumentKey(documentKey)) {
				return;
			}
			const fileResult = await this.fileReader.readActivatedFile();
			await this.frontmatterRepository.saveDocumentKey(documentKey, fileResult);
			if (editor) {
				const view = (editor as any).cm as EditorView;
				await this.connect(documentKey, view, peerListStatus, yorkieConnectionStatus);
				await this.documentListWithIcon.addIcon(file);
				const documentKeys = [...this.settings.documentKeys];
				documentKeys.push(documentKey);
				this.settings = {
					...this.settings,
					documentKeys
				}
			}
			await this.saveSettings();
		})

		this.events.on(CHANGE_USER_INFORMATION_EVENT, async (dto: ChangeUserInformationEventDto) => {
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
				this.yorkieConnector.updateUserInformation(presence)
				this.settings = {
					...this.settings,
					...presence
				};
				await this.saveSettings();
			}
		});

		this.events.on(REMOVE_DOCUMENT_KEY_EVENT, async (dto: RemoveDocumentKeyEventDto) => {
			const {documentKey, file: fileResult} = dto;
			await this.disconnected(peerListStatus, yorkieConnectionStatus);
			await this.frontmatterRepository.removeDocumentKey(fileResult);
			new Notice('Document key is removed');
			await this.documentListWithIcon.removeIcon(fileResult.activatedFile);
			const documentKeys = [...this.settings.documentKeys];
			documentKeys.remove(documentKey);
			this.settings = {
				...this.settings,
				documentKeys
			}
			await this.saveSettings();
		});

		this.events.on(CHANGE_CURSOR_EVENT, async (dto: ChangeCursorEventDto) => {
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			drawCursor(dto, activeView);
		});

		this.events.on(LEAVE_PARTICIPANT_EVENT, async ({clientID}) => {
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (activeView) {
				const view = (activeView.editor as any).cm as EditorView;
				removeCursorAndSelection(clientID, view);
			}
		});
	}

	private async disconnected(peerListStatus: HTMLElement, yorkieConnectionStatus: HTMLElement) {
		await this.yorkieConnector.disconnect();
		peerListStatus.hide();
		yorkieConnectionStatus.setText('🔴 Disconnected');
	}

	private async connect(docKey: string, view: EditorView, peerListStatus: HTMLElement, yorkieConnectionStatus: HTMLElement) {
		try {
			const yorkiePresence = YorkieUserInformation.from(this.settings);
			await this.yorkieConnector.connect(docKey, view, yorkiePresence);
			peerListStatus.show();
			yorkieConnectionStatus.setText('🟢 Connected')
			addCopyFunctionToDocumentKeyProperty();
		} catch (error) {
			console.error('error!!');
			console.error(error);
		}
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

	async onunload() {
		await this.yorkieConnector.disconnect();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async validateDocumentKey(documentKey: string) {
		if (this.settings.documentKeys.contains(documentKey)) {
			new Notice("This document key is already existed!");
			return false;
		}
		if (!await this.isExistedDocumentKeyInRemote(documentKey)) {
			new Notice("This document key is not existed in remote");
			return false;
		}
		return true;
	}

	private async isExistedDocumentKeyInRemote(documentKey: string) {
		try {
			const axiosResponse = await axios.post("https://api.yorkie.dev/yorkie.v1.AdminService/GetDocument", {
					project_name: 'obsidian_yorkie_plugin',
					document_key: documentKey
				},
				{
					headers: {Authorization: process.env.YORKIE_API_SECRET_KEY}
				}
			);
			return axiosResponse.status === 200;
		} catch (error) {
			return false;
		}
	}
}

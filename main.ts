import { MarkdownView, Notice, Plugin } from 'obsidian';
import FrontmatterRepository from "./repository/frontmatterRepository";
import CreateDocumentKeyCommand from "./commands/createDocumentKeyCommand";
import EnterDocumentKeyModal from "./modals/enterDocumentKeyModal";
import EnterDocumentKeyCommand from "./commands/enterDocumentKeyCommand";
import { EventEmitter } from 'events';
import YorkieConnector from "./connectors/yorkieConnector";
import * as dotenv from 'dotenv'
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";
import { RangeSetBuilder, StateEffect, StateField, Transaction } from "@codemirror/state";
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


const USER_EVENTS_LIST = ['input', 'delete', 'move', 'undo', 'redo', 'set'];

// 데코레이션 업데이트 효과
const updateYSelection = StateEffect.define<DecorationSet>();

// 상태 필드 설정
const ySelectionField = StateField.define<DecorationSet>({
	create() {
		return Decoration.none
	},
	update(deco, tr) {
		// 문서 변경 사항 맵핑
		deco = deco.map(tr.changes);

		// 효과 처리
		for (const effect of tr.effects) {
			if (effect.is(updateYSelection)) {
				deco = effect.value;
			}
		}
		return deco;
	},
	provide: f => EditorView.decorations.from(f)
});

function parseColorToRGB(hexColor: string) {
	const r = parseInt(hexColor.slice(1, 3), 16);
	const g = parseInt(hexColor.slice(3, 5), 16);
	const b = parseInt(hexColor.slice(5, 7), 16);
	return `${r}, ${g}, ${b}`;
}

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
		const yorkieConnectionStatus = this.addStatusBarItem();
		const peerListStatus = this.addStatusBarItem();
		peerListStatus.onClickEvent(() => {
			pm.open();
		})
		addCopyFunctionToDocumentKeyProperty();


		await this.setUpSettings();
		this.setEnvironmentVariable();

		this.addCommand(new CreateDocumentKeyCommand(this.frontmatterRepository, this.events, this.createOrEnterNoticeModal, this.fileReader));
		this.addCommand(new EnterDocumentKeyCommand(this.frontmatterRepository, this.enterDocumentKeyModal, this.createOrEnterNoticeModal, this.events, this.fileReader));
		this.addCommand(new RemoveDocumentKeyCommand(this.frontmatterRepository, this.events, this.removeNoticeModal, this.fileReader));

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
			const {userName, color, head, anchor} = dto;
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

			if (!activeView?.editor) return;

			const view = (activeView.editor as any).cm as EditorView;
			const builder = new RangeSetBuilder<Decoration>();

			// 데코레이션 생성 로직
			const start = Math.min(head, anchor);
			const end = Math.max(head, anchor);
			const startLine = view.state.doc.lineAt(start);
			const endLine = view.state.doc.lineAt(end);

			const selectionDeco = Decoration.mark({
				attributes: {
					style: `background-color: rgba(${parseColorToRGB(color)}, 0.5)`
				},
				class: "cm-ySelection"
			});

			// 단일 라인 처리
			if (startLine.number === endLine.number) {
				builder.add(start, end, selectionDeco);
			}
			// 다중 라인 처리
			else {
				// 첫 라인
				builder.add(start, startLine.to, selectionDeco);

				// 중간 라인들
				for (let i = startLine.number + 1; i < endLine.number; i++) {
					const line = view.state.doc.line(i);
					builder.add(line.from, line.to, selectionDeco);
				}

				// 마지막 라인
				builder.add(endLine.from, end, selectionDeco);
			}

			// 트랜잭션 발송
			view.dispatch({
				effects: updateYSelection.of(builder.finish())
			});
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
					const fileResult = await this.fileReader.readActivatedFile();
					const docKey = await this.frontmatterRepository.getDocumentKey(fileResult);
					const view = (leaf.view.editor as any).cm as EditorView;
					if (docKey) {
						await this.connect(docKey, view, peerListStatus, yorkieConnectionStatus);
					} else {
						await this.disconnected(peerListStatus, yorkieConnectionStatus);
					}
				}
			})
		);

		// 플러그인 활성화 시
		this.registerEditorExtension(ySelectionField);

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

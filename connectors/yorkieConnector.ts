import { EventEmitter } from "events";
import yorkie, { Client } from 'yorkie-js-sdk'
import { Notice } from "obsidian";
import { EditorView } from "@codemirror/view";
import YorkieDocument from "./yorkieDocument";
import { Transaction } from "@codemirror/state";
import YorkiePresence, { TYorkiePresence } from "./yorkiePresence";

export default class YorkieConnector {
	private client: Client | null;
	private document: YorkieDocument | null;
	private readonly events: EventEmitter;

	constructor(events: EventEmitter) {
		this.events = events;
	}

	/**
	 * Having YORKIE JS SDK issue
	 * Goal : maintain client / document detach & attach
	 * Problem : By yorkie js sdk Issue, documentWatch is pending
	 */
	async connect(documentKey: string, view: EditorView, presence: YorkiePresence) {
		try {
			// if (!this.client) {
			// 	await this.connectClient();
			// }
			// TODO: After YORKIE ISSUE change to maintain client
			if (this.client) {
				await this.disconnect();
			}
			await this.connectClient();
			await this.attachDocument(documentKey, view, presence);
			new Notice("Connection is SUCCESS!🔗");
		} catch (error) {
			console.error(error);
			new Notice("Connection is FAILED!❌")
		}
	}

	private async connectClient() {
		const yorkieAPIKey = process.env.YORKIE_API_KEY;
		this.client = new yorkie.Client('https://api.yorkie.dev', {
			apiKey: yorkieAPIKey,
		});
		await this.client.activate();
	}

	async attachDocument(documentKey: string, view: EditorView, presence: YorkiePresence) {
		// if (this.document) {
		// 	await this.detach();
		// }
		if (!this.client) {
			return;
		}
		const clientId = this.client.getID();
		const document = new YorkieDocument(documentKey, view, clientId, this.events);
		await this.client?.attach(document.document, {
			initialPresence: {...presence}
		});
		document.setupInitialData();
		this.document = document;
	}

	async detach() {
		if (this.client && this.document) {
			await this.client.detach(this.document.document);
			this.document = null;
		}
	}

	async disconnect() {
		await this.client?.deactivate()
		this.client = null;
		this.document = null;
	}

	updateDocument(tx: Transaction) {
		if (this.document) {
			this.document.update(tx);
		}
	}

	updatePresence(presence: TYorkiePresence) {
		if (this.document) {
			this.document.updatePresence(presence);
		}
	}
}

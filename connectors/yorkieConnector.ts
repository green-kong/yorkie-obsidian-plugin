import { EventEmitter } from "events";
import yorkie, { Client, Document } from 'yorkie-js-sdk'
import { Notice } from "obsidian";

export default class YorkieConnector {
	private client: Client | null;
	// TODO: which type should I use?
	private document: Document<any> | null;
	private readonly events: EventEmitter;

	constructor(events: EventEmitter) {
		this.events = events;
	}

	/**
	 * Having YORKIE JS SDK issue
	 * Goal : maintain client / document detach & attach
	 * Problem : By yorkie js sdk Issue, documentWatch is pending
	 */
	async connect(documentKey: string) {
		try {
			// if (!this.client) {
			// 	await this.connectClient();
			// }
			// TODO: After YORKIE ISSUE change to maintain client
			await this.connectClient();
			await this.attachDocument(documentKey);
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

	async attachDocument(documentKey: string) {
		// if (this.document) {
		// 	await this.detach();
		// }

		this.document = new yorkie.Document(documentKey);
		await this.client?.attach(this.document);
	}

	async detach() {
		if (this.client && this.document) {
			await this.client.detach(this.document);
			this.document = null;
		}
	}

	async disconnect() {
		await this.client?.deactivate()
		this.client = null;
		this.document = null;
	}
}

import yorkie, { ActorID, Document, EditOpInfo, OperationInfo, Text } from 'yorkie-js-sdk'
import { Transaction, TransactionSpec } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { TYorkiePresence } from "./yorkiePresence";
import { EventEmitter } from "events";
import { CHANGE_PRESENCE_EVENT } from "../events/changePresenceEvent";

type TYorkieDocument = {
	content: Text
}

export default class YorkieDocument {
	document: Document<TYorkieDocument, TYorkiePresence>;
	view: EditorView;
	events: EventEmitter;

	constructor(documentKey: string, view: EditorView, clientId: string | undefined, events: EventEmitter) {
		this.document = new yorkie.Document<TYorkieDocument, TYorkiePresence>(documentKey);
		this.view = view;
		this.events = events;
		this.init(clientId);
	}

	private init(clientId: string | undefined) {
		this.subscribeSnapshot();
		this.subscribeRemoteChange();
		this.subscribePeerListChange(clientId);
	}

	private subscribePeerListChange(clientId: string | undefined) {
		this.document.subscribe('presence', (event) => {
			this.displayPeerList(this.document.getPresences(), clientId);
		});
	}

	private displayPeerList(peers: Array<{ clientID: ActorID; presence: TYorkiePresence }>, id: string | undefined) {
		const me = peers.find((peer) => peer.clientID === id)?.presence;
		if (!me) {
			return;
		}
		const others = peers.filter((peer) => peer.clientID !== id);
		this.events.emit(CHANGE_PRESENCE_EVENT, {me, others})
	}

	private subscribeSnapshot() {
		this.document.subscribe((event) => {
			if (event.type === 'snapshot') {
				// The text is replaced to snapshot and must be re-synced.
				this.syncText();
			}
		});
	}

	private subscribeRemoteChange() {
		this.document.subscribe('$.content', (event) => {
			if (event.type === 'remote-change') {
				const {operations} = event.value;
				this.handleOperations(operations);
			}
		});
	}

	setupInitialData() {
		this.document.update((root) => {
			if (!root.content) {
				root.content = new yorkie.Text();
				root.content.edit(0, 0, this.view.state.doc.toString());
			}
		}, 'create content if not exists');
	}

	private syncText() {
		const text = this.document.getRoot().content;
		const transactionSpec: TransactionSpec = {
			changes: {from: 0, to: this.view.state.doc.length, insert: text.toString()},
			annotations: [Transaction.remote.of(true)],
		};

		this.view.dispatch(transactionSpec);
	}

	private handleOperations(operations: Array<OperationInfo>) {
		for (const op of operations) {
			if (op.type === 'edit') {
				this.handleEditOp(op);
			}
		}
	}

	private handleEditOp(op: EditOpInfo) {
		const changes = [
			{
				from: Math.max(0, op.from),
				to: Math.max(0, op.to),
				insert: op.value!.content,
			},
		];

		this.view.dispatch({
			changes,
			annotations: [Transaction.remote.of(true)],
		});
		this.syncText();
	}

	update(transaction: Transaction) {
		let adj = 0;
		transaction.changes.iterChanges((fromA, toA, _, __, inserted) => {
			const insertText = inserted.toJSON().join('\n');
			this.document.update((root) => {
				root.content.edit(fromA + adj, toA + adj, insertText);
			});
			adj += insertText.length - (toA - fromA);
		});
	}

	updatePresence(presence: TYorkiePresence) {
		this.document.update((_,remotePresence) => {
			remotePresence.set(presence);
		})
	}
}

import yorkie, { ActorID, ConnectionChangedEvent, Document, EditOpInfo, OperationInfo, Text } from 'yorkie-js-sdk'
import { Transaction, TransactionSpec } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { TYorkieUserInformation } from "./presence/yorkieUserInformation";
import { EventEmitter } from "events";
import { CHANGE_USER_INFORMATION_EVENT } from "../events/changePresenceEvent";
import { TYorkiePresence } from "./presence/YorkiePresence";
import YorkieCursor from "./presence/yorkieCursor";
import { CHANGE_CURSOR_EVENT } from "../events/changeCursorEvent";
import { LEAVE_PARTICIPANT_EVENT } from "../events/leaveParticipantEvent";

export type TYorkieDocument = {
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
		this.subscribeCursorChange();
	}

	private subscribeCursorChange() {
		this.document.subscribe('others', (event) => {
			const {clientID, presence: {userInformation: {userName, color}, cursor}} = event.value;
			if (event.type === 'unwatched') {
				this.events.emit(LEAVE_PARTICIPANT_EVENT, {clientID});
				return;
			}

			if (!cursor) {
				return;
			}
			const [anchor, head] = this.document.getRoot().content.posRangeToIndexRange(cursor);
			this.events.emit(CHANGE_CURSOR_EVENT, {
				clientID,
				userName,
				color,
				head,
				anchor
			})
		});
	}

	private subscribePeerListChange(clientId: string | undefined) {
		this.document.subscribe('presence', (event) => {
			const peers = this.document.getPresences()
				.map(presence => ({
					clientID: presence.clientID,
					userInformation:
					presence.presence.userInformation
				}))
			this.displayPeerList(peers, clientId);
		});
	}

	private displayPeerList(peers: Array<{
		clientID: ActorID;
		userInformation: TYorkieUserInformation
	}>, id: string | undefined) {
		const me = peers.find((peer) => peer.clientID === id)?.userInformation;
		if (!me) {
			return;
		}
		const others = peers.filter((peer) => peer.clientID !== id)
			.map((peer) => peer.userInformation);
		this.events.emit(CHANGE_USER_INFORMATION_EVENT, {me, others})
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

	updateUserInformation(userInformation: TYorkieUserInformation) {
		this.document.update((_, remotePresence) => {
			remotePresence.set({userInformation});
		})
	}

	updateCursor(yorkieCursor: YorkieCursor) {
		this.document.update((root, remotePresence) => {
			const cursor = yorkieCursor.convertToPosRange(root);
			remotePresence.set({cursor});
		})
	}

	/**
	 * TODO : check yorkie js sdk issue
	 * When offline (no Wi-Fi or other reasons), ConnectionChangeEvent rapidly alternates between 'connected' and 'disconnected' states.
	 */
	subscribeConnection() {
		this.document.subscribe('connection', (event: ConnectionChangedEvent) => {
			if (event.value === 'connected') {
				console.log("connected");
			} else {
				console.log('disconnected!');
			}
		});
	}
}

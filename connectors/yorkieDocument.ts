import yorkie, { Document, EditOpInfo, OperationInfo } from 'yorkie-js-sdk'
import { Transaction, TransactionSpec } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

export default class YorkieDocument {
	document: Document<any>;
	view: EditorView;

	constructor(documentKey: string, view: EditorView) {
		this.document = new yorkie.Document(documentKey);
		this.view = view;
		this.init();
	}

	private init() {
		this.subscribeSnapshot();
		this.subscribeRemoteChange();
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
			console.log(this.view.state.doc.toString());
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
				console.log("yorkie update", insertText)
			});
			adj += insertText.length - (toA - fromA);
		});
	}
}

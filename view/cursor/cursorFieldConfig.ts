import { Decoration, DecorationSet, EditorView } from "@codemirror/view";
import { Range, StateEffect, StateField, Transaction } from "@codemirror/state";

export type CursorDecorationType = { clientID: string, decoration: DecorationSet };
export const updateYCursor = StateEffect.define<CursorDecorationType>();

export const cursorFieldConfig = {
	create() {
		return new Map<string, DecorationSet>();
	},
	update(cursors: Map<string, DecorationSet>, tr: Transaction) {
		const newCursors = new Map(cursors);

		for (const [userId, deco] of newCursors) {
			newCursors.set(userId, deco.map(tr.changes));
		}

		for (const effect of tr.effects) {
			if (effect.is(updateYCursor)) {
				const {clientID, decoration} = effect.value;
				newCursors.set(clientID, decoration);
			}
		}

		return newCursors;
	},
	provide(field: StateField<Map<string, DecorationSet>>) {
		return EditorView.decorations.compute([field], state => {
			const cursors = state.field(field);
			const allRanges: Range<Decoration>[] = [];

			for (const decoSet of cursors.values()) {
				const iter = decoSet.iter();
				while (iter.value) {
					allRanges.push({
						from: iter.from,
						to: iter.to,
						value: iter.value
					});
					iter.next();
				}
			}

			return Decoration.set(allRanges, true);
		});
	}
}

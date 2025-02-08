import { Range, StateEffect, StateField, Transaction } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";

export type SelectionDecorationType = { clientID: string, decoration: DecorationSet };
export const updateYSelection = StateEffect.define<SelectionDecorationType>();

export const selectionFieldConfig = {
	create() {
		return new Map<string, DecorationSet>();
	},
	update(selections: Map<string, DecorationSet>, tr: Transaction) {
		const newSelections = new Map(selections);

		for (const [userId, deco] of newSelections) {
			newSelections.set(userId, deco.map(tr.changes));
		}

		for (const effect of tr.effects) {
			if (effect.is(updateYSelection)) {
				const { clientID, decoration } = effect.value;
				newSelections.set(clientID, decoration);
			}
		}

		return newSelections;
	},
	provide(f: StateField<Map<string, DecorationSet>>) {
		return EditorView.decorations.compute([f], state => {
			const selections = state.field(f);
			const ranges: Range<Decoration>[] = [];

			// 모든 사용자의 선택 영역 병합
			for (const decoSet of selections.values()) {
				const iter = decoSet.iter();
				while (iter.value) {
					ranges.push({
						from: iter.from,
						to: iter.to,
						value: iter.value
					});
					iter.next();
				}
			}

			return Decoration.set(ranges, true);
		});
	}
};

import { StateEffect, StateField, Transaction } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";

export const updateYSelection = StateEffect.define<DecorationSet>();

export const selectionFieldConfig = {
	create() {
		return Decoration.none
	},
	update(deco: DecorationSet, tr: Transaction) {
		deco = deco.map(tr.changes);

		for (const effect of tr.effects) {
			if (effect.is(updateYSelection)) {
				deco = effect.value;
			}
		}
		return deco;
	},
	provide(f: StateField<DecorationSet>) {
		return EditorView.decorations.from(f)
	}
}

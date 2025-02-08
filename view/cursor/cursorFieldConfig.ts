import { Decoration, DecorationSet, EditorView } from "@codemirror/view";
import { StateEffect, StateField, Transaction } from "@codemirror/state";

export const updateYCursor = StateEffect.define<DecorationSet>();

export const cursorFieldConfig = {
	create() {
		return Decoration.none;
	},
	update(deco: DecorationSet, tr: Transaction) {
		deco = deco.map(tr.changes);
		for (const effect of tr.effects) {
			if (effect.is(updateYCursor)) {
				deco = effect.value;
			}
		}
		return deco;
	},
	provide(f: StateField<DecorationSet>) {
		return EditorView.decorations.from(f);
	}
}

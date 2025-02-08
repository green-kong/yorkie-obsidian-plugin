import { ChangeCursorEventDto } from "../../events/changeCursorEvent";
import { MarkdownView } from "obsidian";
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";
import { RangeSetBuilder, StateEffect, StateField } from "@codemirror/state";

const updateYSelection = StateEffect.define<DecorationSet>();

export const ySelectionField = StateField.define<DecorationSet>({
	create() {
		return Decoration.none
	},
	update(deco, tr) {
		deco = deco.map(tr.changes);

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

export const drawCursor = (dto: ChangeCursorEventDto, activeView: MarkdownView | null) => {
	if (!activeView?.editor) return;
	const {userName, color, head, anchor} = dto;

	const view = (activeView.editor as any).cm as EditorView;
	const builder = new RangeSetBuilder<Decoration>();

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

	if (startLine.number === endLine.number) {
		builder.add(start, end, selectionDeco);
	}
	else {
		builder.add(start, startLine.to, selectionDeco);

		for (let i = startLine.number + 1; i < endLine.number; i++) {
			const line = view.state.doc.line(i);
			builder.add(line.from, line.to, selectionDeco);
		}

		builder.add(endLine.from, end, selectionDeco);
	}

	view.dispatch({
		effects: updateYSelection.of(builder.finish())
	});
};

import { ChangeCursorEventDto } from "../../events/changeCursorEvent";
import { MarkdownView } from "obsidian";
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";
import { Line, RangeSetBuilder, StateEffect, StateField } from "@codemirror/state";
import { CursorWidget } from "./CursorWidget";
import { parseColorToRGB } from "./parseColor";

const updateYCursor = StateEffect.define<DecorationSet>();
export const yCursorField = StateField.define<DecorationSet>({
	create() {
		return Decoration.none
	},
	update(deco, tr) {
		deco = deco.map(tr.changes);
		for (const effect of tr.effects) {
			if (effect.is(updateYCursor)) {
				deco = effect.value;
			}
		}
		return deco;
	},
	provide: f => EditorView.decorations.from(f)
});

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


const generateSelectionBuilder = (
	color: string,
	startLine: Line,
	endLine: Line,
	start: number,
	end: number,
	view: EditorView
) => {
	const selectionBuilder = new RangeSetBuilder<Decoration>();
	const selectionDeco = Decoration.mark({
		attributes: {
			style: `background-color: rgba(${parseColorToRGB(color)}, 0.5)`
		},
		class: "cm-ySelection"
	});

	if (startLine.number === endLine.number) {
		selectionBuilder.add(start, end, selectionDeco);
	} else {
		selectionBuilder.add(start, startLine.to, selectionDeco);

		for (let i = startLine.number + 1; i < endLine.number; i++) {
			const line = view.state.doc.line(i);
			selectionBuilder.add(line.from, line.to, selectionDeco);
		}

		selectionBuilder.add(endLine.from, end, selectionDeco);
	}
	return selectionBuilder;
}

export const drawCursor = (dto: ChangeCursorEventDto, activeView: MarkdownView | null) => {
	if (!activeView?.editor) return;
	const {userName, color, head, anchor} = dto;

	const view = (activeView.editor as any).cm as EditorView;
	const cursorBuilder = new RangeSetBuilder<Decoration>();

	const start = Math.min(head, anchor);
	const end = Math.max(head, anchor);
	const startLine = view.state.doc.lineAt(start);
	const endLine = view.state.doc.lineAt(end);


	const selectionBuilder = generateSelectionBuilder(color, startLine, endLine, start, end, view);

	const cursorDeco = Decoration.widget({
		widget: new CursorWidget(userName, color)
	});


	const cursorPosition = Math.max(head, anchor);
	cursorBuilder.add(cursorPosition, cursorPosition, cursorDeco);

	view.dispatch({
		effects: [
			updateYSelection.of(selectionBuilder.finish()),
			updateYCursor.of(cursorBuilder.finish())
		]
	});
};

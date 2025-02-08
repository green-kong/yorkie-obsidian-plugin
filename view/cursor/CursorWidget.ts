// cursorWidget.ts
import { WidgetType } from "@codemirror/view";
import { parseColorToRGB } from "./parseColor";

export class CursorWidget extends WidgetType {
	constructor(
		private readonly userName: string,
		private readonly color: string
	) {
		super();
	}

	eq(other: CursorWidget) {
		return this.userName === other.userName &&
			this.color === other.color;
	}

	toDOM() {
		const container = document.createElement("span");
		container.className = "y-cursor-container";

		const cursorLine = document.createElement("div");
		cursorLine.className = "y-cursor-line";
		cursorLine.style.borderLeftColor = this.rgbaColor;

		const label = document.createElement("div");
		label.className = "y-cursor-label";
		label.textContent = this.userName;
		label.style.backgroundColor = this.rgbaColor;

		container.append(cursorLine, label);
		return container;
	}

	private get rgbaColor() {
		const parsed = parseColorToRGB(this.color);
		return `rgba(${parsed}, 0.5)`;
	}
}

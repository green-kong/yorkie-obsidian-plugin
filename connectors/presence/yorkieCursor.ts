import { TYorkieDocument } from "../yorkieDocument";

export type TYorkieCursor = {
	head: number;
	anchor: number;
}

export default class YorkieCursor implements TYorkieCursor {
	head: number;
	anchor: number;

	constructor(head: number, anchor: number) {
		this.head = head;
		this.anchor = anchor;
	}

	convertToPosRange(yorkieContent: TYorkieDocument) {
		return yorkieContent.content.indexRangeToPosRange([this.anchor, this.head])
	}
}

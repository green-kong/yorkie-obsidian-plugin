import YorkieUserInformation from "./yorkieUserInformation";

export type TYorkieCursor = {
	lineNumber: string;
	column: string;
}

export default class YorkieCursor implements TYorkieCursor {
	lineNumber: string;
	column: string;

	constructor(lineNumber: string, column: string) {
		this.lineNumber = lineNumber;
		this.column = column;
	}
}

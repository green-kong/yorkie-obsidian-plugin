import { TYorkieUserInformation } from "./yorkieUserInformation";
import { TextPosStructRange } from "yorkie-js-sdk";

export type TYorkiePresence = {
	userInformation: TYorkieUserInformation;
	cursor: TextPosStructRange | null;
}

export default class YorkiePresence implements TYorkiePresence {
	userInformation: TYorkieUserInformation;
	cursor: TextPosStructRange;

	constructor(userInformation: TYorkieUserInformation, cursor: TextPosStructRange) {
		this.userInformation = userInformation;
		this.cursor = cursor;
	}
}

import { TYorkieUserInformation } from "./yorkieUserInformation";
import { TYorkieCursor } from "./yorkieCursor";

export type TYorkiePresence = {
	userInformation: TYorkieUserInformation;
	cursor: TYorkieCursor;
}

export default class YorkiePresence implements TYorkiePresence{
	userInformation: TYorkieUserInformation;
	cursor: TYorkieCursor;

	constructor(userInformation: TYorkieUserInformation, cursor: TYorkieCursor) {
		this.userInformation = userInformation;
		this.cursor = cursor;
	}
};

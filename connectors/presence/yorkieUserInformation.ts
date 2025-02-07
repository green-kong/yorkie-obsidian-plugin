import { Settings } from "../../settings/settings";

export type TYorkieUserInformation = {
	userName: string;
	color: string;
}

export default class YorkieUserInformation implements TYorkieUserInformation {
	userName: string;
	color: string;

	constructor(userName: string, color: string) {
		this.userName = userName;
		this.color = color;
	}

	static from(setting: Settings) {
		return new YorkieUserInformation(setting.userName, setting.color);
	}
}

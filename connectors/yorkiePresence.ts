import { Settings } from "../settings/settings";

export type TYorkiePresence = {
	userName: string;
	color: string;
}

export default class YorkiePresence implements TYorkiePresence {
	userName: string;
	color: string;

	constructor(userName: string, color: string) {
		this.userName = userName;
		this.color = color;
	}

	static from(setting: Settings) {
		return new YorkiePresence(setting.userName, setting.color);
	}
}

import { Settings } from "../settings/settings";

export default class YorkiePresence {
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

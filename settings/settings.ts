import { generateRandomUserName } from "./generateRandomUserName";

export interface Settings {
	userName: string;
	color: string;
}

export const DEFAULT_SETTINGS: Settings = {
	userName: generateRandomUserName(),
	color: "#23e235"
}

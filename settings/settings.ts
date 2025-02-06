import { generateRandomUserName } from "./generateRandomUserName";
import { generateRandomColor } from "./generateRandomColor";

export interface Settings {
	userName: string;
	color: string;
	documentKeys: string[];
}

export const DEFAULT_SETTINGS: Settings = {
	userName: generateRandomUserName(),
	color: generateRandomColor(),
	documentKeys: []
}

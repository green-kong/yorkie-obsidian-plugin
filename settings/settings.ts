import { generateRandomUserName } from "./generateRandomUserName";

export interface Settings {
	userName: string;
}

export const DEFAULT_SETTINGS: Settings = {
	userName: generateRandomUserName()
}




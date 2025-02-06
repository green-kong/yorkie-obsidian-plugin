import { TFile } from "obsidian";

export const CREATE_OR_ENTER_DOCUMENT_KEY_EVENT = "createOrEnterDocumentKeyEvent"

export enum EventType {
	CREATE = 'create',
	ENTER = 'enter'
}

export interface CreateOrEnterDocumentKeyEventDto {
	type: EventType;
	documentKey: string;
	file: TFile;
}

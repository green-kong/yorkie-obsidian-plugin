import { ReadFileResult } from "../utils/fileReader";

export const REMOVE_DOCUMENT_KEY_EVENT = "remove-document-key-event";

export interface RemoveDocumentKeyEventDto {
	documentKey: string;
	file: ReadFileResult;
}

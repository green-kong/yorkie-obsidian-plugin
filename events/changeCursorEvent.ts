export const CHANGE_CURSOR_EVENT = 'changeCursorEvent';

export interface ChangeCursorEventDto {
	clientID: string;
	userName: string;
	color: string;
	head: number;
	anchor: number;
}

import { TYorkiePresence } from "../connectors/yorkiePresence";

export const CHANGE_PRESENCE_EVENT = "changePresenceEvent";

export interface ChangePresenceEventDto {
	me: TYorkiePresence;
	others: TYorkiePresence[];
}

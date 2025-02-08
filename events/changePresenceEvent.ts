import { TYorkieUserInformation } from "../connectors/presence/yorkieUserInformation";

export const CHANGE_USER_INFORMATION_EVENT = "changePresenceEvent";

export interface ChangeUserInformationEventDto {
	me: TYorkieUserInformation;
	others: TYorkieUserInformation[];
}

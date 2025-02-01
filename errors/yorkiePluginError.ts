const YORKIE_PLUGIN_ERROR_PREFIX = "YORKIE_PLUGIN_ERROR : "
export default class YorkiePluginError extends Error {
	readonly noticeMessage;

	constructor(message: string, noticeMessage: string) {
		super(YORKIE_PLUGIN_ERROR_PREFIX + message);
		this.noticeMessage = noticeMessage;
	}
};

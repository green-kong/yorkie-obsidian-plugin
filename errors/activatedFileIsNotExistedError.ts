import YorkiePluginError from "./yorkiePluginError";

const message = "ACTIVATED FILE IS NOT EXISTED.";
const noticeMessage = "There is not a file to remove a document key.\nOpen a file first.";

export default class ActivatedFileIsNotExistedError extends YorkiePluginError {

	constructor() {
		super(message, noticeMessage);
	}
}

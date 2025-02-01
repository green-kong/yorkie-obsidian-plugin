import AbstractNoticeModal from "./abstractNoticeModal";
import { App } from "obsidian";
import { EventEmitter } from "events";

export default class RemoveNoticeModal extends AbstractNoticeModal {

	constructor(app: App, events: EventEmitter) {
		super(app, events);
	}

	protected getNoticeContent(): string {
		return `
			<p>Please be aware of the following:</p>
			<ul>
				<li class="yorkie-warning-li">Removing the document key signifies your intention to exit the collaborative editing session for this document.</li>
				<li class="yorkie-warning-li">Other participants, excluding yourself, will retain the ability to edit this document.</li>
				<li class="yorkie-warning-li">Following the removal of the document key, any content you create will not synchronize with the remote version.<br>And conversely, remote changes will not reflect in your local version.</li>
				<li class="yorkie-warning-li">Should you wish to rejoin the collaborative editing session, you may do so by re-entering the previously removed document key.</li>
			</ul>
    	`;
	}
};

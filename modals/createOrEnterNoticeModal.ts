import { App } from "obsidian";
import { EventEmitter } from "events";
import AbstractNoticeModal from "./abstractNoticeModal";

export default class CreateOrEnterNoticeModal extends AbstractNoticeModal {
	constructor(app: App, events: EventEmitter) {
		super(app, events);
	}

	protected getNoticeContent(): string {
		return `
			<p>Please be aware of the following:</p>
			<ul>
				<li class="yorkie-warning-li">Edits made while your device is offline will not sync with the remote server.<br>These changes may be lost when you go back online.</li>
				<li class="yorkie-warning-li">The plugin manager bears no responsibility for issues arising from the leakage of document keys.</li>
				<li class="yorkie-warning-li">Entering a document key into an already open document will result in the loss of current content.</li>
			</ul>
    	`;
	}
};

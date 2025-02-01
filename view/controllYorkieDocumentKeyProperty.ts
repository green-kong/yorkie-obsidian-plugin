import { Notice } from "obsidian";

let valueDiv: Element | null;

export const addCopyFunctionToDocumentKeyProperty = () => {
	const keyDiv = document.querySelector('.metadata-property[data-property-key="YORKIE_DOCUMENT_KEY"] > .metadata-property-key > .metadata-property-key-input');
	valueDiv = document.querySelector('.metadata-property[data-property-key="YORKIE_DOCUMENT_KEY"] > .metadata-property-value > .metadata-input-longtext');
	setProperty(keyDiv);
	setProperty(valueDiv);
}

const setProperty = (element: Element | null) => {
	try {

		if (element instanceof HTMLInputElement) {
			element.readOnly = true;
		} else {
			element?.setAttr("contenteditable", false);
		}
		element?.addEventListener('click', async () => {
			const textToCopy = valueDiv?.textContent;
			if (textToCopy) {
				try {
					await navigator.clipboard.writeText(textToCopy);
					new Notice("✅ Yorkie Document key is copied!")
				} catch (err) {
					new Notice("❌ Yorkie Document key is not copied!")
				}
			}
		});
	} catch (error){
		console.log(error);
	}
};

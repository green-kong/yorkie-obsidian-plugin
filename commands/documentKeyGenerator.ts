import { randomUUID } from "crypto";

export const generateDocumentKey = () => {
	return randomUUID()
		.split('-')
		.join('');
};

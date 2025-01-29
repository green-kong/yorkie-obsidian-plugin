export default class ActivatedFileIsNotExistedError extends Error {
	constructor() {
		super("ACTIVATED FILE IS NOT EXISTED.");
	}
}

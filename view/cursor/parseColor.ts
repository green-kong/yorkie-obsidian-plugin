export const parseColorToRGB = (hexColor: string) => {
	if (hexColor.length !== 7 || !hexColor.startsWith('#')) {
		return '0, 0, 0';
	}
	const r = parseInt(hexColor.slice(1, 3), 16);
	const g = parseInt(hexColor.slice(3, 5), 16);
	const b = parseInt(hexColor.slice(5, 7), 16);
	return `${r}, ${g}, ${b}`;
}

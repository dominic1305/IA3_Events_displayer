import EventCardHandler from "./EventCardHandler.js";

window.onload = async () => {
	const handler = await EventCardHandler.GetHandler(100);
	console.log(handler);
}
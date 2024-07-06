import EventCardHandler from "./../EventCardHandler.js";

window.onload = async () => {
	const handler = await EventCardHandler.GetHandler(100, document.querySelector('.card-container'));
	console.log(handler);
	handler.GenerateCards();
}
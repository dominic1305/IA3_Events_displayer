import EventCardHandler from "./../EventCardHandler.js";
import Notification from "./../Notification.js";

/**@type {EventCardHandler?}*/ let cardHandler;
/**@type {MutationObserver?}*/ let cardObserver;

window.onload = async () => {
	const ip = await fetch("https://api.ipify.org/?format=json").then(rsp => rsp.json()).then(bin => bin["ip"]);
	fetch(`http://api.ipbase.com/v1/json/${ip}`).then(rsp => rsp.json()).then((bin) => {
		document.querySelector(".wrapper .location-display").innerHTML = `Events around ${bin["city"]}`;
	}).catch(() => {
		console.warn("failed to get location");
		document.querySelector(".wrapper .location-display").innerHTML = "Events around Brisbane"; //hard-coded, yay!
	});

	cardObserver = new MutationObserver(() => {
		if (cardHandler == null) throw new Error("cardHandler cannot be null");

		document.querySelector(".card-loader-container").style.display = (document.querySelectorAll(".card-container > div.card").length >= cardHandler.FilteredLength) ? "none" : "flex";
	});
	cardObserver.observe(document.querySelector('.card-container'), { attributes: true, characterData: true, childList: true, });

	cardHandler = await EventCardHandler.GetHandler(document.querySelector(".card-container"), document.querySelector(".filter-controls-btn"));
	console.log(cardHandler);
	cardHandler.GenerateCards(10);
	document.querySelector(".card-loader-container").style.display = "flex";
}

document.querySelector(".create-account-btn").addEventListener("click", async () => {
	for (const input of document.querySelectorAll(".sign-up-container > input")) {
		input.value = "";
	}

	const bool = !Boolean(Number(document.querySelector(".sign-up-container").dataset["open"]));

	document.querySelector(".sign-up-container").style.transform = `translate(${(bool) ? "0" : "100"}%)`;
	document.querySelector(".sign-up-container").dataset["open"] = Number(bool);

	if (bool) {//only call APIs if opening panel
		const ip = await fetch("https://api.ipify.org/?format=json").then(rsp => rsp.json()).then(bin => bin["ip"]);
		document.querySelector(".sign-up-container input#location").value = await fetch(`http://api.ipbase.com/v1/json/${ip}`).then(rsp => rsp.json()).then(bin => bin["city"]).catch(() => {
			console.warn("failed to get location");
			return "Brisbane"; //hard-coded, yay!
		});
	}
});

document.querySelector(".sign-up-container > div.close").addEventListener("click", () => {
	document.querySelector(".create-account-btn").click();
});

document.querySelector(".sign-up-container > input#phone-num").addEventListener("input", (e) => {
	let val = String(document.querySelector(".sign-up-container > input#phone-num").value.replaceAll(' ', '')).split('').map((bin, i) => {
		return (i == 2 || i == 5) ? `${bin} ` : bin; //012 345 6789
	}).join('');

	if (val.length > 12) val = val.slice(0, 12); //larger than 10 digits + 2 spaces

	if (isNaN(Number(val[val.length-1]))) val = val.slice(0, val.length-1); //new char isn't a digit

	document.querySelector(".sign-up-container > input#phone-num").value = val;
});

document.querySelector(".sign-up-container > div.submit").addEventListener("click", () => {
	for (const input of document.querySelectorAll(".sign-up-container > input")) {
		if (input.value == "") {
			input.style.outline = '3px solid #ff0000';

			let opacity = 0xff;
			let interval = setInterval(() => {//error animation
				input.style.outline = `3px solid #ff0000${(opacity -= 2).toString(16).padStart(2, '0')}`;
				if (opacity <= 0) return clearInterval(interval);
			}, 10);

			return;
		}
	}

	setTimeout(() => {//fake it 'til you make it
		document.querySelector(".create-account-btn").click();
		Notification.notify("Account Created Successfully");
	}, Math.random() * (400 - 200) + 200);
});

document.querySelector("#card-loader").addEventListener("click", () => {
	if (cardHandler == null) throw new Error("cardHandler cannot be null");

	cardHandler.GenerateCards(document.querySelectorAll(".card-container > div.card").length + 10);
});
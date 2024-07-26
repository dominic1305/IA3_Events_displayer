import Event, { ParseException } from "./../Event.js";
import LoremIpsum from "./../LoremIpsum.js";

const eventsURL = "https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/brisbane-city-council-events/records";
/**@type {Event?}*/ let event;

window.onload = async () => {
	try {
		const url = new URLSearchParams(new URL(location.href).search);
		/**@type {Object<string, string?>[]}*/ let events = await fetch(`${eventsURL}?limit=${Number(url.get("idx"))+1}`).then(rsp => rsp.json()).then(bin => bin["results"]);

		let idx = Number(url.get("idx"));
		find: if (Event.HashGen(events[idx]["web_link"]) != url.get("hash")) {//didn't find the event in its cached position
			const testHash = url.get("hash");
			for (let i = 0; i < events.length; i++) {
				if (Event.HashGen(events[i]["web_link"]) == testHash) {//found the event but in a different place
					idx = i;
					console.warn("found event in different position");
					const newUrl = new URL(location.href);
					newUrl.searchParams.set("idx", i);
					window.history.pushState({}, "", newUrl); //update url with new idx position
					break find;
				}
			}
			events = await fetch(`${eventsURL}?limit=100`).then(rsp => rsp.json()).then(bin => bin["results"]); //expand array
			for (let i = 0; i < events.length; i++) {
				if (Event.HashGen(events[i]["web_link"]) == testHash) {//found the event but in a different place
					idx = i;
					console.warn("found event in different position");
					const newUrl = new URL(location.href);
					newUrl.searchParams.set("idx", i);
					window.history.pushState({}, "", newUrl); //update url with new idx position
					break find;
				}
			}
			throw new ParseException("unable to find event"); //event doesn't exist in array
		}

		event = Event.GetEvent(events[idx]);

		DrawEvent(events[idx]);
		document.querySelector("title").innerHTML = event.Info["subject"];
	} catch (error) {
		if (!(error instanceof Error)) return; //not an error, not an issue
		if (!(error instanceof ParseException)) console.error(error);

		document.querySelector(".wrapper").innerHTML = ""; //clear screen

		document.querySelector(".wrapper").appendChild(document.querySelector("template#err-page").content.cloneNode(true));
		const element = document.querySelector(".event-err-page");

		element.querySelector(".msg").innerHTML = error.message;

		element.querySelector(".return-btn").addEventListener("click", () => {
			location.assign("./../../home/index.html");
		});
	}
}

document.querySelector("nav > div.title").addEventListener("click", () => {
	location.assign("./../../home/index.html");
});

/**@param {Object<string, string?>} rawInfo*/
function DrawEvent(rawInfo) {
	if (event == null) throw new Error("event cannot be null");

	const FormatDate = () => `<p style="margin: 0;">Start:${Event.FormatDate(info["start_datetime"])}</p><p style="margin: 0;">End:${Event.FormatDate(info["end_datetime"])}</p></div>`;

	document.querySelector(".wrapper").appendChild(document.querySelector("template#event-display").content.cloneNode(true));
	const element = document.querySelector(".event-display-container");

	const info = event.Info; //cache event data
	const lorem = new LoremIpsum();

	element.querySelector(".event-img").src = "./img/placeholder.jpg";
	element.querySelector(".title").innerHTML = lorem.Replace(info["subject"]);
	element.querySelector(".cost").innerHTML = lorem.Replace(`Cost: ${info["cost"]}`);
	element.querySelector(".formated-dates").innerHTML = lorem.Replace(rawInfo["formatteddatetime"] ?? FormatDate());
	element.querySelector(".address").innerHTML = lorem.Replace(info["location"]);
	element.querySelector(".age").innerHTML = lorem.Replace(info["age"]);
	element.querySelector(".event-type").innerHTML = lorem.Replace(info["event_type"].join(', '));
	element.querySelector(".description").innerHTML = lorem.Replace(info["description"].replaceAll('\n', "<br>"));
	element.querySelector(".bookings").innerHTML = lorem.Replace(rawInfo["bookings"] ?? "No bookings required.");
	element.querySelector(".location").innerHTML = lorem.Replace(info["location"]);
	element.querySelector(".template").innerHTML = lorem.Replace(rawInfo["event_template"] ?? "");

	element.querySelector(".visit-btn").dataset["link"] = info["web_link"];
	element.querySelector(".visit-btn").addEventListener("click", (e) => location.assign(e.target.dataset["link"]));

	element.querySelector(".map-container").innerHTML = `<iframe src="https://maps.google.com/maps?q=${info["venueaddress"]}&hl=en&z=14&amp;output=embed"></iframe>`;
	element.querySelector(".map-container > iframe").onload = () => document.querySelector(".display-map-btn").classList.remove("inactive");
	element.querySelector(".display-map-btn").addEventListener("click", (e) => {
		if (e.target.classList.contains("inactive")) return; //map hasn't loaded yet

		const state = Number(e.target.dataset["toggle"]); //0 -> -1 (false) = open, -1 -> 0 (true) = close

		element.querySelector(".map-container").style.maxHeight = `${(state) ? 0 : element.querySelector(".map-container > iframe").clientHeight}px`;
		e.target.dataset["toggle"] = ~state;
	});
}
import Event, { ParseException } from "./../Event.js";

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
					break find;
				}
			}
			events = await fetch(`${eventsURL}?limit=100`).then(rsp => rsp.json()).then(bin => bin["results"]); //expand array
			for (let i = 0; i < events.length; i++) {
				if (Event.HashGen(events[i]["web_link"]) == testHash) {//found the event but in a different place
					idx = i;
					console.warn("found event in different position");
					break find;
				}
			}
			throw new ParseException("unable to find event"); //event doesn't exist in array
		}

		event = Event.GetEvent(events[idx]);

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
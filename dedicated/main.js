import Event, { ParseException } from "./../Event.js";

const eventsURL = "https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/brisbane-city-council-events/records";
/**@type {Event?}*/ let event;

window.onload = async () => {
	try {
		const url = new URLSearchParams(new URL(location.href).search);
		/**@type {Object<string, string?>[]}*/ let events = await fetch(`${eventsURL}?limit=${Number(url.get("idx"))+1}`).then(rsp => rsp.json()).then(bin => bin["results"]);

		let idx = url.get("idx");
		find: if (Event.HashGen(events[idx]["web_link"]) != url.get("hash")) {//didn't find the event in its cached position
			const testHash = url.get("hash");
			for (const event of events) {
				if (Event.HashGen(event["web_link"]) == testHash) {//found the event but in a different place
					idx = events.indexOf(event);
					break find;
				}
			}
			events = await fetch(`${eventsURL}?limit=100`).then(rsp => rsp.json()).then(bin => bin["results"]); //expand array
			for (const event of events) {
				if (Event.HashGen(event["web_link"]) == testHash) {//found the event but in a different place
					idx = events.indexOf(event);
					break find;
				}
			}
			throw new ParseException("unable to find event"); //event doesn't exist in array
		}

		event = Event.GetEvent(events[idx]);
	} catch (error) {
		throw error; //TODO: catch this properly
	}
}

document.querySelector("nav > div.title").addEventListener("click", () => {
	location.assign("./../../home/index.html");
});
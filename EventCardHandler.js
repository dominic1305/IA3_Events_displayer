import Event, { ParseException, GenerationException } from "./Event.js";

export default class EventCardHandler {
	static #eventAPI = "https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/brisbane-city-council-events/records";
	#events;
	#cardLocation;

	/**@private @param {Event[]} events @param {HTMLDivElement} cardLocation*/
	constructor(events, cardLocation) {
		this.#events = events;
		this.#cardLocation = cardLocation;
	}

	/**@param {number} eventCount @param {HTMLDivElement} cardLocation*/
	static async GetHandler(eventCount, cardLocation) {
		const buffer = [];

		for (const info of await this.#GetEvents(`${this.#eventAPI}?limit=${eventCount}`)) {
			try {
				buffer.push(Event.GetEvent(info));
			} catch (err) {
				if (err instanceof ParseException) {//skip if failed to make event
					console.warn(`${err.name} ${err.message}`);
					continue;
				} else
					throw err; //encountered an unexpected error, throw higher
			}
		}

		return new EventCardHandler(buffer, cardLocation);
	}

	/**@returns {Promise<Object<string, string?>>}*/
	static async #GetEvents(API) {
		return await fetch(API).then(rsp => rsp.json()).then(bin => bin["results"]);
	}

	GenerateCards() {
		for (const event of this.#events) {
			try {
				this.#cardLocation.appendChild(event.GenerateCard());
			} catch (err) {
				if (err instanceof GenerationException) {
					console.warn(`${err.name} ${err.message}`);
					continue;
				} else
					throw err; //encountered an unexpected error, throw higher
			}
		}
	}
}
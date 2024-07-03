import Event, { ParseException } from "./Event.js";

export default class EventCardHandler {
	static #eventAPI = "https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/brisbane-city-council-events/records";
	#events;

	/**@private @param {Event[]} events*/
	constructor(events) {
		this.#events = events;
	}

	/**@param {number} eventCount*/
	static async GetHandler(eventCount) {
		const buffer = [];

		for (const info of await this.#GetEvents(`${this.#eventAPI}?limit=${eventCount}`)) {
			try {
				buffer.push(Event.GetEvent(info));
			} catch (err) {
				if (err instanceof ParseException) {//skip if failed to make event
					console.warn(`${err.name}: ${err.message}`);
					continue;
				} else
					throw err; //encountered an unexpected error, throw higher
			}
		}

		return new EventCardHandler(buffer);
	}

	/**@returns {Promise<Object<string, string?>>}*/
	static async #GetEvents(API) {
		return await fetch(API).then(rsp => rsp.json()).then(bin => bin["results"]);
	}
}
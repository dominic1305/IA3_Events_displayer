import Event, { ParseException, GenerationException } from "./Event.js";

export default class EventCardHandler {
	static #eventAPI = "https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/brisbane-city-council-events/records?limit=100";
	#events;
	#cardLocation;

	get Length() {
		return this.#events.length;
	}

	/**@private @param {Event[]} events @param {HTMLDivElement} cardLocation*/
	constructor(events, cardLocation) {
		this.#events = events;
		this.#cardLocation = cardLocation;
	}

	/**@param {HTMLDivElement} cardLocation*/
	static async GetHandler(cardLocation) {
		const buffer = [];

		for (const info of await this.#GetEvents(this.#eventAPI)) {
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

	/**@returns {Promise<Object<string, string?>[]>}*/
	static async #GetEvents(API) {
		return await fetch(API).then(rsp => rsp.json()).then(bin => bin["results"]);
	}

	/**@param {number} targCount*/
	GenerateCards(targCount) {
		let cardCount = document.querySelectorAll(".card-container > div.card").length;

		for (let i = cardCount; i < this.#events.length; i++) {
			if (cardCount == targCount) break; //generated the required amount of cards

			try {
				const element = this.#events[i].GenerateCard();
				this.#cardLocation.appendChild(element);
				cardCount++;

				element.querySelector(".map-btn").addEventListener("click", (e) => {
					this.#createMapModal(e.target.dataset["address"]);
				});

				element.querySelector("#description").addEventListener("click", (e) => {
					const bool = !Boolean(Number(e.target.dataset["hide"]));
					e.target.style.display = (bool) ? "-webkit-box" : "flex";
					e.target.dataset["hide"] = Number(bool);
				});
			} catch (err) {
				if (err instanceof GenerationException) {//skip if failed to generate event card
					console.warn(`${err.name} ${err.message}`);
					continue;
				} else
					throw err; //encountered an unexpected error, throw higher
			}
		}
	}

	/**@param {string} location*/
	#createMapModal(location) {
		const container = document.createElement("dialog");
		container.className = "map-container-modal";

		container.innerHTML += "<div class=\"close-btn\">&#10005;</div>";
		container.innerHTML += `<iframe src="https://maps.google.com/maps?q=${location}&hl=en&z=14&amp;output=embed"></iframe>`;

		document.body.appendChild(container);
		container.showModal();
		document.body.style.overflow = "hidden";

		container.querySelector(".close-btn").addEventListener("click", () => {
			document.body.style.overflow = "auto";
			document.body.removeChild(container);
		});
	}
}
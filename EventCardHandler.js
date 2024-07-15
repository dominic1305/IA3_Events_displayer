import Event, { ParseException, GenerationException } from "./Event.js";

export default class EventCardHandler {
	static #eventAPI = "https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/brisbane-city-council-events/records?limit=100";
	#events;
	#cardLocation;
	#filterBtn;
	#filter;

	get Length() {
		return this.#events.length;
	}

	get FilteredLength() {
		let count = 0;
		for (const event of this.#events) {
			if (event.Info["event_type"].some(bin => this.#filter[bin])) count++;
		}
		return count;
	}

	/**@private @param {Event[]} events @param {HTMLDivElement} cardLocation @param {HTMLDivElement} filterBtn @param {Object<string, boolean>} filter */
	constructor(events, cardLocation, filterBtn, filter) {
		this.#events = events;
		this.#cardLocation = cardLocation;
		this.#filterBtn = filterBtn;
		this.#filter = filter;
	}

	/**@param {HTMLDivElement} cardLocation @param {HTMLDivElement} filterBtn*/
	static async GetHandler(cardLocation, filterBtn) {
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

		const filter = {};
		for (const event of buffer) {
			for (const type of event.Info["event_type"]) {
				if (Object.keys(filter).includes(type)) continue;
				filter[type] = true;
			}
		}

		const handler = new EventCardHandler(buffer, cardLocation, filterBtn, filter);
		handler.#initListeners();

		return handler;
	}

	/**@returns {Promise<Object<string, string?>[]>}*/
	static async #GetEvents(API) {
		return await fetch(API).then(rsp => rsp.json()).then(bin => bin["results"]);
	}

	#initListeners() {
		this.#filterBtn.addEventListener("click", () => {
			const element = this.#filterBtn.parentNode.appendChild(this.#generateFilterModal());

			element.querySelector(".exit").addEventListener("click", () => {
				this.#filterBtn.parentNode.removeChild(element);
			});

			element.querySelector(".submit").addEventListener("click", () => {
				this.#filter = this.#GetNewFilter();
				this.#filterBtn.parentNode.removeChild(element);
				this.#cardLocation.innerHTML = "";
				this.GenerateCards(10);
			});

			element.querySelectorAll(".row input").forEach((bin) => {
				bin.addEventListener("click", () => {
					const method = Number(element.querySelector("#toggle").dataset["method"]);
					const inputs = Array.from(element.querySelectorAll(".row input"));
					if (inputs.every(bin => bin.checked) && method == -1 || inputs.every(bin => !bin.checked) && method == 0) {
						element.querySelector("#toggle").dataset["method"] = ~method;
						element.querySelector("#toggle").innerHTML = (~method) ? "Select All" : "Deselect All";
					}
				});
			});

			element.querySelector("#toggle").addEventListener("click", () => {
				const method = Number(element.querySelector("#toggle").dataset["method"]);
				switch (method) {
					case 0: {//deselect all
						for (const input of element.querySelectorAll(".row input")) {
							input.checked = false;
						}
						break;
					}
					case -1: {//select all
						for (const input of element.querySelectorAll(".row input")) {
							input.checked = true;
						}
						break;
					}
					default: throw new Error(`invalid method: ${method}`);
				}
				element.querySelector("#toggle").dataset["method"] = ~method;
				element.querySelector("#toggle").innerHTML = (~method) ? "Select All" : "Deselect All";
			});
		});
	}

	/**@param {number} targCount*/
	GenerateCards(targCount) {
		let cardCount = document.querySelectorAll(".card-container > div.card").length;

		for (let i = cardCount; i < this.#events.length; i++) {
			if (cardCount == targCount) break; //generated the required amount of cards
			if (!this.#events[i].Info["event_type"].some(bin => this.#filter[bin])) continue; //this event is not compliant with the filter, skip
			if (Array.from(document.querySelectorAll(".card-container > div.card")).some(bin => bin.dataset["idx"] == i)) continue; //card index already exists, skip

			try {
				const element = this.#cardLocation.appendChild(this.#events[i].GenerateCard());
				element.dataset["idx"] = i;
				cardCount++;

				element.querySelector(".map-btn").addEventListener("click", (e) => {
					this.#GenerateMapModal(e.target.dataset["address"]);
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
	#GenerateMapModal(location) {
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

	#generateFilterModal() {
		const parent = document.createElement("div");
		parent.className = "filter-controller-container";

		parent.innerHTML += "<div class=\"title\"><p class=\"title-txt\">Filter</p><div id=\"toggle\" data-method=\"0\">Deselect All</div><p class=\"exit\">&#10005;</p></div>"; //title

		for (const [ key, checked ] of Object.entries(this.#filter)) {
			let row = `<div class="row" data-key="${key}">`; //start row

			row += `<label id="key-select" data-key="${key}"><input type="checkbox" ${(checked) ? "checked" : ""}>${key}</label>`;
			row += `<div class="total-category">${this.#events.map(bin => bin.Info["event_type"]).filter(bin => bin.includes(key)).length}</div>`;

			parent.innerHTML += row + "</div>"; //end row
		}

		parent.innerHTML += "<div class=\"submit\">Submit</div>";

		return parent;
	}

	/**@returns {Object<string, boolean>}*/
	#GetNewFilter() {
		const element = document.querySelector(".filter-controller-container");
		if (element == null) throw new Error("modal doesn\"t exist");

		const filter = {};
		for (const row of element.querySelectorAll(".row > label")) {
			filter[row.dataset["key"]] = row.querySelector("input").checked;
		}

		return filter;
	}
}
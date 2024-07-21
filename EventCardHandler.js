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
			if ((!this.#filter["pending"] && event.IsPending) || (!this.#filter["finished"] && event.IsFinished) || (!this.#filter["active"] && event.IsActive)) continue;
			if (event.Info["event_type"].some(bin => this.#filter[bin])) count++;
		}
		return count;
	}

	get #AreAllTypesFalse() {
		for (const [ key, value ] of Object.entries(this.#filter)) {
			if (["pending", "finished", "active"].includes(key)) continue;
			if (value) return false;
		}
		return true;
	}

	get #AreAllTimesFalse() {
		for (const [ key, value ] of Object.entries(this.#filter)) {
			if (!["pending", "finished", "active"].includes(key)) continue;
			if (value) return false;
		}
		return true;
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

		const filter = { pending: true, finished: true, active: true };
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

			element.querySelectorAll(".row label[data-type=\"type\"] input").forEach((bin) => {
				bin.addEventListener("click", () => {
					const method = Number(element.querySelector("#toggle-types").dataset["method"]);
					const inputs = Array.from(element.querySelectorAll(".row label[data-type=\"type\"] input"));
					if (inputs.every(bin => bin.checked) && method == -1 || inputs.every(bin => !bin.checked) && method == 0) {
						element.querySelector("#toggle-types").innerHTML = (method) ? "Deselect All" : "Select All";
						element.querySelector("#toggle-types").dataset["method"] = ~method;
					}
				});
			});

			element.querySelectorAll(".row label[data-type=\"time\"] input").forEach((bin) => {
				bin.addEventListener("click", () => {
					const method = Number(element.querySelector("#toggle-times").dataset["method"]);
					const inputs = Array.from(element.querySelectorAll(".row label[data-type=\"time\"] input"));
					if (inputs.every(bin => bin.checked) && method == -1 || inputs.every(bin => !bin.checked) && method == 0) {
						element.querySelector("#toggle-times").innerHTML = (method) ? "Deselect All" : "Select All";
						element.querySelector("#toggle-times").dataset["method"] = ~method;
					}
				});
			});

			element.querySelector("#toggle-types").addEventListener("click", () => {
				const method = Number(element.querySelector("#toggle-types").dataset["method"]);
				for (const input of element.querySelectorAll(".row label[data-type=\"type\"] input")) {
					input.checked = Boolean(method);
				}
				element.querySelector("#toggle-types").innerHTML = (method) ? "Deselect All" : "Select All";
				element.querySelector("#toggle-types").dataset["method"] = ~method;
			});

			element.querySelector("#toggle-times").addEventListener("click", () => {
				const method = Number(element.querySelector("#toggle-times").dataset["method"]);
				for (const input of element.querySelectorAll(".row label[data-type=\"time\"] input")) {
					input.checked = Boolean(method);
				}
				element.querySelector("#toggle-times").innerHTML = (method) ? "Deselect All" : "Select All";
				element.querySelector("#toggle-times").dataset["method"] = ~method;
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
			if ((!this.#filter["pending"] && this.#events[i].IsPending) || (!this.#filter["finished"] && this.#events[i].IsFinished) || (!this.#filter["active"] && this.#events[i].IsActive)) continue;

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

				element.querySelector("#web_link").addEventListener("click", () => {
					const event = this.#events[Number(element.dataset["idx"])];
					location.assign(`./../../dedicated/dedicated.html?idx=${element.dataset["idx"]}&hash=${event.Info["hash"]}`);
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
		/**@returns {(event: Event) => boolean} @param {string} type*/
		function GetTimeTypePredicate(type) {
			switch (type) {
				case "pending":		return (event) => event.IsPending;
				case "finished":	return (event) => event.IsFinished;
				case "active":		return (event) => event.IsActive;
				default:			throw new Error(`invalid time type: ${type}`);
			}
		}

		const parent = document.createElement("div");
		parent.className = "filter-controller-container";

		parent.innerHTML += "<div class=\"title\"><p class=\"title-txt\">Filter</p><p class=\"exit\">&#10005;</p></div>"; //title

		parent.innerHTML += `<div class="toggle" id="toggle-times" data-method="${(this.#AreAllTimesFalse) ? -1 : 0}">${(this.#AreAllTimesFalse) ? "Select All" : "Deselect All"}</div>`;

		for (const [ key, checked ] of Object.entries(this.#filter)) {
			let row = "<div class=\"row\">"; //start row

			row += `<label id="key-select" data-type="${["pending", "finished", "active"].includes(key) ? "time" : "type"}" data-key="${key}"><input type="checkbox" ${(checked) ? "checked" : ""}>${key}</label>`;

			if (["pending", "finished", "active"].includes(key)) {//handle time type functions
				row += `<div class="total-category">${this.#events.filter(bin => GetTimeTypePredicate(key)(bin)).length}</div>`;
			} else {
				row += `<div class="total-category">${this.#events.map(bin => bin.Info["event_type"]).filter(bin => bin.includes(key)).length}</div>`;
			}

			parent.innerHTML += row + "</div>"; //end row

			if (key == "active") parent.innerHTML += `<div class="toggle" id="toggle-types" data-method="${(this.#AreAllTypesFalse) ? -1 : 0}">${(this.#AreAllTypesFalse) ? "Select All" : "Deselect All"}</div>`;
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
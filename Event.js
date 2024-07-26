import LoremIpsum from "./LoremIpsum.js";

export default class Event {
	#info;

	get Info() {
		return Object.freeze(Object.assign({}, this.#info));
	}

	get Progress() {//range from 0 - 100, showcasing the progress of the event as a percentage
		let progress = Math.floor(((new Date() - this.#info["start_datetime"]) / (this.#info["end_datetime"] - this.#info["start_datetime"])) * 100);
		return (progress < 0) ? 0 : (progress > 100) ? 100 : progress;
	}

	get IsFinished() {//event is over
		return this.Progress >= 100;
	}

	get IsPending() {//event is yet to happen
		return this.Progress <= 0;
	}

	get IsActive() {//event is activly operating
		return !this.IsPending && !this.IsFinished;
	}

	/**@private @param {Object<string, string | string[] | Date>} info*/
	constructor(info) {
		this.#info = info;
	}

	/**@param {Object<string, string?>} info*/
	static GetEvent(info) {
		const obj = {};

		for (const [ key, value ] of Object.entries(info)) {
			switch (key) {
				case "age":
				case "cost":
				case "description":
				case "location":
				case "subject":
				case "eventimage": {
					obj[key] = value;
					break;
				}
				case "venueaddress": {
					if (value == null) throw new ParseException("Event must contain a venue address");
					obj[key] = value;
					break;
				}
				case "meetingpoint": {
					if (value == null) { obj[key] = ""; break; }
					obj[key] = (value.split(' ')[0].toLowerCase() == "meet") ? value : `Meet ${value.toLocaleLowerCase()}`;
					break;
				}
				case "requirements": {
					obj[key] = `Requirements: ${(value == null) ? "None" : value}`;
					break;
				}
				case "web_link": {
					obj[key] = value;
					obj["hash"] = this.HashGen(value); //creates hash for URL parsing when generating dedicated event page
					break;
				}
				case "event_type": {
					obj[key] = (value != null) ? value.split(',') : [];
					break;
				}
				case "end_datetime":
				case "start_datetime": {
					const date = new Date(value);
					obj[key] = new Date(date.valueOf() + 3.6e+6 * 10); //+10 hours to account for GMT time
					break;
				}
			}
		}

		if (Object.values(obj).some(bin => bin == null)) throw new ParseException("value cannot be null");

		return new Event(obj);
	}

	/**@param {string} str*/
	static HashGen(str) {
		let h1 = 0xdeadbeef;
		let h2 = 0x41c6ce57;
		for(let i = 0; i < str.length; i++) {
			h1 = Math.imul(h1 ^ str.charCodeAt(i), 2654435761);
			h2 = Math.imul(h2 ^ str.charCodeAt(i), 1597334677);
		}
		h1 = Math.imul(h1 ^ (h1 >> 16), 2246822507);
		h2 = Math.imul(h2 ^ (h2 >> 16), 2246822507);
		return (4294967296 * (2097151 & h2) + (h1 >> 0)).toString(32);
	}

	/**@param {Date} date @param {boolean?} _24H_time*/
	static FormatDate(date, _24H_time = false) {
		const _date = `${date.getDate()}/${date.getMonth()+1}/${String(date.getFullYear()).substring(2, 4)} `;

		const hours = date.getHours();
		const minutes = date.getMinutes();

		if (_24H_time) return _date + String(hours).padStart(2, '0') + ':' + String(minutes).padEnd(2, '0');

		if (hours > 12) return _date + String(hours - 12).padStart(2, '0') + ':' + String(minutes).padEnd(2, '0') + " PM";

		return _date + String(hours).padStart(2, '0') + ':' + String(minutes).padEnd(2, '0') + " AM";
	}

	/**@returns {Generator<{key: string, value: string | Date | string[]}>}*/
	*#GetData_Precedence() {
		const arr = new Array(Object.keys(this.#info).length);

		for (const key of Object.keys(this.#info)) {
			switch (key) {
				case "eventimage":		{ arr[0x0] = key; break; }
				case "subject":			{ arr[0x1] = key; break; }
				case "cost":			{ arr[0x2] = key; break; }
				case "age":				{ arr[0x3] = key; break; }
				case "location":		{ arr[0x4] = key; break; }
				case "venueaddress" :	{ arr[0x5] = key; break; }
				case "start_datetime":	{ arr[0x6] = key; break; }
				case "end_datetime":	{ arr[0x7] = key; break; }
				case "meetingpoint":	{ arr[0x8] = key; break; }
				case "requirements":	{ arr[0x9] = key; break; }
				case "description":		{ arr[0xa] = key; break; }
				case "event_type":		{ arr[0xb] = key; break; }
				case "web_link":		{ arr[0xc] = key; break; }
				case "hash":			{ arr[0xd] = key; break; }
				default:				throw new Error(`[INVALID KEY] (${key}) is not a valid key of Event`);
			}
		}

		for (const key of arr) {
			yield { key: key, value: this.#info[key] };
		}
	}

	/**@param {string[]?} ignoreList*/
	GenerateCard(ignoreList) {
		let card = document.createElement("div");
		card.className = "card";

		const lorem = new LoremIpsum();

		for (const { key, value } of this.#GetData_Precedence()) {
			if (ignoreList != null && ignoreList.includes(key)) continue;

			switch (key) {
				case "requirements":
				case "subject": {
					if (typeof value != "string") throw new GenerationException(`invalid type for ${key}`);
					card.innerHTML += `<p id="${key}">${lorem.Replace(value)}</p>`;
					break;
				}
				case "description": {
					if (typeof value != "string") throw new GenerationException(`invalid type for ${key}`);
					card.innerHTML += `<p id="${key}" data-hide="1">${lorem.Replace(value)}</p>`;
					break;
				}
				case "location": {
					if (typeof value != "string") throw new GenerationException(`invalid type for ${key}`);
					card.innerHTML += `<div id="${key}" class="location-container"><div>${lorem.Replace(value)}</div><div class="map-btn" data-address="${this.#info["venueaddress"]}">View on Map</div></div>`;
					break;
				}
				case "venueaddress": continue; //is handled by "location"
				case "cost": {
					if (typeof value != "string") throw new GenerationException(`invalid type for ${key}`);
					card.innerHTML += `<div class="costKey"><p id="${key}">${lorem.Replace(value)}</p><p id="age">${lorem.Replace(this.#info["age"])}</p></div>`;
					break;
				}
				case "age": continue; //is handled by "cost"
				case "web_link": {
					if (typeof value != "string") throw new GenerationException(`invalid type for ${key}`);
					card.innerHTML += `<div id="${key}" class="card-visit-btn">Visit Page</div>`;
					break;
				}
				case "hash": {
					if (typeof value != "string") throw new GenerationException(`invalid type for ${key}`);
					card.dataset["hash"] = value;
					break;
				}
				case "start_datetime": {
					if (!(value instanceof Date && this.#info["end_datetime"] instanceof Date)) throw new GenerationException("invalid date type");

					const titleMSG = lorem.Replace((this.IsPending) ? "This event has not started yet" : (this.IsFinished) ? "This event is over" : `This event is ${this.Progress}% completed`);
					const txt = lorem.Replace((this.IsPending) ? "Pending" : (this.IsFinished) ? "Finished" : `${this.Progress}%`);

					let ss = `<p style="margin: 5px 0 0 0; text-decoration: underline;">Event Progress</p><div class="card-dates" data-state="${txt}"><div class="formated-dates">`;

					ss += `<p style="margin: 0;">Start: ${lorem.Replace(Event.FormatDate(value))}</p>`;
					ss += `<p style="margin: 0;">End: ${lorem.Replace(Event.FormatDate(this.#info["end_datetime"]))}</p></div>`;

					ss +=	`<svg viewBox="0 0 250 250" class="date-progress" style="--progress: ${this.Progress}">
								<circle style="cx: var(--half-size); cy: var(--half-size); r: var(--radius);" class="bg"></circle>
								<circle style="cx: var(--half-size); cy: var(--half-size); r: var(--radius);" class="fg"></circle>
								<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" style="font-size: ${(true) ? "50" : "90"}px;">${txt}</text>
								<title>${titleMSG}</title>
							</svg>`;

					card.innerHTML += ss + "</div>";

					break;
				}
				case "end_datetime": continue; //is handled by "start_datetime"
				case "event_type": continue; //not displayed to user, used for filtering
				case "eventimage": {
					if (typeof value != "string") throw new GenerationException(`invalid type for ${key}`);
					card.innerHTML += `<img class="card-img" src="./img/placeholder.jpg" draggable="false">`;
					break;
				}
				case "meetingpoint": {
					if (typeof value != "string") throw new GenerationException(`invalid type for ${key}`);
					if (value != "") card.innerHTML += `<p id="${key}">${lorem.Replace(value)}</p>`;
					break;
				}
				default: throw new GenerationException(`${key} is not a valid Event element for generation`);
			}
		}

		return card;
	}
}

export class ParseException extends Error {
	/**@param {string} msg*/
	constructor(msg) {
		super(msg);
		super.name = "[PARSE ERROR]";
	}
}

export class GenerationException extends Error {
	/**@param {string} msg*/
	constructor(msg) {
		super(msg);
		super.name = "[GENERATION ERROR]";
	}
}
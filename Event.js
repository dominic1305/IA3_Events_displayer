export default class Event {
	#info;

	get Info() {
		return Object.freeze(Object.assign({}, this.#info));
	}

	/**@private @param {Object<string, string | string[] | Date | HTMLImageElement>} info*/
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
					obj["hash"] = this.#hashGen(value); //creates hash for URL parsing when generating dedicated event page
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
	static #hashGen(str) {
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

	/**@returns {Generator<{key: string, value: string | Date | string[] | HTMLImageElement}>}*/
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

		for (const { key, value } of this.#GetData_Precedence()) {
			if (ignoreList != null && ignoreList.includes(key)) continue;

			switch (key) {
				case "requirements":
				case "subject": {
					if (typeof value != "string") throw new GenerationException(`invalid type for ${key}`);
					card.innerHTML += `<p id="${key}">${value}</p>`;
					break;
				}
				case "description": {
					if (typeof value != "string") throw new GenerationException(`invalid type for ${key}`);
					card.innerHTML += `<p id="${key}" data-hide="1">${value}</p>`;
					break;
				}
				case "location": {
					if (typeof value != "string") throw new GenerationException(`invalid type for ${key}`);
					card.innerHTML += `<div id="${key}" class="location-container"><div>${value}</div><div class="map-btn" data-address="${this.#info["venueaddress"]}">View on Map</div></div>`;
					break;
				}
				case "venueaddress": continue; //is handled by "location"
				case "cost": {
					if (typeof value != "string") throw new GenerationException(`invalid type for ${key}`);
					card.innerHTML += `<div class="costKey"><p id="${key}">${value}</p><p id="age">${this.#info["age"]}</p></div>`;
					break;
				}
				case "age": continue; //is handled by "cost"
				case "web_link": {
					if (typeof value != "string") throw new GenerationException(`invalid type for ${key}`);
					card.innerHTML += `<a class="card-visit-btn" href="${value}" draggable="false">Visit Page</a>`;
					break;
				}
				case "hash": {
					if (typeof value != "string") throw new GenerationException(`invalid type for ${key}`);
					card.dataset["hash"] = value;
					break;
				}
				case "start_datetime": {
					const start = value;
					const end = this.#info["end_datetime"];

					if (!(end instanceof Date && start instanceof Date)) throw new GenerationException("invalid date type");

					let ss = "<p style=\"margin: 5px 0 0 0; text-decoration: underline;\">Event Progress</p><div class=\"card-dates\"><div class=\"formated-dates\">";

					ss += `<p style="margin: 0;">Start: ${this.#FormatDate(start)}</p>`;
					ss += `<p style="margin: 0;">End: ${this.#FormatDate(end)}</p></div>`;

					let progress = Math.floor(((new Date() - start) / (end - start)) * 100);
					progress = (progress < 0) ? 0 : (progress > 100) ? 100 : progress;

					const titleMSG = (progress <= 0) ? "This event has not started yet" : (progress >= 100) ? "This event is over" : `This event is ${progress}% completed`;
					const txt = (progress <= 0) ? "Pending" : (progress >= 100) ? "Finished" : `${progress}%`;

					ss +=	`<svg viewBox="0 0 250 250" class="date-progress" style="--progress: ${progress}">
								<circle style="cx: var(--half-size); cy: var(--half-size); r: var(--radius);" class="bg"></circle>
								<circle style="cx: var(--half-size); cy: var(--half-size); r: var(--radius);" class="fg"></circle>
								<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" style="font-size: ${(progress <= 0 || progress >= 100) ? "50" : "90"}px;">${txt}</text>
								<title>${titleMSG}</title>
							</svg>`;

					card.innerHTML += ss + "</div>";

					break;
				}
				case "end_datetime": continue; //is handled by "start_datetime"
				case "event_type": continue; //not displayed to user, used for filtering
				case "eventimage": {
					if (typeof value != "string") throw new GenerationException(`invalid type for ${key}`);
					card.innerHTML += `<img class="card-img" src="${value}" draggable="false">`;
					break;
				}
				case "meetingpoint": {
					if (typeof value != "string") throw new GenerationException(`invalid type for ${key}`);
					if (value != "") card.innerHTML += `<p id="${key}">${value}</p>`;
					break;
				}
				default: throw new GenerationException(`${key} is not a valid Event element for generation`);
			}
		}

		return card;
	}

	/**@param {Date} date @param {boolean?} _24H_time*/
	#FormatDate(date, _24H_time = false) {
		const _date = `${date.getDate()}/${date.getMonth()+1}/${String(date.getFullYear()).substring(2, 4)} `;

		const hours = date.getHours();
		const minutes = date.getMinutes();

		if (_24H_time) return _date + String(hours).padStart(2, '0') + ':' + String(minutes).padEnd(2, '0');

		if (hours > 12) return _date + String(hours - 12).padStart(2, '0') + ':' + String(minutes).padEnd(2, '0') + " PM";

		return _date + String(hours).padStart(2, '0') + ':' + String(minutes).padEnd(2, '0') + " AM";
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
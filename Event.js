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
					break;
				}
				case "meetingpoint": {
					if (value == null) continue;
					obj[key] = `Meet ${value.toLowerCase()}`;
					break;
				}
				case "requirements": {
					obj[key] = `Requirements: ${(value == null) ? "none" : value}`;
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
}

export class ParseException extends Error {
	/**@param {string} msg*/
	constructor(msg) {
		super(msg);
		super.name = "[PARSE ERROR]";
	}
}
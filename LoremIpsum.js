export default class LoremIpsum {
	#words = ["a", "ac", "accumsan", "ad", "adipiscing", "aenean", "aenean", "aliquam", "aliquam", "aliquet", "amet", "ante", "aptent", "arcu", "at", "auctor", "augue", "bibendum", "blandit", "class", "commodo", "condimentum", "congue", "consectetur", "consequat", "conubia", "convallis", "cras", "cubilia", "curabitur", "curabitur", "curae", "cursus", "dapibus", "diam", "dictum", "dictumst", "dolor", "donec", "donec", "dui", "duis", "egestas", "eget", "eleifend", "elementum", "elit", "enim", "erat", "eros", "est", "et", "etiam", "etiam", "eu", "euismod", "facilisis", "fames", "faucibus", "felis", "fermentum", "feugiat", "fringilla", "fusce", "gravida", "habitant", "habitasse", "hac", "hendrerit", "himenaeos", "iaculis", "id", "imperdiet", "in", "inceptos", "integer", "interdum", "ipsum", "justo", "lacinia", "lacus", "laoreet", "lectus", "leo", "libero", "ligula", "litora", "lobortis", "lorem", "luctus", "maecenas", "magna", "malesuada", "massa", "mattis", "mauris", "metus", "mi", "molestie", "mollis", "morbi", "nam", "nec", "neque", "netus", "nibh", "nisi", "nisl", "non", "nostra", "nulla", "nullam", "nunc", "odio", "orci", "ornare", "pellentesque", "per", "pharetra", "phasellus", "placerat", "platea", "porta", "porttitor", "posuere", "potenti", "praesent", "pretium", "primis", "proin", "pulvinar", "purus", "quam", "quis", "quisque", "quisque", "rhoncus", "risus", "rutrum", "sagittis", "sapien", "scelerisque", "sed", "sem", "semper", "senectus", "sit", "sociosqu", "sodales", "sollicitudin", "suscipit", "suspendisse", "taciti", "tellus", "tempor", "tempus", "tincidunt", "torquent", "tortor", "tristique", "turpis", "ullamcorper", "ultrices", "ultricies", "urna", "ut", "ut", "varius", "vehicula", "vel", "velit", "venenatis", "vestibulum", "vitae", "vivamus", "viverra", "volutpat", "vulputate"];

	constructor() {}

	/**@param {number} x @param {number} y*/
	#Random(x, y) {
		const rnd = (Math.random() * 2 - 1) + (Math.random() * 2 - 1) + (Math.random() * 2 - 1);
		return Math.round(Math.abs(rnd) * x + y);
	}

	/**@param {number} min @param {number} max*/
	#Count(min, max) {
		let result;
		if (min && max) result = Math.floor(Math.random() * (max - min + 1) + min);
		else if (min) result = min;
		else if (max) result = max;
		else result = this.#Random(8, 2);

		return result;
	}

	/**@param {number} min @param {number} max*/
	Words(min, max) {
		const result = [];
		const count = this.#Count(min, max);

		// get random words
		while (result.length < count) {
			const pos = Math.floor(Math.random() * this.#words.length);
			const rnd = this.#words[pos];

			// do not allow same word twice in a row
			if (result.length && result[result.length - 1] == rnd) {
				continue;
			}

			result.push(rnd);
		}

		return result;
	}

	/**@param {number} min @param {number} max*/
	Sentence(min, max) {
		const words = this.Words(min, max);

		// add comma(s) to sentence
		let idx = this.#Random(6, 2);
		while (idx < words.length - 2) {
			words[idx] += ",";
			idx += this.#Random(6, 2);
		}

		// append puctation on end
		const punct = "...!?"
		words[words.length - 1] += punct.charAt(Math.floor(Math.random() * punct.length));

		// uppercase first letter
		words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);

		return words.join(" ");
	}

	/**@param {number} min @param {number} max*/
	Paragraph(min, max) {
		let result = "";
		const count = this.#Count(min, max);

		// append sentences until limit is reached
		while (result.slice(0, -1).split(" ").length < count) {
			result += this.Sentence() + " ";
		}
		result = result.slice(0, -1)

		// remove words
		if (result.split(" ").length > count) {
			var punct = result.slice(-1);
			result = result.split(" ").slice(0, count).join(" ");
			result = result.replace(/,$/, "");
			result += punct;
		}

		return result;
	}

	/**@param {string} str*/
	Replace(str) {
		const wordCount = str.split(' ').length;

		return (str.includes('.') || wordCount >= 20) ? this.Paragraph(wordCount, wordCount) : this.Sentence(wordCount, wordCount);
	}
}
/**@static*/
export default class Notification {
	/**@type {HTMLDivElement?}*/ static #container;
	/**@param {string} str @param {number?} duration*/
	static notify(str, duration = 3000) {
		if (this.#container == null) this.#container = this.#createContainer();

		const msg = document.createElement('p');
		msg.innerHTML = str;
		this.#container.appendChild(msg);
		setTimeout(() => {
			this.#container.removeChild(msg);
		}, duration);
	}
	static #createContainer() {
		const container = document.createElement('div');
		container.className = 'notification-container';

		document.body.appendChild(container);
		return container;
	}
}
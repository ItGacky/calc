(function() {
	const ID_TOTAL = "total";
	const ID_ITEM = "item";
	const ID_CALC = "calc";
	const TEXT_BACK = "\u232B";
	const TEXT_ENTER = "\u23CE";
	const TEXT_YEN = "\u00A5";

	function getElement(id) {
		return document.getElementById(id);
	}

	function queryElements(node, ids) {
		let nodes = [];
		for (let id of ids) {
			nodes.push(node.querySelector("#" + id));
		}
		return nodes;
	}

	function calcItemTotal(qty, unit, tax, discount) {
		return qty * unit * (1 - discount / 100) * (1 + tax / 100);
	}

	function toYen(yen) {
		return TEXT_YEN + String(yen).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
	}

	function toSubTotalYen(item) {
		return toYen(Math.floor(calcItemTotal(item.qty, item.unit, item.tax, item.discount)));
	}

	function getYen(e) {
		return e.value || 0;
	}

	function setYen(e, yen) {
		e.value = yen;
		e.innerText = toYen(yen);
	}

	let items = [];

	window.onload = function() {
		const itemTemplate = getElement(ID_ITEM);
		const itemParent = itemTemplate.parentElement;
		itemParent.removeChild(itemTemplate);

		const total = getElement(ID_TOTAL);

		function updateTotal() {
			let sum = 0;
			for (let item of items) {
				sum += calcItemTotal(item.qty, item.unit, item.tax, item.discount);
			}
			setYen(total, Math.floor(sum));
		}

		function addItem(item) {
			items.push(item);

			const node = itemTemplate.cloneNode(true);
			const [up, down, qty, unit, tax, sub] = queryElements(node, ["up", "down", "qty", "unit", "tax", "sub"]);

			up.addEventListener("click", function() {
				item.qty += 1;
				down.disabled = false;
				qty.innerText = item.qty;
				sub.innerText = toSubTotalYen(item);
				updateTotal();
			});
			down.addEventListener("click", function() {
				item.qty -= 1;
				if (item.qty < 1) {
					down.disabled = true;
				}
				qty.innerText = item.qty;
				sub.innerText = toSubTotalYen(item);
				updateTotal();
			});
			qty.innerText = 1;
			unit.innerText = toYen(Math.floor(item.unit * (1 - item.discount / 100)));
			tax.innerText = item.tax + "%";
			sub.innerText = toSubTotalYen(item);

			itemParent.prepend(node);
			updateTotal();
		}

		const calc = getElement(ID_CALC);
		const [price, tax, discount] = queryElements(calc, ["price", "tax", "discount"]);

		const buttons = calc.getElementsByTagName("button");
		for (let button of buttons) {
			let text = button.innerText;
			let onClick;
			switch (text) {
				case TEXT_BACK:
					onClick = () => setYen(price, Math.floor(getYen(price) / 10));
					break;
				case TEXT_ENTER:
					onClick = () => {
						let unit = getYen(price);
						if (unit > 0) {
							addItem({
								qty: 1,
								unit: unit,
								tax: tax.value,
								discount: discount.value
							});
							setYen(price, 0);
						}
					};
					break;
				default:
					let n = parseInt(text);
					onClick = () => setYen(price, getYen(price) * 10 + n);
					break;
			}
			button.addEventListener("click", onClick);
		}
		setYen(price, 0);
		updateTotal();
	}
})();
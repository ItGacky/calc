(function() {
	const ID_TOTAL = "#total";
	const ID_ITEM = "#main .item";
	const ID_CALC = "#calc";
	const TEXT_BACK = "\u232B";
	const TEXT_ENTER = "\u23CE";
	const TEXT_YEN = "\u00A5";

	function getElement(id) {
		return document.querySelector(id);
	}

	function queryElements(node, conds) {
		let nodes = [];
		for (let cond of conds) {
			nodes.push(node.querySelector(cond));
		}
		return nodes;
	}

	function queryRadioValue(node, name) {
		return node.querySelector(`input[name=${name}]:checked`).value;
	}

	function calcItemTotal(qty, unit, tax, discount) {
		return qty * unit * (100 - discount) * (100 + tax) / 10000;
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
			const nth = items.length % 3;
			items.push(item);

			const node = itemTemplate.cloneNode(true);
			node.classList.add("nth" + nth);
			const [up, down, qty, unit, tax, sub] = queryElements(node, [".up", ".down", ".qty", ".unit", ".tax", ".sub"]);

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
			unit.innerText = toYen(Math.floor(item.unit * (100 - item.discount) / 100));
			tax.innerText = item.tax + "%";
			sub.innerText = toSubTotalYen(item);

			itemParent.prepend(node);
			itemParent.scrollTop = itemParent.scrollHeight;
			updateTotal();
		}

		const calc = getElement(ID_CALC);
		const [price, discount] = queryElements(calc, ["#price", "#discount"]);

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
								tax: parseInt(queryRadioValue(calc, "tax")),
								discount: parseInt(discount.value),
							});
							setYen(price, 0);
						}
					};
					break;
				default:
					let n = parseInt(text, 10);
					onClick = () => setYen(price, getYen(price) * 10 + n);
					break;
			}
			button.addEventListener("click", onClick);
		}
		setYen(price, 0);
		updateTotal();
	}
})();
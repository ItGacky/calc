(function() {
	const TEXT_BACK = "\u232B";
	const TEXT_ENTER = "\u23CE";
	const TEXT_YEN = "\u00A5";

	function parseBoolean(value) {
		return value === "1"; // XXX: for current usage in time
	}

	function queryElement(expr) {
		return document.querySelector(expr);
	}

	function queryElements(node, exprs) {
		let nodes = [];
		for (let expr of exprs) {
			nodes.push(node.querySelector(expr));
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

	function setItemValue(e, value) {
		if (value > 0) {
			e.innerText = value;
		} else {
			e.parentElement.style.display = "none";
		}
	}

	window.onload = function() {
		const itemTemplate = queryElement("#main .item");
		const items = itemTemplate.parentElement;
		items.removeChild(itemTemplate);

		const total_inc = queryElement("#total-inc");
		const total_exc = queryElement("#total-exc");
		const total_tax = queryElement("#total-tax");

		function updateTotal() {
			let sum_inc = 0;
			let sum_exc = 0;
			for (let item of items.querySelectorAll(".item")) {
				const { qty, unit, tax, discount } = item.data;
				sum_inc += calcItemTotal(qty, unit, tax, discount);
				sum_exc += calcItemTotal(qty, unit, 0, discount);
			}
			sum_inc = Math.floor(sum_inc);
			sum_exc = Math.floor(sum_exc);
			setYen(total_inc, sum_inc);
			setYen(total_exc, sum_exc);
			setYen(total_tax, sum_inc - sum_exc);
		}

		function addItem(unit_, tax_, discount_) {
			const data = {
				qty: 1,
				unit: unit_,
				tax: tax_,
				discount: discount_,
			};

			const node = itemTemplate.cloneNode(true);
			node.data = data;
			const [up, down, qty, unit, tax, discount, sub] = queryElements(node, [".up", ".down", ".qty", ".unit", ".tax span", ".discount span", ".sub"]);

			up.addEventListener("click", function() {
				data.qty += 1;
				down.disabled = false;
				qty.innerText = data.qty;
				sub.innerText = toSubTotalYen(data);
				updateTotal();
			});
			down.addEventListener("click", function() {
				data.qty -= 1;
				if (data.qty < 1) {
					down.disabled = true;
				}
				qty.innerText = data.qty;
				sub.innerText = toSubTotalYen(data);
				updateTotal();
			});
			qty.innerText = 1;
			unit.innerText = toYen(data.unit);
			setItemValue(discount, data.discount);
			setItemValue(tax, data.tax);
			sub.innerText = toSubTotalYen(data);

			items.prepend(node);
			items.scrollTop = items.scrollHeight;
			updateTotal();
		}

		const calc = queryElement("#calc");
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
							const tax = parseInt(queryRadioValue(calc, "tax"));
							if (parseBoolean(queryRadioValue(calc, "inc"))) {
								unit = Math.ceil(unit * 100 / (100 + tax));
							}
							addItem(unit, tax, parseInt(discount.value));
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
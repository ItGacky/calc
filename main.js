(function() {
	const TEXT_BACK = "\u232B";
	const TEXT_ENTER = "\u23CE";
	const TEXT_YEN = "\u00A5";

	function parseBoolean(value) {
		return value === "1"; // XXX: for current usage in time
	}

	function parseDecimal(text) {
		return parseInt(text, 10);
	}

	function setVisible(e, value) {
		e.style.display = (value ? "" : "none");
	}

	function setAnimation(e, style, onend) {
		if (e.style.animationName !== undefined) {
			e.addEventListener("animationend", onend);
			e.classList.add(style);
		} else {
			onend.call(e);
		}
	}

	function querySelectorEach(node, exprs) {
		const elems = [];
		for (let expr of exprs) {
			elems.push(node.querySelector(expr));
		}
		return elems;
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
		e.textContent = toYen(yen);
	}

	function setItemValue(e, value) {
		if (value > 0) {
			e.textContent = value;
		} else {
			setVisible(e.parentElement, false);
		}
	}

	window.onload = function() {
		const [
			itemTemplate,
			total_inc,
			total_exc,
			total_tax,
			calc,
			clear
		] = querySelectorEach(document, [
			"#items .item",
			"#total-inc",
			"#total-exc",
			"#total-tax",
			"#calc",
			"#clear"
		]);

		const items = itemTemplate.parentElement;
		items.removeChild(itemTemplate);

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

			const item = itemTemplate.cloneNode(true);
			item.data = data;
			const [
				up,
				down,
				remove,
				qty,
				unit,
				tax,
				discount,
				sub
			] = querySelectorEach(item, [
				".up",
				".down",
				".remove",
				".qty",
				".unit",
				".tax span",
				".discount span",
				".sub"
			]);

			function updateButtons() {
				const some = (data.qty > 0);
				setVisible(down.parentElement, !(down.disabled = !some));
				setVisible(remove.parentElement, !(remove.disabled = some));
			}

			up.addEventListener("click", () => {
				data.qty += 1;
				qty.textContent = data.qty;
				sub.textContent = toSubTotalYen(data);
				updateButtons();
				updateTotal();
			});
			down.addEventListener("click", () => {
				data.qty -= 1;
				qty.textContent = data.qty;
				sub.textContent = toSubTotalYen(data);
				updateButtons();
				updateTotal();
			});
			remove.addEventListener("click", () => {
				data.qty = 0;
				up.disabled = down.disabled = close.disabled = true;
				updateTotal();
				setAnimation(item, "fadeout", () => items.removeChild(item));
			});
			qty.textContent = 1;
			unit.textContent = toYen(data.unit);
			setItemValue(discount, data.discount);
			setItemValue(tax, data.tax);
			sub.textContent = toSubTotalYen(data);

			updateButtons();
			items.prepend(item);
			items.scrollTop = items.scrollHeight;
			updateTotal();
		}

		const unit = calc.querySelector("#unit");
		const buttons = calc.getElementsByTagName("button");
		for (let button of buttons) {
			const text = button.textContent;
			let onClick;
			switch (text) {
				case TEXT_BACK:
					onClick = () => setYen(unit, Math.floor(getYen(unit) / 10));
					break;
				case TEXT_ENTER:
					onClick = () => {
						let yen = getYen(unit);
						if (yen > 0) {
							const tax = parseDecimal(queryRadioValue(calc, "tax"));
							if (parseBoolean(queryRadioValue(calc, "inc"))) {
								yen = Math.ceil(yen * 100 / (100 + tax));
							}
							const discount = parseDecimal(queryRadioValue(calc, "discount"));
							addItem(yen, tax, discount);
							setYen(unit, 0);
						}
					};
					break;
				default:
					const n = parseDecimal(text);
					onClick = () => setYen(unit, getYen(unit) * 10 + n);
					break;
			}
			button.addEventListener("click", onClick);
		}
		setYen(unit, 0);
		updateTotal();

		clear.addEventListener("click", () => {
			items.textContent = "";
			updateTotal();
		});
	}
})();
(function() {
	const ID_CALC = "calc";
	const ID_PRICE = "price";
	const ID_TAX = "tax";
	const ID_DISCOUNT = "discount";
	const ID_TOTAL = "total";
	const ID_ITEM = "item";
	const TEXT_BACK = "\u232B";
	const TEXT_ENTER = "\u23CE";
	const TEXT_YEN = "\u005C";

	function getElement(id) {
		return document.getElementById(id);
	}

	function findChildren(e, children) {
		for (let child of e.childNodes) {
			let id = child.id;
			if (id && id in children) {
				children[id] = child;
			}
		}
	}

	function calcItemTotal(qty, price, tax, discount) {
		return qty * price * (1 - discount / 100) * (1 + tax / 100);
	}

	function toYen(yen) {
		return TEXT_YEN + String(yen).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
	}

	function getYen(e) {
		return e.value || 0;
	}

	function setYen(e, yen) {
		e.value = yen;
		e.innerText = toYen(yen);
	}

	let items = [];

	function updateTotal() {
		let sum = 0;
		for (let item of items) {
			sum += calcItemTotal(item.qty, item.price, item.tax, item.discount);
		}
		setYen(getElement(ID_TOTAL), Math.ceil(sum));
	}

	window.onload = function() {
		let itemTemplate = getElement(ID_ITEM);
		let itemParent = itemTemplate.parentElement;
		itemParent.removeChild(itemTemplate);

		function addItem(price, tax, discount) {
			let desc = {
				qty: 1,
				price: price,
				tax: tax,
				discount: discount
			};
			items.push(desc);
			let itemNode = itemTemplate.cloneNode(true);
			let attrs = {
				"item-up": null,
				"item-down": null,
				"item-qty": null,
				"item-price": null,
				"item-tax": null,
				"item-total": null
			};
			findChildren(itemNode, attrs);
			let down = attrs["item-down"];
			let qty = attrs["item-qty"];
			let total = attrs["item-total"];
			attrs["item-up"].addEventListener("click", function() {
				desc.qty += 1;
				down.disabled = false;
				qty.innerText = desc.qty;
				total.innerText = toYen(Math.ceil(calcItemTotal(desc.qty, desc.price, desc.tax, desc.discount)));
				updateTotal();
			});
			down.addEventListener("click", function() {
				desc.qty -= 1;
				if (desc.qty < 1) {
					down.disabled = true;
				}
				qty.innerText = desc.qty;
				total.innerText = toYen(Math.ceil(calcItemTotal(desc.qty, desc.price, desc.tax, desc.discount)));
				updateTotal();
			});
			qty.innerText = 1;
			attrs["item-price"].innerText = toYen(Math.ceil(price * (1 - discount / 100)));
			attrs["item-tax"].innerText = tax + "%";
			total.innerText = toYen(Math.ceil(calcItemTotal(1, price, tax, discount)));

			itemParent.appendChild(itemNode);

			updateTotal();
		}

		let calc = getElement(ID_CALC);
		let buttons = calc.getElementsByTagName("button");
		for (let button of buttons) {
			let text = button.innerText;
			let onClick;
			switch (text) {
				case TEXT_BACK:
					onClick = function() {
						let price = getElement(ID_PRICE);
						setYen(price, Math.floor(getYen(price) / 10));
					};
					break;
				case TEXT_ENTER:
					onClick = function() {
						let price = getElement(ID_PRICE);
						let tax = getElement(ID_TAX).value;
						let discount = getElement(ID_DISCOUNT).value;
						addItem(getYen(price), tax, discount);
						setYen(price, 0);
					};
					break;
				default:
					let n = parseInt(button.innerText);
					onClick = function() {
						let price = getElement(ID_PRICE);
						setYen(price, getYen(price) * 10 + n);
					};
					break;
			}
			button.addEventListener("click", onClick);
		}
		setYen(getElement(ID_PRICE), 0);
		updateTotal();
	}
})();
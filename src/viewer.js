module.exports = Viewer;

var BlocksView = require('./blocks-view');

function Viewer(opts) {
	if (!opts) opts = {};
	this.doc = opts.document || document.cloneNode();
	if (!this.doc.documentElement) {
		this.doc.appendChild(this.doc.createElement('html'));
		this.doc.documentElement.appendChild(this.doc.createElement('head'));
		this.doc.documentElement.appendChild(this.doc.createElement('body'));
	}
	var map = this.elementsMap = opts.elements || {};
	if (!map.fragment) map.fragment = {
		contents: {
			fragment: {
				spec: "block*"
			}
		},
		render: function renderFragment(doc, block) {
			return block.content.fragment || doc.createElement("div");
		}
	};

	this.plugins = opts.plugins || [];
	this.blocks = new BlocksView(this, opts);
	this.block = {data:{}, content:{}};
	var viewer = this;

	this.elements = Object.keys(map).map(function(key) {
		var el = map[key];
		if (!el.name) el.name = key;
		return el;
	}).sort(function(a, b) {
		return (a.priority || 0) - (b.priority || 0);
	});
}

Viewer.prototype.from = function(block, blocks, overrideType) {
	this.block = block;
	return this.blocks.from(block, blocks, overrideType);
};

Viewer.prototype.element = function(type) {
	if (!type) return;
	return this.elementsMap[type];
};

Viewer.prototype.render = function(block, opts) {
	var dom;
	if (typeof opts == "string") {
		opts = {type: opts};
		console.warn("view.render now expects opts.type, not string");
	}
	try {
		dom = this.blocks.render(block, opts);
	} catch(ex) {
		console.error(ex);
	}
	if (!dom || dom.nodeType != Node.ELEMENT_NODE) return dom;

	var type = (opts || {}).type || block.type;
	var el = this.element(type);
	if (!el.inplace) {
		dom.setAttribute('block-type', type);
		if (block.id != null) dom.setAttribute('block-id', block.id);
		else dom.removeAttribute('block-id');
	}

	if (block.focused) dom.setAttribute('block-focused', block.focused);
	else dom.removeAttribute('block-focused');

	return dom;
};


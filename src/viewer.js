module.exports = Viewer;

function Viewer(opts) {
	var modules = global.Pagecut && global.Pagecut.modules || {};
	var resolvers = this.resolvers = opts.resolvers || {};
	var elements = this.elements = opts.elements || {};

	Object.keys(modules).forEach(function(k) {
		modules[k](resolvers, elements);
	});
}

Viewer.prototype.resolve = function(thing) {
	var obj = {};
	if (typeof thing == "string") obj.url = thing;
	else obj.node = thing;
	var main = this;
	var syncBlock;
	Object.keys(this.resolvers).some(function(k) {
		syncBlock = main.resolvers[k](main, obj, function(err, block) {
			var oldDom = document.getElementById(syncBlock.id);
			if (!oldDom) return;
			if (err) {
				console.error(err);
				main.remove(oldDom);
			} else {
				if (syncBlock.focused) block.focused = true;
				else delete block.focused;
				main.replace(oldDom, block);
			}
		});
		if (syncBlock) return true;
	});
	if (syncBlock && !syncBlock.url) syncBlock.id = "id-" + Date.now();
	return syncBlock;
};

Viewer.prototype.render = function(block, edition) {
	var type = block.type;
	if (!type) throw new Error("Missing block type");
	var el = this.elements[type];
	if (!el) throw new Error("Missing element " + type);
	var renderFn = edition && el.edit || el.view;
	if (!renderFn) throw new Error("Missing render function for block type " + type);
	block = Object.assign({}, block);
	if (!block.data) block.data = {};
	if (!block.content) block.content = {};
	var node = renderFn.call(el, this, block);
	if (block.id && node) node.setAttribute('id', block.id);
	return node;
};

Viewer.prototype.merge = function(dom, content) {
	if (content) Object.keys(content).forEach(function(name) {
		var contentNode = dom.querySelector('[block-content="'+name+'"]');
		if (!contentNode) return;
		var val = content[name];
		if (!val.nodeType) contentNode.innerHTML = val;
		else contentNode.parentNode.replaceChild(val, contentNode);
	});
	return dom;
};

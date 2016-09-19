const {Plugin, NodeSelection} = require("prosemirror/dist/edit");
const {posFromDOM, DOMFromPos} = require("prosemirror/dist/edit/dompos");

function CoedPlugin(pm, options) {
	this.pm = pm;

	this.dragStart = this.dragStart.bind(this);
	this.dragStop = this.dragStop.bind(this);
	this.fixChange = this.fixChange.bind(this);

	pm.on.selectionChange.add(this.fixChange);

	pm.content.addEventListener("mousedown", this.dragStart);
	pm.content.addEventListener("mouseup", this.dragStop);
}

function selectNode(pm, node) {
	var pos = posFromDOM(node);
	var $pos = pm.doc.resolve(pos.pos);
	var after = $pos.nodeAfter;
	if (!after || !after.type.selectable) return;
	pm.setSelection(new NodeSelection($pos));
}

CoedPlugin.prototype.detach = function(pm) {
	if (pm.content) {
		pm.content.removeEventListener("mousedown", this.dragStart);
		pm.content.removeEventListener("mouseup", this.dragStop);
	}
	pm.on.selectionChange.remove(this.fixChange);
};

CoedPlugin.prototype.fixChange = function() {
	if (this.dragging) return;
	var rpos = this.pm.selection.$from;
	var nodePos, fromPos, coedType, level = rpos.depth;
	var inContent = false;
	var node;
	while (level >= 0) {
		node = rpos.node(level);
		if (!node) {
			console.info("no node at level", level);
			break;
		}
		coedType = node.type && node.type.coedType;
		if (coedType == "content") {
			inContent = true;
		} else if (coedType == "root") {
			// select root
			nodePos = rpos.before(level);
			if (!inContent) {
				this.pm.setNodeSelection(nodePos);
			}
			try {
				fromPos = DOMFromPos(this.pm, nodePos);
			} catch(ex) {
				// in which case it's useless to continue
				return;
			}
			break;
		}
		level--;
	}

	var dom;
	if (fromPos) {
		dom = fromPos.node;
		var offset = fromPos.offset;
		if (dom.nodeType == 1 && offset < dom.childNodes.length) {
			dom = dom.childNodes.item(offset);
		}
	}
	if (this.focused && this.focused != dom) {
		this.focused.removeAttribute("coed-focused");
		delete this.focused;
	}
	if (dom) {
		dom.setAttribute("coed-focused", 1);
		this.focused = dom;
	}
};

CoedPlugin.prototype.dragStart = function(e) {
	var dom = e.target;
	if (!dom) return;
	if (dom.nodeType == Node.TEXT_NODE) dom = dom.parentNode;
	var pos;
	try { pos = posFromDOM(dom); } catch(ex) {return;}
	var rpos = this.pm.doc.resolve(pos.pos);
	var level = rpos.depth;
	var node, coedType, inContent = false, inRoot = false, nodePos;
	while (level >= 0) {
		node = rpos.node(level);
		dom = dom.parentNode;
		coedType = node.type && node.type.coedType;
		if (coedType == "content") {
			return;
		} else if (coedType == "root") {
			inRoot = true;
			if (!inContent) {
				this.pm.setNodeSelection(rpos.before(level));
			}
			break;
		}
		level--;
	}
	if (!inRoot) return;
	this.dragging = true;
};

CoedPlugin.prototype.dragStop = function(e) {
	this.dragging = false;
};

module.exports = new Plugin(CoedPlugin);




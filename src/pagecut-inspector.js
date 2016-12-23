var Inspector = {};
global.Pagecut.elements.push(Inspector);
global.Pagecut.resolvers.push(inspectorResolver);

Inspector.name = "link";
Inspector.group = "block";

var StringType = {
	type: 'string'
};
var OptStringType = {
	type: ['string', 'null']
};

Inspector.properties = {
	id: OptStringType,
	originalType: Object.assign({default: "none"}, StringType),
	type:  Object.assign({default: "none"}, StringType),
	url: StringType,
	description: OptStringType,
	icon: OptStringType,
	thumbnail: OptStringType,
	size: OptStringType,
	width: OptStringType,
	height: OptStringType,
	duration: OptStringType,
	site: OptStringType,
	html: OptStringType
};

Inspector.required = ['url'];

Inspector.specs = {
	title: "inline<_>*",
	content: "block+"
};

function inspectorResolver(main, obj, cb) {
	var url = obj.url || obj.node && obj.node.getAttribute('block-url');
	if (!url) return;
	var block = main.cache.get(url);
	if (block) return block;
	(main.shared.inspector || defaultInspector)(url, function(err, info) {
		if (err) return cb(err);
		var block = {
			type: 'link',
			url: url,
			data: info,
			content: {
				title: info.title
			}
		};
		main.cache.set(url, block);
		cb(null, block);
	});
	return {
		type: 'link',
		data: {
			type: 'none'
		},
		content: {
			title: url
		}
	};
}

function defaultInspector(url, cb) {
	setTimeout(function() {
		cb(null, {url: url, title: url});
	});
}

Inspector.editRender = function(main, block) {
	var data = block.data;
	var node = document.createElement('div');
	if (block.type) node.setAttribute('block-type', block.type);
	if (block.url) node.setAttribute('block-url', block.url);
	node.innerHTML = '<header block-handle><a name="type"></a><a title="" target="_blank"></a><a name="preview"></a></header><div>\
<div block-content="title"></div><div block-content="content"></div>\
</div><aside><div><div></div><p></p></div><figure></figure></aside><script type="text/html"></script>';
	var link = node.querySelector('header > a[title]');

	link.setAttribute("title", data.site || "");
	if (data.type) node.setAttribute("type", data.type);
	if (data.originalType) node.setAttribute("original-type", data.originalType);
	if (data.id) node.setAttribute("id", data.id);
	if (data.url) link.setAttribute("href", data.url);
	if (data.icon) ensure(link, 'img', { src: data.icon });
	if (data.thumbnail) ensure(node.querySelector('figure'), 'img', { src: data.thumbnail });
	if (data.html) ensure(node, 'script', {type: 'text/html'}).textContent = data.html || '';

	var obj = {
		dimensions: formatDimensions(data.width, data.height),
		duration: formatDuration(data.duration),
		size: formatSize(data.size)
	};
	Object.keys(obj).forEach(function(key) {
		var span = document.createElement('span');
		span.setAttribute('title', key);
		span.innerHTML = obj[key] || "";
		obj[key] = span;
	});
	node.querySelector('aside > div > p').innerHTML = data.description || "";

	fill(node.querySelector('aside > div > div'), obj);
	main.merge(node, block.content);

	return node;
};

Inspector.viewRender = function(main, block) {
	var data = block.data;
	var content = block.content;
	if (data.type == "link") {
		var anchor = document.createElement('a');
		anchor.href = block.url;
		if (content.title) anchor.setAttribute('title', content.title.innerHTML);
		else anchor.removeAttribute('title');
		anchor.innerHTML = content.content && content.content.innerHTML || '';
		return anchor;
	} else if (data.html) {
		var div = document.createElement('div');
		for (var k in data) {
			if (k == 'html') continue;
			div.setAttribute('data-' + k, data[k]);
		}
		div.innerHTML = data.html;
		return div;
	} else {
		return Inspector.editRender(main, block);
	}
};

function ensure(parent, tag, atts) {
	var childs = parent.childNodes;
	var r = new RegExp("^" + tag + "$", "i");
	var node, child;
	for (var i=0; i < childs.length; i++) {
		child = childs[i];
		if (child.nodeType == Node.ELEMENT_NODE && r.test(child.nodeName)) {
			node = child;
			break;
		}
	}
	if (!node) {
		node = document.createElement(tag);
		parent.appendChild(node);
	}
	if (atts) Object.keys(atts).forEach(function(key) {
		node.setAttribute(key, atts[key]);
	});
	return node;
}

function fill(parent, props) {
	parent.innerHTML = "";
	Object.keys(props).forEach(function(name) {
		var val = props[name];
		parent.appendChild(val);
	});
}

function formatDimensions(w, h) {
	if (!w) return;
	if (!h) return w + 'px';
	return w + 'x' + h;
}

function formatDuration(d) {
	return d;
}

function formatSize(s) {
	if (!s) return;
	return Math.round(s / 1000) + "KB";
}

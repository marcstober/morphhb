/**
 * @fileOverview ElementMarkup is a markup component for OshbRead.
 * @version 1.0
 * @author David
 */
elementMarkup = function() {
	popup = window.popup;
	clickWord = window.clickWord,
	accentInterpretation = window.accentInterpretation;
	var timeoutID;
	// Sets up a span element.
	function spanElement(className) {
		var span = document.createElement('span');
		span.className = className;
		return span;
	}
	// Constructs the element for a seg.
	function segElement(className, content) {
		var span = document.createElement('span');
		span.className = className;
		span.appendChild(document.createTextNode(content));
		return span;
	}
	// Constructs the element for a note.
	function supElement(className, title, content) {
		var sup = document.createElement('sup');
		sup.className = className;
		if (title) {sup.title = title;}
		sup.appendChild(document.createTextNode(content));
		return sup;
	}
	// Constructs the element array for a word.
	function wordElement(word, lemmas) {
		var nodes = [], parts, i, place = 0,
			regex = /^[a-z]$/,
			span = document.createElement('span');
		// Content for the span. (11 instances of large, small or suspended letters.)
		var child = word.firstChild;
		while (child) {
			if (child.nodeType === 3) {
				parts = child.nodeValue.split("/");
				i = 0;
				while (i < parts.length) {
					if (lemmas[place]) {
						span.className = regex.test(lemmas[place]) ? "prefix" : "main";
					} else {
						span.className = "suffix";
					}
					if (parts[i]) {
						span.appendChild(document.createTextNode(parts[i]));
					}
					i++;
					if (i < parts.length) {
						place++;
						nodes.push(span);
						span = document.createElement('span');
					}
				}
				
			} else {
				span.appendChild(segElement(child.getAttribute('type'), child.firstChild.nodeValue));
			}
			child = child.nextSibling;
		}
		nodes.push(span);
		return nodes;
	}
	// Maintains the word data while setting up the handlers.
	var wordData = function() {
		var data = [], lim,
			accentForm = "prose";
		// Sets the word data.
		function setData(word) {
			var span = document.createElement('span'),
				lemmas = word.getAttribute('lemma').split("/"),
				words = wordElement(word, lemmas),
				morphs = "", langCode = "", i;
			span.className = "Hebrew";
			lim = words.length;
			if (word.hasAttribute('morph')) {
				langCode = word.getAttribute('morph').charAt(0);
				morphs = word.getAttribute('morph').substr(1).split("/");
			}
			for (i = 0; i < lim; i++) {
				data[i] = {};
				data[i].node = words[i];
				data[i].lemma = lemmas[i] ? lemmas[i] : "None";
				data[i].lang = langCode;
				data[i].morph = (morphs && morphs[i]) ? morphs[i] : "";
				data[i].accents = word.textContent.replace(/[\u05AF-\u05F4\/]/g, "");
				data[i].form = accentForm;
				span.appendChild(data[i].node);
			}
			return span;
		}
		// Event handlers for the word.
		function handlers(isDisjunctive) {
			var i;
			for (i = 0; i < lim; i++) {
				data[i].accentType = isDisjunctive ? "disjunctive" : "conjunctive";
				// Bypass the closure.
				(function(thisData) {
					data[i].node.onmouseover = function() {
						// console.log("clearing timeout " + t + "...");
						clearTimeout(timeoutID);
						popup.show(thisData);
					};
					data[i].node.onmouseout = function() {
						timeoutID = setTimeout(function() {
							if (popup.isMouseOver()) {
								return;
							}
							popup.hide();
						}, 100);
						// console.log("set timeout " + t);
					};
					data[i].node.onclick = function() {
						clickWord.show(thisData);
					}
				})(data[i]);
			}
		}
		return {
			setForm: function(form) {
				accentForm = form;
			},
			element: function(word) {
				return setData(word);
			},
			addAccent: function(accent) {
				for (var i = 0; i < lim; i++) {
					data[i].accents += accent;
				}
			},
			setHandlers: function(isDisjunctive) {
				handlers(isDisjunctive);
			}
		};
	}();
	// Constructs the element for a qere note.
	function qereElement(qere) {
		var child = qere.getElementsByTagName('rdg')[0].firstChild,
			span = document.createElement('span'), setLine = false;
		span.className = "qere";
		span.title = "qere";
		span.appendChild(segElement("punctuation", "\u00A0"));
		while (child) {
			if (child.nodeType === 3) {
				span.appendChild(segElement("punctuation", "\u00A0"));
			}
			switch (child.nodeName) {
				case 'w':
					span.appendChild(wordData.element(child));
					if (child.hasAttribute('n')) {
						setLine = child.getAttribute('n');
					} else {
						wordData.setHandlers();
					}
					break;
				case 'seg':
					span.appendChild(segElement("punctuation", child.firstChild.nodeValue));
					if (setLine) {
						wordData.addAccent(child.firstChild.nodeValue);
					}
			}
			child = child.nextSibling;
		}
		return {span: span, setLine: setLine};
	}
	// Starts a verse node & adds the verse number.
	function verseElement(verse) {
		var node = spanElement('verse'),
			osisID = verse.getAttribute('osisID'),
			fields = osisID.split('.');
		// Set the accent form for the verse.
		wordData.setForm(accentInterpretation.getForm(osisID));
		node.id = "v." + fields[2]; // Adds an id for verse selection.
		node.appendChild(supElement('verseNumber', '', fields[2]));
		node.appendChild(document.createTextNode('\u00A0'));
		return node;
	}
	// Retrieves the first element node.
	function elementNode(node) {
		var child = node.firstChild;
		while (child && child.nodeType !== 1) {
			child = child.nextSibling;
		}
		return child;
	}
	// Iterates the verse content for markup.
	function verseMarkup(verse) {
		// Starts the verse with verse number markup, then iterates.
		var verseNode = verseElement(verse),
			child = elementNode(verse),
			setLine = false;
		while (child) {
			if (child.nodeType === 3) {
				verseNode.appendChild(segElement("punctuation", " "));
			}
			switch (child.nodeName) {
				case 'w':
					if (setLine) {
						wordData.setHandlers(true);
						setLine = false;
					}
					verseNode.appendChild(wordData.element(child));
					if (child.hasAttribute('n')) {
						setLine = child.getAttribute('n');
					} else {
						wordData.setHandlers();
					}
					break;
				case 'seg':
					type = child.getAttribute('type');
					if (type === 'x-pe' || type === 'x-samekh') {
						verseNode.appendChild(segElement("mark", child.firstChild.nodeValue));
					} else {
						verseNode.appendChild(segElement("punctuation", child.firstChild.nodeValue));
						if (setLine) {
							wordData.addAccent(child.firstChild.nodeValue);
						}
					}
					break;
				case 'note':
					if (child.hasAttribute('n')) {
						verseNode.appendChild(supElement("note", child.firstChild.nodeValue, child.getAttribute('n')));
					} else if (child.hasAttribute('type')) {
						type = child.getAttribute('type');
						if (type === 'variant') {
							verseNode.appendChild(segElement("punctuation", " "));
							var qereOutput = qereElement(child);
							verseNode.appendChild(qereOutput.span);
							setLine = qereOutput.setLine ? qereOutput.setLine : setLine;
						} else if (type === 'alternative') {
							verseNode.appendChild(supElement("note", "alternative: " + child.getElementsByTagName('rdg')[0].firstChild.nodeValue, "*"));
						}
					} else {
						verseNode.appendChild(supElement("note", "alternative: " + child.firstChild.nodeValue, "*"));
					}
			}
			child = child.nextSibling;
		}
		wordData.setHandlers(true);
		return verseNode;
	}
	// Return the array of marked up lines.
	return function(verse) {
		return verseMarkup(verse);
	};
}();
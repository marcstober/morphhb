/**
 * @fileOverview Popup is a markup component for OshbRead.
 * @version 1.0
 * @author David
 */
popup = function() {
    // Interprets the accents.
    var accentInterpretation = window.accentInterpretation;
	var display = document.getElementById('display'),
		pop = document.createElement('div');
	pop.id = 'popup';
	document.getElementById('work').appendChild(pop);
    // Utility to find the position of an element.
    function position(element) {
        var pos = {top: 0, left: 0};
        while (element) {
            pos.top += element.offsetTop;
            pos.left += element.offsetLeft;  
            element = element.offsetParent;
        }
        return pos;
    }
	// Shows the popup.
	function showPopup(data) {
		// var url = "https://openscriptures.github.io/HebrewLexicon/HomeFiles/Lexicon.html"
		// TODO: configuration
		var url = "https://marcstober.github.io/HebrewLexicon/HomeFiles/Lexicon.html"
		url += "?lexID=" + data.lemma.replace(" ", "");
		var markup = "<ul>";
		markup += "<li class='lemma'><a href='" + url + "'>" + data.lemma + "</a></li>";
		markup += "<li class='morph'>" + data.morph + "</li>";
		markup += "<li class='accent'>" + accentInterpretation.interpret(data.accents, data.form, data.accentType) + "</li>";
		markup += "</ul>";
		pop.innerHTML = markup;
		var pos = position(data.node);
		pop.style.top = pos.top + data.node.offsetHeight - display.scrollTop + 'px';
		pop.style.left = pos.left + 'px';
		pop.style.display = 'block';
	}
	// Hides the popup.
	function hidePopup() {
		pop.style.display = 'none';
	}
	isMouseOver = false;
	pop.onmouseover = function() {
		isMouseOver = true;
	};
	pop.onmouseout = function() {
		isMouseOver = false;
	};
	return {
		show: function(data) {
			showPopup(data);
		},
		hide: function() {
			hidePopup();
		},
		isMouseOver: function() {
			return isMouseOver;
		}
	};
}();
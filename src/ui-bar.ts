/* Connect the UI bar */
const rightUiBar = $('<div id="right-ui-bar"></div>').insertAfter("#ui-bar");
rightUiBar.append('<div id="right-ui-bar-tray"><button id="right-ui-bar-toggle" tabindex="0" title="Toggle the Right UI bar" aria-label="Toggle the Right UI bar" type="button"></button></div>');
rightUiBar.append('<div id="right-ui-bar-body"></div>');

/* Attach the toggle button click. */
rightUiBar.find('#right-ui-bar-toggle').ariaClick({
		label : "Toggle the Right UI bar"
	}, function () {
		rightUiBar.toggleClass('stowed');
	});

/* Automatically show the contents of the RightSidebar passage in the right-ui-bar-body element. */
$(document).on(':passagerender', function (ev) {
	setPageElement('right-ui-bar-body', 'RightSidebar');
});

/*
	To have your code stow the bar use:
	<<addclass "#right-ui-bar" "stowed">>

	To unstow the bar use:
	<<removeclass "#right-ui-bar" "stowed">>
*/
$('#ui-bar').remove();
$(document.head).find('#style-ui-bar').remove();
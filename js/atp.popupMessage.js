/*atp.popupMessage.js
based on text wrap example by Darwin Grosse at http://cycling74.com/forums/topic/jsui-mgraphics-patch-a-day/

Features:

- rounded-rectangle backdrop with adjustable margin, color and corner radius
- customizable speech-bubble-style arrow on any side
- optional close button that hides the object with color adjustment
- text color adjustment
- auto-fitting of object box height (not just background) to the text
  taking into consideration text wrapping, margin and arrows

Notes:
- arrow message sets arrow. Has 3 arguments:
	1 - direction:
		0 = off
		1 = Left
		2 = Top
		3 = Right
		4 = bottom
	2 - size (length of arrow)
	3 - distance from origin (top or left)
	
- arrow width adjusted separately

- autoFitHeight: auto resize presentation mode object box to text when resized
  or text changed. Careful with this - I can't find a way to detect when we're
  in presentation mode, so if on, it will affect the presentation mode size and
  location of the object when in patching mode!

- sendFontList: you need to send it this message to get a list of fonts.
  Not done at loadbang by default.

To Do:

- when arrowDir = 4 (bottom), text box should snap to bottom of object box
  rather than top.

- keep text from hitting close button with small margin sizes

*/


this.inlets = 1;
this.outlets = 2;

mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

var myFont = "Arial";
var mySize = 14.0;
var myMessage = "";
var margin = 20;
var cornerRadius = 20;
var bottom;
var bottomPrev = 0;
var sw;
var edgeR;
var swPrev = 0;
var autoResize = 0; //set to 1 to automatically resize height of presentation_rect to fit full text
var closeButtonClick = 0;
var showCloseButton = 0;
var arrowSizeL, arrowSizeR, arrowSizeT, arrowSizeB;
var arrowSize;
var arrowDir = 0;
var showArrow = 0;
var arrowDir = 0;
var arrowWidth = 16;
var textColor = [1., 1., 1., 1.];
var bgColor = [0., 0., 0., 0.66667];
var closeButtonColor = [1., 1., 1., 1.];

// variables for the actual word wrapped drawing
var textHeight = 0;
var wrapText = new Array();

arrow(0,15,20);
updateSw();
mgraphics.redraw();

//function loadbang()
//{
	//sendFontList();
//}

function onclick(x,y,button,cmd,shift,capslock,option,ctrl){
	if (showCloseButton) {
		if (checkCloseButton(x,y)) {
			//user clicks close button
			closeButtonClick = 1;
			mgraphics.redraw();
		}
	}
}
//private. could be left public to permit "synthetic" events
onclick.local = 1;

function ondrag(x,y,button,cmd,shift,capslock,option,ctrl){
	if (showCloseButton) {
		if(closeButtonClick && !checkCloseButton(x,y) ) {
			//user clicked but moved mouse off button
			closeButtonClick = 0;
			mgraphics.redraw();
		} else if (!button && checkCloseButton(x,y) ) {
			//user releases mouse on close button
			box.message("hidden", 1);
			outlet(0, "hidden", 1);
			closeButtonClick = 0;
			mgraphics.redraw();
		}
	}
}
ondrag.local = 1;

function checkCloseButton(x,y) {
	//see if we're clicking on close button or not
	var a = 0;
	
	if ( (x > (edgeR-20-arrowSizeR)) && (x < (edgeR-arrowSizeR)) && (y < (20+arrowSizeT)) && (y > arrowSizeT) ) {
		a = 1;
	}
	
	return a;
}

function paint()
{
	updateSw();
	
	var textLocation;
	
	doWordWrap();
	
	bottom = Math.round(textHeight * wrapText.length+1.5*margin);
	
	if (autoResize) {
		if ((bottom != bottomPrev) || (sw != swPrev)){
			fitHeight("");
		}
	}
	
	with (mgraphics) {
		set_source_rgba(bgColor[0], bgColor[1], bgColor[2], bgColor[3]);
		rectangle_rounded(arrowSizeL, arrowSizeT, sw, bottom, cornerRadius, cornerRadius);
		fill();
		
		set_source_rgba(textColor[0], textColor[1], textColor[2], textColor[3]);
		select_font_face(myFont);
		set_font_size(mySize);
		
		// post(wrapText.length, textHeight, '\n');
		
		for (var i=0; i<wrapText.length; i++) {
			textLocation = textHeight * (i + 1);
			move_to(margin+arrowSizeL, textLocation+0.5*margin+arrowSizeT);
			text_path(wrapText[i]);
			fill();
		}

		if (showCloseButton) {
			//Close button circle
			ellipse(edgeR-20-arrowSizeR,2+arrowSizeT, 18, 18);
			set_line_width(1.5);
			set_source_rgba(closeButtonColor[0], closeButtonColor[1], closeButtonColor[2], closeButtonColor[3]*.75);
			stroke();
			
			//close button X
			set_source_rgba(closeButtonColor[0], closeButtonColor[1], closeButtonColor[2], closeButtonColor[3]);
			set_line_width(2);
			move_to(edgeR-15-arrowSizeR,7+arrowSizeT);
			line_to(edgeR-7-arrowSizeR,15+arrowSizeT);
			stroke();
			move_to(edgeR-7-arrowSizeR,7+arrowSizeT);
			line_to(edgeR-15-arrowSizeR,15+arrowSizeT);
			stroke();
			
			//highlight close button
			if (closeButtonClick) {
				ellipse(edgeR-20-arrowSizeR,2+arrowSizeT, 18, 18);
				set_source_rgba(closeButtonColor[0], closeButtonColor[1], closeButtonColor[2], closeButtonColor[3]*.25);
				fill();
			}
		} //showCloseButton
		
		if(showArrow) {
			//arrow drawing
			set_source_rgba(bgColor[0], bgColor[1], bgColor[2], bgColor[3]);
			if(arrowDir == 1) {
				move_to(arrowSizeL, arrowY - arrowWidth/2);
				line_to(0, arrowY);
				line_to(arrowSizeL, arrowY + arrowWidth/2);
			} else if (arrowDir == 2) {
				move_to(arrowX - arrowWidth/2, arrowSizeT);
				line_to(arrowX, 0);
				line_to(arrowX + arrowWidth/2, arrowSizeT);
			} else if (arrowDir == 3) {
				move_to(edgeR-arrowSizeR, arrowY - arrowWidth/2);
				line_to(edgeR, arrowY);
				line_to(edgeR-arrowSizeR, arrowY + arrowWidth/2);
			} else if (arrowDir == 4) {
				move_to(arrowX - arrowWidth/2, bottom);
				line_to(arrowX, bottom+arrowSizeB);
				line_to(arrowX + arrowWidth/2, bottom);
			}
			close_path();
			fill();
		}
		
	}
}

function setFont(v)
{
	myFont = v;
	mgraphics.redraw();
}

function setSize(v)
{
	mySize = myClip(v, 0.5, 200.0);
	mgraphics.redraw();
}

function setMessage(v)
{
	myMessage = v;
	mgraphics.redraw();
}

function sendFontList()
{
	var fl = mgraphics.getfontlist();
	outlet(1, "clear");
	
	for (var i=0; i<fl.length; i++) {
		outlet(1, "append", fl[i]);
	}
}

function myClip(v, mn, mx)
{
	return Math.min(mx, Math.max(mn, v));
}
myClip.local = 1;

// Here is a quick and dirty word wrapping function...
// improved by Arvid Tomayko 2014-06
function doWordWrap()
{
	var tmpText = null;
	var tmpString = null;
	
	wrapText = new Array();

	with (mgraphics) {
		select_font_face(myFont);
		set_font_size(mySize);
		
		var tm = text_measure(myMessage);
		textHeight = tm[1];	// set the text height.
		
		linesOfText = myMessage.split("\n"); //split by newlines
		
		var k;
		for (k=0; k<linesOfText.length;k++) { //support newlines in text input
			tm = text_measure(linesOfText[k]); //need to measure again
			if (tm[0] <= sw) {
				// good enough to print
				wrapText.push(linesOfText[k]);
			} else {
				// have to wrap
				tmpText = linesOfText[k].split(" ");
				tmpString = "";
				var st = 0;
				var en = -1;
				var i = 0; //change: init i
				
				while (i < tmpText.length) { //changed to a while loop
					tmpString += tmpText[i] + " ";
					tm = text_measure(tmpString);
					
					if (tm[0] > (sw - margin*2)) { //using a margin variable instead of hard coding it
						if (en == -1) {
							// a really big word - just print it
							wrapText.push(tmpString);
							st = ++i; //change: pre-increment i. was st = i+1;
							en = -1;
							tmpString = "";
						} else {
							tmpString = "";
							for (var j=st; j<=en; j++) {
								tmpString += tmpText[j] + " ";
							}
							wrapText.push(tmpString);
							tmpString = ""; //changed to clear string
							//was tmpString = tmpText[i] + " ";
							st = i;
							en = -1;
						}
					} else {
						en = i++; //change: increment i here
					}
				}
				// pick up the last line
				wrapText.push(tmpString);
			}
		}
	}
	
	gc();	// leave a clean campsite...
}		
doWordWrap.local = 1;

function setMargin(a) {
	margin = a;
	mgraphics.redraw();
}

function setCornerRadius(a) {
	cornerRadius = a;
	mgraphics.redraw();
}

function autoFitHeight(a) {
	autoResize = a;
}

function fitHeight(a) {
	//fit the height of the presentation mode object box 
	//(not just background) to the text
	
	var target;
	
	if (a === "patching") {
		target = "patching_rect";
	} else {
		target = "presentation_rect";
	}
	//tell someone about it:
	outlet(0, target, box.rect[0], box.rect[1], edgeR, bottom+arrowSizeB+arrowSizeT);
	bottomPrev = bottom;
	swPrev = sw;
	box.message(target, box.rect[0], box.rect[1], edgeR, bottom+arrowSizeB+arrowSizeT);
}

function closeButton(a) {
	//show/hide close button
	showCloseButton = a;
	mgraphics.redraw();
}

function updateSw() {
	edgeR = box.rect[2] - box.rect[0];
	sw = edgeR - arrowSizeL - arrowSizeR;
}

function arrow(dir, aSize, dist) {
	//set up arrow properties to use for drawing
	
	if (dir < 0) {
		arrowDir = 0;
	} else if (dir > 4) {
		arrowDir = 4;
	} else {
		arrowDir = dir;
	}
	
	if (dist < 0) {
		dist = 0;
	}
	
	arrowSize = aSize;
	
	if (dir == 0) {
		showArrow = 0;
		arrowSizeL = 0;
		arrowSizeT = 0;
		arrowSizeR = 0;
		arrowSizeB = 0;
		arrowX = 0;
		arrowY = 0;
	} else if (dir == 1) {
		showArrow = 1;
		arrowSizeL = aSize;
		arrowSizeT = 0;
		arrowSizeR = 0;
		arrowSizeB = 0;
		arrowX = 0;
		arrowY = dist;
	} else if (dir == 2) {
		showArrow = 1;
		arrowSizeL = 0;
		arrowSizeT = aSize;
		arrowSizeR = 0;
		arrowSizeB = 0;
		arrowX = dist;
		arrowY = 0;
	} else if (dir == 3) {
		showArrow = 1;
		arrowSizeL = 0;
		arrowSizeT = 0;
		arrowSizeR = aSize;
		arrowSizeB = 0;
		arrowX = 0;
		arrowY = dist;
	} else if (dir == 4) {
		showArrow = 1;
		arrowSizeL = 0;
		arrowSizeT = 0;
		arrowSizeR = 0;
		arrowSizeB = aSize;
		arrowX = dist;
		arrowY = 0;
	}
	mgraphics.redraw();
}

function setArrowWidth(a) {
	arrowWidth = a;
	mgraphics.redraw();
}

function bgcolor (r,g,b,a) {
	bgColor[0] = r;
	bgColor[1] = g;
	bgColor[2] = b;
	bgColor[3] = a;
	mgraphics.redraw();
}

function textcolor (r,g,b,a) {
	textColor[0] = r;
	textColor[1] = g;
	textColor[2] = b;
	textColor[3] = a;
	mgraphics.redraw();
}

function controlcolor (r,g,b,a) {
	closeButtonColor[0] = r;
	closeButtonColor[1] = g;
	closeButtonColor[2] = b;
	closeButtonColor[3] = a;
	mgraphics.redraw();
}
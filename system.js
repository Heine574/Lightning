function getMousePos( canvas, evt ) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: Math.floor( ( evt.clientX - rect.left ) / ( rect.right - rect.left ) * canvas.width ),
        y: Math.floor( ( evt.clientY - rect.top ) / ( rect.bottom - rect.top ) * canvas.height )
    };
}

l_bool = {
	val: false
}

/*
Status Codes:
200 = OK
201 = update and continue
202 = sleep and continue
203 = take input and continue
204 = start lightning and continue
205 = stop lightning and continue
206 = run x ticks, then continue
207 = go to mark x and continue
208 = mark this line and continue
209 = wait for file upload and continue

400 = log error and continue

*/

OS = {
	code_i: 0,
	vars: {
		'dollar': '$',
		'timeRef': new Date(),
		'font': StringExpression("15px sans-serif"),
		'keys': [],
		'wait': 0,
		'indent': NumExpression(5),
		'screen_height': NumExpression(360),
		'screen_width': NumExpression(480),
		'add': ScriptExpression(function(system, args) {
			try {return args[0].execute(system).add(system, args[1].execute(system));}
			catch(TypeError) {
				return Raise(system,
				"TypeError: operator '+' is undefined for type '" + args[0].execute(system).type + "'.").run(system);
			}
		}),
		'subtract': ScriptExpression(function(system, args) {
			try {return args[0].execute(system).subtract(system, args[1].execute(system));}
			catch(TypeError) {
				return Raise(system,
				"TypeError: operator '-' is undefined for type '" + args[0].execute(system).type + "'.").run(system);
			}
		}),
		'multiply': ScriptExpression(function(system, args) {
			try {return args[0].execute(system).multiply(system, args[1].execute(system));}
			catch(TypeError) {
				return Raise(system,
				"TypeError: operator '*' is undefined for type '" + args[0].execute(system).type + "'.").run(system);
			}
		}),
		'divide': ScriptExpression(function(system, args) {
			try {return args[0].execute(system).divide(system, args[1].execute(system));}
			catch(TypeError) {
				return Raise(system,
				"TypeError: operator '/' is undefined for type '" + args[0].execute(system).type + "'.").run(system);
			}
		}),
		'assign': ScriptExpression(function(system, args) {return AutoExp(system, system.vars[args[1].tag]=args[0].execute(system));}),
		'eval': ScriptExpression(function(system, args) {return ScriptExpression(eval(args[0].run(system))).run(system);}),
		'del_sprites': ScriptExpression(function(system, args) {system.sprites = [null]; return BoolExpression("True");}),
		'println': ScriptExpression(function(system, args) {
			//console.log(args[0].run(system));
			var a = args[0].run(system);
			if (typeof a == "string") {
				system.shell = system.shell.concat(a.split('\n'));
			} else {
				system.shell.push(a);
			}
			run_text(system);
			if (args.length > 1) {
				if (args[1].run(system) == true) {
					system.status = 201;
				}
			}
			else {
				system.status = 201;
			}
			return StringExpression(a);
		}),
		'sleep': ScriptExpression(function(system, args) {system.status = 202; return NumExpression(args[0].run(system));}),
		'clear': ScriptExpression(function(system, args) {
			var canvas = document.getElementById("canvas");
			var ctx = canvas.getContext("2d");
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle=system.sys_vars.background;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			return BoolExpression("True");
		}),
		'str': ScriptExpression(function(system, args) {return args[0].execute(system).str(system);}),
		'float': ScriptExpression(function(system, args) {return NumExpression(parseFloat(args[0].run(system)));}),
		'int': ScriptExpression(function(system, args) {return NumExpression(parseInt(args[0].run(system)));}),
		'list': ScriptExpression(function(system, args) {return ListExpression(args);}),
		'struct': ScriptExpression(function(system, args) {
			var t = {};
			for (var i = 0; i < args.length; i++) {
				t[args[i].execute(system).items[0].run(system)] = args[i].execute(system).items[1];
			}
			return StructExpression(t);
		}),
		'rgb': ScriptExpression(function(system, args) {
			//return NumExpression(((args[0].run(system)*65536)+(args[1].run(system)*256)+args[2].run(system)));
			return StringExpression(rgb(args[0].run(system), args[1].run(system), args[2].run(system)));
		}),
		'run': ScriptExpression(function(system, argsList) {
			var exp = {
				type: "Expression",
				func: (argsList[0].type == "TagExpression") ? argsList[0]:argsList[0].execute(system),
				args: argsList.slice(1, argsList.length),
				run: function(system) {
					//console.log(this.func);
					d = run_function(system, this.func, this.args);
					//console.log(d);
					try {
						return d.run(system);
					}
					catch (TypeError) {
						run_function(system, TagExpression("println"), [StringExpression("TypeError: expression " + this.func.tag + " returned unexpected value " + d + ".")]);
						return undefined;
					}
				},
				execute: function(system, args) {
					return run_function(system, this.func, this.args);
				}
			}
			return exp.execute(system);
		}),
		'Sprite': ScriptExpression(function(system, args) {
			return StructExpression({
				x: args[0].execute(system),
				y: args[1].execute(system),
				direction: args[2].execute(system),
				costume: args[3].run(system),
				script: args[4].run(system),
				shown: args[5].execute(system),
				size: args[6].execute(system)
			});
		}),
		'hide': ScriptExpression(function(system, args) {
			system.sprites[args[0].run(system)].items.shown = BoolExpression("False");
			return AutoExp(system, "True");
		}),
		'show': ScriptExpression(function(system, args) {
			system.sprites[args[0].run(system)].items.shown = BoolExpression("True");
			return AutoExp(system, "True");
		}),
		'load': ScriptExpression(function(system, args) {
			system.sprites.push(args[0].execute(system));
			return AutoExp(system, "True");
		}),
		'image': ScriptExpression(function(system, args) {
			for (var i = 0; i < args.length; i++) {
				args[i] = args[i].run(system);
			}
			return {
				type: "Image",
				value: args.slice(0, args.length),
				run: function(system) {return this;},
				execute: function(system, args) {return this;},
				str: function(system, args) {return this;}
			};
		}),
		'box': ScriptExpression(function(system, args) {
			for (var i = 0; i < args.length; i++) {
				args[i] = args[i].execute(system);
			}
			return {
				type: "Box",
				coords: args.slice(0, 4),
				fillcolor: args[4].execute(system),
				run: function(system) {return this;},
				execute: function(system, args) {return this;},
				str: function(system, args) {return this;}
			}
		}),
		'text': ScriptExpression(function(system, args) {
			for (var i = 0; i < args.length; i++) {
				args[i] = args[i].execute(system);
			}
			return {
				type: "Text",
				text: args[0].execute(system),
				coords: args.slice(1, 3),
				align: args[3].execute(system),
				fillcolor: args[4].execute(system),
				font: args[5].execute(system),
				run: function(system) {return this;},
				execute: function(system, args) {return this;},
				str: function(system, args) {return this.text.run(system);}
			}
		}),
		'polygon': ScriptExpression(function(system, args) {
			for (var i = 0; i < args.length; i++) {
				args[i] = args[i].execute(system);
			}
			return {
				type: "Polygon",
				coords: args.slice(2, args.length),
				edgecolor: args[0].execute(system),
				fillcolor: args[1].execute(system),
				run: function(system) {return this;},
				execute: function(system, args) {return this;},
				str: function(system, args) {return this;}
			}
		}),
		'bitmap': ScriptExpression(function(system, args) {
			console.log(args);
			console.log(system.vars["data"]);
			for (var i = 0; i < args.length; i++) {
				args[i] = args[i].execute(system);
			}
			
			var data = args[0].run(system);
			var arrayBufferView = new Uint8Array(data);
			console.log(args[0]);
			console.log(arrayBufferView);
			//data = data.replace(/\\"/g, '"');

			var DOMURL = window.URL || window.webkitURL || window;

			var bmpimg = new Image();
			var bmp = new Blob([arrayBufferView], {type: 'image/png'});
			var url = DOMURL.createObjectURL(bmp);
			
			bmpimg.onload = function() {
				DOMURL.revokeObjectURL(url);
			}
			
			bmpimg.src = url;
			
			return {
				type: "BitmapImage",
				coords: args.slice(1, 3),
				img: bmpimg,
				run: function(system) {return this;},
				execute: function(system, args) {return this;},
				str: function(system, args) {return this;}
			}
		}),
		'svg': ScriptExpression(function(system, args) {
			for (var i = 0; i < args.length; i++) {
				args[i] = args[i].execute(system);
			}
			
			var data = args[0].run(system);
			//data = data.replace(/\\"/g, '"');

			var DOMURL = window.URL || window.webkitURL || window;

			var svgimg = new Image();
			var svg = new Blob([data], {type: 'image/svg+xml'});
			var url = DOMURL.createObjectURL(svg);
			
			svgimg.onload = function() {
				DOMURL.revokeObjectURL(url);
			}
			
			svgimg.src = url;
			
			return {
				type: "SVGImage",
				coords: args.slice(1, 3),
				img: svgimg,
				run: function(system) {return this;},
				execute: function(system, args) {return this;},
				str: function(system, args) {return this;}
			};
		}),
		'input': ScriptExpression(function(system, args) {
			var data = system.vars.println.execute(system, args);
			system.status = 203;
			return data;
		}),
		'function': ScriptExpression(function(system, args) {
			return FunctionExpression(args[0], args.slice(1, args.length));
		}),
		'index': ScriptExpression(function(system, args) {return args[1].execute(system).items[args[0].run(OS)];}),
		'attribute': ScriptExpression(function(system, args) {return args[1].execute(system)[args[0].run(OS)];}),
		'edit_index': ScriptExpression(function(system, args) {
			return AutoExp(system, args[1].execute(system).items[args[0].run(OS)] = args[2]);
		}),
		'run_lightning': ScriptExpression(function(system, args) {
			system.status = 204;
			return AutoExp(system, "True");
		}),
		'stop_lightning': ScriptExpression(function(system, args) {
			system.status = 205;
			return AutoExp(system, "True");
		}),
		'wait': ScriptExpression(function(system, args) {
			system.status = 206;
			return args[0];
		}),
		'fps': ScriptExpression(function(system, args) {
			return AutoExp(system, system.fps = args[0].run(system));
		}),
		'gradient': ScriptExpression(function(system, args) {
			var l = args[4].execute(system).keys();
			var c=document.getElementById("canvas");
			var ctx=c.getContext("2d");
			var grad=ctx.createLinearGradient(args[0].run(system),args[1].run(system),args[2].run(system),args[3].run(system));
			for (var i = 0; i < l.length; i++) {
				grad.addColorStop(parseFloat(l[i]),args[4].execute(system).items[l[i]].run(system));
			}
			return {
				type: "GradientExpression",
				gradient: grad,
				run: function(system) {return this.gradient},
				execute: function(system, args) {return this}
			};
		}),
		'goto_mark': ScriptExpression(function(system, args) {
			system.status = 207;
			return args[0];
		}),
		'mark': ScriptExpression(function(system, args) {
			system.status = 208;
			return args[0];
		}),
		'if': ScriptExpression(function(system, args) {
			if (args[0].run(system)) {
				return args[1].execute(system);
			} else {
				return AutoExp(system, "False");
			}
		}),
		'greater_than': ScriptExpression(function(system, args) {
			var b = args[0].run(system) > args[1].run(system);
			return BoolExpression((b ? "True" : "False"));
		}),
		'lesser_than': ScriptExpression(function(system, args) {
			var b = args[0].run(system) < args[1].run(system);
			return BoolExpression((b ? "True" : "False"));
		}),
		'equal': ScriptExpression(function(system, args) {
			var b = args[0].run(system) = args[1].run(system);
			return BoolExpression((b ? "True" : "False"));
		}),
		'fetch': ScriptExpression(function(system, args) {
			console.log(args, args.length);
			if (args.length == 1) {
				return StringExpression(get(args[0].run(system)));
			} else if (args.length == 4) {
				system.vars[args[3].run(system)] = "wait";
				get(
					args[0].run(system),
					[],
					true,
					args[1].run(system),
					args[2].run(system),
					system,
					args[3].run(system)
				);
				system.status = 209;
				console.log(args[3].run(system), system.vars[args[3].run(system)]);
				return args[3];
			}
			
		}),
		'save_file': ScriptExpression(function(system, args) {
			system.files[args[0].run(system)] = args[1].run(system);
			return AutoExp(system, "True");
		}),
		'load_file': ScriptExpression(function(system, args) {
			return StringExpression(open_file(system, args[0].run(system)));
		}),
		'import': ScriptExpression(function(system, args) {
			//console.log(args[0]);
			var data = open_file(system, args[0].run(system));
			var ccode = compile(system, data, ';');
			if (ccode != null) {
				for (var i = 0; i < ccode.length; i++) {
					system.tasks.splice(system.code_i+1+i, 0, ccode[i]);
				}
			}
			return AutoExp(system, "True");

		}),
		'printcolor': ScriptExpression(function(system, args) {
			system.sys_vars.printcolor = args[0].run(system);
			return AutoExp(system, "True");
		}),
		'background': ScriptExpression(function(system, args) {
			system.sys_vars.background = args[0].run(system);
			return AutoExp(system, "True");
		}),		
		'len': ScriptExpression(function(system, args) {
			var l = args[0].execute(system).items;
			return NumExpression(l.length);
		}),
		'load_sound': ScriptExpression(function(system, args) {
			var audio = new Audio(args[0].run(system));
			return {
				type: "Sound",
				data: audio,
				run: function(system, args) {return this},
				execute: function(system, args) {return this}
			};
		}),
		'play_sound': ScriptExpression(function(system, args) {
			var audio = open_file(system, args[0].run(system));
			audio.data.play();
			return BoolExpression("True");
		}),
		'': ScriptExpression(function(system, args) {}),
		'': ScriptExpression(function(system, args) {}),
		'': ScriptExpression(function(system, args) {}),
		'': ScriptExpression(function(system, args) {}),
		'': ScriptExpression(function(system, args) {}),

	},
	sys_vars: {},
	files: {
		
	},
	sprites: [null],
	images: [null],
	svgImages: {},
	tasks: [],
	stack: [],
	lKeys: ['wait'],
	run_lightning: false,
	isTopSystem: true,
	oldshell: [],
	shell: [],
	marks: {},
	objects: {},
	fps: 16,
	timeout: 0,
	status: 200,
	sys_info: [],
	display_tasks: function() {
		var t = [];
		for (var i = 0; i < this.tasks.length; i++) {
			t.push(this.tasks[i].ref);
		}
		return t.join("\n");
	}
};

document.getElementById("canvas").addEventListener('mousemove', function(evt) {
    var mousePos = getMousePos(canvas, evt);
	OS.vars['mouseX'] = mousePos.x - 240;
	OS.vars['mouseY'] = 360 - (mousePos.y + 180);
} );

var mouseDown = false;
document.getElementById("canvas").onmousedown = function() { 
  mouseDown = true;
  OS.vars['mouseDown'] = mouseDown.toString();
}
document.getElementById("canvas").onmouseup = function() {
  mouseDown = false;
  OS.vars['mouseDown'] = mouseDown.toString();
}

function getKey(charCode) {
	var charStr;
	var specialChars = {16:"SHIFT", 17:"CTRL", 18:"ALT", 13:"ENTER", 46:"DEL", 8:"BCKSPACE", 37:"LEFT", 38:"UP", 39:"RIGHT", 40:"DOWN", 186:";", 187:"=", 189:"-", 222:"'"}
	if (charCode in specialChars) {
		charStr = specialChars[charCode];
	}
	else {
		charStr = String.fromCharCode(charCode);
	}
	return charStr;
}

document.onkeydown = function(evt) {
    evt = evt || window.event;
    var charCode = evt.keyCode || evt.which;
    var charStr = getKey(charCode);
	if (OS.vars.keys.indexOf(charStr) == -1) {
		OS.vars.keys.push(charStr);
	}
};

document.onkeyup = function(evt) {
    evt = evt || window.event;
    var charCode = evt.keyCode || evt.which;
    var charStr = getKey(charCode);
	while (OS.vars.keys.indexOf(charStr) > -1) {
		OS.vars.keys.splice(OS.vars.keys.indexOf(charStr), 1);
	}
};

/*setInterval(function() {
var vars = "";
		vars = OS.vars.keys + "<br>";
		for (var i in OS.sprites) {
			vars += "Sprite " + i + ": " + OS.sprites[i] + "<br>";
		}
		
		document.getElementById("data").innerHTML = vars;
	}, 100);*/

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgb(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function toRadians(angle) {
  return angle * (Math.PI / 180);
}

function resizeScreen(system, canvas) {
	var ratio = window.innerWidth/window.innerHeight
	canvas.width = system.vars.screen_height.run(system)*ratio;
    canvas.height = system.vars.screen_height.run(system);
	system.vars.screen_width = NumExpression(system.vars.screen_height.run(system)*ratio);
}

function run_text(system) {
	var canvas = document.getElementById("canvas");
	var ctx = canvas.getContext("2d");
	resizeScreen(system, canvas);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle=system.sys_vars.background;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	//console.log(system.vars["font"]);
	ctx.font = system.vars["font"].string;
	ctx.fillStyle=system.sys_vars.printcolor;
	var spacing = parseInt(system.vars["font"].string.split(" ")[0].replace("px", ""));
	var text_y = canvas.height - spacing/2;
	for (i = system.shell.length - 1; i >= 0; i--) {
		ctx.fillText(system.shell[i], 10, text_y);
		text_y -= spacing;
	}
}

function Shift(ch) {
	var keyMap = {
		"1":"!",
		"2":"@",
		"3":"#",
		"4":"$",
		"5":"%",
		"6":"^",
		"7":"&",
		"8":"*",
		"9":"(",
		"0":")",
		";":":",
		"'":'"',
		"=":"+",
		"-":"_",
	};
	if (ch in keyMap) {
		return keyMap[ch];
	}
	else {
		return ch;
	}
}

function input(system, txt, a, lastkey, lkt) {
	var specialChars = ["SHIFT", "CTRL", "ALT", "ENTER", "DEL", "BCKSPACE", "LEFT", "UP", "RIGHT", "DOWN"]
	keys = system.vars.keys;
	if (keys.indexOf(lastkey) == -1) {
		lastkey = "";
	}
	if (system.vars.keys.length > 0) {
		if (keys.indexOf("ENTER") > -1) {
			system.vars.answer = StringExpression(a);
			setTimeout(run, 1, system, null);
		}
		else {
			var t = 1;
			if (keys.indexOf("SHIFT") > -1) {
				if (keys.indexOf("SHIFT") + 1 < keys.length) {
					if (specialChars.indexOf(keys[keys.indexOf("SHIFT")+1]) == -1) {
						if (keys[keys.indexOf("SHIFT")+1] != lastkey) {
							a += Shift(keys[keys.indexOf("SHIFT")+1]);
							lastkey = keys[keys.indexOf("SHIFT")+1];
						}
					}
				}
			}
			else if (keys.indexOf("BCKSPACE") > -1) {
				a = a.slice(0, -1);
				t = 100;
			}
			else if (specialChars.indexOf(keys[0]) == -1 && keys[0] != lastkey) {
				a += keys[0].toLowerCase();
				lastkey = keys[0];
			}
			//console.log(txt, a);
			system.shell[system.shell.length-1] = txt + a + "|";
			run_text(system);
			setTimeout(input, t, system, txt, a, lastkey);
		}
	}
	else {
		setTimeout(input, 1, system, txt, a, lastkey);
	}
}

function lightning(system) {
	var canvas = document.getElementById("canvas");
	var ctx = canvas.getContext("2d");
	ctx.setTransform(1,0,0,1,0,0);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	var img;
	var shape;
	var data;
	var size;
	for (var i = 1; i < system.sprites.length; i++) {
		if (system.sprites[i] != null && system.sprites[i].items.shown.run(system)) {
			ctx.setTransform(1,0,0,1,
			canvas.width/2 + system.sprites[i].items.x.run(system),
			canvas.height/2 + (-(system.sprites[i].items.y.run(system)))
			);
			ctx.rotate(system.sprites[i].items.direction.run(system)*Math.PI/180);
			size = system.sprites[i].items.size.run(system);
			ctx.scale(size,size);
			img = system.sprites[i].items.costume.value;
			//console.log(system.sprites[i]);
			for (var v = 0; v < img.length; v++) {
				shape = img[v];
				if (shape.type == "Box") {
					ctx.fillStyle=shape.fillcolor.run(system);
					ctx.fillRect(
					shape.coords[0].run(system),
					shape.coords[1].run(system),
					shape.coords[2].run(system)-shape.coords[0].run(system),
					shape.coords[3].run(system)-shape.coords[1].run(system)
					);
				} else if (shape.type == "Polygon") {
					ctx.fillStyle=shape.fillcolor.run(system);
					//ctx.strokeStyle=shape.edgecolor.run(system);
					ctx.moveTo(shape.coords[0].run(system), shape.coords[1].run(system));
					ctx.beginPath();
					for (var e = 2; e < shape.coords.length; e+=2) {
						ctx.lineTo(shape.coords[e].run(system), shape.coords[e+1].run(system));
					}
					ctx.fill();
				} else if (shape.type == "BitmapImage") {
					ctx.drawImage(shape.img, shape.coords[0].run(system), shape.coords[1].run(system));
				} else if (shape.type == "SVGImage") {
					ctx.drawImage(shape.img, shape.coords[0].run(system), shape.coords[1].run(system));
				} else if (shape.type == "Text") {
					ctx.fillStyle=shape.fillcolor.run(system);
					ctx.font=shape.font.run(system);
					ctx.textAlign=shape.align.run(system);
					ctx.fillText(
						shape.text.run(system),
						shape.coords[0].run(system),
						shape.coords[1].run(system),
						system.vars.screen_width.run(system)
					);
				}
			}
			if (system.sprites[i].items.script != "none") {
				data = system.sprites[i].items.script.execute(system, [system.sprites[i]]);
			}
		}
	}
	ctx.setTransform(1,0,0,1,0,0);
	
	setTimeout(run, (1 / system.fps) * 1000, system, null);
}

function run(system, ccode) {
	if (ccode != null) {
		for (var i = 0; i < ccode.length; i++) {
			system.tasks.push(ccode[i]);
		}
		//console.log(ccode);
	}
	if (system.wait > 0) {
		system.wait -= 1;
		lightning(system);
	}
	else {
		//var ID = Math.random();
		//var canvas = document.getElementById("canvas");
		//var ctx = canvas.getContext("2d");
		while (system.tasks.length > system.code_i || (system.run_lightning.val && system.isTopSystem)) {
			if (system.status == 200) {
				data = system.tasks[system.code_i].run(system);
				system.code_i++;
				//console.log(system.status, ID);
			}
			if (system.status == 201) {//update
				system.status = 200;
				setTimeout(run, 0, system, null); //replace later
				break;
			}
			if (system.status == 202) {//sleep
				system.status = 200;
				setTimeout(run, (data) * 1000, system, null); //replace later
				break;
			}
			if (system.status == 203) {//input
				system.status = 200;
				//system.shell.push(data);
				run_text(system);
				setTimeout(input, 1, system, system.shell[system.shell.length-1], "", "");
				break;
			}
			if (system.status == 204) {//start lightning
				system.status = 200;
				system.run_lightning = true;
			}
			if (system.status == 205) {//stop lightning
				system.status = 200;
				system.run_lightning = false;
			}
			if (system.status == 206) {//wait lightning
				system.status = 200;
				system.wait = data-1;
				lightning(system);
				break;
			}
			if (system.status == 207) {//goto mark
				system.status = 200;
				system.code_i = system.marks[data];
			}
			if (system.status == 208) {//mark line
				system.status = 200;
				system.marks[data] = system.code_i;
			}
			if (system.status == 209) {//asynchronous fetch
				console.log(data);
				console.log(system.vars[data]);
				if (system.vars[data] != "wait" || system.timeout > 20) {system.status = 200; system.timeout = 0;}
				else {
					system.timeout++;
					setTimeout(run, 100, system, null); //replace later
					break;
				}
			}
			
			/*if (system.run_lightning) {
				lightning(system);
				break;
			}*/
		}
	}
}

function run_function(system, func, args) {
	exe_func = func.execute(system);
	//console.log(func, args);
	//console.log(exe_func);
	//console.log(args)
	/*try {
		return exe_func(system, args);
	}
	catch(TypeError) {
		//return system.vars.println.run(system)(system, [StringExpression("ReferenceError: " + func.tag + " is not defined.")]);
	}*/
	return exe_func.execute(system, args);
}

function sleep(ms) {
    var date = new Date();
    var curDate = null;
    do { curDate = new Date(); }
    while(curDate-date < ms);
}

function start(system, file) {
	var ccode = compile(system, open_file(system, file), ";");
	run(system, ccode);
	//console.log(ccode);
	if (system.status == 301) {
		var inf = system.sys_info;
		setTimeout(compile_and_run, 1000, inf[0], inf[1], inf[2]);
	}
}

function compile(system, code, sep) {
	var pcode = [];
	var ccode = "";
	var t_code = code.replace(/\r\n/g, "\n").replace(/	/g, " ".repeat(system.vars.indent.run(system)));
	code = "";
	var string = false;
	for (var i = 0; i < t_code.length; i++) {
		if (t_code[i] == '"' && t_code[i-1] != '\\') {
			string = !string;
		}
		if ((t_code[i] != " " && t_code[i] != "\n") && !string) {
			if (t_code[i] == sep) {
				code += "|-|NEW_LINE|-|";
			}
			else {
				code += t_code[i];
			}
		}
		else if (string) {
			code += t_code[i];
		}
	}
	code = code.split("|-|NEW_LINE|-|");
	//console.log(code);
	
	for (var i = 0; i < code.length; i++) {
		if (code[i][0] != "#") {
			pcode.push(parse(system, code[i]));
		}
	}
	
	ccode = [];
	for (var i = 0; i < pcode.length; i++) {
		ccode.push(compile_obj(system, pcode[i]));
	}
	
	return ccode;
}

function compile_obj(system, pcode) {
	var exp = {
		type: "Expression",
		func: null,
		args: [],
		run: function(system) {
			//console.log(this.func);
			d = run_function(system, this.func, this.args);
			//console.log(d);
			try {
				return d.run(system);
			}
			catch (TypeError) {
				run_function(system, TagExpression("println"), [StringExpression("TypeError: expression " + this.func.tag + " returned unexpected value " + d + ".")]);
				return undefined;
			}
		},
		execute: function(system, args) {
			return run_function(system, this.func, this.args);
		}
	}
	
	//console.log(pcode, typeof(pcode));
	
	if (typeof(pcode) == "undefined") {
		return "";
	}
	else if (typeof(pcode) != "string") {
		exp.func = compile_obj(system, pcode[0])
		pcode.splice(0, 1);
		for (var i = 0; i < pcode.length; i++) {
			exp.args.push(compile_obj(system, pcode[i]));
		}
		return exp
	}
	else if (pcode[0] == '"' && pcode[pcode.length-1] == '"') {
		return StringExpression(pcode.slice(1, -1));
		/*{
			type: "StringExpression",
			string: pcode.slice(1, -1),
			run: function(system) {
				return this.string;
			},
			execute: function(system, args) {return this;}
		};*/
	}
	else if (!isNaN(parseFloat(pcode))) {
		return NumExpression(pcode);
		/*{
			type: "NumExpression",
			num: parseFloat(pcode),
			run: function(system) {
				return this.num;
			},
			execute: function(system, args) {return this;}
		};*/
	}
	else if (pcode == "True" || pcode == "False") {
		return BoolExpression(pcode);
		/*{
			type: "BoolExpression",
			bool: (pcode == "True") ? true:false,
			run: function(system) {
				return this.bool;
			},
			execute: function(system, args) {return this;}
		};*/
	}
	else {
		return TagExpression(pcode);
		/*{
			type: "TagExpression",
			tag: pcode,
			run: function(system) {
				return get_var(system, this.tag).run(system);
			},
			execute: function(system, args) {return this;}
		};*/
		//return pcode;
	}
}

function get_var(system, tag) {
	//console.log(tag);
	if (system.vars[tag] != undefined) {
		return system.vars[tag];
	}
	else {
		
		return Raise(system, "ReferenceError: " + tag + " is not defined.");
	}
}

function Raise(system, error) {
	var exp = {
		type: "Expression",
		func: TagExpression("println"),
		args: [StringExpression(error)],
		run: function(system) {
			d = run_function(system, this.func, this.args);
			try {
				return d.run(system);
			}
			catch (TypeError) {
				run_function(system, TagExpression("println"), [StringExpression("TypeError: expression " + this.func.tag + " returned unexpected value " + d + ".")]);
				return undefined;
			}
		},
		execute: function(system, args) {
			return run_function(system, this.func, this.args);
		}
	}
	return exp;
}

function AutoExp(system, i) {
	if (i[0] == '"' && i[i.length-1] == '"') {
		return StringExpression(i.slice(1, -1))
		/*{
			type: "StringExpression",
			string: i.slice(1, -1),
			run: function(system) {
				return this.string;
			},
			execute: function(system, args) {return this;}
		};*/
	}
	else if (!isNaN(parseFloat(i))) {
		return NumExpression(i);
		/*{
			type: "NumExpression",
			num: parseFloat(i),
			run: function(system) {
				return this.num;
			},
			execute: function(system, args) {return this;}
		};*/
	}
	else if (i == "True" || i == "False") {
		return BoolExpression(i);
		/*{
			type: "BoolExpression",
			bool: (i == "True") ? true:false,
			run: function(system) {
				return this.bool;
			},
			execute: function(system, args) {return this;}
		};*/
	}
	else if (i in system.vars) {
		return TagExpression(i);
		/*{
			type: "TagExpression",
			tag: i,
			run: function(system) {
				return get_var(system, this.tag).run(system);
			},
			execute: function(system, args) {return this;},
			str: function(system, args) {return StringExpression(this.tag);}
		};*/
		//return i;
	}
	else {
		return StringExpression("");
	}
}

function StringExpression(str) {
	return {
		type: "StringExpression", string: str, run: function(system) {return this.string;},
		execute: function(system, args) {return this;}, str: function(system) {return this;},
		add: function(system, v) {
			if (v.type == "StringExpression") {
				return StringExpression(this.string + v.string)
			}
		}};
}

function StructExpression(keyList) {
	return {type: "StructExpression", items: keyList, run: function(system) {
		return this.items;
	},
	keys: function(system) {
		var keys = [];
		for (var key in this.items) {
			keys.push(key);
		}
		return keys;
	},
	execute: function(system, args) {return this;},
	str: function(system) {
		var s = "{";
		var k = this.keys(system);
		for (var i = 0; i < k.length-1; i++) {
			s += k[i] + ": " + this.items[k[i]] + ", "
		}
		s += k[i] + ": " + this.items[k[i]]
		return this;
	}};
}

function ListExpression(i) {
	return {type: "ListExpression", items: i, run: function(system) {
		var l = [];
		for (var i = 0; i < this.items.length; i++) {
			l.push(this.items[i].run(system));
		}
		return l;
	},
	execute: function(system, args) {return this;},
	str: function(system) {return StringExpression(this.items.toString());}};
}

function TagExpression(t) {
	return {type: "TagExpression", tag: t, run: function(system) {return get_var(system, this.tag).run(system);},
	execute: function(system, args) {return get_var(system, this.tag);},
	str: function(system, args) {return StringExpression(this.tag);}};
}

function ScriptExpression(f) {
	return {type: "ScriptExpression", script: f, run: function(system) {return this;},
	execute: function(system, args) {return this.script(system, args);},
	str: function(system, args) {return StringExpression(this.script.toString());}};
}

function FunctionExpression(args, f) {
	return {type: "FunctionExpression", argslist: args.run(OS), code: f, run: function(system) {return this;},
	execute: function(system, args) {return this.script(system, args);},
	str: function(system, args) {return StringExpression(this.code.toString());}};
}

function BoolExpression(b) {
	return {type: "BoolExpression", bool: (b == "True") ? true:false, run: function(system) {return this.bool;},
	execute: function(system, args) {return this;},
	str: function(system, args) {return StringExpression(this.bool.toString());}};
}

function NumExpression(n) {
	return {
		type: "NumExpression", num: parseFloat(n), run: function(system) {return this.num;},
		execute: function(system, args) {return this;},
		str: function(system, args) {return StringExpression(this.num.toString());},
		add: function(system, v) {
			if (v.type == "NumExpression") {
				return NumExpression(this.num + v.num)
			}
		},
		subtract: function(system, v) {
			if (v.type == "NumExpression") {
				return NumExpression(this.num - v.num)
			}
		},
		multiply: function(system, v) {
			if (v.type == "NumExpression") {
				return NumExpression(this.num * v.num)
			}
		},
		divide: function(system, v) {
			if (v.type == "NumExpression") {
				return NumExpression(this.num / v.num)
			}
		}
	};
}

function parse(system, code) {
	
	//code = code.replace(/, /g, ",");
	//console.log("<-", code)
	
	//Parsing
	var ptree = [];
	var join = "";
	var level = 0;
	var string = false;
	
	for (var i = 0; i < code.length; i++) {
		//console.log(code[i], string, i, code.length)
		if (code[i] == ' ' && !string) {
			continue;
		}
		if (string) {
			if (code[i] == '\\' && code[i+1] == 'n' && code[i-1] != '\\') {
				join += '\n';
				i++;
				continue;
			}
		}
		if (code[i] == '"' && (code[i-1] != '\\' || i == 0)) {
			if (string) { string = false; }
			else if (!string) { string = true; }
			//console.log(string)
		}
		else if (code[i] == '(' && !string) {
			level++;
			if (level-1 == 0) {
				if (join != "") {
					ptree.push(parse(system, join));
					join = "";
				}
				continue;
				//i++;
			}			
		}
		else if (code[i] == ',' && !string) {
			if (level == 1) {
				ptree.push(parse(system, join));
				join = "";
				/*if (code[i+1] != '(') {
					i++;
				}
				else {
					continue;
				}*/
				continue;
			}
		}
		else if (code[i] == ')' && !string) {
			level--;
			if (level+1 == 1) {
				if (join.replace(/ /g, "") != "") {
					ptree.push(parse(system, join));
					join = "";
				}
				continue;
				//i++;
			}
		}
		else if (code[i] == '=' && level == 0 && !string) {
			ptree.push("assign");
			i++;
			if (code[i] == " ") {
				i++;
			}
			ptree.push(parse(system, code.slice(i)));
			ptree.push(join.replace(/ /g, ""));
			break;
		}
		else if (code[i] == '+' && level == 0 && !string) {
			if (code[i+1] == '+') {
				if (join.replace(/ /g, "") != "") {
					ptree.push(parse(system, join));
					if (ptree.length == 1) {
						ptree = ptree[0];
					}
					ptree = ["assign", ptree, ["add", ptree, "1"]];
					break;
				}
				else {
					ptree = ["raise", "SyntaxError"];
					break;
				}
			}
			else {
				//console.log(join, ptree);
				if (join.replace(/ /g, "") != "") {
					ptree.push(parse(system, join));
				}
				if (ptree.length == 1) {
					ptree = ptree[0];
				}
				i++;
				while (code[i] == " ") {
					i++;
				}
				//console.log(code, code[i], code.slice(i));
				ptree = ["add", ptree, parse(system, code.slice(i))];
				break;
			}
		}
		else if (code[i] == '-' && level == 0 && !string) {
			if (join.replace(/ /g, "") != "") {
				ptree.push(parse(system, join));
			}
			else if (ptree.length == 0) {
				ptree.push("0");
			}
			if (ptree.length == 1) {
				ptree = ptree[0];
			}
			i++;
			while (code[i] == " ") {
				i++;
			}
			//console.log(code, code[i], code.slice(i));
			ptree = ["subtract", ptree, parse(system, code.slice(i))];
			break;
		}
		else if (code[i] == '*' && level == 0 && !string) {
			if (join.replace(/ /g, "") != "") {
				ptree.push(parse(system, join));
			}
			if (ptree.length == 1) {
				ptree = ptree[0];
			}
			i++;
			while (code[i] == " ") {
				i++;
			}
			//console.log(code, code[i], code.slice(i));
			ptree = ["multiply", ptree, parse(system, code.slice(i))];
			break;
		}
		else if (code[i] == '/' && level == 0 && !string) {
			if (join.replace(/ /g, "") != "") {
				ptree.push(parse(system, join));
			}
			if (ptree.length == 1) {
				ptree = ptree[0];
			}
			i++;
			while (code[i] == " ") {
				i++;
			}
			//console.log(code, code[i], code.slice(i));
			ptree = ["divide", ptree, parse(system, code.slice(i))];
			break;
		}
		
		if (/*code[i] != '\\' || code[i-1] == '\\'*/true) {join = join + code[i];}
	}
	
	//Postparsing
	if (ptree.length == 0) {
		ptree = code;
		while (ptree[ptree.length-1] == " ") {
			ptree = ptree.slice(0, -1);
		}
	}
	if (ptree.length == 1 && typeof(ptree[0]) != "string") {
		ptree = ptree[0];
	}
	
	ptree = replace_literals(ptree);
	
	//console.log("->", ptree)
	return ptree;
}

function replace_literals(ptree) {
	//console.log(ptree);
	if (typeof(ptree) == "string") {return ptree.replace(/\\"/g, "\"");}
	else {
		for (var i = 0; i < ptree.length; i++) {
			ptree[i] = replace_literals(ptree[i]);
		}
		return ptree;
	}
}

function open_file(system, file) {
	//console.log(system);
	if (file.split(":")[0] == "cloud") {
		var data = get("cloudData/" + file.split(":")[1], [])/*.replace(/\r\n/g, "\n")/*.replace(/\\\\/g, "\\")*/;
		//console.log(data);
		return data;
	}
	else {
		if (system.files[file] == null) {
			//throw "404: FileNotFoundError";
			//console.log("println \"Error 404: File " + file + " not found.\";");
			return "println \"Error 404: File " + file + " not found.\";";
		}
		else {
			return system.files[file];
		}
	}
}

function update_timer(system) {
	date = new Date();
	system.vars["timer"] = (date - system.vars["timeRef"]) / 1000;
}

/*if (code[i] == '(') {
			l = ptree;
			//console.log('tree:', l, '(');
			for (var n = 0; n < level - 1; n++) {
				l = l[step[n]];
				//console.log(step, n);
				//console.log(l);
			}
			//console.log(l, join);
			//console.log(step, level);
			
			if (level > 0) {
				l.push([]);
				if (join != "") {
					l[step[level]].push(join);
				}
			}
			else if (join != "") {
				l.push(join);
			}
			
			step[level]++;
			//console.log(step, level);
			
			level++;
			step[level] = 0;
			join = "";
			i++;
		}
		if (code[i] == ',') {
			l = ptree;
			//console.log('tree:', l, ',');
			for (var n = 0; n < level - 1; n++) {
				l = l[step[n]];
				//console.log(step, n);
				//console.log(l);
			}
			//console.log(l, join);
			//console.log(step, level);
			l.push(join);
			step[level]++;
			join = "";
			i++;
		}
		if (code[i] == ')') {
			l = ptree;
			//console.log('tree:', l, ')');
			for (var n = 0; n < level - 1; n++) {
				l = l[step[n]];
				//console.log(step, n);
				//console.log(l);
			}
			//console.log(l, join);
			//console.log(step, level);
			if (join != "") {
				l.push(join);
			}
			level--;
			step[level-1]++;
			//console.log(step, level);
			join = "";
			i += 2;
		}*/
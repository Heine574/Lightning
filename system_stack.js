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

400 = log error and continue

	else if (func == "assign") {
		return system.vars[args[1].run()] = args[0].run();
	}
	else if (func == "eval") {
		return eval(args[0].run());
	}
	else if (func == "del_sprites") {
		system.sprites = [null];
		return true;
	}
	else if (func == "println") {
		var a = args[0].run();
		system.shell.push(a);
		run_text(system);
		if (args.length > 1) {
			if (args[1].run() == true) {
				system.status = 201;
			}
		}
		else {
			system.status = 201;
		}
		return a;
	}
	else if (func == "sleep") {
		system.status = 202;
		return args[0].run();
	}
	else if (func == "clear") {
		var canvas = document.getElementById("canvas");
		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, 480, 360);
		return true;
	}
	else if (func == "str") {
		return args[0].run().toString();
	}
	else if (func == "float") {
		return parseFloat(args[0].run());
	}
	else if (func == "rgb") {
		return ((parseInt(args[0].run()) * 65536) + (parseInt(args[1].run()) * 256) + parseInt(args[2].run()));
	}
	else if (func == "Sprite") {
		return system.vars[args[1].run()] = args[0].run();
	}
	else if (func == "image") {
		return system.vars[args[1].run()] = args[0].run();
	}
	else if (func == "box") {
		return system.vars[args[1].run()] = args[0].run();
	}
	else if (func == "") {
		return system.vars[args[1].run()] = args[0].run();
	}
	else if (func == "") {
		return system.vars[args[1].run()] = args[0].run();
	}
	else if (func == "") {
		return system.vars[args[1].run()] = args[0].run();
	}
	else if (func == "") {
		return system.vars[args[1].run()] = args[0].run();
	}
	else if (func == "input") {
		system.status = 203;
		return args[0].run();
	}
	else if (func == "") {
		return system.vars[args[1].run()] = args[0].run();
	}

*/

OS = {
	code_i: 0,
	vars: {
		'dollar': '$',
		'timeRef': new Date(),
		'font': "15px sans-serif",
		'keys': [],
		'add': function(system, args) {return args[0].run() + args[1].run();},
		'subtract': function(system, args) {return args[0].run() - args[1].run();},
		'multiply': function(system, args) {return args[0].run() * args[1].run();},
		'divide': function(system, args) {return args[0].run() / args[1].run();},
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
	run_lightning: l_bool,
	isTopSystem: true,
	oldshell: [],
	shell: [],
	objects: {},
	fps: 16,
	status: 200,
	sys_info: []
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

setInterval(function() {
var vars = "";
		for (var i in OS.vars) {
			vars += i + ": " + OS.vars[i] + "<br>";
		}
		for (var i in OS.sprites) {
			vars += "Sprite " + i + ": " + OS.sprites[i] + "<br>";
		}
		
		document.getElementById("data").innerHTML = vars;
	}, 100);

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

function get_UID(system) {
	var i = 0;
	while (system.vars.hasOwnProperty('x' + i.toString())) {
		i += 1;
	}
	return 'x' + i.toString();
}

function drawEllipse(context, centerX, centerY, width, height) {
	
	height = height*2
	width = width*2

	context.beginPath();

	context.moveTo(centerX, centerY - height/2); // A1

	context.bezierCurveTo(
		centerX + width/2, centerY - height/2, // C1
		centerX + width/2, centerY + height/2, // C2
		centerX, centerY + height/2); // A2

	context.bezierCurveTo(
		centerX - width/2, centerY + height/2, // C3
		centerX - width/2, centerY - height/2, // C4
		centerX, centerY - height/2); // A1

	context.strokeStyle = "red";
	context.stroke();
	context.closePath();	
}

function run_text(system) {
	var canvas = document.getElementById("canvas");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, 480, 360);
	//console.log(system.vars["font"]);
	ctx.font = system.vars["font"];
	var spacing = parseInt(system.vars["font"].split(" ")[0].replace("px", ""));
	var text_y = 360 - spacing/2;
	for (i = system.shell.length - 1; i >= 0; i--) {
		ctx.fillText(system.shell[i], 10, text_y);
		text_y -= spacing;
	}
}

function run_stack(system, ccode) {
	if (ccode != null) {
		for (var i = 0; i < ccode.length; i++) {
			system.tasks.push(ccode[i]);
		}
		//console.log(ccode);
	}
	var a;
	var b;
	var c;
	var d;
	var canvas = document.getElementById("canvas");
	var ctx = canvas.getContext("2d");
	while (system.tasks.length > 0) {
		//console.log(system.stack)
		if (system.tasks[0] == "assign") {
			b = system.stack.shift();
			a = system.stack.shift();
			system.vars[b] = a;
		}
		else if (system.tasks[0] == "add") {
			b = parseFloat(system.stack.shift());
			a = parseFloat(system.stack.shift());
			system.stack.unshift(a + b);
		}
		else if (system.tasks[0] == "subtract") {
			b = parseFloat(system.stack.shift());
			a = parseFloat(system.stack.shift());
			system.stack.unshift(a - b);
		}
		else if (system.tasks[0] == "get") {
			a = system.stack.shift();
			system.stack.unshift(system.vars[a]);
		}
		else if (system.tasks[0] == "println") {
			a = system.stack.shift();
			console.log(a);
		}
		else if (system.tasks[0] == "del_sprites") {
			
		}
		else if (system.tasks[0] == "") {
			
		}
		else {
			system.stack.unshift(system.tasks[0]);
		}
			
		system.tasks.splice(0, 1);
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
	if (system.vars.keys.indexOf(lastkey) == -1) {
		lastkey = "";
	}
	if (system.vars.keys.length > 0) {
		if (system.vars.keys.indexOf("ENTER") > -1) {
			system.vars.answer = a;
			setTimeout(run, 1, system, null);
		}
		else {
			var t = 1;
			if (system.vars.keys.indexOf("SHIFT") > -1) {
				if (system.vars.keys.indexOf("SHIFT") + 1 < system.vars.keys.length) {
					if (specialChars.indexOf(system.vars.keys[system.vars.keys.indexOf("SHIFT")+1]) == -1) {
						if (system.vars.keys[system.vars.keys.indexOf("SHIFT")+1] != lastkey) {
							a += Shift(system.vars.keys[system.vars.keys.indexOf("SHIFT")+1]);
							lastkey = system.vars.keys[system.vars.keys.indexOf("SHIFT")+1];
						}
					}
				}
			}
			else if (system.vars.keys.indexOf("BCKSPACE") > -1) {
				a = a.slice(0, -1);
				t = 100;
			}
			else if (specialChars.indexOf(system.vars.keys[0]) == -1 && system.vars.keys[0] != lastkey) {
				a += system.vars.keys[0].toLowerCase();
				lastkey = system.vars.keys[0];
			}
			//console.log(txt, a);
			system.shell[system.shell.length-1] = txt + a;
			run_text(system);
			setTimeout(input, t, system, txt, a, lastkey);
		}
	}
	else {
		setTimeout(input, 1, system, txt, a, lastkey);
	}
}

function run(system, ccode) {
	if (ccode != null) {
		for (var i = 0; i < ccode.length; i++) {
			system.tasks.push(ccode[i]);
		}
		//console.log(ccode);
	}
	var ID = Math.random();
	var canvas = document.getElementById("canvas");
	var ctx = canvas.getContext("2d");
	while (system.tasks.length > 0 || (system.run_lightning.val && system.isTopSystem)) {
		data = system.tasks[0].run();
		system.tasks.splice(0, 1);
		//console.log(system.status, ID);
		if (system.status == 201) {
			system.status = 200;
			setTimeout(run, (1 / system.fps) * 1000, system, null); //replace later
			break;
		}
		if (system.status == 202) {
			system.status = 200;
			setTimeout(run, (data) * 1000, system, null); //replace later
			break;
		}
		if (system.status == 203) {
			system.status = 200;
			system.shell.push(data);
			run_text(system);
			setTimeout(input, 1, system, data, "", "");
			break;
		}
	}
}

function run_function(system, func, args) {
	func = func.run();
	//console.log(func, args);

}

function sleep(ms) {
    var date = new Date();
    var curDate = null;
    do { curDate = new Date(); }
    while(curDate-date < ms);
}

function start(system, file) {
	var ccode = compile(system, open_file(system, file), "\n");
	run(system, ccode);
	//run_stack(system, ccode);
	//console.log(ccode);
	if (system.status == 301) {
		var inf = system.sys_info;
		setTimeout(compile_and_run, 1000, inf[0], inf[1], inf[2]);
	}
}

function compile(system, code, sep) {
	var pcode = [];
	var ccode = "";
	code = code.replace(/\r\n/g, "\n");
	code = code.split(sep);
	//console.log(code);
	
	for (var i = 0; i < code.length; i++) {
		pcode.push(parse(system, code[i]));
	}
	
	//ccode = compile_stack(system, pcode);
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
		run: function() {
			return run_function(system, this.func, this.args);
		}
	}
	
	//console.log(pcode, typeof(pcode));
	
	
	if (typeof(pcode) != "string") {
		exp.func = compile_obj(system, pcode[0])
		pcode.splice(0, 1);
		for (var i = 0; i < pcode.length; i++) {
			exp.args.push(compile_obj(system, pcode[i]));
		}
		return exp
	}
	else if (pcode[0] == '"' && pcode[pcode.length-1] == '"') {
		return {
			type: "StringExpression",
			string: pcode.slice(1, -1),
			run: function() {
				return this.string;
			}
		};
	}
	else if (!isNaN(parseFloat(pcode))) {
		return {
			type: "NumExpression",
			num: parseFloat(pcode),
			run: function() {
				return this.num;
			}
		};
	}
	else if (pcode == "True" || pcode == "False") {
		return {
			type: "BoolExpression",
			bool: (pcode == "True") ? true:false,
			run: function() {
				return this.bool;
			}
		};
	}
	else {
		return {
			type: "TagExpression",
			tag: pcode,
			run: function() {
				return this.tag;
			}
		};
		//return pcode;
	}
}

function compile_stack(system, pcode) {
	
	var ccode = [];
	//console.log(pcode);
	
	KFORTH = false;
	
	if (typeof(pcode[0]) == "string") {
		if (pcode[0] == "assign" && KFORTH) {
			return [pcode[2] + ": {" + compile_stack(system, pcode[1]) + "} pop"];
		}
		else {
			pcode.push(pcode[0]);
			pcode.splice(0, 1);
		}
	}
	//console.log(pcode);
	
	for (var i = 0; i < pcode.length; i++) {
		//console.log(pcode[i], typeof(pcode[i]));
		if (typeof(pcode[i]) == "string") {
			if (KFORTH) {
				ccode = ccode.concat(pcode[i].replace(/add/g, '+').replace(/subtract/g, '-'));
			}
			else {
				ccode = ccode.concat(pcode[i]);
			}
		}
		else {
			ccode = ccode.concat(compile_stack(system, pcode[i]));
		}
	}
	
	/*while (ccode.search("  ") != -1) {
		ccode = ccode.replace(/  /g, " ");
	}*/
	
	return ccode;
}

function parse(system, code) {
	
	code = code.replace(/, /g, ",");
	//console.log(code)
	
	//Parsing
	var ptree = [];
	var join = "";
	var level = 0;
	var string = false;
	
	for (var i = 0; i < code.length; i++) {
		//console.log(code[i], string, i, code.length)
		if (code[i] == '"') {
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
				if (code[i+1] != '(') {
					i++;
				}
				else {
					continue;
				}
				//continue;
			}
		}
		else if (code[i] == ')' && !string) {
			if (level == 1) {
				if (join.replace(/ /g, "") != "") {
					ptree.push(parse(system, join));
					join = "";
				}
				i++;
			}
			level--;
		}
		else if (code[i+1] == '=' && level == 0 && !string) {
			ptree.push("assign");
			i++;
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
			ptree = ["divide", ptree, parse(system, code.slice(i))];
			break;
		}
		
		join = join + code[i];
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
	
	//console.log(ptree)
	return ptree;
}

function open_file(system, file) {
	//console.log(system);
	if (file.split("//")[0] == "cloud:") {
		var data = get("cloudData/" + file.split("//")[1], [])/*.replace(/\r\n/g, "\n")/*.replace(/\\\\/g, "\\")*/;
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
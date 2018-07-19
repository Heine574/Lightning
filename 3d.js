function is3Dcmd(cmd) {
	var commands = ['render', 'box'];
	return commands.includes(cmd);
}

function command(system, cmd) {
	console.log(cmd);
	if (cmd == "render") {
		render(system);
		system.tasks.splice(0, 1);
	}
	else if (cmd == "box") {
		var t = system.tasks;
		system.objects[t[1]] = box(t[2], t[3], t[4], t[5], t[6], t[7]);
		system.tasks.splice(0, 8);
	}
	else {
		system.tasks.splice(0, 1);
	}
}

function render(system) {
	var cam = {
		x: -10,
		y: 10,
		z: -10,
		pitch: -10,
		yaw: 10
	};
	var obj;
	for (var o in system.objects) {
		obj = system.objects[o];
	}
	clearRect(0, 0, 480, 360);
	for (var i = 0; i < 100; i++) {
		for (var i = 0; i < 100; i++) {
		}
	}
}

function box(x1, y1, z1, x2, y2, z2) {
	var rBox = {
		x1: x1,
		y1: y1,
		z1: z1,
		x2: x2,
		y2: y2,
		z2: z2,
		isInside: function(x, y, z) {
			return x >= x1 && y >= y1 && z >= z1 && x <= x2 && y <= y2 && z <= z2;
		},
		color: rgb(255, 0, 0),
		transparent: false
	}
	return rBox;
		
}
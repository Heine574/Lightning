function post(path, params) {
    var xhttp = new XMLHttpRequest();
	txt = [];
	for (i in params) {
		txt.push(i + '=' + params[i]);
	}
	txt = txt.join('\r\n')
	xhttp.open("POST", path, false);
	xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhttp.send(txt);
	return xhttp.responseText;
}

function get(path, params, cache=true) {
	console.log(path);
    var xhttp = new XMLHttpRequest();
	if (cache) {
		txt = ['t=' + Math.random().toString()];
	}
	else {
		txt = [];
	}
	for (i in params) {
		txt.push(i + '=' + params[i]);
	}
	txt = "?" + txt.join('&')
	xhttp.open("GET", path + txt, false);
	//xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhttp.send();
	return xhttp.responseText;
}
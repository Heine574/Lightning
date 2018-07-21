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

function get(path, params, cache=true, responseType="text", async=false, system=null, tag="") {
	console.log(path, params, cache, responseType, async, system, tag);
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
	xhttp.system = system;
	xhttp.tag = tag;
	if (async) {
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				console.log(this.response);
				this.system.vars[tag] = {
					type: "XMLHttpData",
					data: this.response,
					run: function(system) {return this.data;},
					execute: function(system, args) {return this;}
				}
			}
		};
	}
	txt = "?" + txt.join('&');
	xhttp.open("GET", path + txt, async);
	if (async) {xhttp.responseType = responseType;}
	//xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhttp.send();
	if (!async) {return xhttp.responseText;}
}
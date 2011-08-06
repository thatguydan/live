/*

var net = require('net');
var path = require('path');
var sys = require('sys');
var Worker = require('webworker').Worker;

var NUM_WORKERS = 5;

var workers = [];
var numReqs = 0;

for (var i = 0; i < NUM_WORKERS; i++) {
	workers[i] = new Worker(path.join(__dirname, 'worker.js'));
}

net.createServer(function(s) {
	s.pause();

	var hv = 0;
	s.remoteAddress.split('.').forEach(function(v) {
		hv += parseInt(v);
	});

	var wid = hv % NUM_WORKERS;

	sys.debug('Request from ' + s.remoteAddress + ' going to worker ' + wid);

	workers[wid].postMessage(++numReqs, s.fd);
}).listen(8080);

*/

var sys = require("sys"),  
    http = require("http"),
	url = require('url'),
	Client = require('mysql').Client,
	
	DATABASE = 'sunswift_live',
	TABLE = 'log',
	gzip = require('gzip');





server = http.createServer(function(request, response){
	// Parse the url
	var path = url.parse(request.url).pathname;
	var _GET = url.parse(request.url, true).query;
	client = new Client(),
	client.user = 'root';
	client.password = '';
	// Connect to the database
	client.connect();
	client.query('USE '+DATABASE);
	
	switch (path) {
		case '/replay.json':
			if (_GET.from == "" || _GET.to == "") {
				console.log("Malformed");
				break;
			}
		
			var sql = "SELECT * FROM "+TABLE+" WHERE speed BETWEEN 1 AND 100 AND timestamp>'1294351243.77' ORDER BY timestamp ASC;";
			client.query(sql, function(error, results, fields) {
				client.end();
				if (error) {
					throw error;
					sys.log(error.message);
				}
				else {
					// Prepare the JSON to go out the door
					var json = JSON.stringify(results);
					// If it's a JSONP request, wrap the JSON in the callback function name
					var uncompressed = (_GET.callback) ? _GET.callback + "(" + json + ");" : json;
					// If the browser can handle gzip
					try { 
						var handlesgzip = request.headers['accept-encoding'].indexOf("gzip");
					}
					catch (err) { 
						var handlesgzip = -1;
					}
					if (handlesgzip>-1) {
						// Compress the JSON
						gzip(uncompressed, function(gziperror, compressed) {
							// If there is an error, log it and then send the data uncompressed.
							if (gziperror) {
								sys.log(gziperror.message);	
								sendUncompressedData(response, uncompressed);	
							} 
							else {
								// If all is peachy, send the compressed data
								console.log("Sent "+compressed.length+" bytes of data");
								response.writeHead(200, {
									'Content-Encoding':'gzip',
									'Content-Length': compressed.length,
									'Content-Type': 'application/json',
									'Access-Control-Allow-Origin:': '*'
								});
								response.write(compressed);
								response.end("\n");								
							}
						});
					}
					else {
						sendUncompressedData(response, uncompressed);
					}
				}
			
			});		
			break;
		case '/last.json':
			
		
			break;
		default: send404(response);	
	}
	//response.finish();
});

function connect () {

}

function disconnect () {
	//client.disconnect();
}

function sendUncompressedData (res, data) {
	res.writeHead(200, {
		'Content-Length': data.length,
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin:': '*'							
	});
	res.write(data);
	
	res.end("\n");
	console.log("Sent "+data.length+"bytes of data");
	
} 

function send404(response){
  response.writeHead(404);
  response.write('Action not supported.');
  response.end();
};

function dump(arr,level) {
	var dumped_text = "";
	if(!level) level = 0;
	//The padding given at the beginning of the line.
	var level_padding = "";
	for(var j=0;j<level+1;j++) level_padding += "    ";
	
	if (typeof(arr) == 'object') { //Array/Hashes/Objects
		for(var item in arr) {
			var value = arr[item];
	  		if (typeof(value) == 'object') { //If it is an array,
	   			dumped_text += level_padding + "'" + item + "' ...\n";
	   			dumped_text += dump(value,level+1);
	  		} 
			else dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
	 	}
	} 
	else dumped_text = "===>"+arr+"<===("+typeof(arr)+")";	//Stings/Chars/Numbers etc.
	return dumped_text;
}

server.listen(8080);

server.on('error', function (exc) {
    sys.log("ignoring exception: " + exc);
});

sys.puts("Sunswift Live now serving requests.");
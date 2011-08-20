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
	var client = new Client();
	client.user = 'root';
	client.password = '';
	// Connect to the database
	client.connect();
	client.query('USE '+DATABASE);
	
	switch (path) {
		case '/events.json':
			var callback = (_GET.callback) ? _GET.callback : '';	
			sendEvents(client,request,response,callback);
		break;
		break;
		case '/replay.json':
			if (!_GET.from || !_GET.to) {
				console.log("Malformed");
				response.writeHead(400);
				response.end(JSON.stringify({result:0,error:"Malformed Request"}));
				break;
			}
			var callback = (_GET.callback) ? _GET.callback : '';
			handleReplayRequest(_GET.from,_GET.to,client,request,response,callback);
		break;
		case '/last.json':
			
		
		break;
		default: send404(response);	
	}
	//response.finish();
});

function sendEvents(client,request,response,callback) {
	var sql = "SELECT title,timestamp_from,timestamp_to FROM `events` ORDER BY timestamp DESC";
	client.query(sql,function(error,results) {
		if (error) {
			response.writeHead(200);
			response.write(JSON.stringify({result:0,error:"Database Error"}));
		}
		else {
			var json = JSON.stringify(results);
			var out = (callback) ? callback + "(" + json + ");" : json;
			response.writeHead(200);
			response.end(out);
		};
	});
}

function handleReplayRequest(from, to, client, request, response, callback) {
	try {
		var f = Number(from);
		var t = Number(to);
	}
	catch (err) {
		response.writeHead(400);
		response.end('Invalid Request');
	}
	if (isNaN(f) || isNaN(t) || !f || !t) {
		response.writeHead(400);
		response.end("Invalid Request");
		return false;
	}
	var sql = client.format("SELECT * FROM "+TABLE+" WHERE speed BETWEEN 1 AND 120 AND timestamp > ? && timestamp < ? ORDER BY timestamp ASC;",[f,t]);
	console.log(sql);
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
			var uncompressed = (callback) ? callback + "(" + json + ");" : json;
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
			else sendUncompressedData(response, uncompressed);
		}
	
	});	
}

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
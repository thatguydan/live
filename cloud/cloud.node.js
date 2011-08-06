var sys = require('sys'),
	http = require('http'),
	gzip = require('gzip'),
	Client = require('mysql').Client,
	client = new Client(),
	UPDATEINTERVAL = 10000,
	CREDENTIALS = 'sometext',
	HOST = '127.0.0.1',
	PORT = '8000',
	PATH = '/',
	sql = {},
	sql.db = 'sunswift',
	sql.table = 'log';
	client.user = 'root';
	client.pass = '';							

var server = http.createServer(function(req,res) {
	// Handle GET requests from the public
	var path = url.parse(request.url).pathname;
	var _GET = url.parse(request.url, true).query;
	
	switch (path) {
		case '/replay.json':
			replay.json(req, res);
			break;
		default: 
			send404(response);	
			break;
	}
	
	// Handle POST requests from scanalysis
	res.setEncoding('utf8');
	res.content = '';
	res.on("data",function(chunk) {
		res.content += chunk;
	});
	res.on("end",function() {
		processRequest(res);
	});
	
}).listen(PORT,HOST);

console.log("Sunswift Live listening at "+HOST+":"+PORT);

var processRequest = function(res) {
	// Check for malformed data
	try { var packet = JSON.parse(res.content.toString()); }
	catch (err) { throw err; }
	
	// Check credentials
	if (packet.data.credentials!==CREDENTIALS) {
		send404(res);
		return;
	}
	//var data = gzip.
	// we need to uncompress the data here
	switch(data.do) {
		case 'append':
			append(data, res);
		break;
	}
};
/*
*	Read-Write Code
*/
var append = function(data, res) {
	client.connect();
	client.query("USE "+DATABASE);
	var sql = "INSERT IGNORE INTO $table (`timestamp`, `speed`, `batterypower`, `arraypower`, `motorpower`, `motortemp`, `heatsinktemp`, `latitude`, `longitude`) VALUES";
	for (i in data.data) {
		sql += 	" ('"+data.data.timestamp+"',
				'"+data.data.speed+"',
				'"+data.data.batterypower+"',
				'"+data.data.arraypower+"',
				'"+data.data.motorpower+"',
				'"+data.data.motortemp+"',
				'"+data.data.heatsinktemp+"',
				'"+data.data.latitude+"',
				'"+data.data.longitude+"'),"
	}
	sql = sql.slice(0,-1);
	sql += ";";
	client.query(sql,function(error,results,fields) {
		
	});
	
}


/*
*	Read-only Code
*/
var replay.json = function(req, res) {
	if (_GET.from == "" || _GET.to == "") {
		send404(res);
		return;
	}
	client.connect();
	client.query('USE '+DATABASE);
	
	var sql = "SELECT * FROM "+TABLE+" WHERE speed BETWEEN 1 AND 100 AND timestamp>'1294351243.77' ORDER BY timestamp ASC;";
	client.query(sql, function(error, results, fields) {
		if (error) throw error;
		else send(results, req, res);
		client.end();
	});
}

var send = function(results, req, res) {
	// Prepare the JSON to go out the door
	var json = JSON.stringify(results);
	// If it's a JSONP request, wrap the JSON in the callback function name
	var data = (_GET.callback) ? _GET.callback + "(" + json + ");" : json;
	// If the browser can handle gzip
	try { var handlesgzip = request.headers['accept-encoding'].indexOf("gzip"); }
	catch (err) { var handlesgzip = -1;	}
	// Send correct data to browser
	if (handlesgzip>-1) sendCompressed(res, data);
	else sendUncompressed(res, data);
}

var sendCompressed = function (res, data) {
	// Compress the JSON
	gzip(data, function(gziperror, compressed) {
		// If there is an error, log it and then send the data uncompressed.
		if (gziperror) {
			sys.log(gziperror.message);
			sendUncompressedData(res, data);
		} 
		else {
			// If all is peachy, send the compressed data
			console.log("Sent "+compressed.length+" bytes of compressed data");
			res.writeHead(200, {
				'Content-Encoding':'gzip',
				'Content-Length': compressed.length,
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin:': '*'
			});
			res.write(compressed);
			res.end();							
		}
	});
}

var sendUncompressed = function (res, data) {
	res.writeHead(200, {
		'Content-Length': data.length,
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin:': '*'							
	});
	res.write(data);
	res.end();							
	console.log("Sent "+data.length+"bytes of data");
} 

var send404 = function(response){
  response.writeHead(404);
  response.write('Malformed :(');
};

var dump = function(arr,level) {
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


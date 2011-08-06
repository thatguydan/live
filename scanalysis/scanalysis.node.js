var sys = require('sys'),
	http = require('http'),
	gzip = require('gzip'),
	Client = require('mysql').Client,
	client = new Client(),
	UPDATEINTERVAL = 10000,
	CREDENTIALS = 'sometext',
	HOST = 'localhost',
	PORT = '8000',
	PATH = '/',
	sql = {},
	sql.db = 'sunswift',
	sql.table = 'log';	
	client.user = 'root';
	client.pass = '';						

var loop = setInterval("fetch",UPDATEINTERVAL);

var fetch = function() {
	client.connect();
	client.query('USE '+sql.db);
	var now = Math.round((new Date()).getTime() / 1000);
	var since = now - 30;
	var sql = "SELECT * FROM `"+sql.table+"` WHERE timestamp > " +since+" ORDER BY timestamp ASC";
	client.query(sql, function(error,results,fields) {
		if (error) throw error;
		else processData(results);
	});
	client.end();
};

var processData = function(in) {
	// Aggregate data
	
	// Format POST data to send
	
	// Compress data
	gzip(out, function(error, data) {
		if (error) throw error;
		else send(data);
	});
};

var send = function(data) {
	var options = {
	  	host: HOST,
	  	port: PORT,
	  	path: PATH,
	  	method: 'POST'
	};

	var req = http.request(options, function(res) {
		res.content = '';
	  	res.setEncoding('utf8');
	  	res.on('data', function (chunk) { 
			res.content += chunk;	
		});
		res.on('end',function() { 
			log(chunk); 
		});
	});
	var packet = {
		'do':'append',
		'data':data,
		'credentials': CREDENTIALS
	}
	// write data to request body
	req.write(data);
	req.end();
};

var log = function(response) {
	console.log(JSON.stringify(response));
};
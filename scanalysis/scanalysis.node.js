var sys = require('sys'),
	http = require('http'),
	gzip = require('gzip'),
	util = require('util'),
	sqlite3 = require('sqlite3').verbose(),
	UPDATEINTERVAL = 10000,
	CREDENTIALS = 'sometext',
	HOST = 'localhost',
	PORT = '8000',
	PATH = '/',
	sqlfile = './live.sqlite3',
	sqltable = 'canlog',
	loop,
	db;		
	
var nodes = {
	speed: {
		node:20,
		channel:6
	},
	batterypower: {
		node:10,
		channel:6
	},
	arraypower: {
		node:40,
		channel:1	// Check if this is 1,2,3
	},
	motorpower: {
		node:40,
		channel:3	// Check if this is 1,2,3
	},
	motortemp: {
		node:20,
		channel:13
	},
	heatsinktemp: {
		node:20,
		channel:12
	},
	latitude: {
		node:30,
		channel:1
	},
	longitude: {
		node:30,
		channel:2
	}
};
	

var db = new sqlite3.Database(sqlfile,sqlite3.OPEN_READONLY,function() {
	// Startup when sqlite database has been read
	//loop = setInterval("fetch",UPDATEINTERVAL);
	fetch();
});

var fetch = function() {
	var now = Math.round((new Date()).getTime() / 1000);
	var since = now - 30;
	since = 1304755855635;		//Dev, take this out
	var sql = "SELECT * FROM `"+sqltable+"` WHERE ciel_timestamp > "+since+" AND ciel_timestamp < "+(since+(30000))+" AND message_type=0 ORDER BY ciel_timestamp ASC";
	db.all(sql,function(err,results) {
		if (err) throw err;
		else if (results.length==0) return false;
		else processData(results,since);
	});
};

var processData = function(data,start) {
	var tmp = [];
	for (i=0;i<data.length;i++) {
		for (j in nodes) {
			if (data[i].source_address == nodes[j].node && data[i].specifics == nodes[j].channel) {
				tmp.push({
					timestamp:data[i].ciel_timestamp,
					node:j,
					value:data[i].value
				});
			}
		}
	};
	//console.log(util.inspect(tmp));
	var current_time = start + 2000;
	var out = [];
	var n = 0;
	for (i=0;i<tmp.length;i++) {
		if (tmp[i].timestamp<current_time) {
			if (typeof out[n] === "undefined") {
				out[n] = new Object;
			}
			out[n][tmp[i].node]=(typeof out[n][tmp[i].node] !== "undefined") ? (out[n][tmp[i].node]+tmp[i].value)/2:tmp[i].value;
			//console.log(util.inspect(out[n]));
		}
		else {
			if (typeof out[n] !== "undefined") n++;
			current_time = current_time + 2000;
		}
	};
	
	console.log(util.inspect(out));
	// Aggregate data
	
	// Format POST data to send
	
	// Compress data
	console.log("Done here");
	return;
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
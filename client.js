var net=require("net");

function connect(url){
	var conn=net.createConnection(url,onconnection);
	console.log("Connected to url "+url);
}

function onconnection

module.exports.connect=connect;

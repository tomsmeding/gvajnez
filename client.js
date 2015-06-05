var net=require("net"),
    netio=require("./netio.js"),
    fileio=require("./fileio.js"),
    etc=require("./etc.js"),
    msgtype=require("./msgtype.json");

var conn;

var uniqid=(function(){
	var id=0;
	return function(){return id++;};
})();

function connect(url){
	console.log("Connecting to url "+url);
	conn=net.createConnection(url.split(":")[1],url.split(":")[0],onconnection);
}

function onconnection(){
	console.log("Connected");
	conn.on("data",netio.makeBufferedProtocolHandler(onmessage));
	conn.write(netio.constructMessage(msgtype.ping,[]));
	setInterval(function(){
		conn.write(netio.constructMessage(msgtype.ping,[]));
	},60000); //each minute, send a ping
}

function onmessage(msg,from,messageBuffer){
	switch(msg.type){
		case msgtype.file:
			console.log("file received!");
			fileio.updateFile(String(msg.args[0]),parseInt(msg.args[1]),msg.args[2]);
			break;
		case msgtype.checkout:
			console.log("checkout received!");
			break;
		case msgtype.checkin:
			console.log("checkin received!");
			break;
		case msgtype.ping:
			//console.log("ping received!");
			conn.write(netio.constructMessage(msgtype.pong,[]));
			break;
		case msgtype.pong:
			console.log("Connection OK.");
			break;
		default:
			console.log("unknown message type "+msg.type+" received!");
			break;
	}
}

module.exports.connect=connect;

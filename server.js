var net=require("net"),
    netio=require("./netio.js"),
    msgtype=require("./msgtype.json");

var conns=[];

var uniqid=(function(){
	var id=0;
	return function(){return id++;};
})();

function serve(port){
	console.log("Serving on port "+port);
	net.createServer(onconnection).listen(port);
}

function onconnection(conn){
	var id=uniqid();
	console.log("Accepted connection (id "+id+")");
	conns.push([id,conn]);
	conn.on("end",function(){
		console.log("Connection with "+id+" lost");
		for(var i=0;i<conns.length;i++)if(conns[i][0]==id)break;
		if(i==conns.length)throw new Error();
		conns.splice(i,1);
	});
	conn.on("data",netio.makeBufferedProtocolHandler(onmessage,[id,conn]));
	conn.write(netio.constructMessage(msgtype.ping,[]));
	setInterval(function(){
		conn.write(netio.constructMessage(msgtype.ping,[]));
	},60000); //each minute, send a ping
}

function onmessage(msg,from,messageBuffer){
	switch(msg.type){
		case msgtype.file:
		case msgtype.checkout:
		case msgtype.checkin:
			console.log((msg.type==msgtype.file?"file":msg.type==msgtype.checkout?"checkout":"checkin")+" received! from "+from[0]);
			conns.forEach(function(c){
				if(c[0]!=from[0])
					c[1].write(messageBuffer);
			});
			break;
		case msgtype.ping:
			//console.log("ping received! from "+from[0]);
			from[1].write(netio.constructMessage(msgtype.pong,[]));
			break;
		case msgtype.pong:
			console.log("Pong received from "+from[0]+".");
			break;
		default:
			console.log("unknown message type "+msg.type+" received!");
			break;
	}
}

module.exports.serve=serve;

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

}

function onmessage(msg,from){
	switch(msg.type){
		case msgtype.file:
			console.log("file received! from "+from[0]);
			break;
		case msgtype.checkout:
			console.log("checkout received! from "+from[0]);
			break;
		case msgtype.checkin:
			console.log("checkin received! from "+from[0]);
			break;
		case msgtype.ping:
			//console.log("ping received! from "+from[0]);
			from[1].write(netio.constructMessage(msgtype.pong,[]));
			break;
		case msgtype.pong:
			console.log("Connection with "+from[0]+" OK.");
			break;
		default:
			console.log("unknown message type "+msg.type+" received!");
			break;
	}
}

module.exports.serve=serve;

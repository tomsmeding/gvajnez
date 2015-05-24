var net=require("net"),
    netio=require("./netio.js"),
    msgtype=require("./msgtype.json");

var server,conns=[];

var uniqid=(function(){
	var id=0;
	return function(){return id++;};
})();

function serve(port){
	console.log("Serving on port "+port);
	server=net.createServer(onconnection);
}

function onconnection(conn){
	var id=uniqid();
	conns.push([id,conn]);
	conn.on("end",function(){
		for(var i=0;i<conns.length;i++)if(conns[i][0]==id)break;
		if(i==conns.length)throw new Error();
		conns.splice(i,1);
	});
	var buffer=new Buffer(0);
	conn.on("data",netio.sockondata);
	conn.write(netio.constructMessage(msgtype.protocol,[new Buffer(0,0,0,1)]));
}

module.exports.serve=serve;

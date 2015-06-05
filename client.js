var net=require("net"),
    fs=require("fs"),
    netio=require("./netio.js"),
    fileio=require("./fileio.js"),
    etc=require("./etc.js"),
    msgtype=require("./msgtype.js");

var servconn,checkedout=[];

var uniqid=(function(){
	var id=0;
	return function(){return id++;};
})();

function connect(url){
	console.log("Connecting to url "+url);
	servconn=net.createConnection(url.split(":")[1],url.split(":")[0],onconnection);
}

function onconnection(){
	console.log("Connected");
	servconn.on("end",function(){
		console.error("Connection with server lost!");
		process.exit(1);
	});
	servconn.on("data",netio.makeBufferedProtocolHandler(onmessage));
	servconn.write(netio.constructMessage(msgtype.ping,[]));
	setInterval(function(){
		servconn.write(netio.constructMessage(msgtype.ping,[]));
	},60000); //each minute, send a ping
}

function onmessage(msg,from,messageBuffer){
	var fname,idx;
	switch(msg.type){
		case msgtype.file:
			console.log("file received!");
			fileio.updateFile(String(msg.args[0]),parseInt(msg.args[1]),msg.args[2]);
			break;
		case msgtype.checkout:
			console.log("checkout received!");
			fname=String(msg.args[0]);
			if(checkedout.indexOf(fname)==-1)checkedout.push(msg.args[0]);
			else console.warn("Warning: someone checked out a file that you already checked out. Sync issues?");
			break;
		case msgtype.checkin:
			console.log("checkin received!");
			fname=String(msg.args[0]);
			idx=checkedout.indexOf(fname);
			if(idx!=-1)checkedout.splice(idx,1);
			else console.warn("Warning: someone checked in a file that wasn't checked out here. Sync issues?");
			break;
		case msgtype.ping:
			//console.log("ping received!");
			servconn.write(netio.constructMessage(msgtype.pong,[]));
			break;
		case msgtype.pong:
			console.log("Pong received.");
			break;
		default:
			console.error("unknown message type "+msg.type+" received!");
			break;
	}
}



if(fs.existsSync(etc.client_editsock)){
	fs.writeSync(process.stdout.fd,"The Gvajnez socket file already exists. Another instance might be running.\nContinue forcefully? [y/N] ");
	var response=new Buffer(10);
	var num=fs.readSync(process.stdin.fd,response,0,10,null);
	response=String(response.slice(0,num)).trim();
	if(response=="y"||response=="Y")fs.unlinkSync(etc.client_editsock);
	else process.exit(1);
}
net.createServer(edit_onconnection).listen(etc.client_editsock);

function exitcleanup(){
	try {fs.unlinkSync(etc.client_editsock);}
	catch(e){}
}
process.on("exit",exitcleanup);
process.on("SIGINT",function(){
	exitcleanup();
	process.exit(0);
});

function edit_onconnection(conn){
	console.log("Accepted edit connection");
	conn.on("end",function(){
		console.log("An edit connection lost");
	});
	conn.on("data",netio.makeBufferedProtocolHandler(edit_onmessage,conn));
}

function edit_onmessage(msg,conn,messageBuffer){
	var fname;
	switch(msg.type){
		case msgtype.edit.open:
			fname=String(msg.args[0]);
			if(checkedout.indexOf(fname)!=-1){
				conn.write(netio.constructMessage(msgtype.edit.open_err,[msg.args[0]]));
			} else {
				checkedout.push(fname);
				servconn.write(netio.constructMessage(msgtype.checkout,[msg.args[0]]));
				conn.write(netio.constructMessage(msgtype.edit.open_ok,[msg.args[0]]));
			}
			break;
		case msgtype.edit.close:
			fname=String(msg.args[0]);
			servconn.write(netio.constructMessage(msgtype.checkin,[msg.args[0]]));
			break;
		default:
			console.error("unknown message type "+msg.type+" received from edit client!");
			break;
	}
}



fileio.attachWatcher(function(changes){
	console.log(changes);
});



module.exports.connect=connect;

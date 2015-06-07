var etc=require("./etc.js"),
    msgtype=require("./msgtype.js");

function constructMessage(type,args){
	var len=6+args.map(function(a){return 4+a.length;}).reduce(function(a,b){return a+b;},0);
	var buf=new Buffer(len);
	//console.log("constructing message with len",len)
	buf.writeUInt32BE(len,0);
	buf.writeUInt8(type,4);
	buf.writeUInt8(args.length,5);
	var cursor=6;
	for(var i=0;i<args.length;i++){
		if(!(args[i] instanceof Buffer))args[i]=new Buffer(""+args[i]);
		buf.writeUInt32BE(args[i].length,cursor);
		cursor+=4;
		args[i].copy(buf,cursor);
		cursor+=args[i].length;
	}
	//console.log("constructing message with len",len,"result:",buf);
	return buf;
}

function parseMessage(buf){
	var buflen=buf.length;
	if(buflen<4)return false;
	var len=buf.readUInt32BE(0);
	if(buflen<len)return false;
	console.log(buf.slice(0,len));
	var type=buf.readUInt8(4);
	var numargs=buf.readUInt8(5);
	var cursor=6;
	var args=new Array(numargs),arglen;
	for(var i=0;i<numargs;i++){
		//console.log("pM: i="+i);
		if(cursor+4>len)return {type:null,args:null,len:len};
		arglen=buf.readUInt32BE(cursor);
		cursor+=4;
		//console.log("pM: cursor="+cursor);
		if(cursor+arglen>len)return {type:null,args:null,len:len};
		args[i]=new Buffer(arglen);
		buf.copy(args[i],0,cursor,cursor+arglen);
		cursor+=arglen;
	}
	return {type:type,args:args,len:len};
}

function makeBufferedProtocolHandler(onmessage,obj){
	var buffer=new Buffer(0);
	return function(data){
		if(typeof data=="string")data=new Buffer(data);
		//console.log("received",data);

		//first append new data to buffer
		var tmp=new Buffer(buffer.length+data.length);
		if(buffer.length)buffer.copy(tmp);
		data.copy(tmp,buffer.length);
		buffer=tmp;
		//console.log("buffer+data",buffer);

		//then while there's a message in there
		do {
			//try to parse it
			var messageBuffer=new Buffer(buffer.length);
			buffer.copy(messageBuffer);
			var msg=parseMessage(messageBuffer);

			if(msg==false)return; //more data needed

			//console.log("messageBuffer",messageBuffer);
			//console.log("msg.len",msg.len);

			//replace buffer with the data that's left
			if(buffer.length-msg.len>0){
				tmp=new Buffer(buffer.length-msg.len);
				buffer.copy(tmp,0,msg.len);
				buffer=tmp;
			} else {
				buffer=new Buffer(0);
			}
			//console.log("buffer",buffer);

			//now all administration is done, we've got ourselves a message
			if(msg.type==null)throw new Error("Invalid message received!");
			onmessage(msg,obj,messageBuffer);
		} while(buffer.length);
	};
}

module.exports.constructMessage=constructMessage;
module.exports.parseMessage=parseMessage;
module.exports.makeBufferedProtocolHandler=makeBufferedProtocolHandler;

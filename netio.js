function constructMessage(type,args){
	var len=6+args.map(function(a){return 4+a.length;}).reduce(function(a,b){return a+b;});
	var buf=new Buffer(len);
	buf.writeUInt32BE(len,0);
	buf.writeUInt8(type,4);
	buf.writeUInt8(args.length,5);
	var cursor=6;
	for(var i=0;i<args.length;i++){
		buf.writeUInt32BE(args[i].length,cursor);
		cursor+=4;
		args[i].copy(buf,cursor);
		cursor+=args[i].length;
	}
	return buf;
}

function parseMessage(buf){
	if(buf.length<4)return false;
	
}

function sockondata(data){
	if(typeof data=="string")data=new Buffer(data);
	var tmp=new Buffer(buffer.length+data.length);
	buffer.copy(tmp);
	data.copy(tmp,buffer.length);
	buffer=tmp;

	if(buffer.length<4)return;
	var msglen=buffer.readUInt32BE(0);
	if(buffer.length<msglen)return;

	tmp=new Buffer(msglen-4);
	buffer.copy(tmp,0,4,msglen);
	onmessage(tmp,[id,conn]);

	tmp=buffer.slice(msglen+1);
	buffer=tmp;
}

function onmessage(buf,from){
	var type,args;
	type=buf.readUInt8(0);
	switch(type){
		case msgtype.file:
			break;
		case msgtype.checkout:
			break;
		case msgtype.checkin:
			break;
		default:
			throw Error("Unknown message type "+type+" received from peer");
	}
}

module.exports.sockondata=sockondata;
module.exports.onmessage=onmessage;

#!/usr/bin/env node
"use strict";

var net=require("net"),
    fs=require("fs"),
    path=require("path"),
    spawn=require("child_process").spawn,
    netio=require("./netio.js"),
    etc=require("./etc.js"),
    msgtype=require("./msgtype.js");

var conn;
var fname;
var fileIsOpen=false;

function connect(){
	conn=net.createConnection(etc.client_editsock,onconnection);
}

function onconnection(){
	conn.on("end",function(){
		console.error("Connection with server lost!");
		process.exit(1);
	});
	conn.on("data",netio.makeBufferedProtocolHandler(onmessage));
	conn.write(netio.constructMessage(msgtype.edit.open,[new Buffer(fname)]));
}

function onmessage(msg,from,messageBuffer){
	var editor,proc;
	switch(msg.type){
		case msgtype.edit.open_ok:
			fileIsOpen=true;
			process.on("exit",closeFileThing);
			process.on("SIGINT",function(){
				closeFileThing();
				process.exit(0);
			});
			editor=process.env.EDITOR;
			if(editor)editor=editor.split(" ");
			else editor=["vim"];
			console.log("Using editor '"+editor+"'");
			proc=spawn(editor[0],editor.slice(1).concat([path.resolve(fname)]),{stdio:"inherit"});
			proc.on("close",function(code){
				if(code!=0){
					console.log("'"+editor+"' exited with code "+code+"!");
				}
				conn.write(netio.constructMessage(msgtype.edit.close,[new Buffer(fname)]));
				process.exit(0);
			});
			break;
		case msgtype.edit.open_err:
			console.log("Your client does not like that you open '"+fname+"'.");
			process.exit(1);
			break;
		default:
			console.error("unknown message type "+msg.type+" received!");
			break;
	}
}

function closeFileThing(){
	conn.write(netio.constructMessage(msgtype.edit.close,[new Buffer(fname)]));
}



if(process.argv.length!=3){
	console.log("Usage: edit <file>");
	console.log("Checkouts the file in gvajnez and opens it with $EDITOR.");
	process.exit(1);
}
fname=process.argv[2];
connect(); //this will handle further protocol and actions

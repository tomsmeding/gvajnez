var fs=require("fs"),
    path=require("path"),
    etc=require("./etc.js");

var directory=process.cwd();
var currentState=[];
var ignored=[etc.client_editsock,".DS_Store"];


function updateFile(fname,mode,buf){
	fs.writeFileSync(fname,buf,{mode:mode});
}


function collectDirState(dir){
	if(!dir)dir=directory;
	console.log("collectDirState("+dir+")");
	var list=fs.readdirSync(dir);
	var result=[];
	var statinfo,i,j;
	for(i=0;i<list.length;i++){
		for(j=0;j<ignored.length;j++){
			if(etc.endsWith(path.normalize(dir+"/"+list[i]),"/"+ignored[j]))break;
		}
		if(j<ignored.length)continue;
		statinfo=fs.statSync(dir+"/"+list[i]);
		if(statinfo.isDirectory()){
			result=result.concat(collectDirState(dir+"/"+list[i]));
		} else if(statinfo.isFile()){
			result.push({
				name:path.resolve(dir+"/"+list[i]),
				mode:statinfo.mode,
				mtime:statinfo.mtime.getTime()
			});
		}
	}
	return result;
}

function collectChanges(dir,state){
	if(!dir)dir=directory;
	var i,j,obj;
	var changes=[];
	for(i=0;i<state.length;i++){
		for(j=0;j<currentState.length;j++){
			if(state[i].name==currentState[j].name)break;
		}
		if(j==currentState.length||
				currentState[j].mode!=state[i].mode||
				currentState[j].mtime!=state[i].mtime){
			//either file didn't exist yet, or metadata has changed
			changes.push(state[i]);
		}
	}
	for(i=0;i<currentState.length;i++){
		for(j=0;j<state.length;j++){
			if(currentState[i].name==state[j].name)break;
		}
		if(j==state.length){
			//file doesn't exist anymore
			changes.push(currentState[i]);
		}
	}
	return changes;
}

function attachWatcher(callback){
	var timeout={_:null}; //something that JS creates a reference to.
	_attachWatcher(timeout,directory,callback);
	var newstate=collectDirState(directory);
	var changes=collectChanges(directory,newstate).map(function(o){o.name=o.name.replace(/^\.\//,"");return o;});
	currentState=newstate;
	if(changes.length!=0)callback(changes);
}
function _attachWatcher(timeout,dir,callback){
	//this CRUFT is needed because recursive:true doesn't work on non-bsd/osx platforms
	console.log("fileio: Attaching a watcher to directory "+dir);
	var watcher=fs.watch(dir,{persistent:false,recursive:false},function(ev,fname){
		console.log("fileio: change in directory "+dir+" (fname "+fname+")");
		if(timeout._)return;
		timeout._=setTimeout(function(){
			var newstate=collectDirState(directory);
			var changes=collectChanges(directory,newstate).map(function(o){o.name=o.name.replace(/^\.\//,"");return o;});
			currentState=newstate;
			if(changes.length!=0)callback(changes);
			timeout._=null;
			console.log(currentState);
		},500);
	});
	var list=fs.readdirSync(dir);
	var i;
	for(i=0;i<list.length;i++)
		if(fs.statSync(dir+"/"+list[i]).isDirectory())
			_attachWatcher(timeout,dir+"/"+list[i],callback);
}

function ignoreFiles(fnames){
	ignored=ignored.concat(fnames);
}


module.exports.updateFile=updateFile;
module.exports.attachWatcher=attachWatcher;
module.exports.ignoreFiles=ignoreFiles;

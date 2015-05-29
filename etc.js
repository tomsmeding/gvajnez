function throw_error(s){
	console.log("ERROR: "+s);
	throw new Error(s);
}

module.exports.throw_error=throw_error;

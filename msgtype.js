module.exports={
	"file":1, // fname, mode, contents
	"filedelete":2, // fname
	"checkout":3, // fname
	"checkin":4, // fname
	"ping":5, // -
	"pong":6, // -

	"edit":{
		"open":100, // fname
		"close":101, // fname
		"open_ok":102, // fname
		"open_err":103, // fname
		"close_ok":104, // fname
		"close_err":105 // fname
	}
};

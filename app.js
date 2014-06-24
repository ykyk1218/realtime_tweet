var express = require('express');
//var http   = require('http').Server(app);
//var path   = require('path');
//var routes = require('./routes');
//var user   = require('./routes/user');
var twitter = require('ntwitter');
var conf = require('config');
var twitter = new twitter({
  consumer_key: conf.twitter.consumer_key,
  consumer_secret: conf.twitter.consumer_secret,
  access_token_key: conf.twitter.access_token_key,
  access_token_secret: conf.twitter.access_token_secret 
});

require('date-utils');


var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://localhost/tweet');
var schema = new mongoose.Schema({tweet:{type:String}, created_at:{type:String}});
var Tweet = db.model('tweet', schema);

var app = express();
//var io = require('socket.io').listen(app);

// all environments
//app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
/*
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
*/
app.use(express.static(__dirname + '/assets'));

var server = require('http').Server(app);
/*
var keywords = [
	'#WorldCup',
	'#ワールドカップ',
	'#wcup2014',
	'#ワールドカップ2014',
	'#W杯',
	'#絶対に負けられない戦い',
	'#日本代表',
	'#daihyo',
	'#Brazil2014',
	'#JPN'
];
*/

var keywords = [
	'#daihyo',
	'#JPN'
];
var keyword = 'サッカー';
var counters = new Array();
var twId = 0;
var io = require('socket.io')(server);
var fs = require('fs');
var j =0;
var dataFolder = './data/';

for(var i=0; i<keywords.length; i++) {
	fs.readFile(dataFolder + i + '_count.txt', function(e, text) {
		if(text.toString() != "undefined") {
		//if(!e) {
		console.log(text.toString());
			counters.push(text.toString());
		}
		//}
	});
}

app.get('/', function(req, res) {
	res.render('index', { title: 'Express Sample', keywords: keywords });

		twitterstream(0, 0);
		twitterstream(0, 1);
		/*
		twitterstream(0, 2);
		twitterstream(0, 3);
		twitterstream(0, 4);
		twitterstream(0, 5);
		twitterstream(0, 6);
		twitterstream(0, 7);
		twitterstream(0, 8);
		twitterstream(0, 9);
		*/
		
});


/*
io.on('connection', function(socket) {
	socket.emit('news', {hello: 'world'});
	socket.on('my other event', function(data) {
		console.log(data);
	});
});
*/
//io.set('log_level',1);
server.listen(1337);


function twitterstream(twId, indexNum) {
		twitter.stream('statuses/filter', {'track': keywords[indexNum]},function(stream) {
			stream.on('data', function(data) {
				if(twId < data.id) {
					if(data.user.lang == "ja" && data.text.indexOf("RT")) {
						counters[indexNum]++;
						fs.writeFile(dataFolder + indexNum + '_count.txt', counters[indexNum],  function(e) {
							console.log(e);
						});

						var now = new Date();
						var year = now.getFullYear() + "";
						var month = now.getMonth() + 1 + "";
						var day = now.getDate() + "";
						var hour = now.getHours() + "";
						var minutes = now.getMinutes() + "";
						var seconds = now.getSeconds() + "";	
						fs.writeFile(dataFolder + indexNum + '_count.txt.' + year + month + day + hour + minutes, counters[indexNum],  function(e) {
							console.log(e);
						});

						var time = now.toFormat("YYYY/MM/DD HH24:MI:SS");
						var mTweet = new Tweet({tweet: data.text, created_at: time});
						mTweet.save(function(err) {
							console.log(err);
						});

						twId = data.id;
						io.sockets.emit('mes_' + indexNum, {"text": data.text, "counter": counters[indexNum]});
					}
				}
			});
			stream.on('end', function(response) {
				//接続が切れた場合の処理
			});
			stream.on('destroy', function(response) {
				//接続が破棄された場合の処理
			});
			stream.on('error', function(e) {
				console.log(e);
			});
		});
}

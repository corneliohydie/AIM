var max7219lib = require('node-max7219-led-matrix');
var max7219 = new max7219lib.max7219("/dev/spidev0.0");
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require ('express-handlebars');
var expressValidator =  require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var MikroNode = require('mikronode-ng');
var randomstring = require('randomstring');
var os = require('os');
var randomstring = require('randomstring');
const pisoval = 12;
//const raspi = require('raspi');
//const Serial = require('raspi-serial').Serial;
var Gpio = require('onoff').Gpio
var coin_waitflg = false;
var cvaldly = false;
var cval = 0;
getcoinINT();
var gvar = require('./src/routes/index');

const RPI_IPADDR = '';
const RPI_USERNAME = 'admin';
const RPI_PASSWORD = '';

var mknodecmd = require('./mknodecmd');
var hwhbactiveflg = false;
//gethwheartbeats(10000);


//console.log(os.cpus());
/*
raspi.init(() => {
  var serial = new Serial();
  serial.open(() => {
    serial.write('Hello from raspi-serial');
    serial.on('data', (data) => {
      process.stdout.write(data);
    });
  });
});
*/
var strRandom = randomstring.generate(4);
var uptimelim = '03:00:00';
var byteslim = '2M';
var paramdata = ['=name=' + strRandom,'=limit-uptime='+uptimelim,'=limit-bytes-total='+byteslim];

//mknodecmd.GenUser(paramdata);
var timeoutHndler = [];
var cointHndler = [];

function addvoucher(coinval){
	var strRandom = randomstring.generate(4);
	var uptlim = "";
	var i=0;
	console.log('coinval d1 ' + coinval);
	for (;((coinval>=20)&&(i<5));i++){
		coinval = coinval - 20;
	}
	console.log('coinval d2 ' + coinval);
	console.log('i       d3 ' + i);
	if(i>0){
		uptlim = i+'d ';
	}
	uptlim = uptlim + pisoconversionfn(coinval);
	console.log('kkkkkk    ' + strRandom + "  Lim  " + uptlim);
	mknodecmd.GenUser(['=name=' + strRandom,'=limit-uptime='+uptlim]);
}
function pisoconversionfn(value){
	if (value<=0){return '00:00:00';}
	var tmpv = pisoval * value;
	var i = 0;
//	console.log('tmpv    d4 ' + tmpv);
	for (;tmpv>=60;i++){
		tmpv = tmpv - 60;
	}
//	console.log('tmpv    d5 ' + tmpv);
//	console.log('i       d6 ' + i);
	if (tmpv>=10){
		return '0'+i+':'+tmpv+':00';
	}
	return '0'+i+':0'+tmpv+':00';
}
function getcoinINT(){
	console.log('Please press the button on GPIO #18...');
//	var blinkInterval = setInterval(blinkLED, 250); //run the blinkLED function every 250ms
	var LED = new Gpio(4, 'out'); //use GPIO pin 4, and specify that it is output

	button = new Gpio(17, 'in', 'both');
	button.watch(function (err, value) {
		if (err) throw err;

		console.log('GPIO coin: ' + value);
		//LED.writeSync(value);
		if(value == 1){
			cval++;
		}
		if(cvaldly){
/*			if (coin_waitflg){
				setTimeout(updtecval(),9000);
			}else{
			}
*/			console.log('+++**** true');
			clearTimeout(timeoutHndler);
			timeoutHndler = setTimeout(cvaldlyfn,4000);
			clearTimeout(cointHndler);
		}
		else{
			console.log('+++**** false');
			cvaldly = true;
			timeoutHndler = setTimeout(cvaldlyfn,4000);
		}
		//button.unexport(); // Unexport GPIO and free resources
	});
}
function cvaldlyfn(){
	console.log('++++++++++++++++++++++++++++++++++++done cval:  ' + cval);
	cvaldly = false;
	if (coin_waitflg){
		clearTimeout(cointHndler);
		cointHndler = setTimeout(coinwdlyfn,8000);

	}else{
		coin_waitflg = true;
		cointHndler = setTimeout(coinwdlyfn,12000);
	}
}
function coinwdlyfn(){
	console.log('++++++++$$$$$$$$$$$$$$$$$$$$$$$$$$$$44 final cval:  ' + cval);
	coin_waitflg = false;
	addvoucher(cval);
	cval = 0;

}

function check_HW_STAT(){
	var cpus = os.cpus();
	var cpustat = "CPU's: ";
	var memt = os.totalmem();
	var memf = os.freemem();
	gvar.gvar.rpiMEM.set(memf + '  : ' + Math.round(100 * memf / memt) + '% Used');

	for(var i = 0, len = cpus.length; i < len; i++) {
	//    console.log("CPU %s:", i);

		var cpu = cpus[i], total = 0;

		for(var type in cpu.times) {
			total += cpu.times[type];
		}
			cpustat += '[' + i + ']: ' + (100 - Math.round(100 * cpu.times['idle'] / total)) + '%  ';
		/*
		for(type in cpu.times) {
			console.log("\t",type, Math.round(100 * cpu.times[type] / total));
		}
		*/
	}
	console.log('cpustat',cpustat);
	gvar.gvar.rpiCPU.set(cpustat);
	//console.log('gvar', gvar.gvar.rpiCPU.get());
}

gvar.gvar.rpiIP.set(getrpiIPADDR(os.networkInterfaces()));

/*
max7219.setBrightness(7);
max7219.setBrightness(7);
max7219.setBrightness(7);
max7219.clear();
max7219.cls();
*/
/*
max7219.letterx('A',1);
max7219.letterx('I',2);
max7219.letterx('M',3);
max7219.letterx(3,4);
*/
/*
max7219.letterx('B',1);
max7219.letterx('P',2);
max7219.letterx('I',3);
max7219.letterx('T',4);
*/
expressSRV();
//webserver();


//jsloop(3000);
function getrpiIPADDR(intobj){
	var addresses = [];
	for (var k in intobj) {
	   for (var k2 in intobj[k]) {
		   var address = intobj[k][k2];
		   if (address.family === 'IPv4' && address.address !== '127.0.0.1' && !address.internal){
			   addresses.push(address.address);
		   }
	   }
	}
	if (addresses[0]){
		return addresses[0]
	}else { return 0}
}
function expressSRV(){
	var routes = require('./src/routes/index');
	//Init app
	var app = express();
	var server = require('http').createServer(app);
	var io = require('socket.io')(server);
	app.set('views',path.join(__dirname,'./src/views'));
	app.engine('handlebars',exphbs({defaultLayout:'../../src/views/layouts/layout'}));
	app.set('view engine','handlebars');
	//bodyParser Middleware

	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({extended:false}));
	app.use(cookieParser());
	//Set Static Folder
	app.use(express.static(path.join(__dirname,'public')));
	//Express session
	app.use(session({
		secret: 'secret',
		saveUninitialized: true,
		resave: true
	}));
	//Express Validator
	app.use(expressValidator({
		errorFormatter: function(param, msg, value){
			var namespace = param.split('.')
			,root = namespace.shift()
			,formParam = root;
			while (namespace.length) {
				formParam +='[' + namespace.shift() + ']';
			}
			return {
				param: formParam,
				msg: msg,
				value: value
			};
		}
	}));
	//Connect flash
	app.use(flash());
	//Global Vars
	app.use(function(req,res,next){
	 res.locals.success_msg = req.flash('success_msg');
	 res.locals.error_msg = req.flash('error_msg');
	 res.locals.error = req.flash('error');
	 next();
	 });
	 app.use('/',routes.routes);
	//
	server.listen(80);
	console.log('starting sockets connection...');
	io.on('connection',function(client){
		console.log('Client connected...');
		client.on('join',function(data){
			console.log(data);
			client.emit('messages','hellow from server');
		});

	});
/*
	app.set('port',(process.env.PORT || 3003));
	app.listen(app.get('port'),function() {
   	console.log('Server started on port ' + app.get('port'));
 	});
*/
}

function checkipsla(cb){
	console.log('1st');
	var promise = new Promise(function(resolve,reject){
		mktkcmd('/ping',['=address=4.2.2.2','=count=4'],function(val){
			if (val.length>0 || val.toString().indexOf("ms")!=-1){
				resolve(1);
			}else{
				resolve(0);
			}
		});
	});
	promise.then(pipslabool2).then(pipslabool3).then(function(ctr){
		cb(ctr);
	});
}
function pipslabool2(ctr){
	return new Promise(function(resolve,reject){
		mktkcmd('/ping',['=address=208.67.222.222','=count=4'],function(val){
			if (val.length>0 || val.toString().indexOf("ms")!=-1){
				console.log('2nd + ' + (ctr+1),val);
				resolve(ctr + 1);
			}else{
				console.log('2nd' + ctr);
				resolve(ctr);
			}
		});
	});
}
function pipslabool3(ctr){
	return new Promise(function(resolve,reject){
		mktkcmd('/ping',['=address=8.8.8.8','=count=4'],function(val){
			if (val.length>0 || val.toString().indexOf("ms")!=-1){
				console.log('3rd + ' + (ctr+1),val);
				resolve(ctr + 1);
			}else{
				console.log('3rd' + ctr);
				resolve(ctr);
			}
		});
	});
}
function gethwheartbeats(hwhbdelay,cb){
	setTimeout(function(){
		console.log("+++++hwhb delay " + hwhbdelay);
		checkipsla(function(retval){
			if(retval>1){
				console.log('with internet');
			}else{
				console.log('without internet');
			}
		});
		check_HW_STAT();
		if (hwhbactiveflg){
			gethwheartbeats(10000);
		}else{
			gethwheartbeats(hwhbdelay);
		}
	},hwhbdelay)
}
function GenUser(userparams){
	if(userparams){
		mktkcmd('/ip/hotspot/user/add',userparams,function(cbval){
			console.log("cbval " + cbval);
		});
		return 'ok';
	}else{
		return 'Missing value, user params required!';
	}
}
function mktkcmd(cmd,params,cb){
	var connection = MikroNode.getConnection(RPI_IPADDR, RPI_USERNAME,RPI_PASSWORD);
    connection.closeOnDone = true;
    connection.connect(function(conn) {
        try
        {
			var chan = conn.openChannel();
			chan.closeOnDone = true;
			if(params){
				chan.write([cmd].concat(params), function(c) {
							c.on('trap', function(data) {
								cb(['trap',data]);
							});
							c.on('done', function(data) {
								cb(parsemkdata(cmd,data));
							});
						});
			}else{
				chan.write(cmd, function(c) {
					c.on('trap', function(data) {
						cb(['trap',data]);
					});
					c.on('done', function(data) {
						cb(data);
					});
				});
			}

		}catch(e){
			cb(['err',e]);
		}
    });
}
function parsemkdata(cmd,val){
	var arrx = [];
	if (cmd='/ping'){
		for(i=0;i<4;i++){
			try{
				var tmp =val[i][10].split('=avg-rtt=');
				if (tmp.length = 2){
					arrx.push(tmp[1]);
				}
			}catch(err){
			}
		}
	}else{
		return val;
	}
	return arrx;
}
/*
function webserver(){
	var http = require('http').createServer(handler); //require http server, and create server with function handler()
	var fs = require('fs'); //require filesystem module
	var io = require('socket.io')(http) //require socket.io module and pass the http object (server)
	var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
	var LED = new Gpio(4, 'out'); //use GPIO pin 4 as output
	var pushButton = new Gpio(17, 'in', 'both'); //use GPIO pin 17 as input, and 'both' button presses, and releases should be handled

//	http.listen(8080); //listen to port 8080

	function handler (req, res) { //create server
	  fs.readFile(__dirname + '/public/index.html', function(err, data) { //read file index.html in public folder
		if (err) {
		  res.writeHead(404, {'Content-Type': 'text/html'}); //display 404 on error
		  return res.end("404 Not Found");
		}
		res.writeHead(200, {'Content-Type': 'text/html'}); //write HTML
		res.write(data); //write data from index.html
		return res.end();
	  });
	}

	io.sockets.on('connection', function (socket) {// WebSocket Connection
	  var lightvalue = 0; //static variable for current status
	  pushButton.watch(function (err, value) { //Watch for hardware interrupts on pushButton
		if (err) { //if an error
		  console.error('There was an error', err); //output error message to console
		  return;
		}
		lightvalue = value;
		socket.emit('light', lightvalue); //send button status to client
	  });
	  socket.on('light', function(data) { //get light switch status from client
		lightvalue = data;
		if (lightvalue != LED.readSync()) { //only change LED if status has changed
		  LED.writeSync(lightvalue); //turn LED on or off
		  loopstat = lightvalue;
		  console.log("lightvalue = " + lightvalue);
		  if (loopstat) {
			  jsloop(4000);
		  }
		}
	  });
	});

	process.on('SIGINT', function () { //on ctrl+c
	  LED.writeSync(0); // Turn LED off
	  LED.unexport(); // Unexport LED GPIO to free resources
	  pushButton.unexport(); // Unexport Button GPIO to free resources
	  process.exit(); //exit completely
	});
}
*/

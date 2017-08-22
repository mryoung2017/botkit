require('dotenv').load();

var Redshift = require('node-redshift');
var SQL = require('sql-template-strings');
var session_duration = 1;

var fs = require('fs');
var buf = new Buffer(1024);

var client = {
  user: process.env.Redshift_user,
  database: process.env.Redshift_database,
  password: process.env.Redshift_password,
  port: process.env.Redshift_port,
  host: process.env.Redshift_host
};

var redshift  = new Redshift(client);
					
if (!process.env.Redshift_user) {
    console.log('Error: Specify Redshift_user in environment');
    process.exit(1);
}

if (!process.env.Redshift_database) {
    console.log('Error: Specify Redshift_database in environment');
    process.exit(1);
}

if (!process.env.Redshift_password) {
    console.log('Error: Specify Redshift_password in environment');
    process.exit(1);
}

if (!process.env.Redshift_port) {
    console.log('Error: Specify Redshift_port in environment');
    process.exit(1);
}

if (!process.env.Redshift_host) {
    console.log('Error: Specify Redshift_host in environment');
    process.exit(1);
}

function session_update() {
	fs.open("./lib/storage/session_counter.txt", 'r+', function(err, fd) {
		if (err) {
			return console.log(err);
		}
		fs.readFile(fd, function(err, session_overall_number){
			if (err){
				console.log(err);
			}

			// Print only read bytes to avoid junk.
			 if(session_overall_number){
				session_overall_number++;
				fs.writeFile(fd, session_overall_number, function(err){
					if (err){
						console.log(err);
					}
				});
			 }
			
			// Close the opened file.
			fs.close(fd, function(err){
				if (err){
					console.log(err);
				} 
			});
		});
	});
	
	var data_temp = fs.readFileSync("./lib/storage/session_counter.txt");
	
	var data = data_temp.toString();
	
	return data;
	
}

function dateAdd(date, interval, units) {
  var ret = new Date(date); //don't change original date
  var checkRollover = function() { if(ret.getDate() != date.getDate()) ret.setDate(0);};
  switch(interval.toLowerCase()) {
    case 'year'   :  ret.setFullYear(ret.getFullYear() + units); checkRollover();  break;
    case 'quarter':  ret.setMonth(ret.getMonth() + 3*units); checkRollover();  break;
    case 'month'  :  ret.setMonth(ret.getMonth() + units); checkRollover();  break;
    case 'week'   :  ret.setDate(ret.getDate() + 7*units);  break;
    case 'day'    :  ret.setDate(ret.getDate() + units);  break;
    case 'hour'   :  ret.setTime(ret.getTime() + units*3600000);  break;
    case 'minute' :  ret.setTime(ret.getTime() + units*60000);  break;
    case 'second' :  ret.setTime(ret.getTime() + units*1000);  break;
    default       :  ret = undefined;  break;
  }
  return ret;
}
	
var Session = {
			get: function( user_data , time_now, last_session_data) {

				// If user exists :
				if (user_data) {
				
						// If session has expired
						if ( last_session_data.timeout < time_now ) {
							
							// Create a new session :						
							var session_uuid = session_update();
							var session_timeout = dateAdd(time_now, 'minute', session_duration);
							
						}
						// If session has not expired :
						else {
							
							// Keep session uuid and add time
							var session_uuid = user_data.last_session;
							var session_timeout = dateAdd(time_now, 'minute', session_duration);
							
						}
						
						return {timeout : session_timeout,
								uuid : session_uuid};
						
				}
				else {
						var session_uuid = session_update();
						var session_timeout = dateAdd(time_now, 'minute', session_duration);
						
						// Create new session :
						
						var new_session = session_update();
						
						return {timeout : session_timeout,
								uuid : session_uuid};
								
				}
			}
}

module.exports = Session;
	
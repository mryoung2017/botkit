var uuidv1 = require('uuid/v1');

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
			get: function( user_data , time_now, last_session_data ) {
				// If user exists :


				if (user_data) {

           if ( typeof(last_session_data.timeout) == "string") {
             last_session_data.timeout = new Date(last_session_data.timeout);
           };
					// If session has expired
					if ( last_session_data.timeout < time_now ) {
						// Create a new session :
						var session_uuid = 'ses-'+uuidv1();
						console.log('New session : '+session_uuid);
						var session_timeout = dateAdd(time_now, 'minute', Session.session_duration);
						return {timeout : session_timeout,
										uuid : session_uuid};
					}
					// If session has not expired :
					else {
						// Keep session uuid and add time
						var session_uuid = user_data.last_session;
						var session_timeout = dateAdd(time_now, 'minute', Session.session_duration);
						return {timeout : session_timeout,
								uuid : session_uuid};
					}
				}
				else {

					// Create new session :
					var session_uuid = 'ses-'+uuidv1();
					console.log('New session : '+session_uuid);
					var session_timeout = dateAdd(time_now, 'minute', Session.session_duration);

					return {timeout : session_timeout,
							uuid : session_uuid};

				}
			}
}

module.exports = Session;

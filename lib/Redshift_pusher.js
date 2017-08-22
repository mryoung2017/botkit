	
/* 
redshift.query(SQL`SELECT * FROM users WHERE user_uuid=${FB_user_id}`, {raw: true})
	.then(function(user) {
		// If users doesn't exist in DB
		
		if (!user) {
			redshift.query(SQL`INSERT INTO users (user_uuid) VALUES (${FB_user_id})`, {raw: true})
			.then(function(){
				redshift.query(SQL`INSERT INTO sessions (sess_uuid, start_time) VALUES (${API_sess_uuid},${time_stamp})`, {raw: true})
				.then(function(){
					redshift.query(SQL`SELECT * FROM users WHERE user_uuid=${FB_user_id}`, {raw: true})
					.then(function(user){
						var userid = user[0].id;				
						redshift.query(SQL`UPDATE sessions SET userid=${userid} WHERE sess_uuid=${API_sess_uuid}`, {raw: true})
						.then(function(){
							redshift.query(SQL`SELECT * FROM sessions WHERE userid=${userid}`, {raw: true})
							.then(function(session){

								
								
									
								}).catch(function(err){
									console.log(err);
								});	
								
							})
							.catch(function(err){
							console.log(err);
							});
						})
						.catch(function(err){
						console.log(err);
						});
					})
					.catch(function(err){
					console.log(err);
					});	
				})
				.catch(function(err){
					console.log(err);
				});
			})
			.catch(function(err){
			console.log(err);
			});
			});
		}
		// If User already exists in DB:
		else {

			var userid=user[0].id;
			
			// Get past sessions from this user
			redshift.query(SQL`SELECT * FROM sessions WHERE userid = ${userid} ORDER BY id DESC;`, {raw: true})
			.then(function(session){
								
				
				var last_session = session[0].sess_uuid;		//Get last_session ID from DB
				
				// If user is still in the same session
				if (last_session === API_sess_uuid) {
					

				}
				
				// If new session started
				else {
					
					redshift.query(SQL`INSERT INTO sessions (sess_uuid, start_time, userid) VALUES (${API_sess_uuid},${time_stamp}, ${userid})`, {raw: true})
					.then(function(){
						
						var current_node = null;			// Convert current_node string to Int
						var current_node_childs = null;		// Get current node childs
						
						Promise.resolve(node_search(dialog, current_node, current_node_childs, message)).then(function(found_node){
							console.log('input context : '+ found_node.input_context);
							fb_send(bot, message, found_node.output);
						}).catch(function(err){
							console.log(err);
						});
						
					})
					.catch(function(err){
						console.log(err);
					});
				};	
			})
			.catch(function(err){
				console.log(err);
			});
		}
	})
	.catch(function(err){
	  console.log(err);
	});	 */
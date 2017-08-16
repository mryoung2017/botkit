
function node_search(dialog, current_node, current_node_childs, message){

	if (current_node_childs != null) {

		//Check in each child node if intent is matched
		for (let i=0; i < current_node_childs.length; i++) {
			
			// If intent is matched :
			if (dialog.child_nodes[parseInt(current_node_childs[i])].intent_name === message.nlpResponse.result.action) {					
				
				//if found child node has childs
				if (dialog.child_nodes[parseInt(current_node_childs[i])].childs != null && dialog.child_nodes[parseInt(current_node_childs[i])].childs.length > 0){
					
					return {
						id: dialog.child_nodes[parseInt(current_node_childs[i])].uuid,
						input_context : dialog.child_nodes[parseInt(current_node_childs[i])].id,
						output : dialog.child_nodes[parseInt(current_node_childs[i])].output	
						}
					
				}
				
				//if found node has NO childs
				else if (dialog.child_nodes[parseInt(current_node_childs[i])].childs == null || dialog.child_nodes[parseInt(current_node_childs[i])].childs.length == 0) { 
					
					return {
						id: dialog.child_nodes[parseInt(current_node_childs[i])].uuid,
						input_context : null,
						output : dialog.child_nodes[parseInt(current_node_childs[i])].output	
						}
					
				};
				search_in_root_nodes = false;
				break;
			}					
			// If no intent is matched in child nodes :
			else { 
				
				search_in_root_nodes = true;
			}
		}
		};
		
	if (current_node_childs == null || search_in_root_nodes) {
		
		//Check in each root node if intent is matched
		for (var i=0; i < dialog.root_nodes.length; i++) {
			
			// If intent is matched
			if (dialog.root_nodes[i].intent_name === message.nlpResponse.result.action) {
				
				
				//fb_send(message, found_node.output);				//send content	
				
				//if found node has childs
				if (dialog.root_nodes[i].childs != null && dialog.root_nodes[i].childs.length > 0 ){
					
					return {
						id: dialog.root_nodes[i].uuid,
						input_context : dialog.root_nodes[i].id,
						output : dialog.root_nodes[i].output	
						}
					
					
				}
				
				//if found root node has NO childs
				else if (dialog.root_nodes[i].childs == null || dialog.root_nodes[i].childs.length ==0 ) {
					
					return {
						id: dialog.root_nodes[i].uuid,
						input_context : null,
						output : dialog.root_nodes[i].output	
						}
					
				}
				
				search_in_root_nodes = false;
				break;
				
			}
			// If no intent matched at all
			else { 
				
				console.log('no node found');
				bot.reply(message, 'no node found')
			}
		}
	};
	
	
}



module.exports = node_search;
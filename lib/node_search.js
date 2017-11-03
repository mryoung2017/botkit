var _ = require('lodash') ;

function nodeSearch(dialog, current_node, current_node_childs, current_node_fallback, message, user_data){

	var conditionsMatch = function(node) {

		var conditions = node.conditions;

		var filterIntent = function() {
			return Promise.resolve( _.filter(conditions, (condition) => {
				if (condition === undefined || condition === " ") {
					return condition;
				}
				 return (condition.intent === message.intent)
			}));
		}

		var filterEntities = function(conditions_to_filter) {
			return _.filter(conditions_to_filter, (condition) => {

				if (condition.entities.length === 0) {
					return conditions_to_filter;
				}
				var NLP_entities = _.keys(message.entities);
				let NLP_entities_values = _.flatMap(message.entities, entity => entity);

				// Returns true if `message.result.parameters`contains all elements in `condition.entities`
				return condition.entities.every((entity) => {
					// Seperate the entity from its value in the condition entity
					let entity_value = entity.split(':');

					// If the condition entity is not matched
					if (NLP_entities.indexOf(entity_value[0]) === -1) {
						return false;
					}
					// If there is no specified value, return true if the entity is matched
					if (entity_value.length === 1) {
						return true;
					}
					// Else if the value is specified in the condition,
					// return true if it exists in the NLP response
					return (NLP_entities_values.indexOf(entity_value[1]) >= 0);

				});
			})
		};

		var filterContexts = function(conditions_to_filter) {
			if (user_data === undefined) {
				return conditions_to_filter;
			}
			if (conditions_to_filter.length === 0) {
				return conditions_to_filter;
			}
			return _.filter(conditions_to_filter, (condition) => {
				if (conditions_to_filter.contexts.length === 0) {
					return false;
				}
				var cond = condition.contexts.replace( /\s/g, "").toLowerCase();
				var context_key = cond.split(':',1);
				var context_value = clean_condition.split(':')[1];
				return user_data[context_key] == context_value;
			})
		}

		var getNode = function(filtered_conditions) {
			if (filtered_conditions == undefined && filtered_conditions.length < 1) {
				return node;
			}
			else {
				setTimeout(function () {
					return;
				}, 500);
			}
		}

		return filterIntent()
		.then(filterEntities)
		.then(filterContexts)
		.then(getNode)
		.then(getInfosFromNode)

	}

	var getInfosFromNode = function(node) {
		return new Promise(function(resolve, reject) {
			if (node !== undefined) {
				let has_fallback_or_child =
				node.childs != null && node.childs.length > 0
				||	node.fallback != null && node.childs.fallback > 0;

				if (has_fallback_or_child){
					return reject({
						id: node.uuid,
						input_context : node.id,
						output : node.output,
						tag: node.tag
					})
				}
				else {
					return reject({
						id: node.uuid,
						input_context : "null",
						output : node.output,
						tag: node.tag
					})
				}
			}
			else {
				return resolve();
			}
		});
	}

	function searchInTitle(node) {
		var user_input = message.text.toLowerCase()
		return new Promise((resolve, reject) => {

			var title_matches = node.title.toLowerCase() === user_input;

			if (title_matches) {
				var has_fallback_or_child =
				node.childs != null && node.childs.length > 0 || node.fallback != "";

				if (has_fallback_or_child){
					return reject({
						id: node.uuid,
						input_context : node.id,
						output : node.output,
						tag: node.tag
					})
				}
				else {
					return reject({
						id: node.uuid,
						input_context : "null",
						output : node.output,
						tag: node.tag
					})
				}
			}
			else {
				return setTimeout(function() {
					return resolve('TESSST')
				}, 1)
			}
		})
	}

	function searchInRootTitles() {
		var searchInTitles = dialog.root_nodes.map(root_node => searchInTitle(root_node));
		return Promise.all(searchInTitles)
	}

	function searchInChildTitles() {
		var searchInTitles = child_nodes.map(child_node => searchInTitle(child_node))
		return Promise.all(searchInTitles)
	}

	function searchConditionsInRootNodes() {
		var root_promises = dialog.root_nodes.map(root_node => conditionsMatch(root_node));
		return Promise.all(root_promises);
	}

	function searchConditionsInChildNodes() {
		var child_promises = child_nodes.map(child_node => conditionsMatch(child_node));
		return Promise.all(child_promises);
	}

	function searchInFallbackNodes() {
		return new Promise(function(resolve, reject) {
			console.log("fallback node found : "+parseInt(current_node_fallback));

			var fallback_node = dialog.fallback_nodes[parseInt(current_node_fallback)];
			var not_default_fallback = fallback_node.parent_node != null
			&& fallback_node.parent_node.length > 0;

			if (not_default_fallback) {

				var has_fallback_or_child =
				fallback_node.childs != null
				&&	fallback_node.childs.length > 0
				|| fallback_node.fallback != null
				&& fallback_node.fallback.length > 0;

				if (has_fallback_or_child) {
					return reject({
						id: fallback_node.uuid,
						input_context : fallback_node.id,
						output : fallback_node.output,
						tag: fallback_node.tag
					})
				}
				else {
					return reject({
						id: fallback_node.uuid,
						input_context : "null",
						output : fallback_node.output,
						tag: fallback_node.tag
					})
				}
			}
		});
	}

	if (current_node_childs != null) {

		var child_nodes_indexes = current_node_childs.map(index => parseInt(index))
		var child_nodes = [];
		for (var i = 0; i < child_nodes_indexes.length; i++) {
			child_nodes.push(dialog.child_nodes[child_nodes_indexes[i]]);
		}

		//Check in each child node if title is matched
		return searchInChildTitles()
		.then(searchConditionsInRootNodes)
		.then(searchInRootTitles)
		.then(searchConditionsInChildNodes)
		.then(searchInFallbackNodes)
		.then(() => {
			console.log('No node found, giving default fallback');
			return Promise.resolve({
				id: dialog.fallback_nodes[0].uuid,
				input_context : current_node,
				output : dialog.fallback_nodes[0].output,
				tag: "null"
			})
		})
		.catch((result) => {
			if (result.id !== undefined) {
				console.log('Found node : ', result);
				return Promise.resolve(result)
			}
			else {
				return Promise.reject(result)
			}
		})
	}
	// If current node has no child or the intent was not matched in child nodes
	else {

		return searchInRootTitles()
		.then(searchConditionsInRootNodes)
		.then(() => {
			console.log('No node found, giving default fallback');
			return Promise.resolve({
				id: dialog.fallback_nodes[0].uuid,
				input_context : current_node,
				output : dialog.fallback_nodes[0].output,
				tag: "null"
			})
		})
		.catch((result) => {
			if (result.id !== undefined) {
				console.log('Found node : ', result);
				return Promise.resolve(result)
			}
			else {
				return Promise.reject(result)
			}
		})
	}
};


module.exports = nodeSearch;

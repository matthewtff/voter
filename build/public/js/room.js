(function () {
	
	function moveToHomePage() {
		document.location.href = '/html/index.html';
	}
	
	function onMessageReceived(response) {
		if (response['command'] == 'chat_message') {
			var user = response['user_id'];
			var message = response['data'];
			document.write('<p><b>' + user + '</b> ' + message + '</p>');
		}
	}
	
	function main() {
		var room_info = utils.getRoomInfo();
		if (!room_info) {
			moveToHomePage();
		}
	};

	main();
})();
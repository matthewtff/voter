(function () {

  var room = this;
  var room_info = null;
  var user_info = null;

  function moveToHomePage() {
    document.location.href = '/html/index.html';
  }

  function registerUser(room_id) {
    var pretend_long_poll = onMessageReceived.bind(room, true);
    utils.runHttpRequest('/room?command=add_user&id=' + room_id, pretend_long_poll);
  }

  function removeUser(user_id) {
    utils.runHttpRequest('/user?command=remove_user&id=' + user_id, onMessageReceived);
  }

  function makeLongPoll(user_id) {
    var kBadId = "<bad_id>";
    var id = kBadId;
    if (user_id) {
      id = user_id;
    } else if (user_info) {
      id = user_info.user_id;
    }
    if (id == kBadId) {
      console.error("Longpoll to unkown user id performed.");
      return;
    }
    var callback = onMessageReceived.bind(room, true);
    utils.runHttpRequest('/user?command=long_poll&id=' + id, callback);
  }

  function onMessageReceived(is_long_poll, response) {
    if (typeof is_long_poll !== "boolean") {
      response = is_long_poll;
      is_long_poll = false;
    }
    if (response['command'] == 'chat_message') {
      var user = response['user_id'];
      var message = response['data'];
      utils.write(user + ' : ' + message);
    } else if (response['command'] == 'user_info') {
      user_info = response['data'];
      utils.write(user_info.user_name);
      utils.saveUserInfo(user_info);
      window.addEventListener('beforeunload', removeUser.bind(room, user_info.user_id));
    } else if (response['command'] == 'admin_selected') {
      utils.write('Admin selected: ' + response['data'].user_name);
    }

    if (is_long_poll) {
      makeLongPoll();
    }
  }

  function main() {
    room_info = utils.getRoomInfo();
    if (!room_info) {
      moveToHomePage();
    }
    utils.write('Room #' + room_info.room_id);
    registerUser(room_info.room_id);
  };

  main();
})();
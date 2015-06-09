(function () {

  var default_room_number = "Enter room number";

  function removeHelp() {
    var room_input = document.querySelector('.room .input-inner');
    //room_input.style.opacity = 0.5;
    if (room_input.textContent == default_room_number) {
      room_input.textContent = "";
    }
  }

  function returnHelp() {
    var room_input = document.querySelector('.room .input-inner');
    room_input.style.opacity = 0.5;
    if (room_input.textContent.length == 0) {
      room_input.textContent = default_room_number;
    }
  }

  function registerEventListeners() {
    var create_room_element = document.querySelector('.create-room .button-inner');
    create_room_element.addEventListener('click', createRoom);

    var join_room_element = document.querySelector('.join .button-inner');
    join_room_element.addEventListener('click', checkRoomAndJoin);

    var room_input = document.querySelector('.room .input-inner');
    room_input.addEventListener('focus', removeHelp);
    room_input.addEventListener('blur', returnHelp);
  }

  function createRoom() {
    utils.runHttpRequest("/room-manager?command=create_room", onMessageReceived);
  }

  function checkRoomAndJoin() {
    var room_number_element = document.querySelector('.room .input-inner');
    if (room_number_element.textContent == default_room_number) {
      return;
    }
    var room_number = utils.parseInt(room_number_element.textContent);
    getRoomList(function (response) {
      if (response['command'] != 'rooms_list') {
        return;
      }
      response['data'].forEach(function (room_info) {
        if (room_number == room_info.room_id) {
          moveToRoom({ room_id: room_number });
        }
      });
    });
  }

  function getRoomList(callback) {
    utils.runHttpRequest("/room-manager?command=get_all_rooms", callback);
  }

  function onMessageReceived(message) {
    if (message['command'] == 'room_info') {
      // We schedule move to room to be able to handle other messages, if any.
      return setTimeout(moveToRoom, 0, message['data']);
    }
  }

  function moveToRoom(room_info) {
    utils.saveRoomInfo(room_info);
    document.location.href = '/html/room.html';
  }

  registerEventListeners();

})();

var utils = (function () {

  var kRoomInfoPath = 'room.info';
  var kUserInfoPath = 'user.info';

  function runHttpRequest(url, callback) {
    var req = new XMLHttpRequest();
    req.open("GET", url);
    req.onreadystatechange = function () {
      if (req.readyState == 4 && req.status == 200) {
        // Server always responses a bunch of messages.
        // So call callback for every of them.
        JSON.parse(req.response).forEach(function (message) {
          callback(message);
        });
      }
    };
    req.send();
  }

  function saveRoomInfo(room_info) {
    localStorage.setItem(kRoomInfoPath, JSON.stringify(room_info));
  }

  function saveUserInfo(user_info) {
    localStorage.setItem(kUserInfoPath, JSON.stringify(user_info));
  }

  function getRoomInfo() {
    return JSON.parse(localStorage.getItem(kRoomInfoPath));
  }

  function getUserInfo(user_info) {
    return JSON.parse(localStorage.getItem(kUserInfoPath));
  }

  function parseInteger(string_representation) {
    if (parseInt) {
      return parseInt(string_representation);
    } else if (Number.parseInt) {
      return Number.parseInt(string_representation);
    }
    return NaN;
  }

  function write(message) {
    var paragraph = document.createElement('p');
    paragraph.innerText = message;
    document.body.appendChild(paragraph);
  }

  return {
    getRoomInfo: getRoomInfo,
    getUserInfo: getUserInfo,
    parseInt: parseInteger,
    runHttpRequest: runHttpRequest,
    saveRoomInfo: saveRoomInfo,
    saveUserInfo: saveUserInfo,
    write: write
  };

})();
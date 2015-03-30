(function() {

  function registerEventListeners() {
    var create_room = document.querySelector('.create-room .button');
    create_room.addEventListener('click', createRoom);
  }

  function createRoom() {
    document.location.pathname = '/create-room';
  }

  registerEventListeners();

})();

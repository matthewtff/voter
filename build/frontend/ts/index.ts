/// <reference path="room.ts" />
/// <reference path="utils.ts" />

class IndexPage {
  private static kDefaultRoomNumber = "Enter room number";
  private static kDisabledClass = "disabled";
  private static kRoomPageAddress = "/html/room.html";
  private room_input_ : Element;

  constructor() {
    this.room_input_ = document.querySelector('.room .input-inner');
    this.RegisterEventHandlers();
  }

  RegisterEventHandlers() : void {
    const create_room_element =
        document.querySelector('.create-room .button-inner');
    create_room_element.addEventListener('click', this.CreateRoom.bind(this));

    const join_room_element = document.querySelector('.join .button-inner');
    join_room_element.addEventListener('click',
                                       this.CheckRoomAndJoin.bind(this));

    this.room_input_.addEventListener('focus', this.RemoveHelp.bind(this));
    this.room_input_.addEventListener('blur', this.ReturnHelp.bind(this));
  }

  private RemoveHelp() : void {
    this.room_input_.classList.remove(IndexPage.kDisabledClass);
    if (this.room_input_.textContent == IndexPage.kDefaultRoomNumber) {
      this.room_input_.textContent = "";
    }
  }

  private ReturnHelp() : void {
    this.room_input_.classList.add(IndexPage.kDisabledClass);
    if (this.room_input_.textContent.length == 0) {
      this.room_input_.textContent = IndexPage.kDefaultRoomNumber;
    }
  }

  private CreateRoom() : void {
    Utils.RunHttpRequest("/room-manager?command=create_room",
                         this.OnMessageReceived.bind(this));
  }

  private CheckRoomAndJoin() {
    if (this.room_input_.textContent == IndexPage.kDefaultRoomNumber) {
      return;
    }
    const room_id = this.room_input_.textContent;
    IndexPage.GetRoomList(function (response) {
      if (response[Utils.kCommand] != 'rooms_list') {
        return;
      }
      response['data'].forEach(function (room_info) {
        if (room_id == room_info.room_id) {
          IndexPage.MoveToRoom({ room_id: room_id });
        }
      });
    });
  }

  private static GetRoomList(callback) {
    Utils.RunHttpRequest("/room-manager?command=get_all_rooms", callback);
  }

  private static MoveToRoom(room_info) {
    const room = new Room(room_info);
    room.Save();
    document.location.href = IndexPage.kRoomPageAddress;
  }

  private OnMessageReceived(message) {
    if (message[Utils.kCommand] == 'room_info') {
      // We schedule move to room to be able to handle other messages, if any.
      return setTimeout(IndexPage.MoveToRoom, 0, message[Utils.kData]);
    }
  }
}

const index_page = new IndexPage();

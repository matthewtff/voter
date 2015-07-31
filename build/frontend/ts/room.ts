/// <reference path="utils.ts" />

class Room {
  private static kRoomInfoPath = "room.info";
  private static kRoomIdFieldName = "room_id";
  private static kRoomPageAddress = "/html/room.html";
  private room_id_ : string;

  constructor(room_info : Object) {
    if (!Room.Validate(room_info))
      return null;
    this.room_id_ = room_info[Room.kRoomIdFieldName];
  }

  id() : string {
    return this.room_id_;
  }

  static Validate (info : Object) : Boolean {
    return info.hasOwnProperty(Room.kRoomIdFieldName) &&
        Utils.IsString(info[Room.kRoomIdFieldName]);
  }

  static MoveToRoom(room_id : string) {
    document.location.href = Room.kRoomPageAddress + '#' + room_id;
  }
}

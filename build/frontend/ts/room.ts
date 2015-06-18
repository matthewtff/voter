/// <reference path="utils.ts" />

interface RoomInfo {
  room_id : string;
}

class Room {
  private static kRoomInfoPath = "room.info";
  private static kRoomIdFieldName = "room_id";
  private info_ : RoomInfo;

  constructor(room_info : Object) {
    if (!Room.Validate(room_info)) {
      throw new Error("Cannot create room from invalid room info!");
    }
    this.info_ = {
      room_id : room_info[Room.kRoomIdFieldName],
    };
  }

  Save() : void {
    localStorage.setItem(Room.kRoomInfoPath, JSON.stringify(this.info_));
  }
  id() : string {
    return this.info_.room_id;
  }
  static Load() : Room {
    const saved_room_info = localStorage.getItem(Room.kRoomInfoPath);
    if (!saved_room_info)
      return null;
    return new Room(JSON.parse(saved_room_info));
  }
  static Validate (info : Object) : Boolean {
    const has_valid_room_id = info.hasOwnProperty(Room.kRoomIdFieldName)
        && Utils.IsString(info[Room.kRoomIdFieldName]);
    return has_valid_room_id;
  }
}

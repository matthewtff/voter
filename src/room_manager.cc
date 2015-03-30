#include "room_manager.hh"

#include <koohar.hh>

#include "room.hh"

namespace voter {

namespace {

const char kCreateRoomCommand[] = "create_room";
const char kGetAllRooms[] = "get_all_rooms";
const char kRoomId[] = "room_id";
const char kRoomInfo[] = "room_info";
const char kRoomsList[] = "rooms_list";
const char kRoomManagerPath[] = "/room-manager";

koohar::JSON::Object CreateRoomInfoObject(const Room& room) {
  koohar::JSON::Object room_info;
  room_info[kRoomId] = room.id();
  return room_info;
}

}  // anonymous namespace

RoomManager::RoomManager() : CommandsHandler(this) {
  AddHandler(kCreateRoomCommand, CreateHandler(&RoomManager::OnCreateRoom));
  AddHandler(kGetAllRooms, CreateHandler(&RoomManager::OnGetAllRooms));
}

void RoomManager::RemoveRoom(const std::string& room_id) {
  RoomList::const_iterator room = std::find_if(rooms_.cbegin(), rooms_.cend(),
      [&room_id](const Room& room) {
        return room.id() == room_id;
      });
  const bool found_room = room != rooms_.cend();
  assert(found_room && "We should not try removing room that doesn't exist");
  if (found_room) {
    rooms_.erase(room);
  }
}

bool RoomManager::ShouldHandleRequest(const koohar::Request& request) const {
  return request.Corresponds(kRoomManagerPath);
}

bool RoomManager::OnRequest(koohar::Request&& request,
                            koohar::Response&& response) {
  if (CommandsHandler::OnRequest(std::move(request), std::move(response))) {
    return true;
  }
  return std::any_of(rooms_.begin(), rooms_.end(), [&](Room& room) {
    return room.OnRequest(std::move(request), std::move(response));
  });
}

// private

CommandsHandler::Handler RoomManager::CreateHandler(CommandsListener listener) {
  return std::bind(listener, this, std::placeholders::_1);
}

void RoomManager::OnCreateRoom(const koohar::Request& /* request */) {
  rooms_.emplace_front(this);
  const Room& room = rooms_.front();

  // Also send back room id.
  koohar::JSON::Object room_info;
  room_info[CommandsHandler::kCommandName] = kRoomInfo;
  room_info[CommandsHandler::kData] = CreateRoomInfoObject(room);
  SendMessage(room_info);
}

void RoomManager::OnGetAllRooms(const koohar::Request& /* request */) {
  koohar::JSON::Object rooms_list_info;
  rooms_list_info[CommandsHandler::kCommandName] = kRoomsList;

  koohar::JSON::Object rooms_list;
  for (const Room& room : rooms_) {
    rooms_list.AddToArray(CreateRoomInfoObject(room));
  }
  rooms_list_info[CommandsHandler::kData] = rooms_list;
  SendMessage(rooms_list_info);
}

}  // namespace voter

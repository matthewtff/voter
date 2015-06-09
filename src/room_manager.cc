#include "room_manager.hh"

#include <koohar.hh>

#include "room.hh"
#include "utils.hh"

namespace voter {
namespace {

using RoomIdChecker = MethodChecker<Room, std::string>;

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

RoomManager::RoomManager(IntervalDelegate* interval_delegate)
    : CommandsHandler(this),
      interval_delegate_(interval_delegate) {
  AddHandler(kCreateRoomCommand,
             CreateHandler(&RoomManager::OnCreateRoom, this));
  AddHandler(kGetAllRooms,
             CreateHandler(&RoomManager::OnGetAllRooms, this));
}

void RoomManager::RemoveRoom(const std::string& room_id) {
  RoomList::const_iterator room = std::find_if(rooms_.cbegin(), rooms_.cend(),
                                               RoomIdChecker(room_id, &Room::id));
  const bool found_room = room != rooms_.cend();
  assert(found_room && "We should not try removing room that doesn't exist");
  if (found_room) {
    rooms_.erase(room);

    // TODO(matthewtff): Remove this log message.
    koohar::JSON::Object room_info;
    room_info[CommandsHandler::kCommandName] = kRoomInfo;
    room_info[CommandsHandler::kData] = CreateRoomInfoObject(*room);
    std::cout << "Removing room: " << room_info.ToString() << std::endl;
  }
}

koohar::ServerAsio::TimeoutHandle RoomManager::SetInterval(
    std::chrono::milliseconds timeout,
    std::function<void()> callback) {
  return interval_delegate_->SetInterval(timeout, callback);
}

void RoomManager::ClearInterval(
    koohar::ServerAsio::TimeoutHandle timeout_handle) {
  interval_delegate_->ClearInterval(timeout_handle);
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

void RoomManager::OnCreateRoom(const koohar::Request& /* request */) {
  rooms_.emplace_front(this);
  const Room& room = rooms_.front();

  // Also send back room id.
  koohar::JSON::Object room_info;
  room_info[CommandsHandler::kCommandName] = kRoomInfo;
  room_info[CommandsHandler::kData] = CreateRoomInfoObject(room);
  std::cout << "Creating room: " << room_info.ToString() << std::endl;
  SendMessage(room_info);
}

void RoomManager::OnGetAllRooms(const koohar::Request& /* request */) {
  koohar::JSON::Object rooms_list_info;
  rooms_list_info[CommandsHandler::kCommandName] = kRoomsList;

  koohar::JSON::Object rooms_list;
  rooms_list.SetType(koohar::JSON::Type::Array);
  for (const Room& room : rooms_) {
    rooms_list.AddToArray(CreateRoomInfoObject(room));
  }
  rooms_list_info[CommandsHandler::kData] = rooms_list;
  SendMessage(rooms_list_info);
}

}  // namespace voter

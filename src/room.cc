#include "room.hh"

#include <algorithm>

#include <koohar.hh>

#include "room_manager.hh"

namespace {

const char kAddUserCommand[] = "add_user";
const char kRoomPath[] = "/room";
const char kUserId[] = "user_id";
const char kUserInfo[] = "user_info";
const char kUserName[] = "user_name";

std::string GenerateId() {
  static unsigned long last_id = 0;
  return std::to_string(++last_id);
}

}  // anonymous namespace

namespace voter {

Room::Room(RoomManager* room_manager)
    : CommandsHandler(this),
      room_manager_(room_manager),
      id_(GenerateId()) {
  AddHandler(kAddUserCommand, CreateHandler(&Room::OnAddUser));
}

bool Room::ShouldHandleRequest(const koohar::Request& request) const {
  return request.Corresponds(kRoomPath) && request.Body("id") == id_;
}

bool Room::OnRequest(koohar::Request&& request, koohar::Response&& response) {
  if (CommandsHandler::OnRequest(std::move(request), std::move(response))) {
    return true;
  }
  return std::any_of(users_.begin(), users_.end(), [&](User& user) {
    return user.OnRequest(std::move(request), std::move(response));
  });
}

void Room::RemoveUser(const std::string& user_id) {
  UserList::const_iterator user = std::find_if(users_.cbegin(), users_.cend(),
      [&user_id](const User& user) {
        return user.id() == user_id;
      });
  const bool found_user = user != users_.cend();
  assert(found_user && "We should not try removing user that doesn't exist");
  if (found_user) {
    users_.erase(user);
  }
  if (users_.empty()) {
    // |RemoveRoom| actually deletes |this|.
    room_manager_->RemoveRoom(id());
  }
}

void Room::BroadcastMessage(const koohar::JSON::Object& message) {
  for (User& user : users_) {
    user.SendMessage(message);
  }
}

// private

CommandsHandler::Handler Room::CreateHandler(CommandsListener listener) {
  return std::bind(listener, this, std::placeholders::_1);
}

void Room::OnAddUser(const koohar::Request& /* request */) {
  users_.emplace_front(this);
  const User& user = users_.front();

  // Also send back to user his id and name.
  koohar::JSON::Object user_info;
  user_info[CommandsHandler::kCommandName] = kUserInfo;
  user_info[kUserId] = user.id();
  user_info[kUserName] = user.name();
  SendMessage(user_info);
}

}  // namespace voter

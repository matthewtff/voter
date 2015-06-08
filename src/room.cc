#include "room.hh"

#include <algorithm>

#include <koohar.hh>

#include "room_manager.hh"

namespace voter {
namespace {

const char kAddUserCommand[] = "add_user";
const char kRoomPath[] = "/room";
const char kUserInfo[] = "user_info";

std::string GenerateId() {
  static unsigned long last_id = 0;
  return std::to_string(++last_id);
}

koohar::JSON::Object CreateUserInfoMessage(const User& user) {
  koohar::JSON::Object user_info;
  user_info[CommandsHandler::kCommandName] = kUserInfo;
  user_info[CommandsHandler::kData] = user.GetUserInfo();
  return user_info;
}

}  // anonymous namespace

Room::Room(RoomManager* room_manager)
    : CommandsHandler(this),
      room_manager_(room_manager),
      id_(GenerateId()) {
  AddHandler(kAddUserCommand, CreateHandler(&Room::OnAddUser, this));

  AddAdminUser();
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
  UserList::iterator user = std::find_if(users_.begin(), users_.end(),
      [&user_id](const User& user) {
        return user.id() == user_id;
      });
  const bool found_user = user != users_.end();
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

void Room::OnAddUser(const koohar::Request& /* request */) {
  users_.emplace_front(this);
  // Also send back to user his id and name.
  SendMessage(CreateUserInfoMessage(users_.front()));
}

void Room::AddAdminUser() {
  std::cout << "Adding admin user!!!" << std::endl;
  users_.emplace_front(this, User::Role::Admin);
  SendMessage(CreateUserInfoMessage(users_.front()));
}

}  // namespace voter

#include "room.hh"

#include <algorithm>
#include <chrono>
#include <forward_list>
#include <iostream>

#include <koohar.hh>

#include "room_manager.hh"
#include "utils.hh"

namespace voter {
namespace {

using UserIdChecker = MethodChecker<User, std::string>;

const char kAddUserCommand[] = "add_user";
const char kRoomPath[] = "/room";
const char kVerifyUserCommand[] = "verify_user";
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
      id_(GenerateId()),
      check_emptyness_interval_(0u) {
  AddHandler(kAddUserCommand, CreateHandler(&Room::OnAddUser, this));
  AddHandler(kVerifyUserCommand, CreateHandler(&Room::OnVerifyUser, this));
  check_emptyness_interval_ =
      room_manager_->SetInterval(std::chrono::milliseconds(2000),
                                 std::bind(&Room::CheckEmptyness, this));
}

Room::~Room() {
  room_manager_->ClearInterval(check_emptyness_interval_);
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
                                         UserIdChecker(user_id, &User::id));
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

void Room::OnVerifyUser(const koohar::Request& request) {
  const std::string& user_id = request.Body("id");
  const bool user_exists =
      std::any_of(users_.begin(), users_.end(),
                  UserIdChecker(user_id, &User::id));

  koohar::JSON::Object verified_message;
  verified_message[CommandsHandler::kCommandName] = kVerifyUserCommand;
  verified_message[CommandsHandler::kData] = user_exists;
  SendMessage(verified_message);
}

void Room::CheckEmptyness() {
  std::list<std::string> left_users;
  bool admin_left = false;
  for (User& user : users_) {
    if (user.CheckIfUnavailable()) {
      left_users.push_front(user.id());
      admin_left = admin_left || user.role() == User::Role::Admin;
    }
  }
  const bool room_is_empty = left_users.size() == users_.size();
  if (room_is_empty) {
    room_manager_->RemoveRoom(id_);
  } else {
    std::for_each(left_users.begin(), left_users.end(),
                  std::bind(&Room::RemoveUser, this, std::placeholders::_1));
    if (admin_left) {
      SelectNewAdministrator();
    }
  }
}

void Room::SelectNewAdministrator() {
  users_.front().MakeAdmin();
}

}  // namespace voter

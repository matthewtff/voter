#include "room.hh"

#include <algorithm>
#include <chrono>
#include <forward_list>
#include <iostream>
#include <iterator>

#include <koohar.hh>

#include "room_manager.hh"
#include "utils.hh"

namespace voter {
namespace {

using UserChecker = MethodChecker<User, std::string>;

const char kAddUserCommand[] = "add_user";
const char kGetAllUsersCommand[] = "get_all_users";
const char kRoomPath[] = "/room";
const char kUserInfo[] = "user_info";
const char kUsersList[] = "users_list";

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
  AddHandler(kGetAllUsersCommand, CreateHandler(&Room::OnUsersList, this));
  check_emptyness_interval_ =
      room_manager_->SetInterval(std::chrono::milliseconds(2000),
                                 std::bind(&Room::CheckEmptyness, this));
}

Room::~Room() {
  room_manager_->ClearInterval(check_emptyness_interval_);
}

bool Room::ShouldHandleRequest(const koohar::Request& request) {
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

bool Room::CheckNameIsUnique(const std::string& name) {
  return std::none_of(users_.begin(), users_.end(),
                      UserChecker(name, &User::name));
}

void Room::BroadcastMessage(const koohar::JSON::Object& message) {
  std::for_each(users_.begin(), users_.end(),
                std::bind(&User::SendMessage, std::placeholders::_1, message));
}

void Room::MakeRequest(koohar::ClientRequest&& request,
                       koohar::OutputConnection::Callback callback) {
  room_manager_->MakeRequest(std::move(request), callback);
}

// private

void Room::OnAddUser(const koohar::Request& /* request */) {
  users_.emplace_front(this);
  // Also send back to user his id and name.
  SendMessage(CreateUserInfoMessage(users_.front()));
}

void Room::OnUsersList(const koohar::Request& /* request */) {
  koohar::JSON::Object users_list_info;
  users_list_info[CommandsHandler::kCommandName] = kUsersList;
  koohar::JSON::Object users_list;
  users_list.SetType(koohar::JSON::Type::Array);
  for (const User& user : users_) {
    users_list.AddToArray(user.GetUserInfo());
  }
  users_list_info[CommandsHandler::kData] = users_list;
  SendMessage(users_list_info);
}

void Room::CheckEmptyness() {
  users_.remove_if(std::bind(&User::CheckIfUnavailable, std::placeholders::_1));
  if (users_.empty()) {
    room_manager_->RemoveRoom(id_);
  }
}

}  // namespace voter

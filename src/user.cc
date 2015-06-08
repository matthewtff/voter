#include "user.hh"

#include <random>

#include <koohar.hh>

#include "room.hh"

namespace {

const char kAddUserCommand[] = "add_user";
const char kChatMessageCommand[] = "chat_message";
const char kLongPollCommand[] = "long_poll";
const char kUserId[] = "user_id";
const char kUserLeaveCommand[] = "user_leave";
const char kUserName[] = "user_name";
const char kUserPath[] = "/user";

std::string GenerateName() {
  static const std::string kNames[] = {
    "Michelangelo",
    "Claude Monet",
    "Goya",
    "Ivan Shishkin",
    "Pablo Picasso",
    "Vincent van Gogh",
    "Ivan Aivazovsky",
    "Salvador Dali",
    "Edgar Degas",
    "Edouard Manet",
    "Harmensz van Rijn Rembrandt",
    "Gerhard Richter",
    "Vecellio Tiziano",
    "Ilya Repin",
  };

  std::random_device device;
  std::default_random_engine engine(device());
  std::uniform_int_distribution<int> uniform_dist(0, array_size(kNames) - 1);
  return kNames[uniform_dist(engine)];
}

std::string GenerateId() {
  static unsigned long last_id = 0;
  return std::to_string(++last_id);
}

}  // anonymous namespace

namespace voter {

User::User(Room* room, const Role role)
    : CommandsHandler(this),
      room_(room),
      name_(GenerateName()),
      id_(GenerateId()),
      role_(role) {
  AddHandler(kChatMessageCommand, CreateHandler(&User::OnChatMessage, this));
  AddHandler(kUserLeaveCommand, CreateHandler(&User::OnUserLeave, this));
  AddHandler(kLongPollCommand, CreateHandler(&User::OnLongPoll, this));

  // Notify users about new one.
  koohar::JSON::Object notify_user;
  notify_user[CommandsHandler::kCommandName] = kAddUserCommand;
  notify_user[CommandsHandler::kData] = GetUserInfo();
  room_->BroadcastMessage(notify_user);
}

bool User::ShouldHandleRequest(const koohar::Request& request) const {
  return request.Corresponds(kUserPath) && request.Body("id") == id_;
}

koohar::JSON::Object User::GetUserInfo() const {
  koohar::JSON::Object user_info;
  user_info[kUserId] = id_;
  user_info[kUserName] = name_;
  return user_info;
}

// private

void User::OnChatMessage(const koohar::Request& request) {
  koohar::JSON::Object send_message;
  send_message[CommandsHandler::kCommandName] = kChatMessageCommand;
  send_message[kUserId] = id_;
  send_message[CommandsHandler::kData] = request.body();
  room_->BroadcastMessage(send_message);
}

void User::OnLongPoll(const koohar::Request& /* request */) {
  // Fake intentionally.
}

void User::OnUserLeave(const koohar::Request& /* request */) {
  room_->RemoveUser(id_);
  koohar::JSON::Object user_leave;
  user_leave[CommandsHandler::kCommandName] = kUserLeaveCommand;
  user_leave[CommandsHandler::kData] = GetUserInfo();
  room_->BroadcastMessage(user_leave);
}

}  // namespace voter

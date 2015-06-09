#include "user.hh"

#include <random>

#include <koohar.hh>

#include "room.hh"

namespace {

const char kAddUserCommand[] = "add_user";
const char kAdminSelectedMessage[] = "admin_selected";
const char kChatMessageCommand[] = "chat_message";
const char kIsAdministrator[] = "is_administrator";
const char kLongPollCommand[] = "long_poll";
const char kKeepAliveCommand[] = "keep_alive";
const char kUserId[] = "user_id";
const char kUserLeaveCommand[] = "user_leave";
const char kUserName[] = "user_name";
const char kUserPath[] = "/user";

const std::chrono::seconds kUserTimeoutDuration = std::chrono::seconds(2);
const std::chrono::seconds kUserKeepAliveTimeout = std::chrono::seconds(6);

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

koohar::JSON::Object KeepAliveMessage() {
  koohar::JSON::Object keep_alive_message;
  keep_alive_message[voter::CommandsHandler::kCommandName] = kKeepAliveCommand;
  return keep_alive_message;
}

}  // anonymous namespace

namespace voter {

User::User(Room* room)
    : CommandsHandler(this),
      room_(room),
      name_(GenerateName()),
      id_(GenerateId()),
      connection_gone_since_(std::chrono::steady_clock::now()),
      last_seen_alive_(std::chrono::steady_clock::now()) {
  AddHandler(kChatMessageCommand, CreateHandler(&User::OnChatMessage, this));
  AddHandler(kUserLeaveCommand, CreateHandler(&User::OnUserLeave, this));
  AddHandler(kLongPollCommand, CreateHandler(&User::OnLongPoll, this));

  // Notify users about new one.
  koohar::JSON::Object notify_user;
  notify_user[CommandsHandler::kCommandName] = kAddUserCommand;
  notify_user[CommandsHandler::kData] = GetUserInfo();
  room_->BroadcastMessage(notify_user);

  role_ = room_->users().empty() ? Role::Admin : Role::Voter;
}

bool User::ShouldHandleRequest(const koohar::Request& request) const {
  const bool matches = request.Corresponds(kUserPath)
      && request.Body("id") == id_;
  if (matches) {
    last_seen_alive_ = std::chrono::steady_clock::now();
  }
  return matches;
}

void User::OnConnectionGone() {
  connection_gone_since_ = std::chrono::steady_clock::now();
}

void User::MakeAdmin() {
  role_ = Role::Admin;
  koohar::JSON::Object admin_selected;
  admin_selected[CommandsHandler::kCommandName] = kAdminSelectedMessage;
  admin_selected[CommandsHandler::kData] = GetUserInfo();
  room_->BroadcastMessage(admin_selected);
}

bool User::CheckIfUnavailable() {
  if (HasActiveConnection()) {
    const std::chrono::seconds not_seen_for =
        std::chrono::duration_cast<std::chrono::seconds>(
            std::chrono::steady_clock::now() - last_seen_alive_);
    if (not_seen_for > kUserKeepAliveTimeout) {
      SendMessage(KeepAliveMessage());
    }
    return false;
  }
  const std::chrono::seconds gone_for =
      std::chrono::duration_cast<std::chrono::seconds>(
          std::chrono::steady_clock::now() - connection_gone_since_);
  return gone_for > kUserTimeoutDuration;
}

koohar::JSON::Object User::GetUserInfo() const {
  koohar::JSON::Object user_info;
  user_info[kUserId] = id_;
  user_info[kUserName] = name_;
  user_info[kIsAdministrator] = role_ == Role::Admin;
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

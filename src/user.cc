#include "user.hh"

#include <random>

#include <koohar.hh>

#include "room.hh"

namespace {

const char kAddUserCommand[] = "add_user";
const char kAdminSelectedMessage[] = "admin_selected";
const char kGetTaskCommand[] = "get_task";
const char kUserMessageCommand[] = "user_message";
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
  std::uniform_int_distribution<int> uniform_dist(
      0, koohar::array_size(kNames) - 1);
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

User::User(Delegate* delegate, const Role role)
    : CommandsHandler(this),
      delegate_(delegate),
      name_(SelectName()),
      id_(GenerateId()),
      role_(role),
      connection_gone_since_(std::chrono::steady_clock::now()),
      last_seen_alive_(std::chrono::steady_clock::now()) {
  AddObserver(this);
  AddHandler(kGetTaskCommand, CreateHandler(&User::OnGetTask, this));
  AddHandler(kUserMessageCommand, CreateHandler(&User::OnUserMessage, this));
  AddHandler(kUserLeaveCommand, CreateHandler(&User::OnUserLeave, this));
  AddHandler(kLongPollCommand, CreateHandler(&User::OnLongPoll, this));

  // Notify users about new one.
  koohar::JSON::Object notify_user;
  notify_user[CommandsHandler::kCommandName] = kAddUserCommand;
  notify_user[CommandsHandler::kData] = GetUserInfo();
  delegate_->BroadcastMessage(notify_user);
}

User::~User() {
  koohar::JSON::Object user_leave;
  user_leave[CommandsHandler::kCommandName] = kUserLeaveCommand;
  user_leave[CommandsHandler::kData] = GetUserInfo();
  delegate_->BroadcastMessage(user_leave);
}

bool User::ShouldHandleRequest(const koohar::Request& request) {
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
  delegate_->BroadcastMessage(admin_selected);
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

void User::OnGetTask(const koohar::Request& request) {
  static const char kIssueURL[] = "http://st-api.yandex-team.ru/v2/issues/";
  const std::string task_id = request.Body("task_id");
  delegate_->MakeRequest(koohar::ClientRequest(kIssueURL + task_id),
                         std::bind(&User::OnReceiveTaskInfo,
                                   this,
                                   std::placeholders::_1,
                                   std::placeholders::_2));
}

void User::OnReceiveTaskInfo(koohar::ClientRequest&& /* request */,
                             koohar::ClientResponse&& response) {
  koohar::JSON::Object task_info_message;
  task_info_message[CommandsHandler::kCommandName] = kGetTaskCommand;
  task_info_message[CommandsHandler::kData] =
      koohar::JSON::Parse(response.body());
  SendMessage(task_info_message);
}

void User::OnUserMessage(const koohar::Request& request) {
  koohar::JSON::Object send_message;
  send_message[CommandsHandler::kCommandName] = kUserMessageCommand;
  send_message[kUserId] = id_;
  send_message[CommandsHandler::kData] = request.Body("data");
  delegate_->BroadcastMessage(send_message);
}

void User::OnLongPoll(const koohar::Request& /* request */) {
  // Fake intentionally.
}

void User::OnUserLeave(const koohar::Request& /* request */) {
  delegate_->RemoveUser(id_);
}

std::string User::SelectName() {
  std::string name = GenerateName();
  while (!delegate_->CheckNameIsUnique(name)) {
    name = GenerateName();
  }
  return name;
}

}  // namespace voter

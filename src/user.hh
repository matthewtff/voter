#ifndef voter_user_hh
#define voter_user_hh

#include <chrono>
#include <list>
#include <memory>
#include <string>

#include <koohar.hh>

#include "commands_handler.hh"

namespace voter {

class Room;

class User : public CommandsHandler,
             public CommandsHandler::Delegate,
             public CommandsHandler::Observer {
 public:
  enum class Role {
    Admin,
    Voter
  };
  User(Room* room);
  ~User();

  // CommandsHandler::Delegate implementation.
  bool ShouldHandleRequest(const koohar::Request& request) const override;

  // CommandsHandler::Observer implementation.
  void OnConnectionGone() override;

  std::string name() const { return name_; }
  std::string id() const { return id_; }
  Role role() const { return role_; }

  void MakeAdmin();

  bool CheckIfUnavailable();
  koohar::JSON::Object GetUserInfo() const;

 private:
  // Command handlers:
  void OnUserMessage(const koohar::Request& request);
  void OnLongPoll(const koohar::Request& request);
  void OnUserLeave(const koohar::Request& /* request */);

  Room* const room_;
  const std::string name_;
  const std::string id_;
  Role role_;
  std::chrono::steady_clock::time_point connection_gone_since_;
  mutable std::chrono::steady_clock::time_point last_seen_alive_;
};  // class User

}  // namespace voter

#endif  // voter_user_hh

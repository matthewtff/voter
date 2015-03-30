#ifndef voter_user_hh
#define voter_user_hh

#include <list>
#include <memory>
#include <string>

#include <koohar.hh>

#include "commands_handler.hh"

namespace koohar {
class Request;
}

namespace voter {

class Room;

class User : public CommandsHandler,
             public CommandsHandler::Delegate {
 public:
  User(Room* room);

  // CommandsHandler::Delegate implementation.
  bool ShouldHandleRequest(const koohar::Request& request) const override;

  std::string name() const { return name_; }
  std::string id() const { return id_; }

 private:
  using CommandsListener = void(User::*)(const koohar::Request& request);
  CommandsHandler::Handler CreateHandler(CommandsListener listener);

  // Command handlers:
  void OnChatMessage(const koohar::Request& request);
  void OnUserLeave(const koohar::Request& /* request */);

  Room* const room_;
  const std::string name_;
  const std::string id_;
};  // class User

}  // namespace voter

#endif  // voter_user_hh

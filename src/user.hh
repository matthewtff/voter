#ifndef voter_user_hh
#define voter_user_hh

#include <chrono>
#include <list>
#include <memory>
#include <string>

#include <koohar.hh>

#include "commands_handler.hh"

namespace voter {

class User : public CommandsHandler,
             public CommandsHandler::Delegate,
             public CommandsHandler::Observer {
 public:
  class Delegate {
   public:
    virtual bool CheckNameIsUnique(const std::string& name) = 0;
    virtual void BroadcastMessage(const koohar::JSON::Object& message) = 0;
    virtual void MakeRequest(koohar::ClientRequest&&,
                             koohar::OutputConnection::Callback) = 0;
  };

  User(Delegate* delegate);
  ~User();

  // CommandsHandler::Delegate implementation.
  bool ShouldHandleRequest(const koohar::Request& request) override;

  // CommandsHandler::Observer implementation.
  void OnConnectionGone() override;

  std::string name() const { return name_; }
  std::string id() const { return id_; }

  bool CheckIfUnavailable();
  koohar::JSON::Object GetUserInfo() const;

 private:
  // Command handlers:
  void OnGetTask(const koohar::Request& request);
  void OnUserMessage(const koohar::Request& request);
  void OnLongPoll(const koohar::Request& request);

  void OnReceiveTaskInfo(koohar::ClientRequest&& /* request */,
                         koohar::ClientResponse&& response);

  std::string SelectName();

  Delegate* delegate_;
  const std::string name_;
  const std::string id_;
  std::chrono::steady_clock::time_point connection_gone_since_;
  std::chrono::steady_clock::time_point last_seen_alive_;
};  // class User

}  // namespace voter

#endif  // voter_user_hh

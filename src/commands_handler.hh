#ifndef voter_commands_handler_hh
#define voter_commands_handler_hh

#include <functional>
#include <list>
#include <map>
#include <utility>

#include <koohar.hh>

namespace voter {

class CommandsHandler {
 public:
  using Handler = std::function<void(const koohar::Request& request)>;
  using HandlersMap = std::map<std::string, Handler>;

  class Delegate {
   public:
    virtual bool ShouldHandleRequest(const koohar::Request& request) = 0;
  };  // class CommandsHandler::Delegate

  class Observer {
   public:
    virtual void OnConnectionGone() {}
  };  // class CommandsHandler::Observer

  static const char* kCommandName;
  static const char* kData;

  CommandsHandler(Delegate* delegate);
  virtual ~CommandsHandler();
  void AddHandler(const std::string command_name, Handler handler) {
    handlers_map_[command_name] = handler;
  }
  void RemoveHandler(const std::string command_name) {
    handlers_map_.erase(command_name);
  }

  virtual bool OnRequest(koohar::Request&& request,
                         koohar::Response&& response);
  void SendMessage(const koohar::JSON::Object& message);

  bool HasActiveConnection() const;
  void AddObserver(Observer* observer);
  void RemoveObserver(Observer* observer);

 protected:
  template <typename Binder, typename Method, typename ... Args>
  Handler CreateHandler(Method listener,
                        Binder binder,
                        Args... args) {
    return std::bind(listener, binder, std::placeholders::_1, args...);
  }

 private:
  void TryHandleMessage(const koohar::Request& request);
  void DispatchMessages();

  Delegate* const delegate_;
  std::list<Observer*> observers_;
  std::unique_ptr<koohar::Response> response_;
  std::list<koohar::JSON::Object> message_queue_;
  HandlersMap handlers_map_;
};  // class CommandsHandler

}  // namespace voter

#endif  // voter_commands_handler_hh

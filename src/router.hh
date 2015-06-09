#ifndef voter_router_hh
#define voter_router_hh

#include <map>

#include "room_manager.hh"

namespace koohar {
class ServerAsio;
class Request;
class Response;
}  // namespace koohar

namespace voter {

class UrlHandler;

class Router {
 public:
  Router(RoomManager::IntervalDelegate* interval_delegate);
  void OnRequest(koohar::Request&& request, koohar::Response&& response);

 private:
  using HandlersMap = std::map<std::string, UrlHandler>;

  RoomManager room_manager_;
};  // class Router

}  // namespace voter

#endif  // voter_router_hh

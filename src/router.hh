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
  Router(/*const koohar::ServerAsio* server*/) /*: server_(server)*/ {}
  void OnRequest(koohar::Request&& request, koohar::Response&& response);

 private:
  using HandlersMap = std::map<std::string, UrlHandler>;

  //const koohar::ServerAsio* server_;
  RoomManager room_manager_;
};  // class Router

}  // namespace voter

#endif  // voter_router_hh

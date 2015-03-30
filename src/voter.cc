#include <koohar.hh>

#include <iostream>

#include "handler.hh"
#include "router.hh"

namespace {
const char kConfigPath[] = "./config.json";

koohar::ServerAsio* server_ptr = nullptr;

HandlerRet SignalHandler(HandlerGet /* sig */) {
  if (server_ptr) {
    LOG << "Stopping server... ";
    server_ptr->Stop();
    LOG << "Done!" << std::endl;
  }
}

void RegisterHandlers() {
  SetHandler(CTRL_C_EVENT, SignalHandler);
  SetHandler(QUIT_EVENT, SignalHandler);
  SetHandler(TERM_EVENT, SignalHandler);
}
}

int main (int argc, char* argv[]) {
  const unsigned short port = (argc > 1)
      ? static_cast<unsigned short>(std::atoi(argv[1])) : 8000;

  RegisterHandlers();
  koohar::ServerAsio server{port};
  server.Load(kConfigPath);
  server_ptr = &server;

  voter::Router router;
  server.Listen(std::bind(&voter::Router::OnRequest,
                          &router,
                          std::placeholders::_1,
                          std::placeholders::_2));
}

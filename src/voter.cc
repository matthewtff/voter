#include <koohar.hh>

#include <iostream>

#include "handler.hh"
#include "router.hh"
#include "room_manager.hh"

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

class IntervalMaster : public voter::RoomManager::IntervalDelegate {
 public:
  IntervalMaster(koohar::ServerAsio* server_asio) : server_asio_(server_asio) {}

  // RoomManager::IntervalDelegate implementation.
  koohar::ServerAsio::TimeoutHandle SetInterval(
        std::chrono::milliseconds timeout,
        koohar::ServerAsio::TimerCallback callback) override {
    return server_asio_->SetInterval(timeout, callback);
  }

  void ClearInterval(
      koohar::ServerAsio::TimeoutHandle timeout_handle) override {
    server_asio_->ClearInterval(timeout_handle);
  }

 private:
  koohar::ServerAsio* server_asio_;
};  // class IntervalMaster

}  // anonymous namespace

int main (int argc, char* argv[]) {
  const unsigned short port = (argc > 1)
      ? static_cast<unsigned short>(std::atoi(argv[1])) : 8000;

  RegisterHandlers();
  koohar::ServerAsio server{port};
  server.Load(kConfigPath);
  server_ptr = &server;

  IntervalMaster interval_master(&server);

  voter::Router router(&interval_master);
  server.Listen(std::bind(&voter::Router::OnRequest,
                          &router,
                          std::placeholders::_1,
                          std::placeholders::_2));
}

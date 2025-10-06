#pragma once

#include <memory>
#include <string>
#include <grpcpp/grpcpp.h>
#include <grpcpp/health_check_service_interface.h>
#include <grpcpp/ext/proto_server_reflection_plugin.h>

#include "dnd5e_service.h"

namespace dnd5e {

class Server {
public:
    explicit Server(const std::string& server_address = "0.0.0.0:50051");
    ~Server() = default;

    Server(const Server&) = delete;
    Server& operator=(const Server&) = delete;
    Server(Server&&) = delete;
    Server& operator=(Server&&) = delete;

    bool Initialize();
    bool Start();
    void Stop();
    void Wait();
    bool IsRunning() const;
    const std::string& GetAddress() const;

private:
    std::string server_address_;
    std::unique_ptr<grpc::Server> server_;
    std::unique_ptr<Dnd5eServiceImpl> service_;
    bool is_running_;

    void SetupServerBuilder(grpc::ServerBuilder& builder);
};

} // namespace dnd5e



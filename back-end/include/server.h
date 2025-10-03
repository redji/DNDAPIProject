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

    // Non-copyable
    Server(const Server&) = delete;
    Server& operator=(const Server&) = delete;

    // Non-movable
    Server(Server&&) = delete;
    Server& operator=(Server&&) = delete;

    /**
     * @brief Initialize the server
     * @return true if initialization successful, false otherwise
     */
    bool Initialize();

    /**
     * @brief Start the server
     * @return true if server started successfully, false otherwise
     */
    bool Start();

    /**
     * @brief Stop the server gracefully
     */
    void Stop();

    /**
     * @brief Wait for the server to finish
     */
    void Wait();

    /**
     * @brief Check if server is running
     * @return true if server is running, false otherwise
     */
    bool IsRunning() const;

    /**
     * @brief Get server address
     * @return server address string
     */
    const std::string& GetAddress() const;

private:
    std::string server_address_;
    std::unique_ptr<grpc::Server> server_;
    std::unique_ptr<Dnd5eServiceImpl> service_;
    bool is_running_;

    /**
     * @brief Setup server builder with services
     * @param builder Server builder to configure
     */
    void SetupServerBuilder(grpc::ServerBuilder& builder);
};

} // namespace dnd5e

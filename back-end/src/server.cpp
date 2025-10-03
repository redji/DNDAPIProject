#include "server.h"
#include <iostream>
#include <grpcpp/grpcpp.h>
#include <grpcpp/health_check_service_interface.h>
#include <grpcpp/ext/proto_server_reflection_plugin.h>

namespace dnd5e {

Server::Server(const std::string& server_address)
    : server_address_(server_address), is_running_(false) {
}

bool Server::Initialize() {
    try {
        // Create API client
        auto api_client = std::make_shared<ApiClient>();
        
        // Create service implementation
        service_ = std::make_unique<Dnd5eServiceImpl>(api_client);
        
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Failed to initialize server: " << e.what() << std::endl;
        return false;
    }
}

bool Server::Start() {
    try {
        grpc::ServerBuilder builder;
        SetupServerBuilder(builder);
        
        server_ = builder.BuildAndStart();
        if (!server_) {
            std::cerr << "Failed to build and start server" << std::endl;
            return false;
        }
        
        is_running_ = true;
        std::cout << "Server started successfully on " << server_address_ << std::endl;
        return true;
        
    } catch (const std::exception& e) {
        std::cerr << "Failed to start server: " << e.what() << std::endl;
        return false;
    }
}

void Server::Stop() {
    if (server_ && is_running_) {
        std::cout << "Stopping server..." << std::endl;
        server_->Shutdown();
        is_running_ = false;
    }
}

void Server::Wait() {
    if (server_) {
        server_->Wait();
    }
}

bool Server::IsRunning() const {
    return is_running_;
}

const std::string& Server::GetAddress() const {
    return server_address_;
}

void Server::SetupServerBuilder(grpc::ServerBuilder& builder) {
    // Add listening port
    builder.AddListeningPort(server_address_, grpc::InsecureServerCredentials());
    
    // Register service
    builder.RegisterService(service_.get());
    
    // Enable health checking
    grpc::EnableDefaultHealthCheckService(true);
    
    // Enable server reflection
    grpc::reflection::InitProtoReflectionServerBuilderPlugin();
    
    // Set server options
    builder.SetMaxReceiveMessageSize(4 * 1024 * 1024); // 4MB
    builder.SetMaxSendMessageSize(4 * 1024 * 1024);    // 4MB
    
    // Add completion queue for async operations
    builder.SetDefaultCompressionAlgorithm(GRPC_COMPRESS_GZIP);
}

} // namespace dnd5e


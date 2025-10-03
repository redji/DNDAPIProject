#include <iostream>
#include <string>
#include <csignal>
#include <memory>
#include <grpcpp/grpcpp.h>

#include "server.h"

namespace {
    std::unique_ptr<dnd5e::Server> g_server;
    
    void SignalHandler(int signal) {
        std::cout << "\nReceived signal " << signal << ". Shutting down gracefully...\n";
        if (g_server) {
            g_server->Stop();
        }
    }
}

int main(int argc, char* argv[]) {
    // Parse command line arguments
    std::string server_address = "0.0.0.0:50051";
    bool test_mode = false;
    
    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--address" && i + 1 < argc) {
            server_address = argv[++i];
        } else if (arg == "--test") {
            test_mode = true;
        } else if (arg == "--help") {
            std::cout << "D&D 5e Backend Server\n";
            std::cout << "Usage: " << argv[0] << " [options]\n";
            std::cout << "Options:\n";
            std::cout << "  --address <addr>    Server address (default: 0.0.0.0:50051)\n";
            std::cout << "  --test              Run in test mode\n";
            std::cout << "  --help              Show this help message\n";
            return 0;
        }
    }
    
    if (test_mode) {
        std::cout << "Running in test mode - exiting immediately\n";
        return 0;
    }
    
    // Set up signal handlers
    std::signal(SIGINT, SignalHandler);
    std::signal(SIGTERM, SignalHandler);
    
    try {
        // Create and initialize server
        g_server = std::make_unique<dnd5e::Server>(server_address);
        
        if (!g_server->Initialize()) {
            std::cerr << "Failed to initialize server\n";
            return 1;
        }
        
        std::cout << "Starting D&D 5e Backend Server on " << server_address << "\n";
        std::cout << "Press Ctrl+C to stop the server\n";
        
        if (!g_server->Start()) {
            std::cerr << "Failed to start server\n";
            return 1;
        }
        
        // Wait for server to finish
        g_server->Wait();
        
    } catch (const std::exception& e) {
        std::cerr << "Server error: " << e.what() << "\n";
        return 1;
    }
    
    std::cout << "Server stopped\n";
    return 0;
}


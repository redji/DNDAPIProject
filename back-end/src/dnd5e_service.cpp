#include "dnd5e_service.h"
#include <grpcpp/grpcpp.h>
#include <chrono>
#include <algorithm>
#include <sstream>

namespace dnd5e {

Dnd5eServiceImpl::Dnd5eServiceImpl(std::shared_ptr<ApiClient> api_client)
    : api_client_(api_client) {
    search_engine_ = std::make_unique<SearchEngine>(api_client_);
}

grpc::Status Dnd5eServiceImpl::GetEndpoints(
    grpc::ServerContext* context,
    const GetEndpointsRequest* request,
    GetEndpointsResponse* response) {
    
    (void)context;
    (void)request;
    try {
        auto endpoints = GetAllEndpoints();
        
        for (const auto& endpoint : endpoints) {
            response->add_endpoints(endpoint);
        }
        response->set_total_count(static_cast<int32_t>(endpoints.size()));
        
        return grpc::Status::OK;
        
    } catch (const std::exception& e) {
        return grpc::Status(grpc::StatusCode::INTERNAL, 
                           "Failed to get endpoints: " + std::string(e.what()));
    }
}

grpc::Status Dnd5eServiceImpl::GetList(
    grpc::ServerContext* context,
    const GetListRequest* request,
    GetListResponse* response) {
    
    (void)context;
    try {
        const std::string& endpoint = request->endpoint();
        
        if (!IsValidEndpoint(endpoint)) {
            return grpc::Status(grpc::StatusCode::INVALID_ARGUMENT,
                               "Invalid endpoint: " + endpoint);
        }
        
        auto api_response = api_client_->GetList(endpoint);
        
        response->set_endpoint(endpoint);
        response->set_total_count(api_response.count);
        response->set_page(request->page());
        response->set_page_size(request->page_size());
        
        // Apply pagination
        int start_idx = request->page() * request->page_size();
        int end_idx = std::min(start_idx + request->page_size(), 
                              static_cast<int>(api_response.results.size()));
        
        bool has_more = end_idx < static_cast<int>(api_response.results.size());
        response->set_has_more(has_more);
        
        // Add items for current page
        for (int i = start_idx; i < end_idx; ++i) {
            auto* item = response->add_items();
            *item = ConvertToProtoItem(api_response.results[i], endpoint);
        }
        
        return grpc::Status::OK;
        
    } catch (const std::exception& e) {
        return grpc::Status(grpc::StatusCode::INTERNAL,
                           "Failed to get list: " + std::string(e.what()));
    }
}

grpc::Status Dnd5eServiceImpl::GetItem(
    grpc::ServerContext* context,
    const GetItemRequest* request,
    GetItemResponse* response) {
    
    (void)context;
    try {
        const std::string& endpoint = request->endpoint();
        const std::string& index = request->index();
        
        if (!IsValidEndpoint(endpoint)) {
            return grpc::Status(grpc::StatusCode::INVALID_ARGUMENT,
                               "Invalid endpoint: " + endpoint);
        }
        
        auto item_data = api_client_->GetItem(endpoint, index);
        
        // Create basic item info
        ApiItem item;
        item.set_index(index);
        item.set_endpoint(endpoint);
        
        if (item_data.contains("name")) {
            item.set_name(item_data["name"]);
        }
        if (item_data.contains("url")) {
            item.set_url(item_data["url"]);
        }
        
        response->mutable_item()->CopyFrom(item);
        response->set_raw_data(item_data.dump());
        
        return grpc::Status::OK;
        
    } catch (const std::exception& e) {
        return grpc::Status(grpc::StatusCode::INTERNAL,
                           "Failed to get item: " + std::string(e.what()));
    }
}

grpc::Status Dnd5eServiceImpl::SearchItems(
    grpc::ServerContext* context,
    const SearchItemsRequest* request,
    SearchItemsResponse* response) {
    
    (void)context;
    try {
        const std::string& query = request->query();
        
        if (query.empty()) {
            return grpc::Status(grpc::StatusCode::INVALID_ARGUMENT,
                               "Search query cannot be empty");
        }
        
        std::vector<std::string> endpoints;
        for (int i = 0; i < request->endpoints_size(); ++i) {
            endpoints.push_back(request->endpoints(i));
        }
        
        auto results = search_engine_->Search(query, endpoints, request->max_results());
        
        response->set_query(query);
        response->set_total_found(static_cast<int32_t>(results.size()));
        
        for (const auto& result : results) {
            auto* search_result = response->add_results();
            search_result->mutable_item()->CopyFrom(ConvertToProtoItem(result.item, result.endpoint));
            search_result->set_matched_field(result.matched_field);
            search_result->set_relevance_score(result.relevance_score);
        }
        
        return grpc::Status::OK;
        
    } catch (const std::exception& e) {
        return grpc::Status(grpc::StatusCode::INTERNAL,
                           "Failed to search items: " + std::string(e.what()));
    }
}

grpc::Status Dnd5eServiceImpl::HealthCheck(
    grpc::ServerContext* context,
    const HealthCheckRequest* request,
    HealthCheckResponse* response) {
    
    (void)context;
    (void)request;
    try {
        // Check if API client is working
        auto endpoints = api_client_->GetEndpoints();
        
        if (endpoints.empty()) {
            response->set_status(HealthCheckResponse::NOT_SERVING);
            response->set_message("API client not responding");
        } else {
            response->set_status(HealthCheckResponse::SERVING);
            response->set_message("Server is healthy");
        }
        
        auto now = std::chrono::system_clock::now();
        auto timestamp = std::chrono::duration_cast<std::chrono::milliseconds>(
            now.time_since_epoch()).count();
        response->set_timestamp(timestamp);
        
        return grpc::Status::OK;
        
    } catch (const std::exception& e) {
        response->set_status(HealthCheckResponse::NOT_SERVING);
        response->set_message("Health check failed: " + std::string(e.what()));
        return grpc::Status::OK; // Return OK even if health check fails
    }
}

bool Dnd5eServiceImpl::IsValidEndpoint(const std::string& endpoint) const {
    return api_client_->IsValidEndpoint(endpoint);
}

ApiItem Dnd5eServiceImpl::ConvertToProtoItem(
    const ApiClient::ApiItem& item, 
    const std::string& endpoint) const {
    
    ApiItem proto_item;
    proto_item.set_index(item.index);
    proto_item.set_name(item.name);
    proto_item.set_url(item.url);
    proto_item.set_endpoint(endpoint);
    
    return proto_item;
}

std::vector<std::string> Dnd5eServiceImpl::GetAllEndpoints() const {
    return api_client_->GetEndpoints();
}

} // namespace dnd5e


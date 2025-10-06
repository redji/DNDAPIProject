#pragma once

#include <memory>
#include <string>
#include <vector>
#include <grpcpp/grpcpp.h>

#include "dnd5e.grpc.pb.h"
#include "api_client.h"
#include "search_engine.h"

namespace dnd5e {

class Dnd5eServiceImpl final : public Dnd5eService::Service {
public:
    explicit Dnd5eServiceImpl(std::shared_ptr<ApiClient> api_client);
    ~Dnd5eServiceImpl() = default;

    Dnd5eServiceImpl(const Dnd5eServiceImpl&) = delete;
    Dnd5eServiceImpl& operator=(const Dnd5eServiceImpl&) = delete;
    Dnd5eServiceImpl(Dnd5eServiceImpl&&) = delete;
    Dnd5eServiceImpl& operator=(Dnd5eServiceImpl&&) = delete;

    grpc::Status GetEndpoints(grpc::ServerContext* context, const GetEndpointsRequest* request, GetEndpointsResponse* response) override;
    grpc::Status GetList(grpc::ServerContext* context, const GetListRequest* request, GetListResponse* response) override;
    grpc::Status GetItem(grpc::ServerContext* context, const GetItemRequest* request, GetItemResponse* response) override;
    grpc::Status SearchItems(grpc::ServerContext* context, const SearchItemsRequest* request, SearchItemsResponse* response) override;
    grpc::Status HealthCheck(grpc::ServerContext* context, const HealthCheckRequest* request, HealthCheckResponse* response) override;

private:
    std::shared_ptr<ApiClient> api_client_;
    std::unique_ptr<SearchEngine> search_engine_;
    bool IsValidEndpoint(const std::string& endpoint) const;
    ApiItem ConvertToProtoItem(const ApiClient::ApiItem& item, const std::string& endpoint) const;
    std::vector<std::string> GetAllEndpoints() const;
};

} // namespace dnd5e



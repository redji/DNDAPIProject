#pragma once

#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <nlohmann/json.hpp>
#include <curl/curl.h>

namespace dnd5e {

class ApiClient {
public:
    struct ApiItem {
        std::string index;
        std::string name;
        std::string url;
    };

    struct ApiResponse {
        int count;
        std::vector<ApiItem> results;
    };

    explicit ApiClient(const std::string& base_url = "https://www.dnd5eapi.co/api/2014");
    ~ApiClient();

    ApiClient(const ApiClient&) = delete;
    ApiClient& operator=(const ApiClient&) = delete;
    ApiClient(ApiClient&&) = delete;
    ApiClient& operator=(ApiClient&&) = delete;

    ApiResponse GetList(const std::string& endpoint);
    nlohmann::json GetItem(const std::string& endpoint, const std::string& index);
    std::vector<std::string> GetEndpoints();
    bool IsValidEndpoint(const std::string& endpoint);
    const std::string& GetBaseUrl() const;
    void SetTimeout(int timeout_seconds);

private:
    std::string base_url_;
    CURL* curl_;
    int timeout_seconds_;
    std::vector<std::string> valid_endpoints_;

    void InitializeCurl();
    void CleanupCurl();
    std::string MakeRequest(const std::string& url);
    static size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* userp);
    ApiResponse ParseListResponse(const std::string& json_str);
    void LoadValidEndpoints();
};

} // namespace dnd5e



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

    // Non-copyable
    ApiClient(const ApiClient&) = delete;
    ApiClient& operator=(const ApiClient&) = delete;

    // Non-movable
    ApiClient(ApiClient&&) = delete;
    ApiClient& operator=(ApiClient&&) = delete;

    /**
     * @brief Get list of items from an endpoint
     * @param endpoint Endpoint name (e.g., "classes", "spells")
     * @return ApiResponse containing the list of items
     * @throws std::runtime_error if request fails
     */
    ApiResponse GetList(const std::string& endpoint);

    /**
     * @brief Get detailed information about a specific item
     * @param endpoint Endpoint name
     * @param index Item index
     * @return JSON object containing item details
     * @throws std::runtime_error if request fails
     */
    nlohmann::json GetItem(const std::string& endpoint, const std::string& index);

    /**
     * @brief Get all available endpoints
     * @return vector of endpoint names
     */
    std::vector<std::string> GetEndpoints();

    /**
     * @brief Check if an endpoint is valid
     * @param endpoint Endpoint name to check
     * @return true if valid, false otherwise
     */
    bool IsValidEndpoint(const std::string& endpoint);

    /**
     * @brief Get base URL
     * @return base URL string
     */
    const std::string& GetBaseUrl() const;

    /**
     * @brief Set request timeout
     * @param timeout_seconds Timeout in seconds
     */
    void SetTimeout(int timeout_seconds);

private:
    std::string base_url_;
    CURL* curl_;
    int timeout_seconds_;
    std::vector<std::string> valid_endpoints_;

    /**
     * @brief Initialize cURL
     */
    void InitializeCurl();

    /**
     * @brief Cleanup cURL
     */
    void CleanupCurl();

    /**
     * @brief Make HTTP GET request
     * @param url URL to request
     * @return response body as string
     * @throws std::runtime_error if request fails
     */
    std::string MakeRequest(const std::string& url);

    /**
     * @brief cURL write callback function
     * @param contents Data received
     * @param size Size of each element
     * @param nmemb Number of elements
     * @param userp User pointer (string buffer)
     * @return Number of bytes written
     */
    static size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* userp);

    /**
     * @brief Parse JSON response to ApiResponse
     * @param json_str JSON string to parse
     * @return parsed ApiResponse
     * @throws std::runtime_error if parsing fails
     */
    ApiResponse ParseListResponse(const std::string& json_str);

    /**
     * @brief Load valid endpoints from API
     */
    void LoadValidEndpoints();
};

} // namespace dnd5e

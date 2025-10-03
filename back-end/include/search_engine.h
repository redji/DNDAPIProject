#pragma once

#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <functional>
#include "api_client.h"

namespace dnd5e {

struct SearchResult {
    ApiClient::ApiItem item;
    std::string matched_field;
    float relevance_score;
    std::string endpoint;
};

class SearchEngine {
public:
    explicit SearchEngine(std::shared_ptr<ApiClient> api_client);
    ~SearchEngine() = default;

    // Non-copyable
    SearchEngine(const SearchEngine&) = delete;
    SearchEngine& operator=(const SearchEngine&) = delete;

    // Non-movable
    SearchEngine(SearchEngine&&) = delete;
    SearchEngine& operator=(SearchEngine&&) = delete;

    /**
     * @brief Search for items across all or specific endpoints
     * @param query Search query
     * @param endpoints Optional list of endpoints to search in (empty = all endpoints)
     * @param max_results Maximum number of results to return
     * @return vector of search results
     */
    std::vector<SearchResult> Search(
        const std::string& query,
        const std::vector<std::string>& endpoints = {},
        int max_results = 100
    );

    /**
     * @brief Search in a specific endpoint
     * @param query Search query
     * @param endpoint Endpoint to search in
     * @param max_results Maximum number of results
     * @return vector of search results
     */
    std::vector<SearchResult> SearchInEndpoint(
        const std::string& query,
        const std::string& endpoint,
        int max_results = 100
    );

    /**
     * @brief Preload data for faster searching
     * @param endpoints Endpoints to preload (empty = all endpoints)
     */
    void PreloadData(const std::vector<std::string>& endpoints = {});

    /**
     * @brief Clear cached data
     */
    void ClearCache();

    /**
     * @brief Get cache statistics
     * @return map of endpoint names to item counts
     */
    std::unordered_map<std::string, size_t> GetCacheStats() const;

private:
    std::shared_ptr<ApiClient> api_client_;
    std::unordered_map<std::string, std::vector<ApiClient::ApiItem>> cached_data_;

    /**
     * @brief Calculate relevance score for a search result
     * @param item Item to score
     * @param query Search query
     * @param matched_field Which field matched
     * @return relevance score (0.0 to 1.0)
     */
    float CalculateRelevanceScore(
        const ApiClient::ApiItem& item,
        const std::string& query,
        const std::string& matched_field
    ) const;

    /**
     * @brief Check if text contains query (case-insensitive)
     * @param text Text to search in
     * @param query Query to search for
     * @return true if text contains query
     */
    bool ContainsQuery(const std::string& text, const std::string& query) const;

    /**
     * @brief Get data for an endpoint (from cache or API)
     * @param endpoint Endpoint name
     * @return vector of items
     */
    std::vector<ApiClient::ApiItem> GetEndpointData(const std::string& endpoint);

    /**
     * @brief Search in a single item
     * @param item Item to search in
     * @param query Search query
     * @param endpoint Endpoint name
     * @return optional search result if match found
     */
    std::optional<SearchResult> SearchInItem(
        const ApiClient::ApiItem& item,
        const std::string& query,
        const std::string& endpoint
    ) const;
};

} // namespace dnd5e


#pragma once

#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <optional>
#include "api_client.h"

namespace dnd5e {

struct SearchHit {
    ApiClient::ApiItem item;
    std::string matched_field;
    float relevance_score;
    std::string endpoint;
};

class SearchEngine {
public:
    explicit SearchEngine(std::shared_ptr<ApiClient> api_client);
    ~SearchEngine() = default;

    SearchEngine(const SearchEngine&) = delete;
    SearchEngine& operator=(const SearchEngine&) = delete;
    SearchEngine(SearchEngine&&) = delete;
    SearchEngine& operator=(SearchEngine&&) = delete;

    std::vector<SearchHit> Search(const std::string& query, const std::vector<std::string>& endpoints = {}, int max_results = 100);
    std::vector<SearchHit> SearchInEndpoint(const std::string& query, const std::string& endpoint, int max_results = 100);
    void PreloadData(const std::vector<std::string>& endpoints = {});
    void ClearCache();
    std::unordered_map<std::string, size_t> GetCacheStats() const;

private:
    std::shared_ptr<ApiClient> api_client_;
    std::unordered_map<std::string, std::vector<ApiClient::ApiItem>> cached_data_;

    float CalculateRelevanceScore(const ApiClient::ApiItem& item, const std::string& query, const std::string& matched_field) const;
    bool ContainsQuery(const std::string& text, const std::string& query) const;
    std::vector<ApiClient::ApiItem> GetEndpointData(const std::string& endpoint);
    std::optional<SearchHit> SearchInItem(const ApiClient::ApiItem& item, const std::string& query, const std::string& endpoint) const;
};

} // namespace dnd5e



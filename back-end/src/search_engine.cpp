#include "search_engine.h"
#include <algorithm>
#include <cctype>
#include <cmath>
#include <iostream>

namespace dnd5e {

SearchEngine::SearchEngine(std::shared_ptr<ApiClient> api_client)
    : api_client_(api_client) {
}

std::vector<SearchHit> SearchEngine::Search(
    const std::string& query,
    const std::vector<std::string>& endpoints,
    int max_results) {
    
    std::vector<SearchHit> all_results;
    
    // If no specific endpoints provided, search all
    std::vector<std::string> search_endpoints = endpoints;
    if (search_endpoints.empty()) {
        search_endpoints = api_client_->GetEndpoints();
    }
    
    for (const auto& endpoint : search_endpoints) {
        auto endpoint_results = SearchInEndpoint(query, endpoint, max_results);
        all_results.insert(all_results.end(), endpoint_results.begin(), endpoint_results.end());
    }
    
    // Sort by relevance score (highest first)
    std::sort(all_results.begin(), all_results.end(),
        [](const SearchHit& a, const SearchHit& b) {
            return a.relevance_score > b.relevance_score;
        });
    
    // Limit results
    if (static_cast<int>(all_results.size()) > max_results) {
        all_results.resize(max_results);
    }
    
    return all_results;
}

std::vector<SearchHit> SearchEngine::SearchInEndpoint(
    const std::string& query,
    const std::string& endpoint,
    int max_results) {
    
    std::vector<SearchHit> results;
    auto items = GetEndpointData(endpoint);
    
    for (const auto& item : items) {
        auto result = SearchInItem(item, query, endpoint);
        if (result.has_value()) {
            results.push_back(result.value());
        }
    }
    
    // Sort by relevance score
    std::sort(results.begin(), results.end(),
        [](const SearchHit& a, const SearchHit& b) {
            return a.relevance_score > b.relevance_score;
        });
    
    // Limit results
    if (static_cast<int>(results.size()) > max_results) {
        results.resize(max_results);
    }
    
    return results;
}

void SearchEngine::PreloadData(const std::vector<std::string>& endpoints) {
    std::vector<std::string> load_endpoints = endpoints;
    if (load_endpoints.empty()) {
        load_endpoints = api_client_->GetEndpoints();
    }
    
    for (const auto& endpoint : load_endpoints) {
        try {
            auto response = api_client_->GetList(endpoint);
            cached_data_[endpoint] = response.results;
        } catch (const std::exception& e) {
            // Log error but continue with other endpoints
            std::cerr << "Failed to preload data for " << endpoint << ": " << e.what() << std::endl;
        }
    }
}

void SearchEngine::ClearCache() {
    cached_data_.clear();
}

std::unordered_map<std::string, size_t> SearchEngine::GetCacheStats() const {
    std::unordered_map<std::string, size_t> stats;
    for (const auto& [endpoint, items] : cached_data_) {
        stats[endpoint] = items.size();
    }
    return stats;
}

float SearchEngine::CalculateRelevanceScore(
    const ApiClient::ApiItem& item,
    const std::string& query,
    const std::string& matched_field) const {
    
    float score = 0.0f;
    
    // Exact match gets highest score
    if (item.name == query || item.index == query) {
        score += 1.0f;
    }
    // Starts with query gets high score
    else if (item.name.find(query) == 0 || item.index.find(query) == 0) {
        score += 0.8f;
    }
    // Contains query gets medium score
    else if (ContainsQuery(item.name, query) || ContainsQuery(item.index, query)) {
        score += 0.6f;
    }
    
    // Boost score based on matched field
    if (matched_field == "name") {
        score += 0.2f;
    } else if (matched_field == "index") {
        score += 0.1f;
    }
    
    // Normalize score
    return std::min(score, 1.0f);
}

bool SearchEngine::ContainsQuery(const std::string& text, const std::string& query) const {
    if (text.empty() || query.empty()) {
        return false;
    }
    
    // Convert both to lowercase for case-insensitive search
    std::string lower_text = text;
    std::string lower_query = query;
    
    std::transform(lower_text.begin(), lower_text.end(), lower_text.begin(),
        [](unsigned char c) { return std::tolower(c); });
    std::transform(lower_query.begin(), lower_query.end(), lower_query.begin(),
        [](unsigned char c) { return std::tolower(c); });
    
    return lower_text.find(lower_query) != std::string::npos;
}

std::vector<ApiClient::ApiItem> SearchEngine::GetEndpointData(const std::string& endpoint) {
    // Check cache first
    auto it = cached_data_.find(endpoint);
    if (it != cached_data_.end()) {
        return it->second;
    }
    
    // Fetch from API and cache
    try {
        auto response = api_client_->GetList(endpoint);
        cached_data_[endpoint] = response.results;
        return response.results;
    } catch (const std::exception& e) {
        std::cerr << "Failed to get data for " << endpoint << ": " << e.what() << std::endl;
        return {};
    }
}

std::optional<SearchHit> SearchEngine::SearchInItem(
    const ApiClient::ApiItem& item,
    const std::string& query,
    const std::string& endpoint) const {
    
    std::string matched_field;
    bool found = false;
    
    // Check name field
    if (ContainsQuery(item.name, query)) {
        matched_field = "name";
        found = true;
    }
    // Check index field
    else if (ContainsQuery(item.index, query)) {
        matched_field = "index";
        found = true;
    }
    
    if (!found) {
        return std::nullopt;
    }
    
    SearchHit result;
    result.item = item;
    result.matched_field = matched_field;
    result.relevance_score = CalculateRelevanceScore(item, query, matched_field);
    result.endpoint = endpoint;
    
    return result;
}

} // namespace dnd5e


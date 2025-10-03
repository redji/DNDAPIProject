#include "api_client.h"
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <algorithm>

namespace dnd5e {

ApiClient::ApiClient(const std::string& base_url)
    : base_url_(base_url), curl_(nullptr), timeout_seconds_(30) {
    InitializeCurl();
    LoadValidEndpoints();
}

ApiClient::~ApiClient() {
    CleanupCurl();
}

void ApiClient::InitializeCurl() {
    curl_global_init(CURL_GLOBAL_DEFAULT);
    curl_ = curl_easy_init();
    
    if (!curl_) {
        throw std::runtime_error("Failed to initialize cURL");
    }
    
    // Set common options
    curl_easy_setopt(curl_, CURLOPT_USERAGENT, "D&D-5e-Backend/1.0");
    curl_easy_setopt(curl_, CURLOPT_TIMEOUT, timeout_seconds_);
    curl_easy_setopt(curl_, CURLOPT_FOLLOWLOCATION, 1L);
    curl_easy_setopt(curl_, CURLOPT_SSL_VERIFYPEER, 1L);
    curl_easy_setopt(curl_, CURLOPT_SSL_VERIFYHOST, 2L);
}

void ApiClient::CleanupCurl() {
    if (curl_) {
        curl_easy_cleanup(curl_);
        curl_ = nullptr;
    }
    curl_global_cleanup();
}

std::string ApiClient::MakeRequest(const std::string& url) {
    std::string response_data;
    
    curl_easy_setopt(curl_, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl_, CURLOPT_WRITEFUNCTION, WriteCallback);
    curl_easy_setopt(curl_, CURLOPT_WRITEDATA, &response_data);
    
    CURLcode res = curl_easy_perform(curl_);
    
    if (res != CURLE_OK) {
        std::string error_msg = "cURL error: ";
        error_msg += curl_easy_strerror(res);
        throw std::runtime_error(error_msg);
    }
    
    long response_code;
    curl_easy_getinfo(curl_, CURLINFO_RESPONSE_CODE, &response_code);
    
    if (response_code != 200) {
        std::string error_msg = "HTTP error: ";
        error_msg += std::to_string(response_code);
        throw std::runtime_error(error_msg);
    }
    
    return response_data;
}

size_t ApiClient::WriteCallback(void* contents, size_t size, size_t nmemb, std::string* userp) {
    size_t total_size = size * nmemb;
    userp->append(static_cast<char*>(contents), total_size);
    return total_size;
}

ApiClient::ApiResponse ApiClient::GetList(const std::string& endpoint) {
    if (!IsValidEndpoint(endpoint)) {
        throw std::invalid_argument("Invalid endpoint: " + endpoint);
    }
    
    std::string url = base_url_ + "/" + endpoint;
    std::string response = MakeRequest(url);
    
    return ParseListResponse(response);
}

nlohmann::json ApiClient::GetItem(const std::string& endpoint, const std::string& index) {
    if (!IsValidEndpoint(endpoint)) {
        throw std::invalid_argument("Invalid endpoint: " + endpoint);
    }
    
    std::string url = base_url_ + "/" + endpoint + "/" + index;
    std::string response = MakeRequest(url);
    
    try {
        return nlohmann::json::parse(response);
    } catch (const nlohmann::json::exception& e) {
        throw std::runtime_error("Failed to parse JSON response: " + std::string(e.what()));
    }
}

std::vector<std::string> ApiClient::GetEndpoints() {
    return valid_endpoints_;
}

bool ApiClient::IsValidEndpoint(const std::string& endpoint) {
    return std::find(valid_endpoints_.begin(), valid_endpoints_.end(), endpoint) 
           != valid_endpoints_.end();
}

const std::string& ApiClient::GetBaseUrl() const {
    return base_url_;
}

void ApiClient::SetTimeout(int timeout_seconds) {
    timeout_seconds_ = timeout_seconds;
    if (curl_) {
        curl_easy_setopt(curl_, CURLOPT_TIMEOUT, timeout_seconds_);
    }
}

ApiClient::ApiResponse ApiClient::ParseListResponse(const std::string& json_str) {
    try {
        auto json = nlohmann::json::parse(json_str);
        
        ApiResponse response;
        response.count = json.value("count", 0);
        
        if (json.contains("results") && json["results"].is_array()) {
            for (const auto& item : json["results"]) {
                ApiItem api_item;
                api_item.index = item.value("index", "");
                api_item.name = item.value("name", "");
                api_item.url = item.value("url", "");
                response.results.push_back(api_item);
            }
        }
        
        return response;
        
    } catch (const nlohmann::json::exception& e) {
        throw std::runtime_error("Failed to parse JSON response: " + std::string(e.what()));
    }
}

void ApiClient::LoadValidEndpoints() {
    // Define the known valid endpoints
    valid_endpoints_ = {
        "ability-scores",
        "alignments",
        "backgrounds",
        "classes",
        "conditions",
        "damage-types",
        "equipment",
        "equipment-categories",
        "feats",
        "features",
        "languages",
        "magic-items",
        "magic-schools",
        "monsters",
        "proficiencies",
        "races",
        "rule-sections",
        "rules",
        "skills",
        "spells",
        "subclasses",
        "subraces",
        "traits",
        "weapon-properties"
    };
}

} // namespace dnd5e


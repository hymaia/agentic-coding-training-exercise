import Foundation

/// Item condition enum
enum ItemCondition: String, Codable, CaseIterable, Sendable {
    case new = "new"
    case likeNew = "like_new"
    case good = "good"
    case fair = "fair"
    case parts = "parts"
    case unknown = "unknown"
}

/// Item status enum
enum ItemStatus: String, Codable, CaseIterable, Sendable {
    case draft = "draft"
    case active = "active"
    case reserved = "reserved"
    case sold = "sold"
    case archived = "archived"
}

/// Item warranty enum
enum ItemWarranty: String, Codable, CaseIterable, Sendable {
    case none = "none"
    case sixMonths = "6_months"
    case oneYear = "1_year"
    case twoYears = "2_years"
}

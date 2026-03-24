import Foundation

/// Pagination options
struct PaginationOptions: Sendable {
    let limit: Int
    let cursor: String?

    init(limit: Int = 20, cursor: String? = nil) {
        self.limit = limit
        self.cursor = cursor
    }
}

/// Filter options for listing items
struct ItemFilters: Sendable {
    let status: String?
    let category: String?
    let city: String?
    let postalCode: String?
    let isFeatured: Bool?
    let deliveryAvailable: Bool?
    let minPriceCents: Int?
    let maxPriceCents: Int?

    init(
        status: String? = nil,
        category: String? = nil,
        city: String? = nil,
        postalCode: String? = nil,
        isFeatured: Bool? = nil,
        deliveryAvailable: Bool? = nil,
        minPriceCents: Int? = nil,
        maxPriceCents: Int? = nil
    ) {
        self.status = status
        self.category = category
        self.city = city
        self.postalCode = postalCode
        self.isFeatured = isFeatured
        self.deliveryAvailable = deliveryAvailable
        self.minPriceCents = minPriceCents
        self.maxPriceCents = maxPriceCents
    }
}

/// Sort options
struct SortOptions: Sendable {
    enum Field: String {
        case id
        case title
        case priceCents = "price_cents"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case publishedAt = "published_at"
    }

    enum Direction: String {
        case asc
        case desc
    }

    let field: Field
    let direction: Direction

    init(field: Field = .createdAt, direction: Direction = .desc) {
        self.field = field
        self.direction = direction
    }

    var rawValue: String {
        return "\(field.rawValue):\(direction.rawValue)"
    }
}

/// Paginated result
struct ItemPage: Sendable {
    let items: [Item]
    let nextCursor: String?

    init(items: [Item], nextCursor: String? = nil) {
        self.items = items
        self.nextCursor = nextCursor
    }
}

/// Item repository protocol (port)
/// This is the port that the application layer depends on.
/// Adapters implement this protocol to provide persistence.
protocol ItemRepositoryProtocol: Sendable {
    /// Create a new item
    func create(_ item: CreateItemData) async throws -> Item

    /// Find item by ID
    func findById(_ id: Int) async throws -> Item?

    /// List all items with filters, sorting, and pagination
    func findAll(filters: ItemFilters, sort: SortOptions, limit: Int, cursor: String?) async throws -> ItemPage

    /// Full-text search
    func search(query: String, filters: ItemFilters, sort: SortOptions, limit: Int, cursor: String?) async throws -> ItemPage

    /// Update (replace) an item
    func update(_ item: ReplaceItemData, id: Int) async throws -> Item?

    /// Partial update an item
    func patch(_ data: UpdateItemData, id: Int) async throws -> Item?

    /// Delete an item
    func delete(id: Int) async throws -> Bool

    /// Check if an item exists
    func exists(id: Int) async throws -> Bool
}

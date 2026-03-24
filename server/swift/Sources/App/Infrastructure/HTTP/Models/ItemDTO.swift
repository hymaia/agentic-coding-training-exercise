import Foundation
import Vapor

// MARK: - Response Models

/// Health check response
struct HealthResponse: Content {
    let status: String
    let timestamp: String

    init() {
        self.status = "ok"
        self.timestamp = ISO8601Formatter.string(from: Date())
    }
}

/// Item response (full item data)
struct ItemResponse: Content {
    let id: Int
    let title: String
    let description: String?
    let priceCents: Int
    let category: String?
    let condition: String
    let status: String
    let isFeatured: Bool
    let city: String?
    let postalCode: String?
    let country: String
    let deliveryAvailable: Bool
    let warranty: String
    let createdAt: String
    let updatedAt: String
    let publishedAt: String?
    let images: [ItemImage]

    enum CodingKeys: String, CodingKey {
        case id
        case title
        case description
        case priceCents = "price_cents"
        case category
        case condition
        case status
        case isFeatured = "is_featured"
        case city
        case postalCode = "postal_code"
        case country
        case deliveryAvailable = "delivery_available"
        case warranty
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case publishedAt = "published_at"
        case images
    }

    init(from item: Item) {
        self.id = item.id
        self.title = item.title
        self.description = item.description
        self.priceCents = item.priceCents
        self.category = item.category
        self.condition = item.condition.rawValue
        self.status = item.status.rawValue
        self.isFeatured = item.isFeatured
        self.city = item.city
        self.postalCode = item.postalCode
        self.country = item.country
        self.deliveryAvailable = item.deliveryAvailable
        self.warranty = item.warranty.rawValue
        self.createdAt = ISO8601Formatter.string(from: item.createdAt)
        self.updatedAt = ISO8601Formatter.string(from: item.updatedAt)
        self.publishedAt = item.publishedAt.map { ISO8601Formatter.string(from: $0) }
        self.images = item.images
    }
}

/// List items response with pagination
struct ListItemsResponse: Content {
    let items: [ItemResponse]
    let nextCursor: String?

    enum CodingKeys: String, CodingKey {
        case items
        case nextCursor = "next_cursor"
    }

    init(from page: ItemPage) {
        self.items = page.items.map { ItemResponse(from: $0) }
        self.nextCursor = page.nextCursor
    }
}

// MARK: - Request Models

/// Create item request
struct CreateItemRequest: Content {
    let title: String
    let description: String?
    let priceCents: Int
    let category: String?
    let condition: String
    let status: String?
    let isFeatured: Bool?
    let city: String?
    let postalCode: String?
    let country: String?
    let deliveryAvailable: Bool?
    var warranty: ItemWarranty?
    let images: [ItemImage]?

    enum CodingKeys: String, CodingKey {
        case title
        case description
        case priceCents = "price_cents"
        case category
        case condition
        case status
        case isFeatured = "is_featured"
        case city
        case postalCode = "postal_code"
        case country
        case deliveryAvailable = "delivery_available"
        case warranty
        case images
    }

    func toCreateItemData() throws -> CreateItemData {
        guard let condition = ItemCondition(rawValue: condition) else {
            throw DomainError.validationError(["condition": "Invalid condition value"])
        }

        let statusValue: ItemStatus
        if let statusStr = status {
            guard let s = ItemStatus(rawValue: statusStr) else {
                throw DomainError.validationError(["status": "Invalid status value"])
            }
            statusValue = s
        } else {
            statusValue = .draft
        }

        return CreateItemData(
            title: title,
            description: description,
            priceCents: priceCents,
            category: category,
            condition: condition,
            status: statusValue,
            isFeatured: isFeatured ?? false,
            city: city,
            postalCode: postalCode,
            country: country ?? "FR",
            deliveryAvailable: deliveryAvailable ?? false,
            warranty: warranty ?? .none,
            images: images ?? []
        )
    }
}

/// Update item request (full replace)
struct UpdateItemRequest: Content {
    let title: String
    let description: String?
    let priceCents: Int
    let category: String?
    let condition: String
    let status: String
    let isFeatured: Bool
    let city: String?
    let postalCode: String?
    let country: String
    let deliveryAvailable: Bool
    let warranty: ItemWarranty
    let images: [ItemImage]

    enum CodingKeys: String, CodingKey {
        case title
        case description
        case priceCents = "price_cents"
        case category
        case condition
        case status
        case isFeatured = "is_featured"
        case city
        case postalCode = "postal_code"
        case country
        case deliveryAvailable = "delivery_available"
        case warranty
        case images
    }

    func toReplaceItemData() throws -> ReplaceItemData {
        guard let condition = ItemCondition(rawValue: condition) else {
            throw DomainError.validationError(["condition": "Invalid condition value"])
        }

        guard let status = ItemStatus(rawValue: status) else {
            throw DomainError.validationError(["status": "Invalid status value"])
        }

        return ReplaceItemData(
            title: title,
            description: description,
            priceCents: priceCents,
            category: category,
            condition: condition,
            status: status,
            isFeatured: isFeatured,
            city: city,
            postalCode: postalCode,
            country: country,
            deliveryAvailable: deliveryAvailable,
            warranty: warranty,
            images: images
        )
    }
}

/// Patch item request (partial update)
struct PatchItemRequest: Content {
    let title: String?
    let description: String?
    let priceCents: Int?
    let category: String?
    let condition: String?
    let status: String?
    let isFeatured: Bool?
    let city: String?
    let postalCode: String?
    let country: String?
    let deliveryAvailable: Bool?
    let warranty: ItemWarranty?
    let images: [ItemImage]?

    enum CodingKeys: String, CodingKey {
        case title
        case description
        case priceCents = "price_cents"
        case category
        case condition
        case status
        case isFeatured = "is_featured"
        case city
        case postalCode = "postal_code"
        case country
        case deliveryAvailable = "delivery_available"
        case warranty
        case images
    }

    func toUpdateItemData() throws -> UpdateItemData {
        var data = UpdateItemData()

        if let title = title { data.title = title }
        if let description = description { data.description = description }
        if let priceCents = priceCents { data.priceCents = priceCents }
        if let category = category { data.category = category }
        if let conditionStr = condition {
            guard let c = ItemCondition(rawValue: conditionStr) else {
                throw DomainError.validationError(["condition": "Invalid condition value"])
            }
            data.condition = c
        }
        if let statusStr = status {
            guard let s = ItemStatus(rawValue: statusStr) else {
                throw DomainError.validationError(["status": "Invalid status value"])
            }
            data.status = s
        }
        if let isFeatured = isFeatured { data.isFeatured = isFeatured }
        if let city = city { data.city = city }
        if let postalCode = postalCode { data.postalCode = postalCode }
        if let country = country { data.country = country }
        if let deliveryAvailable = deliveryAvailable { data.deliveryAvailable = deliveryAvailable }
        if let warranty = warranty { data.warranty = warranty }
        if let images = images { data.images = images }

        return data
    }
}

import Foundation

/// Item entity
struct Item: Codable, Equatable, Sendable {
    let id: Int
    let title: String
    let description: String?
    let priceCents: Int
    let category: String?
    let condition: ItemCondition
    let status: ItemStatus
    let isFeatured: Bool
    let city: String?
    let postalCode: String?
    let country: String
    let deliveryAvailable: Bool
    let warranty: ItemWarranty
    let createdAt: Date
    let updatedAt: Date
    let publishedAt: Date?
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

    init(
        id: Int,
        title: String,
        description: String? = nil,
        priceCents: Int,
        category: String? = nil,
        condition: ItemCondition,
        status: ItemStatus,
        isFeatured: Bool,
        city: String? = nil,
        postalCode: String? = nil,
        country: String,
        deliveryAvailable: Bool,
        warranty: ItemWarranty = .none,
        createdAt: Date,
        updatedAt: Date,
        publishedAt: Date? = nil,
        images: [ItemImage] = []
    ) {
        self.id = id
        self.title = title
        self.description = description
        self.priceCents = priceCents
        self.category = category
        self.condition = condition
        self.status = status
        self.isFeatured = isFeatured
        self.city = city
        self.postalCode = postalCode
        self.country = country
        self.deliveryAvailable = deliveryAvailable
        self.warranty = warranty
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.publishedAt = publishedAt
        self.images = images
    }
}

/// Item data for creation (without id and timestamps)
struct CreateItemData: Sendable {
    let title: String
    let description: String?
    let priceCents: Int
    let category: String?
    let condition: ItemCondition
    let status: ItemStatus
    let isFeatured: Bool
    let city: String?
    let postalCode: String?
    let country: String
    let deliveryAvailable: Bool
    let warranty: ItemWarranty
    let images: [ItemImage]

    func withDefaults() -> CreateItemData {
        return CreateItemData(
            title: title,
            description: description,
            priceCents: priceCents,
            category: category,
            condition: condition,
            status: status,
            isFeatured: isFeatured,
            city: city,
            postalCode: postalCode,
            country: country.isEmpty ? "FR" : country,
            deliveryAvailable: deliveryAvailable,
            warranty: warranty,
            images: images
        )
    }
}

/// Item data for update (all optional except id)
struct UpdateItemData: Sendable {
    var title: String?
    var description: String?
    var priceCents: Int?
    var category: String?
    var condition: ItemCondition?
    var status: ItemStatus?
    var isFeatured: Bool?
    var city: String?
    var postalCode: String?
    var country: String?
    var deliveryAvailable: Bool?
    var warranty: ItemWarranty?
    var images: [ItemImage]?
}

/// Item data for PUT (full replace)
struct ReplaceItemData: Sendable {
    let title: String
    let description: String?
    let priceCents: Int
    let category: String?
    let condition: ItemCondition
    let status: ItemStatus
    let isFeatured: Bool
    let city: String?
    let postalCode: String?
    let country: String
    let deliveryAvailable: Bool
    let warranty: ItemWarranty
    let images: [ItemImage]
}

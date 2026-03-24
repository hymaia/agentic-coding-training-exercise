import Foundation
import Vapor

/// Use case for creating items
actor CreateItemUseCase {
    private let repository: ItemRepositoryProtocol

    init(repository: ItemRepositoryProtocol) {
        self.repository = repository
    }

    /// Execute the use case
    func execute(_ data: CreateItemData) async throws -> Item {
        // Validate input
        try validate(data)

        // Apply defaults
        let itemData = applyDefaults(to: data)

        // Create item via repository
        return try await repository.create(itemData)
    }

    // MARK: - Validation

    private func validate(_ data: CreateItemData) throws {
        var errors: [String: String] = [:]

        // Title validation
        if data.title.count < 3 {
            errors["title"] = "Title must be at least 3 characters"
        } else if data.title.count > 200 {
            errors["title"] = "Title must be at most 200 characters"
        }

        // Price validation
        if data.priceCents < 0 {
            errors["price_cents"] = "Price must be greater than or equal to 0"
        }

        // If there are validation errors, throw
        if !errors.isEmpty {
            throw DomainError.validationError(errors)
        }
    }

    private func applyDefaults(to data: CreateItemData) -> CreateItemData {
        return CreateItemData(
            title: data.title,
            description: data.description,
            priceCents: data.priceCents,
            category: data.category,
            condition: data.condition,
            status: data.status == .draft ? .draft : data.status, // Keep status if set, otherwise draft
            isFeatured: data.isFeatured,
            city: data.city,
            postalCode: data.postalCode,
            country: data.country.isEmpty ? "FR" : data.country,
            deliveryAvailable: data.deliveryAvailable,
            warranty: data.warranty,
            images: data.images
        )
    }
}

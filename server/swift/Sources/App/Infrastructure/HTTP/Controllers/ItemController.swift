import Vapor

/// Item controller handling all item-related HTTP requests
struct ItemController {
    let createItemUseCase: CreateItemUseCase
    let getItemUseCase: GetItemUseCase
    let listItemsUseCase: ListItemsUseCase
    let updateItemUseCase: UpdateItemUseCase
    let patchItemUseCase: PatchItemUseCase
    let deleteItemUseCase: DeleteItemUseCase

    // MARK: - Health Check

    /// Health check endpoint
    func health(_ req: Request) async throws -> HealthResponse {
        return HealthResponse()
    }

    // MARK: - List Items

    /// List items with optional filtering, sorting, and pagination
    func list(_ req: Request) async throws -> Response {
        // Parse query parameters with validation
        var validationErrors: [String: String] = [:]

        let status = req.query["status"] as String?
        if let statusValue = status, ItemStatus(rawValue: statusValue) == nil {
            validationErrors["status"] = "Invalid status value"
        }

        let category = req.query["category"] as String?

        let city = req.query["city"] as String?
        let postalCode = req.query["postal_code"] as String?

        var isFeatured: Bool?
        if let isFeaturedStr = req.query["is_featured"] as String? {
            switch isFeaturedStr.lowercased() {
            case "true":
                isFeatured = true
            case "false":
                isFeatured = false
            default:
                validationErrors["is_featured"] = "is_featured must be a boolean"
            }
        }

        var deliveryAvailable: Bool?
        if let deliveryStr = req.query["delivery_available"] as String? {
            switch deliveryStr.lowercased() {
            case "true":
                deliveryAvailable = true
            case "false":
                deliveryAvailable = false
            default:
                validationErrors["delivery_available"] = "delivery_available must be a boolean"
            }
        }

        var minPriceCents: Int?
        if let minPriceStr = req.query["min_price_cents"] as String? {
            if let value = Int(minPriceStr) {
                if value < 0 {
                    validationErrors["min_price_cents"] = "min_price_cents must be >= 0"
                } else {
                    minPriceCents = value
                }
            } else {
                validationErrors["min_price_cents"] = "min_price_cents must be an integer"
            }
        }

        var maxPriceCents: Int?
        if let maxPriceStr = req.query["max_price_cents"] as String? {
            if let value = Int(maxPriceStr) {
                if value < 0 {
                    validationErrors["max_price_cents"] = "max_price_cents must be >= 0"
                } else {
                    maxPriceCents = value
                }
            } else {
                validationErrors["max_price_cents"] = "max_price_cents must be an integer"
            }
        }

        // Build filters
        let filters = ItemFilters(
            status: status,
            category: category,
            city: city,
            postalCode: postalCode,
            isFeatured: isFeatured,
            deliveryAvailable: deliveryAvailable,
            minPriceCents: minPriceCents,
            maxPriceCents: maxPriceCents
        )

        // Parse sort parameter
        var sort = SortOptions()
        if let sortStr = req.query["sort"] as String? {
            let parts = sortStr.split(separator: ":", maxSplits: 1)
            if parts.count != 2 {
                validationErrors["sort"] = "sort must be in the form field:direction"
            } else {
                let fieldStr = String(parts[0])
                let directionStr = String(parts[1])
                if let field = SortOptions.Field(rawValue: fieldStr) {
                    if let direction = SortOptions.Direction(rawValue: directionStr) {
                        sort = SortOptions(field: field, direction: direction)
                    } else {
                        validationErrors["sort"] = "sort direction must be asc or desc"
                    }
                } else {
                    validationErrors["sort"] = "sort field must be one of: id, title, price_cents, created_at, updated_at, published_at"
                }
            }
        }

        // Parse pagination parameters
        var limit = 20
        if let limitStr = req.query["limit"] as String? {
            if let value = Int(limitStr) {
                if value < 1 || value > 100 {
                    validationErrors["limit"] = "limit must be between 1 and 100"
                } else {
                    limit = value
                }
            } else {
                validationErrors["limit"] = "limit must be an integer"
            }
        }
        let cursor = req.query["cursor"] as String?

        if !validationErrors.isEmpty {
            throw DomainError.validationError(validationErrors)
        }

        // Check if this is a search request
        if let query = req.query["q"] as String? {
            // Full-text search
            let page = try await listItemsUseCase.executeSearch(
                query: query,
                filters: filters,
                sort: sort,
                limit: limit,
                cursor: cursor
            )

            let response = ListItemsResponse(from: page)
            return try encodeResponse(response, status: .ok)
        } else {
            // Regular list
            let page = try await listItemsUseCase.execute(
                filters: filters,
                sort: sort,
                limit: limit,
                cursor: cursor
            )

            let response = ListItemsResponse(from: page)
            return try encodeResponse(response, status: .ok)
        }
    }

    // MARK: - Create Item

    /// Create a new item
    func create(_ req: Request) async throws -> Response {
        let request = try req.content.decode(CreateItemRequest.self)
        let data = try request.toCreateItemData()
        let item = try await createItemUseCase.execute(data)

        let response = ItemResponse(from: item)
        return try encodeResponse(response, status: .created)
    }

    // MARK: - Get Item

    /// Get a single item by ID
    func get(_ req: Request) async throws -> Response {
        guard let id = req.parameters.get("id", as: Int.self) else {
            throw DomainError.validationError(["id": "Invalid item ID"])
        }

        let item = try await getItemUseCase.execute(id: id)
        let response = ItemResponse(from: item)

        return try encodeResponse(response, status: .ok)
    }

    // MARK: - Update Item

    /// Replace an entire item
    func update(_ req: Request) async throws -> Response {
        guard let id = req.parameters.get("id", as: Int.self) else {
            throw DomainError.validationError(["id": "Invalid item ID"])
        }

        let request = try req.content.decode(UpdateItemRequest.self)
        let data = try request.toReplaceItemData()
        let item = try await updateItemUseCase.execute(data, id: id)

        let response = ItemResponse(from: item)
        return try encodeResponse(response, status: .ok)
    }

    // MARK: - Patch Item

    /// Partially update an item
    func patch(_ req: Request) async throws -> Response {
        guard let id = req.parameters.get("id", as: Int.self) else {
            throw DomainError.validationError(["id": "Invalid item ID"])
        }

        let request = try req.content.decode(PatchItemRequest.self)
        let data = try request.toUpdateItemData()
        let item = try await patchItemUseCase.execute(data, id: id)

        let response = ItemResponse(from: item)
        return try encodeResponse(response, status: .ok)
    }

    // MARK: - Delete Item

    /// Delete an item
    func delete(_ req: Request) async throws -> Response {
        guard let id = req.parameters.get("id", as: Int.self) else {
            throw DomainError.validationError(["id": "Invalid item ID"])
        }

        _ = try await deleteItemUseCase.execute(id: id)

        return Response(status: .noContent)
    }

    // MARK: - Helper Methods

    private func encodeResponse(_ content: Content, status: HTTPResponseStatus) throws -> Response {
        let encoder = JSONEncoder.vaporISO8601
        let data = try encoder.encode(content)
        let body = Response.Body(data: data)

        return Response(
            status: status,
            headers: ["Content-Type": "application/json"],
            body: body
        )
    }
}

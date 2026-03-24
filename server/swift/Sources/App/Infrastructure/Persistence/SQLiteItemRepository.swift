import Foundation
import SQLKit

/// SQLite repository adapter for items
actor SQLiteItemRepository: ItemRepositoryProtocol {
    private let sql: SQLDatabase

    init(database: SQLDatabase) {
        self.sql = database
    }

    /// Create a new item
    func create(_ item: CreateItemData) async throws -> Item {
        let now = ISO8601Formatter.string(from: Date())

        let imagesJSON = try JSONEncoder().encode(item.images)
        let imagesString = String(data: imagesJSON, encoding: .utf8) ?? "[]"

        let insertQuery: SQLQueryString = """
            INSERT INTO items (
                title, description, price_cents, category, condition, status,
                is_featured, city, postal_code, country, delivery_available,
                images, created_at, updated_at
            ) VALUES (
                \(bind: item.title),
                \(bind: item.description),
                \(bind: item.priceCents),
                \(bind: item.category),
                \(bind: item.condition.rawValue),
                \(bind: item.status.rawValue),
                \(bind: item.isFeatured ? 1 : 0),
                \(bind: item.city),
                \(bind: item.postalCode),
                \(bind: item.country),
                \(bind: item.deliveryAvailable ? 1 : 0),
                \(bind: imagesString),
                \(bind: now),
                \(bind: now)
            )
        """

        try await sql.raw(insertQuery).run()

        // Get the last inserted row ID
        let lastId = try await sql.raw("SELECT last_insert_rowid() as id").first()
        guard let lastIdRow = lastId else {
            throw DomainError.internalError("Failed to get inserted item ID")
        }

        let rowId: Int64 = try lastIdRow.decode(column: "id", inferringAs: Int64.self)
        guard rowId > 0 else {
            throw DomainError.internalError("Failed to get inserted item ID")
        }

        guard let createdItem = try await findById(Int(rowId)) else {
            throw DomainError.internalError("Failed to retrieve created item")
        }

        return createdItem
    }

    /// Find item by ID
    func findById(_ id: Int) async throws -> Item? {
        let query: SQLQueryString = "SELECT * FROM items WHERE id = \(bind: id)"
        let rows = try await sql.raw(query).all()

        guard let row = rows.first else {
            return nil
        }

        return try rowToItem(row)
    }

    /// List all items with filters, sorting, and pagination
    func findAll(filters: ItemFilters, sort: SortOptions, limit: Int, cursor: String?) async throws -> ItemPage {
        // Build WHERE clause
        var whereConditions: [SQLQueryString] = []

        if let status = filters.status {
            whereConditions.append("status = \(bind: status)")
        }
        if let category = filters.category {
            whereConditions.append("category = \(bind: category)")
        }
        if let city = filters.city {
            whereConditions.append("city = \(bind: city)")
        }
        if let postalCode = filters.postalCode {
            whereConditions.append("postal_code = \(bind: postalCode)")
        }
        if let isFeatured = filters.isFeatured {
            whereConditions.append("is_featured = \(bind: isFeatured)")
        }
        if let deliveryAvailable = filters.deliveryAvailable {
            whereConditions.append("delivery_available = \(bind: deliveryAvailable)")
        }
        if let minPriceCents = filters.minPriceCents {
            whereConditions.append("price_cents >= \(bind: minPriceCents)")
        }
        if let maxPriceCents = filters.maxPriceCents {
            whereConditions.append("price_cents <= \(bind: maxPriceCents)")
        }

        // Handle cursor pagination
        if let cursor = cursor, let cursorData = CursorCodec.decode(cursor) {
            let sortField = sort.field.rawValue
            let sortDir = sort.direction
            let comparator = sortDir == .desc ? "<" : ">"

            let cursorCondition: SQLQueryString = """
                (\(ident: sortField), \(ident: "id")) \(unsafeRaw: comparator) (\(bind: cursorData.createdAt), \(bind: cursorData.id))
                """
            whereConditions.append(cursorCondition)
        }

        let whereClause: SQLQueryString = whereConditions.isEmpty
            ? ""
            : "WHERE \(SQLList(whereConditions, separator: SQLRaw(" AND ")))"

        // Build ORDER BY clause
        let direction = sort.direction == .asc ? "ASC" : "DESC"
        let orderClause: SQLQueryString = """
            ORDER BY \(ident: sort.field.rawValue) \(unsafeRaw: direction), \(ident: "id") \(unsafeRaw: direction)
            """

        // Build LIMIT clause
        let limitClause: SQLQueryString = "LIMIT \(literal: limit + 1)"

        // Build and execute query
        let queryString: SQLQueryString = "SELECT * FROM items \(whereClause) \(orderClause) \(limitClause)"

        let rows = try await sql.raw(queryString).all()

        // Check if there's a next page
        let hasNextPage = rows.count > limit
        let itemRows = Array(rows.prefix(limit))

        let items = try itemRows.map { try rowToItem($0) }

        // Build next cursor
        var nextCursor: String?
        if hasNextPage, let lastItem = items.last {
            nextCursor = CursorCodec.encode(id: lastItem.id, createdAt: ISO8601Formatter.string(from: lastItem.updatedAt))
        }

        return ItemPage(items: items, nextCursor: nextCursor)
    }

    /// Full-text search using FTS5
    func search(query: String, filters: ItemFilters, sort: SortOptions, limit: Int, cursor: String?) async throws -> ItemPage {
        // Build WHERE clause for filters
        var whereConditions: [SQLQueryString] = []

        if let status = filters.status {
            whereConditions.append("items.status = \(bind: status)")
        }
        if let category = filters.category {
            whereConditions.append("items.category = \(bind: category)")
        }
        if let city = filters.city {
            whereConditions.append("items.city = \(bind: city)")
        }
        if let postalCode = filters.postalCode {
            whereConditions.append("items.postal_code = \(bind: postalCode)")
        }
        if let isFeatured = filters.isFeatured {
            whereConditions.append("items.is_featured = \(bind: isFeatured)")
        }
        if let deliveryAvailable = filters.deliveryAvailable {
            whereConditions.append("items.delivery_available = \(bind: deliveryAvailable)")
        }
        if let minPriceCents = filters.minPriceCents {
            whereConditions.append("items.price_cents >= \(bind: minPriceCents)")
        }
        if let maxPriceCents = filters.maxPriceCents {
            whereConditions.append("items.price_cents <= \(bind: maxPriceCents)")
        }

        // Handle cursor pagination
        if let cursor = cursor, let cursorData = CursorCodec.decode(cursor) {
            let cursorCondition: SQLQueryString = """
                (\(ident: "items.created_at"), \(ident: "items.id")) < (\(bind: cursorData.createdAt), \(bind: cursorData.id))
                """
            whereConditions.append(cursorCondition)
        }

        let filtersClause: SQLQueryString = whereConditions.isEmpty
            ? ""
            : "AND \(SQLList(whereConditions, separator: SQLRaw(" AND ")))"

        // Build LIMIT clause
        let limitClause: SQLQueryString = "LIMIT \(literal: limit + 1)"

        let ftsQuery = query

        // Execute FTS search with BM25 ranking
        let searchQuery: SQLQueryString = """
        SELECT items.* FROM items
        INNER JOIN items_fts ON items.id = items_fts.rowid
        WHERE items_fts MATCH \(bind: ftsQuery)
        \(filtersClause)
        ORDER BY bm25(items_fts), items.created_at DESC, items.id DESC
        \(limitClause)
        """

        let rows = try await sql.raw(searchQuery).all()

        // Check if there's a next page
        let hasNextPage = rows.count > limit
        let itemRows = Array(rows.prefix(limit))

        let items = try itemRows.map { try rowToItem($0) }

        // Build next cursor
        var nextCursor: String?
        if hasNextPage, let lastItem = items.last {
            nextCursor = CursorCodec.encode(id: lastItem.id, createdAt: ISO8601Formatter.string(from: lastItem.updatedAt))
        }

        return ItemPage(items: items, nextCursor: nextCursor)
    }

    /// Update (replace) an item
    func update(_ item: ReplaceItemData, id: Int) async throws -> Item? {
        let now = ISO8601Formatter.string(from: Date())

        let imagesJSON = try JSONEncoder().encode(item.images)
        let imagesString = String(data: imagesJSON, encoding: .utf8) ?? "[]"

        let updateQuery: SQLQueryString = """
            UPDATE items SET
                title = \(bind: item.title),
                description = \(bind: item.description),
                price_cents = \(bind: item.priceCents),
                category = \(bind: item.category),
                condition = \(bind: item.condition.rawValue),
                status = \(bind: item.status.rawValue),
                is_featured = \(bind: item.isFeatured ? 1 : 0),
                city = \(bind: item.city),
                postal_code = \(bind: item.postalCode),
                country = \(bind: item.country),
                delivery_available = \(bind: item.deliveryAvailable ? 1 : 0),
                images = \(bind: imagesString),
                updated_at = \(bind: now)
            WHERE id = \(bind: id)
        """

        try await sql.raw(updateQuery).run()
        let updateCount = try await changesCount()
        if updateCount == 0 {
            return nil
        }

        return try await findById(id)
    }

    /// Partial update an item
    func patch(_ data: UpdateItemData, id: Int) async throws -> Item? {
        var updates: [SQLQueryString] = []

        if let title = data.title {
            updates.append("title = \(bind: title)")
        }
        if let description = data.description {
            updates.append("description = \(bind: description)")
        }
        if let priceCents = data.priceCents {
            updates.append("price_cents = \(bind: priceCents)")
        }
        if let category = data.category {
            updates.append("category = \(bind: category)")
        }
        if let condition = data.condition {
            updates.append("condition = \(bind: condition)")
        }
        if let status = data.status {
            updates.append("status = \(bind: status)")
        }
        if let isFeatured = data.isFeatured {
            updates.append("is_featured = \(bind: isFeatured)")
        }
        if let city = data.city {
            updates.append("city = \(bind: city)")
        }
        if let postalCode = data.postalCode {
            updates.append("postal_code = \(bind: postalCode)")
        }
        if let country = data.country {
            updates.append("country = \(bind: country)")
        }
        if let deliveryAvailable = data.deliveryAvailable {
            updates.append("delivery_available = \(bind: deliveryAvailable)")
        }
        if let images = data.images {
            let imagesJSON = try JSONEncoder().encode(images)
            let imagesString = String(data: imagesJSON, encoding: .utf8) ?? "[]"
            updates.append("images = \(bind: imagesString)")
        }

        if updates.isEmpty {
            return try await findById(id)
        }

        let now = ISO8601Formatter.string(from: Date())
        updates.append("updated_at = \(bind: now)")

        let stmt: SQLQueryString = """
            UPDATE items SET \(SQLList(updates, separator: SQLRaw(", "))) WHERE id = \(bind: id)
            """

        try await sql.raw(stmt).run()
        let updateCount = try await changesCount()
        if updateCount == 0 {
            return nil
        }

        return try await findById(id)
    }

    /// Delete an item
    func delete(id: Int) async throws -> Bool {
        let query: SQLQueryString = "DELETE FROM items WHERE id = \(bind: id)"
        try await sql.raw(query).run()
        return try await changesCount() > 0
    }

    /// Check if an item exists
    func exists(id: Int) async throws -> Bool {
        let query: SQLQueryString = "SELECT 1 FROM items WHERE id = \(bind: id) LIMIT 1"
        let result = try await sql.raw(query).first()

        return result != nil
    }

    // MARK: - Helper Methods

    /// Convert database row to Item entity
    private func rowToItem(_ row: SQLRow) throws -> Item {
        let id: Int = try row.decode(column: "id")
        let title: String = try row.decode(column: "title")
        let priceCents: Int = try row.decode(column: "price_cents")
        let conditionRaw: String = try row.decode(column: "condition")
        let statusRaw: String = try row.decode(column: "status")
        let isFeaturedInt: Int = try row.decode(column: "is_featured")
        let country: String = try row.decode(column: "country")
        let deliveryAvailableInt: Int = try row.decode(column: "delivery_available")
        let createdAtString: String = try row.decode(column: "created_at")
        let updatedAtString: String = try row.decode(column: "updated_at")

        guard let condition = ItemCondition(rawValue: conditionRaw),
              let status = ItemStatus(rawValue: statusRaw),
              let createdAt = ISO8601Formatter.date(from: createdAtString),
              let updatedAt = ISO8601Formatter.date(from: updatedAtString) else {
            throw DomainError.internalError("Failed to parse item row")
        }

        let description: String? = try row.decode(column: "description", as: String?.self)
        let category: String? = try row.decode(column: "category", as: String?.self)
        let city: String? = try row.decode(column: "city", as: String?.self)
        let postalCode: String? = try row.decode(column: "postal_code", as: String?.self)
        let publishedAtString: String? = try row.decode(column: "published_at", as: String?.self)
        let publishedAt = publishedAtString.flatMap { ISO8601Formatter.date(from: $0) }

        let imagesString: String? = try row.decode(column: "images", as: String?.self)
        let images = parseImages(imagesString)

        return Item(
            id: id,
            title: title,
            description: description,
            priceCents: priceCents,
            category: category,
            condition: condition,
            status: status,
            isFeatured: isFeaturedInt != 0,
            city: city,
            postalCode: postalCode,
            country: country,
            deliveryAvailable: deliveryAvailableInt != 0,
            createdAt: createdAt,
            updatedAt: updatedAt,
            publishedAt: publishedAt,
            images: images
        )
    }

    private func changesCount() async throws -> Int {
        guard let row = try await sql.raw("SELECT changes() as count").first() else {
            return 0
        }
        let count: Int = try row.decode(column: "count")
        return count
    }

    /// Parse images from JSON column
    private func parseImages(_ jsonString: String?) -> [ItemImage] {
        guard let jsonString = jsonString, !jsonString.isEmpty,
              let data = jsonString.data(using: .utf8),
              let images = try? JSONDecoder().decode([ItemImage].self, from: data) else {
            return []
        }
        return images
    }
}

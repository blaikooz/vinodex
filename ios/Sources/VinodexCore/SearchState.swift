import Foundation
import Observation

/// In-flight search queries, kept alive across navigation.
///
/// `RootView` has no `NavigationStack` — it swaps the LCD's content on a `path`
/// change — so a list screen is *destroyed* when you open an entry from it and
/// rebuilt when you come back. Its `@State` query went with it, and returning
/// from a result dropped you into the unfiltered list with an empty field, which
/// meant retyping the search to look at the second result.
///
/// Keyed per listing rather than globally: master search, world search and each
/// filtered category listing are different searches, and carrying one screen's
/// query into another would be its own bug.
///
/// Deliberately **not** persisted to `UserDefaults`. A query is session state —
/// a cold launch should open on the full list, not on whatever was being typed
/// last week.
@MainActor
@Observable
public final class SearchStateStore {
    public static let shared = SearchStateStore()

    private var queries: [String: String] = [:]

    public init() {}

    public func query(for key: String) -> String {
        queries[key] ?? ""
    }

    /// Empty queries are removed rather than stored, so clearing a field costs
    /// nothing and `isEmpty` means what it says.
    public func setQuery(_ query: String, for key: String) {
        if query.isEmpty {
            queries.removeValue(forKey: key)
        } else {
            queries[key] = query
        }
    }

    public func clear() {
        queries.removeAll()
    }

    public var isEmpty: Bool { queries.isEmpty }

    /// Stable identity for one listing.
    ///
    /// Categories are sorted so a `Set`'s iteration order — which is not stable
    /// between launches — cannot change the key underneath a stored query.
    public static func key(categories: Set<EntryCategory>, filter: EntryFilter?) -> String {
        let cats = categories.map(\.rawValue).sorted().joined(separator: "+")
        guard let filter else { return cats }
        return "\(cats)|\(filter.storageKey)"
    }
}

public extension EntryFilter {
    /// A stable string form, for use as a dictionary key.
    ///
    /// Spelled out rather than derived from `indicatorText` or `String(describing:)`
    /// — the first is display copy that can be reworded, the second is a compiler
    /// detail. Either would silently orphan stored queries when it changed.
    var storageKey: String {
        switch self {
        case .region(let countries): "region:" + countries.sorted().joined(separator: ",")
        case .type(let value): "type:" + value
        case .tasting(let value): "tasting:" + value
        case .soil(let value): "soil:" + value
        case .origin(let value): "origin:" + value
        case .rarity(let value): "rarity:" + value.rawValue
        case .system(let value): "system:" + value
        case .climate(let value): "climate:" + value.rawValue
        }
    }
}

#if canImport(SwiftUI) && canImport(UIKit)
import SwiftUI
import VinodexCore

/// The scrolling entry list, with an optional filter banner and search bar.
public struct EncyclopediaListScreen: View {
    let categories: Set<EntryCategory>
    let filter: EntryFilter?
    let showsSearch: Bool
    let onSelect: (WineEntry) -> Void

    /// Held outside the view, so it survives the screen being torn down and
    /// rebuilt when you open an entry and come back — see `SearchStateStore`.
    @State private var searches = SearchStateStore.shared
    @State private var access = AccessStore.shared
    @AppStorage(LcdMode.storageKey) private var lcdRaw = LcdMode.dark.rawValue
    private var lcd: LcdMode { LcdMode(rawValue: lcdRaw) ?? .dark }
    private let db = WineDatabase.shared

    private var searchKey: String {
        SearchStateStore.key(categories: categories, filter: filter)
    }

    private var search: String { searches.query(for: searchKey) }

    /// Bound straight through to the store rather than mirrored into `@State`
    /// and restored on appear: a mirror has to be seeded from *somewhere*, and
    /// every ordering of `onAppear` / `task` against the initial `task(id:)` run
    /// either filtered twice or flashed the unfiltered list first.
    private var searchBinding: Binding<String> {
        Binding(
            get: { searches.query(for: searchKey) },
            set: { searches.setQuery($0, for: searchKey) }
        )
    }

    public init(
        categories: Set<EntryCategory>,
        filter: EntryFilter? = nil,
        showsSearch: Bool = true,
        onSelect: @escaping (WineEntry) -> Void
    ) {
        self.categories = categories
        self.filter = filter
        self.showsSearch = showsSearch
        self.onSelect = onSelect
    }

    /// Recomputed only when the query actually changes.
    ///
    /// This was a computed property, so every keystroke *and* every unrelated
    /// re-render re-filtered and re-sorted all 284 entries — which is why
    /// master search, the one screen with every category selected, was slow to
    /// appear. `task(id:)` runs it once per query instead.
    @State private var results: [WineEntry] = []

    private func recompute() {
        results = db.entries.apply(
            EntryQuery(categories: categories, filter: filter, search: search)
        )
    }

    /// `task(id:)` alone covers first appearance. The `onAppear` that used to sit
    /// alongside it made the screen build its entire row tree twice on entry —
    /// `onAppear` filled `results`, then the initial `task` reassigned it, and a
    /// `@State` assignment invalidates whether or not the value changed.
    public var body: some View {
        content
            .task(id: search) { recompute() }
    }

    private var content: some View {
        VStack(spacing: 0) {
            if let filter {
                filterBanner(filter)
            }

            ZStack {
                DexScreenBackground()

                ScrollView {
                    // Lazy, not a plain VStack. Master search selects every
                    // category, so a plain stack built and measured all 284 rows
                    // — each resolving an icon well and its chips — before the
                    // first frame could be shown. That was most of the delay
                    // between tapping SEARCH and the list appearing. Only the
                    // visible handful is built now.
                    LazyVStack(spacing: 8) {
                        if showsSearch {
                            searchBar
                        }

                        if results.isEmpty {
                            emptyState
                        } else {
                            ForEach(results) { entry in
                                EntryTileView(
                                    entry: entry,
                                    palette: db.palette,
                                    locked: access.isLocked(entry, in: db)
                                ) {
                                    onSelect(entry)
                                }
                            }
                        }
                    }
                    .padding(10)
                }
                .scrollDismissesKeyboard(.interactively)
            }
        }
    }

    private func filterBanner(_ filter: EntryFilter) -> some View {
        HStack(spacing: 10) {
            Image(systemName: "line.3.horizontal.decrease.circle.fill")
                .font(.system(size: 20))
                .foregroundStyle(Dex.green)
            Text(filter.indicatorText)
                .font(DexFont.mono(20))
                .foregroundStyle(Dex.stone200)
            Spacer()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Dex.stone800)
        .overlay(alignment: .bottom) {
            Dex.stone700.frame(height: 1)
        }
    }

    private var searchBar: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(Dex.green500)
            DexSearchField(text: searchBinding)
                .frame(height: 34)
        }
        .padding(.horizontal, 12)
        .frame(height: 46)
        .background(Capsule().fill(lcd.well))
        .overlay(Capsule().strokeBorder(lcd.surfaceEdge, lineWidth: 2))
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "list.bullet.rectangle")
                .font(.system(size: 40))
                .foregroundStyle(Dex.red500)
            Text("NO DATA FOUND")
                .font(DexFont.retro(11))
                .foregroundStyle(Dex.red500)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
        .opacity(0.6)
    }
}
#endif

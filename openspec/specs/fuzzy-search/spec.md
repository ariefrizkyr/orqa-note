## ADDED Requirements

### Requirement: Cmd+K fuzzy file search
The system SHALL provide a modal search overlay triggered by `Cmd+K` that fuzzy-matches file and bookmark names across the entire workspace.

#### Scenario: Open search
- **WHEN** user presses `Cmd+K`
- **THEN** system displays a centered modal overlay with an auto-focused search input

#### Scenario: Search by filename
- **WHEN** user types "roadmap" in the search input
- **THEN** system displays fuzzy-matched results showing files like `q2-roadmap.md`, `product-roadmap.xlsx` with file path, icon, and extension

#### Scenario: Open result
- **WHEN** user presses Enter or clicks a search result
- **THEN** system opens the file as a tab (or switches to existing tab) and closes the search modal

#### Scenario: Close search
- **WHEN** user presses Escape
- **THEN** system closes the search modal with no action

#### Scenario: No results
- **WHEN** user types a query with no matches
- **THEN** system displays "No files found" message

#### Scenario: Keyboard navigation
- **WHEN** user presses Up/Down arrow keys in search
- **THEN** system highlights the previous/next result in the list

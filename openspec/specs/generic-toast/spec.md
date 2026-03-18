## ADDED Requirements

### Requirement: Toast store
The system SHALL provide a Zustand store (`toast-store.ts`) that exposes a `showToast` action accepting `message` (string), `placement` (enum), and optional `duration` (number, default 2000ms).

#### Scenario: Show a toast
- **WHEN** `showToast({ message: "Path copied", placement: "top-right" })` is called
- **THEN** the store state SHALL contain the message, placement, and a generated id
- **AND** the toast SHALL auto-dismiss after the specified duration

#### Scenario: Replace existing toast
- **WHEN** a toast is visible and `showToast` is called again
- **THEN** the previous toast SHALL be replaced by the new one

#### Scenario: Default duration
- **WHEN** `showToast` is called without a `duration` parameter
- **THEN** the toast SHALL auto-dismiss after 2000ms

### Requirement: Toast placement
The toast system SHALL support configurable placement positions: `top-right`, `top-left`, `bottom-right`, `bottom-left`.

#### Scenario: Top-right placement
- **WHEN** a toast is shown with `placement: "top-right"`
- **THEN** it SHALL render fixed at the top-right corner of the viewport

#### Scenario: Bottom-right placement
- **WHEN** a toast is shown with `placement: "bottom-right"`
- **THEN** it SHALL render fixed at the bottom-right corner of the viewport

### Requirement: Toast component
The system SHALL provide a `Toast` component that reads from the toast store and renders the active toast. It SHALL be mounted once globally in `App.tsx`.

#### Scenario: Toast renders with message
- **WHEN** the toast store has an active toast with message "URL copied"
- **THEN** the Toast component SHALL display "URL copied" in a dark neutral styled container

#### Scenario: No active toast
- **WHEN** the toast store has no active toast
- **THEN** the Toast component SHALL render nothing

### Requirement: Toast styling
The toast SHALL use dark neutral colors consistent with the existing `UpdateToast` aesthetic (`bg-neutral-900`, `text-neutral-100`, rounded corners, subtle shadow).

#### Scenario: Visual consistency
- **WHEN** a toast is displayed
- **THEN** it SHALL use `bg-neutral-900` background, `text-neutral-100` text, rounded corners, and a subtle shadow

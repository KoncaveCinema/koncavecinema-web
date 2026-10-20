# Phase F8: Concessions & Delivery Tracking

Blocked on API Phase 7 (concession catalog, address validation, Chowdeck dispatch).

## Deliverables

- Concessions step in checkout: catalog (`GET /api/concessions/catalog`), quantity steppers, cart
  summary inside the API's price breakdown.
- Delivery address with autocomplete, validation and fee quote
  (`POST /api/concessions/validate-address`); clear message outside the 15 km zone.
- Order creation bound to the ticket (`POST /api/concessions/orders`).
- Lobby delivery card: status timeline (placed, dispatched, courier assigned, picked up,
  delivered) and ETA from `GET /api/concessions/orders/:id/tracking`; delay voucher notice.

## Acceptance Criteria

- [ ] Unserviceable addresses are caught before payment.
- [ ] The lobby shows delivery status updates without a reload.

# Phase F4: Ticketing & Checkout

## Objective

The in-checkout flow from the PRD (section 3.1): details, KYC when needed, payment, in one modal,
with no double charges on bad networks.

## API Endpoints

| Method   | Endpoint                            | Use                                                       |
| :------- | :---------------------------------- | :-------------------------------------------------------- |
| `POST`   | `/api/tickets/reserve`              | 10-minute hold; send `Idempotency-Key`                    |
| `DELETE` | `/api/tickets/release`              | Cancel a hold                                             |
| `POST`   | `/api/payments/checkout/initialize` | Paystack checkout for a held pass; send `Idempotency-Key` |
| `GET`    | `/api/payments/verify/:reference`   | Confirm after return from Paystack                        |
| `GET`    | `/api/tickets/my-tickets`           | Ticket wallet, paginated                                  |
| `GET`    | `/api/tickets/:id`                  | Pass detail                                               |
| `POST`   | `/api/tickets/:id/cancel`           | Cancel                                                    |
| `POST`   | `/api/tickets/claim-invite`         | Private suite guest joins with an invite code             |

## Deliverables

- Checkout dialog (sheet on mobile) with steps: 1 account (inline register / sign in),
  2 KYC (Public Hall only, reuses `KycStep`), 3 review and pay. The price breakdown is the API's
  (`baseAmount`, `infrastructureMarkup`, `vatAmount`, `processingFee`, total); the client never
  computes money.
- Hold timer from the reservation expiry; on expiry the dialog explains and offers to retry.
- Paystack payment (Inline popup, falling back to redirect to the authorization URL); on return,
  verify every 3 seconds for 30 seconds (PRD section 5, "Webhook Drop"), then show a pending state
  with support details.
- Error handling by code: `KYC_REQUIRED`, `RESERVATION_ALREADY_HELD`, `RESERVATION_IN_PROGRESS`,
  `SCREENING_SOLD_OUT`, `SCREENING_CONCLUDED`, `TICKET_NOT_PAYABLE`, `PAYMENT_GATEWAY_*`,
  `IDEMPOTENCY_*`.
- Ticket wallet: upcoming and past passes, pass detail, "Enter screening" link.
- Private suite host view: invite links for 4 or 9 guests with copy and share; guest claim page
  (`SUITE_NOT_ACTIVE`, `SUITE_FULL`, `SUITE_CLAIM_IN_PROGRESS`).

## Acceptance Criteria

- [ ] Double-tapping Pay or retrying on a dropped connection never creates a second hold or charge.
- [ ] A user charged while the webhook is late sees the confirmed pass within 30 seconds.
- [ ] The total shown equals the amount Paystack charges.

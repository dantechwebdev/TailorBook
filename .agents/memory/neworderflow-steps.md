---
name: NewOrderFlow steps
description: The 6-step guided wizard for creating new orders
---

Steps (0-indexed): Customer(0) → Garment(1) → Measurements(2) → Delivery(3) → Payment(4) → Review(5)

`OrderDraft` has a `draftMeasurement: { template, data, label } | null` field for inline measurements recorded during the flow.

**Why:** Build Prompt requires Measurements as step 3 of the guided flow. Users can select existing measurements, record new inline, or skip.

**How to apply:** StepReview handles `draftMeasurement` — if set with no `measurementId`, it calls `addMeasurement()` before `addJob()` during creation.

StepMeasurements reads `getMeasurementsByCustomer` from store. For existing customers with saved measurements, shows selectable cards. For new customers or empty history, shows inline template + key fields.

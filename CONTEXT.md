# RC Admin

RC Admin is the operator workspace for preparing printable catalog items and handling order operations for a print-farm storefront.

## Language

**Operator**:
A staff user who manages catalog setup, upload confirmation, order review, and recovery actions.
_Avoid_: Admin user, dashboard user

**Catalog Item**:
A sellable product record prepared for printing, with storefront copy, imagery, material selection, color, price, and print file metadata.
_Avoid_: Product card, listing

**Print File**:
The STL asset associated with a catalog item and confirmed for downstream printing.
_Avoid_: Model URL, raw STL link

**Gallery Image**:
A supplemental image attached to a catalog item to show alternate angles or details.
_Avoid_: Raw gallery entry, image blob

**Order Queue**:
The operator worklist of customer orders that may need review, retry, reconciliation, notification resend, cancellation, or refund.
_Avoid_: Fulfillment dashboard, order table

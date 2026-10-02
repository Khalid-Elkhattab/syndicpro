# Functional Specification

**DIREKTDOTCOM — Web Development & Digital Marketing Division**

**Property management (syndic) application: web and mobile platform, co-owner portal, AI connectivity and showcase website**

| | |
|---|---|
| **Client** | KHALLOUFI NEGOCE |
| **Reference** | CDC-MA7314 |
| **Version** | 1.0 |
| **Date** | 01/10/2026 |

---

## Table of Contents

1. Project Overview
2. Users and Roles
3. Functional Modules (1 to 12)
4. Generated Documents
5. Technical and Security Requirements
6. Schedule and Delivery
7. Items to Be Provided by the Client
8. Out of Scope
9. Validation

---

## 1. Project Overview

KHALLOUFI NEGOCE provides property management (syndic) services for several residences. The project consists of setting up a single application that replaces Excel files and centralizes all management: property portfolio, co-owners, contributions, payments, budgets, expenses, cash management, debt collection, complaints and general assemblies.

| Component | Description |
|---|---|
| **Management back-office** | Web application for the KHALLOUFI NEGOCE team, usable on computer, tablet and phone. |
| **Co-owner portal** | Personal access for each co-owner, installable on a phone like an app. |
| **AI connectivity** | WhatsApp assistant for residents and an MCP server to connect artificial intelligence tools. |
| **Showcase website** | Public website presenting the company, with contact and quote request. |

**Multi-residence:** a single application manages all residences, each with its own buildings, budget, calculation method and fiscal period.

**Languages:** French and Arabic.

---

## 2. Users and Roles

| Role | Access |
|---|---|
| **Super administrator** | Full access, user and permission management, settings, audit log, recycle bin. |
| **Manager / assistant** | Permissions defined per module (view, create, edit, delete) and restricted to certain residences if needed. Deletions can be subject to approval. |
| **Co-owner** | Personal portal: their situation, receipts, documents, complaints. |
| **Visitor** | Showcase website, contact form and quote request form. |

---

## 3. Functional Modules

### Module 1 — Residences and Units

Describe the entire managed portfolio: residences, buildings and premises.

**Data managed**

| Data | Detail |
|---|---|
| Residence name | Example: Résidence Les Jardins 1 |
| Syndicate name | Example: Syndicat des copropriétaires Les Jardins 1 |
| City, address | Location of the residence |
| Building no. | One or more buildings per residence |
| Unit type | Apartment, duplex, shop, office, house, other |
| Unit no. | Unit (lot) number |
| Surface area | In m² |
| Share (tantième / quote-part) | Used to calculate contributions by share |
| Land title no. | Land reference of the unit |
| Parking space | Yes, no or common area; space no. (one or more) |
| Storage box | Yes or no; box no. (one or more) |

**Features**

- Creation, editing, archiving
- Import of units from an Excel file
- Check of the total shares per residence
- Search and filters (residence, building, type)
- Unit record with history of owners and payments
- Excel and PDF export

---

### Module 2 — Co-owners

Centralize the contact details and units of each co-owner.

**Data managed**

| Data | Detail |
|---|---|
| First and last name | Individual or company |
| CIN | National ID card no. (or RC for a company) |
| Phone number | One or more, with indication of the WhatsApp number |
| Email | One or more |
| Units | A co-owner can hold several units, in one or more residences |

**Features**

- Several co-owners for the same unit (joint ownership)
- Change of owner (sale) with history preserved
- Activation of access to the co-owner portal
- Direct contact by WhatsApp, call or email
- Import from Excel, export of the list
- Internal notes per co-owner

---

### Module 3 — Contributions and Fund Calls

Define the contributions of each residence and automatically calculate each unit's share.

**Data managed**

| Data | Detail |
|---|---|
| Residence | Residence concerned |
| Contribution type | Syndic contribution or exceptional contribution |
| Contribution name | Example: Syndic contribution year 2026 |
| Period | From ... to ... (example: from 01/09/2026 to 31/08/2027) |
| Calculation method | Fixed or by share, selectable for each residence |
| Amount | Per month and per year |

**Calculation rules**

- **Fixed mode:** grid of amounts by unit category (shop, apartment by surface area, duplex, house, large surface...).
- **Share (tantième) mode:** coefficient = annual budget ÷ total shares; the unit's annual contribution = share × coefficient.
- Monthly breakdown pro rata to the number of days in each month, with automatic rounding adjustment so that the total is exact.
- Exceptional contribution applicable to the whole residence or to certain buildings.

**Documents**

- Fund call per co-owner
- Contribution table per residence (PDF, Excel)

---

### Module 4 — Payments and Receipts

Record each payment and give a receipt to the co-owner.

**Data managed**

| Data | Detail |
|---|---|
| Date | Payment date |
| Residence, building no., unit no. | The co-owner's name is displayed automatically |
| Contribution type | Contribution concerned |
| Payment method | Cheque, bank transfer, deposit, cash (list) |
| Document no. | Mandatory for a cheque or a bill of exchange |
| Bank | List of banks |
| Payment amount | Total amount received |

**Features**

- A payment spread over several contributions or years. Example: a single payment can settle the 2024, 2025 and 2026 contributions.
- Automatic allocation (from oldest to most recent) or manual.
- Numbered PDF payment receipt with verification QR code, sent by WhatsApp or email.
- Payment declared by the co-owner from their portal (with supporting document), approved or rejected by the manager.
- Cancellation of a payment tracked in the history.

---

### Module 5 — Budgets and Expenses

Prepare the budget of each residence and track actual expenses.

**Budget**

| Data | Detail |
|---|---|
| Budget type | Forecast budget or off-budget |
| Budget name | Operating budget or investment budget |
| Account | Example: Security and cleaning services |
| Sub-account | Example: Security service |
| Budget line | Quantity × unit price, monthly and annual amounts calculated |

**Expenses**

| Data | Detail |
|---|---|
| Date, residence | Date and residence concerned |
| Charge type | Expense or intervention (an intervention can have an amount of 0) |
| Budget type, account, sub-account | Link to the budget |
| Amount, payment method, document no., bank | Payment details |
| Allocation by building | Example: one expense shared between buildings A, B and C |
| Supplier, supporting document | Attached invoice or photo |

**Features**

- Comparison of planned vs. actual budget
- Alert when an account is exceeded
- Supplier list
- Excel and PDF export

**Documents**

- Forecast budget
- Expense statement
- Planned vs. actual budget

---

### Module 6 — Cash Management (Treasury)

Track the money of each residence over a period.

| Data | Detail |
|---|---|
| Period | From ... to ... |
| Opening balance | Bank balance at the start of the period |
| Total contributions | Receipts for the period (automatic calculation) |
| Total expenses | Disbursements for the period (automatic calculation) |
| Closing balance | Bank balance at the end of the period, compared with the bank statement |

**Documents**

- Treasury statement

---

### Module 7 — Debt Collection

Track unpaid amounts and automate reminders.

- Situation of each co-owner: due, paid, remaining to pay, detail by period.
- Unpaid situation, by residence and by building.
- Automatic payment reminder at the end of each month by WhatsApp and email.
- Formal notice (mise en demeure) for debts unpaid for more than one year.
- Lawyer list: export of the cases to be forwarded.
- History of all reminders sent.

**Documents**

- Co-owner situation
- Unpaid statement
- Situation per residence
- Reminder letter
- Formal notice
- Lawyer list

---

### Module 8 — Complaints

Receive, handle and track residents' complaints.

| Data | Detail |
|---|---|
| Date and time | Automatic recording |
| Complaint type | Configurable list (elevator, cleaning, security, leak...) |
| Residence, building no., unit no. | Location |
| Description, photos | Details of the problem |
| Handling date and time | Entered at closure |
| Feedback to the client | Response sent to the resident |

**Features**

- Complaint created by the manager, the co-owner or the WhatsApp assistant
- Statuses: new, in progress, handled
- Message exchange with the resident
- Measured handling time

---

### Module 9 — General Assemblies and Reports

Prepare general assemblies and produce official documents.

- AG notice: date, place, agenda, sent to co-owners.
- Attendance list and proxies.
- AG minutes: pre-filled template, resolutions and voting results.
- Quitus (إبراء الذمة): certificate for a co-owner who is up to date with their payments.
- Financial report and moral (activity) report for the fiscal year.
- Notes and information: announcements to the residents of a residence or a building.

**Documents**

- AG notice
- Attendance list
- AG minutes
- Quitus
- Financial report
- Moral report
- Fund call

---

### Module 10 — Co-owner Portal

Give each co-owner personal access, on computer or phone.

- Secure login
- Dashboard: due, paid, remaining to pay
- Contribution details
- Receipt download
- Payment declaration with supporting document
- Submission and tracking of complaints
- Residence documents (minutes, regulations...)
- Announcements and information
- Installation on a phone like an app
- French and Arabic

---

### Module 11 — AI Connectivity: Agent and MCP

Connect the application to artificial intelligence, securely.

**AI assistant on WhatsApp**

- The resident is recognized by their phone number.
- They can ask for their balance, receive their receipts and file a complaint.
- Handover to a manager when the assistant cannot answer.

**MCP server and API**

- MCP server to connect Claude, ChatGPT or other AI tools to the application's data.
- Natural-language questions: "Who hasn't paid this month?", "What is the residence's balance?".
- Sensitive actions (sending reminders, modifications) subject to approval.
- Access via secure, revocable keys; every exchange is logged.
- Documented API to connect future tools.

---

### Module 12 — Showcase Website

Present KHALLOUFI NEGOCE and attract new residences.

- Pages: home, services, references, about, contact
- Contact form and quote request
- Direct access to the co-owner portal
- Content editable from the administration
- Google referencing (basic SEO, sitemap)
- French and Arabic, mobile-friendly

---

## 4. Generated Documents

| Document | Format and use |
|---|---|
| Payment receipt | Numbered PDF with QR code, sent by WhatsApp or email |
| Fund call | PDF per co-owner or per residence |
| Situation of each co-owner | PDF, detailed statement by period |
| Unpaid situation | PDF and Excel, by residence and building |
| Situation of co-owners per residence | PDF and Excel |
| Payment reminder | Automatic message at the end of each month |
| Formal notice | PDF, debts unpaid for more than one year |
| Lawyer list | Excel and PDF |
| AG notice and AG minutes | PDF |
| Quitus (إبراء الذمة) | PDF |
| Financial report and moral report | PDF |
| Forecast budget, expense statement | PDF and Excel |
| Treasury statement | PDF |

All documents carry the letterhead of KHALLOUFI NEGOCE and of the syndicate of the residence concerned.

---

## 5. Technical and Security Requirements

- Hosted web application, accessible via the internet (HTTPS)
- Compatible with computer, tablet and phone
- Encrypted passwords, secure sessions
- Permissions per module and per residence
- Audit log: who did what and when
- Recycle bin: restoration of deleted items
- Automatic daily database backup
- Excel and PDF exports
- Interface in French and Arabic
- Data hosted on a server dedicated to the client

---

## 6. Schedule and Delivery

| Step | Content |
|---|---|
| **1. Frontend** | Design of screens and interface, validated with you |
| **2. Backend** | Database, calculations, PDF documents, AI connectivity |
| **3. Testing phase** | Demo version tested and validated by you |
| **4. Delivery** | Data migration, training, go-live |

**Total duration:** 5 weeks. **Warranty:** 3 months after delivery.

---

## 7. Items to Be Provided by the Client

- Company logo and colors
- List of residences, buildings and units (Excel)
- List of co-owners and their contact details
- Shares (tantièmes) or contribution grid for each residence
- Budgets and fiscal periods
- Opening bank balances and prior unpaid amounts
- Desired templates (formal notice, minutes, quitus)
- Dedicated WhatsApp Business number
- Desired domain name for the website
- Texts and photos for the showcase website

**External costs borne by the client:** hosting, domain name and consumption of the artificial intelligence service according to usage.

---

## 8. Out of Scope

- General accounting and tax filings
- HR management and staff payroll
- Online card payment
- Publication on the App Store and Google Play

These items can be the subject of an additional quote.

---

## 9. Validation

This specification describes the functional scope of the application. Any modification will be subject to an amendment approved by both parties.
